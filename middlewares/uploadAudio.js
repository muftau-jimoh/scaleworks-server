const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Ensure upload directory exists
const uploadPath = path.join(__dirname, '../uploads/audio');
if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath, { recursive: true }); // Create the directory if it doesn't exist
}

// Set up storage engine
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadPath); // Files will be stored in 'uploads/audio'
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
    cb(new Error("Invalid file type. Allowed types: mp3, wav, ogg, flac, webm"), false); // Reject file
  }
};

// Initialize Multer with storage and file filter
const uploadAudio = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
}).single("audio"); // ✅ Expecting a single file upload with key "audio"

// Middleware to check if a file was uploaded
const singleAudioFileUpload = (req, res, next) => {
  uploadAudio(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ error: `Multer error: ${err.message}` });
    } else if (err) {
      console.log('err: ', err)
      return res.status(400).json({ error: `Upload error: ${err.message}` });
    } else if (!req.file) {
      return res.status(400).json({ error: "No audio file uploaded." });
    }
    next();
  });
};

module.exports = { uploadAudio, singleAudioFileUpload };
