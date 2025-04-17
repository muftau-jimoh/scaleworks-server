const express = require("express");
const {chatWithBot, uploadToKnowledgeBase, fetchKnowledgeBase, deleteKnowledgeBase, fetchRecentCBAChats, batchSaveCBAChats} = require(".././controllers/chatbotController");
const { isAuthenticatedUser } = require("../middlewares/authMiddleware");
const {upload, validateFileUpload, handleFileMulterError} = require("../middlewares/uploadFile");
const router = express.Router();

router.get("/", isAuthenticatedUser, chatWithBot);
router.post("/upload-knowledge", isAuthenticatedUser, upload.array("files"), validateFileUpload, handleFileMulterError, uploadToKnowledgeBase);
router.post("/fetch-knowledgebases", isAuthenticatedUser, fetchKnowledgeBase);
router.post("/delete-knowledge", isAuthenticatedUser, deleteKnowledgeBase);

router.get("/fetch-recent-chats", isAuthenticatedUser, fetchRecentCBAChats);
router.post("/batch-save-chats", isAuthenticatedUser, batchSaveCBAChats);

module.exports = router;
