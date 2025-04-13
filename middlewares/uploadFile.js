const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Ensure upload directory exists
const uploadPath = path.join(__dirname, '../uploads/file');
if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath, { recursive: true }); // Create the directory if it doesn't exist
}


// Allowed file types
const allowedFileTypes = [".pdf", ".doc", ".docx", ".txt", ".xlsx", ".csv", ".md"];

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadPath); // Temporary storage before Cloudinary upload
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});

// File filter function
const fileFilter = (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedFileTypes.includes(ext)) {
        cb(null, true);
    } else {
        req.fileValidationError = `Unsupported file type: ${ext}. Allowed types: ${allowedFileTypes.join(", ")}`;
        cb(null, false); // Reject file without throwing an error
    }
};


// Multer instance
const uploadLogo = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 👈 50MB max file size
  },
});


// Middleware to handle file validation error
const validateFileUpload = (req, res, next) => {
    if (req.fileValidationError) {
        return res.status(400).json({ error: req.fileValidationError });
    }

    next();
};


// Middleware to catch Multer errors like file size
const handleFileMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ error: 'File size exceeds 50MB limit.' });
    }
    return res.status(400).json({ error: `Multer error: ${err.message}` });
  } else if (err) {
    return res.status(500).json({ error: 'An unexpected error occurred.' });
  }

  next();
};

module.exports = { upload, validateFileUpload, handleFileMulterError };
