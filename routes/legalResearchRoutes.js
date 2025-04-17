const express = require("express");
const { performLegalResearch, fetchRecentLAChats, batchSaveChats } = require(".././controllers/legalResearchController");
const { isAuthenticatedUser } = require("../middlewares/authMiddleware");
const router = express.Router();

router.get("/", isAuthenticatedUser, performLegalResearch);
router.get("/fetch-recent-chats", isAuthenticatedUser, fetchRecentLAChats);
router.post("/batch-save-chats", isAuthenticatedUser, batchSaveChats);

module.exports = router;
