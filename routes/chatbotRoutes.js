const express = require("express");
const { chatWithBot } = require(".././controllers/chatbotController");
const { isAuthenticatedUser } = require("../middlewares/authMiddleware");
const router = express.Router();

router.post("/", isAuthenticatedUser, chatWithBot);

module.exports = router;
