const express = require("express");
const { performLegalResearch } = require(".././controllers/legalResearchController");
const { isAuthenticatedUser } = require("../middlewares/authMiddleware");
const router = express.Router();

router.post("/", isAuthenticatedUser, performLegalResearch);

module.exports = router;
