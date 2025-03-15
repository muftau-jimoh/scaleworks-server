const express = require("express");
const { performLegalResearch } = require(".././controllers/legalResearchController");
const { isAuthenticatedUser } = require("../middlewares/authMiddleware");
const router = express.Router();

// router.get("/", isAuthenticatedUser, performLegalResearch);
router.get("/", performLegalResearch);

module.exports = router;
