const multer = require("multer");
const path = require("path");

// Set up storage engine (e.g., specifying destination and file naming)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/audio/"); // Files will be stored in the 'uploads/audio' folder
  },
  filename: (req, file, cb) => {
    // Use original file name with a unique identifier
    cb(null, Date.now() + path.extname(file.originalname)); // Filename with timestamp
  },
});

// File filter to accept only audio files
const fileFilter = (req, file, cb) => {
  const allowedFileTypes = /mp3|wav|ogg|flac|webm/; // Allowed audio file types
  const extname = allowedFileTypes.test(path.extname(file.originalname).toLowerCase());

  if (extname) {
    return cb(null, true); // Accept the file
  } else {
    // Reject the file and send an error message via the callback
    return cb(new Error("Invalid file type. Allowed types are: mp3, wav, ogg, flac, webm"));
  }
};

// Middleware to ensure only one file is uploaded
const singleAudioFileUpload = (req, res, next) => {
  // Check if no file is uploaded
  if (!req.file) {
    return res.status(500).json({ error: "No audio file uploaded." });
  }

  next();
};

// Initialize Multer with storage, file filter, and limits
const uploadAudio = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 50 * 1024 * 1024 }, // File size limit (50MB)
}).single("file"); // Expecting a single file upload

module.exports = { uploadAudio, singleAudioFileUpload };
