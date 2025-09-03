import validator from "validator";

const sanitizeInput = (req, res, next) => {
  for (const key in req.query) {
    if (typeof req.query[key] === 'string') {
      req.query[key] = validator.escape(req.query[key]);
    }
  }
  
  if (req.body && typeof req.body === 'object') {
    const sensitiveFields = ['email', 'username', 'message'];
    
    for (const field of sensitiveFields) {
      if (req.body[field] && typeof req.body[field] === 'string') {
        req.body[field] = req.body[field]
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
          .replace(/javascript:/gi, '')
          .replace(/on\w+\s*=/gi, '');
      }
    }
  }
  
  next();
};

export default sanitizeInput;
