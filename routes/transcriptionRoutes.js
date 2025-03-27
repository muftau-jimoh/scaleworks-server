const express = require("express");
const { transcribeAudio } = require("../controllers/transcriptionController");
const { isAuthenticatedUser } = require("../middlewares/authMiddleware");
const { singleAudioFileUpload } = require("../middlewares/uploadAudio");
const router = express.Router();

router.post("/", isAuthenticatedUser, singleAudioFileUpload, transcribeAudio);

module.exports = router;
