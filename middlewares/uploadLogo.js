const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Ensure upload directory exists
const uploadPath = path.join(__dirname, '../uploads/images'); // 👈 Focused on images
if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath, { recursive: true }); // Create the directory if it doesn't exist
}

// Allowed image types
const allowedImageTypes = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg"];

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadPath); // Temporary storage before Cloudinary upload
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${uniqueSuffix}${ext}`);
  }
});

// File filter to allow only images
const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowedImageTypes.includes(ext)) {
    cb(null, true);
  } else {
    req.fileValidationError = `Unsupported file type: ${ext}. Allowed types: ${allowedImageTypes.join(", ")}`;
    cb(null, false); // Reject the file
  }
};

// Multer instance
const uploadLogo = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 👈 10MB max file size
  },
});

// Middleware to validate file type or size errors
const validateLogoUpload = (req, res, next) => {
  if (req.fileValidationError) {
    return res.status(400).json({ error: req.fileValidationError });
  }
  next();
};

// Middleware to catch Multer errors like file size
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ error: 'File size exceeds 10MB limit.' });
    }
    return res.status(400).json({ error: `Multer error: ${err.message}` });
  } else if (err) {
    return res.status(500).json({ error: 'An unexpected error occurred.' });
  }

  next();
};

module.exports = {
  uploadLogo,
  validateLogoUpload,
  handleMulterError,
};
