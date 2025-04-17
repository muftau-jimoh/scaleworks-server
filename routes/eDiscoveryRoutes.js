const express = require("express");
const { performEDiscovery, fetchRecentEDChats, batchSaveEDChats } = require("../controllers/eDiscoveryController");
const { isAuthenticatedUser } = require("../middlewares/authMiddleware");
const { validateFileUpload, upload, handleFileMulterError } = require("../middlewares/uploadFile");

const router = express.Router();

router.post("/", isAuthenticatedUser, upload.array("files"), validateFileUpload, handleFileMulterError, performEDiscovery);

router.get("/fetch-recent-chats", isAuthenticatedUser, fetchRecentEDChats);
router.post("/batch-save-chats", isAuthenticatedUser, batchSaveEDChats);


module.exports = router;