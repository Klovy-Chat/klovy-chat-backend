class SecurityMonitor {
  constructor() {
    this.securityEvents = [];
    this.maxEvents = 1000;
    this.alertThresholds = {
      loginFailures: 10,
      suspiciousRequests: 20,
      blockedRequests: 5,
    };
  }

  logEvent(type, details) {
    const event = {
      type,
      timestamp: new Date().toISOString(),
      ...details,
    };

    this.securityEvents.push(event);

    if (this.securityEvents.length > this.maxEvents) {
      this.securityEvents.shift();
    }

    this.checkAlerts(type);
  }

  checkAlerts(eventType) {
    const recentEvents = this.getRecentEvents(15 * 60 * 1000);
    const eventCounts = this.countEventTypes(recentEvents);

    Object.entries(this.alertThresholds).forEach(([type, threshold]) => {
      if (eventCounts[type] >= threshold) {
        this.sendAlert(type, eventCounts[type], threshold);
      }
    });
  }

  getRecentEvents(timeWindow) {
    const cutoff = Date.now() - timeWindow;
    return this.securityEvents.filter(
      (event) => new Date(event.timestamp).getTime() > cutoff,
    );
  }

  countEventTypes(events) {
    return events.reduce((counts, event) => {
      counts[event.type] = (counts[event.type] || 0) + 1;
      return counts;
    }, {});
  }

  sendAlert(type, count, threshold) {
    const alertMessage = `SECURITY ALERT: ${count} ${type} events detected (threshold: ${threshold})`;

    console.error("🚨", alertMessage);
  }

  getSecurityReport() {
    const last24h = this.getRecentEvents(24 * 60 * 60 * 1000);
    const eventCounts = this.countEventTypes(last24h);

    return {
      totalEvents: last24h.length,
      eventTypes: eventCounts,
      lastEvents: this.securityEvents.slice(-10),
      timestamp: new Date().toISOString(),
    };
  }

  middleware() {
    return (req, res, next) => {
      const originalSend = res.send;

      res.send = function (body) {
        if (res.statusCode === 401 || res.statusCode === 403) {
          securityMonitor.logEvent("authFailure", {
            ip: req.ip,
            url: req.url,
            method: req.method,
            userAgent: req.get("User-Agent"),
            statusCode: res.statusCode,
          });
        }

        if (res.statusCode === 400 && body.includes("Invalid request")) {
          securityMonitor.logEvent("suspiciousRequests", {
            ip: req.ip,
            url: req.url,
            method: req.method,
            userAgent: req.get("User-Agent"),
          });
        }

        if (res.statusCode === 403) {
          securityMonitor.logEvent("blockedRequests", {
            ip: req.ip,
            url: req.url,
            method: req.method,
          });
        }

        return originalSend.call(this, body);
      };

      next();
    };
  }
}

const securityMonitor = new SecurityMonitor();

export default securityMonitor;
