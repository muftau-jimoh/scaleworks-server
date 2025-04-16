const express = require("express");
const {chatWithBot, uploadToKnowledgeBase, fetchKnowledgeBase, deleteKnowledgeBase} = require(".././controllers/chatbotController");
const { isAuthenticatedUser } = require("../middlewares/authMiddleware");
const {upload, validateFileUpload, handleFileMulterError} = require("../middlewares/uploadFile");
const router = express.Router();

router.get("/", isAuthenticatedUser, chatWithBot);
router.post("/upload-knowledge", isAuthenticatedUser, upload.array("files"), validateFileUpload, handleFileMulterError, uploadToKnowledgeBase);
router.post("/fetch-knowledgebases", isAuthenticatedUser, fetchKnowledgeBase);
router.post("/delete-knowledge", isAuthenticatedUser, deleteKnowledgeBase);

module.exports = router;
