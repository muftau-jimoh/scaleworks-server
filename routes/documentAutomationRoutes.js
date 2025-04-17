const express = require("express");
const { automateDocument, fetchRecentDAChats, batchSaveDAChats } = require("../controllers/documentAutomationController");
const { isAuthenticatedUser } = require("../middlewares/authMiddleware");
const { upload, validateFileUpload, handleFileMulterError } = require("../middlewares/uploadFile");
const router = express.Router();

router.post("/", isAuthenticatedUser, upload.single("file"), validateFileUpload, handleFileMulterError, automateDocument);

router.get("/fetch-recent-chats", isAuthenticatedUser, fetchRecentDAChats);
router.post("/batch-save-chats", isAuthenticatedUser, batchSaveDAChats);

module.exports = router;
 