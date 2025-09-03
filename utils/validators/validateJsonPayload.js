const validateJsonPayload = (req, res, next) => {
  if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
    if (req.headers['content-type']?.includes('application/json')) {
      const contentLength = parseInt(req.headers['content-length'] || '0');
      if (contentLength > 10 * 1024 * 1024) { 
        return res.status(413).json({ error: 'Payload too large' });
      }
    }
  }
  next();
};

export default validateJsonPayload;
