const express = require("express");
const chatWithBot = require(".././controllers/chatbotController");
const { isAuthenticatedUser } = require("../middlewares/authMiddleware");
const router = express.Router();

router.get("/", chatWithBot);

module.exports = router;
