const express = require("express");
const { reviewContract } = require("../controllers/contractReviewController");
const { isAuthenticatedUser } = require("../middlewares/authMiddleware");
const router = express.Router();

router.post("/", isAuthenticatedUser, reviewContract);

module.exports = router;
