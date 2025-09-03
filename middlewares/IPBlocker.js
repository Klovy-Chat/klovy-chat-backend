class IPBlocker {
  constructor() {
    this.blockedIPs = new Set();
    this.suspiciousActivity = new Map();
    this.maxSuspiciousActivity = 10;
    this.blockDuration = 60 * 60 * 1000;
  }

  isBlocked(ip) {
    return this.blockedIPs.has(ip);
  }

  addSuspiciousActivity(ip) {
    const now = Date.now();
    const activity = this.suspiciousActivity.get(ip) || {
      count: 0,
      lastActivity: now,
    };

    if (now - activity.lastActivity > this.blockDuration) {
      activity.count = 0;
    }

    activity.count++;
    activity.lastActivity = now;
    this.suspiciousActivity.set(ip, activity);

    if (activity.count >= this.maxSuspiciousActivity) {
      this.blockIP(ip);
      console.warn(`IP ${ip} blocked due to suspicious activity`);
    }
  }

  blockIP(ip, duration = this.blockDuration) {
    this.blockedIPs.add(ip);

    setTimeout(() => {
      this.unblockIP(ip);
    }, duration);
  }

  unblockIP(ip) {
    this.blockedIPs.delete(ip);
    this.suspiciousActivity.delete(ip);
    console.log(`IP ${ip} unblocked`);
  }

  middleware() {
    return (req, res, next) => {
      const ip = req.ip || req.connection.remoteAddress;

      if (this.isBlocked(ip)) {
        console.warn(`Blocked IP ${ip} attempted access`);
        return res.status(403).json({
          error: "Access denied",
          message:
            "Your IP has been temporarily blocked due to suspicious activity",
        });
      }

      next();
    };
  }
}

const ipBlocker = new IPBlocker();

export const trackSuspiciousActivity = (req, res, next) => {
  const ip = req.ip || req.connection.remoteAddress;

  const isSuspicious =
    (req.method === "POST" && !req.body) ||
    req.url.includes("..") ||
    req.url.includes("<script") ||
    req.get("User-Agent")?.includes("bot") ||
    req.get("User-Agent")?.includes("crawler") ||
    Object.keys(req.query).length > 20 ||
    JSON.stringify(req.body).length > 100000;

  if (isSuspicious) {
    ipBlocker.addSuspiciousActivity(ip);
  }

  next();
};

export default ipBlocker;
