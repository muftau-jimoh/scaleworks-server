const express = require("express");
const { transcribeAudio } = require("../controllers/transcriptionController");
const { isAuthenticatedUser } = require("../middlewares/authMiddleware");
const { uploadAudio, singleAudioFileUpload } = require("../middlewares/uploadAudio");
const router = express.Router();

router.post("/", isAuthenticatedUser, uploadAudio, singleAudioFileUpload, transcribeAudio);

module.exports = router;
