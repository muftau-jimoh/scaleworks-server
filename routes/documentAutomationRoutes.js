const express = require("express");
const { automateDocument } = require("../controllers/documentAutomationController");
const { isAuthenticatedUser } = require("../middlewares/authMiddleware");
const router = express.Router();

router.post("/", isAuthenticatedUser, automateDocument);

module.exports = router;
