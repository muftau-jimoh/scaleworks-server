const express = require("express");
const { reviewContract, performContractReviewTask, fetchRecentCRChats, batchSaveCRChats } = require("../controllers/contractReviewController");
const {upload, validateFileUpload, handleFileMulterError} = require("../middlewares/uploadFile");
const { isAuthenticatedUser } = require("../middlewares/authMiddleware");
const router = express.Router();

router.post("/", isAuthenticatedUser, upload.array("files"), validateFileUpload, handleFileMulterError, reviewContract);
router.post("/perform-task", isAuthenticatedUser, performContractReviewTask);

router.get("/fetch-recent-chats", isAuthenticatedUser, fetchRecentCRChats);
router.post("/batch-save-chats", isAuthenticatedUser, batchSaveCRChats);

module.exports = router;