const express = require("express");
const {chatWithBot, uploadToKnowledgeBase} = require(".././controllers/chatbotController");
const { isAuthenticatedUser } = require("../middlewares/authMiddleware");
const {upload, validateFileUpload, handleFileMulterError} = require("../middlewares/uploadFile");
const router = express.Router();

router.get("/", isAuthenticatedUser, chatWithBot);
router.post("/upload-knowledge", isAuthenticatedUser, upload.array("files"), validateFileUpload, handleFileMulterError, uploadToKnowledgeBase);

module.exports = router;
