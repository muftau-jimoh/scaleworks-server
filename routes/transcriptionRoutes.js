const express = require("express");
const { transcribeAudio, performTranscriptTask } = require("../controllers/transcriptionController");
const { isAuthenticatedUser } = require("../middlewares/authMiddleware");
const { singleAudioFileUpload } = require("../middlewares/uploadAudio");
const { handleFileMulterError } = require("../middlewares/uploadFile");
const router = express.Router();

router.post("/", isAuthenticatedUser, singleAudioFileUpload, handleFileMulterError, transcribeAudio);
router.post("/perform-task", isAuthenticatedUser, performTranscriptTask);

module.exports = router; 
