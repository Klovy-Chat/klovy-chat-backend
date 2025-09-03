const fileTypeValidator = (allowedTypes) => {
  return (req, res, next) => {
    if (req.file || req.files) {
      const files = req.files || [req.file];
      
      for (const file of files) {
        if (file && !allowedTypes.includes(file.mimetype)) {
          return res.status(400).json({
            error: 'Invalid file type. Allowed types: ' + allowedTypes.join(', ')
          });
        }
        
        if (file && file.size > 20 * 1024 * 1024) { 
          return res.status(400).json({
            error: 'File too large. Maximum size: 20MB'
          });
        }
      }
    }
    next();
  };
};

export default fileTypeValidator;
