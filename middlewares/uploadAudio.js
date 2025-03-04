const multer = require("multer");
const path = require("path");

// Set up storage engine
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/audio/"); // Files will be stored in 'uploads/audio'
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // Unique filename
  },
});

// File filter to allow only specific audio formats
const fileFilter = (req, file, cb) => {
  const allowedFileTypes = /mp3|wav|ogg|flac|webm/;
  const extname = allowedFileTypes.test(path.extname(file.originalname).toLowerCase());

  if (extname) {
    cb(null, true); // Accept file
  } else {
    cb(new Error("Invalid file type. Allowed types: mp3, wav, ogg, flac, webm")); // Reject file
  }
};

// Middleware to check if a file was uploaded
const singleAudioFileUpload = (req, res, next) => {
  if (!req.file) {
    return res.status(400).json({ error: "No audio file uploaded." });
  }
  next();
};

// Initialize Multer with storage and file filter
const uploadAudio = multer({
  storage: storage,
  fileFilter: fileFilter, // ✅ Corrected from "audioFilter"
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
}).single("audio"); // Expecting a single file upload

module.exports = { uploadAudio, singleAudioFileUpload };
