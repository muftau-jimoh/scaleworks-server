const express = require("express");
const {chatWithBot, uploadToKnowledgeBase} = require(".././controllers/chatbotController");
const { isAuthenticatedUser } = require("../middlewares/authMiddleware");
const {upload, validateFileUpload} = require("../middlewares/uploadFile");
const router = express.Router();

router.get("/", isAuthenticatedUser, chatWithBot);
router.post("/upload-knowledge", isAuthenticatedUser, upload.array("files"), validateFileUpload, uploadToKnowledgeBase);

module.exports = router;
