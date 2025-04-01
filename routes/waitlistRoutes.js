const express = require("express");
const { addToWaitlist } = require("../controllers/waitlistController");
const router = express.Router();

router.post("/", addToWaitlist);

module.exports = router;