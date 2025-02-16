const express = require("express");
const { transcribeAudio } = require("../controllers/transcriptionController");
const { isAuthenticatedUser } = require("../middlewares/authMiddleware");
const router = express.Router();

router.post("/", isAuthenticatedUser, transcribeAudio);

module.exports = router;
