const multer = require("multer");
const path = require("path");

// Allowed file types
const allowedFileTypes = [".pdf", ".doc", ".docx", ".txt", ".xlsx", ".csv", ".md"];

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "uploads/file/"); // Temporary storage before Cloudinary upload
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

// Multer middleware
const upload = multer({ storage, fileFilter });

// Middleware to handle file validation error
const validateFileUpload = (req, res, next) => {
    if (req.fileValidationError) {
        return res.status(400).json({ error: req.fileValidationError });
    }

    next();
};

module.exports = { upload, validateFileUpload };
