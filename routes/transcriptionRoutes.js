const express = require("express");
const { transcribeAudio } = require("../controllers/transcriptionController");
const { isAuthenticatedUser } = require("../middlewares/authMiddleware");
const { singleAudioFileUpload } = require("../middlewares/uploadAudio");
const { handleFileMulterError } = require("../middlewares/uploadFile");
const router = express.Router();

router.post("/", isAuthenticatedUser, singleAudioFileUpload, handleFileMulterError, transcribeAudio);

module.exports = router;
