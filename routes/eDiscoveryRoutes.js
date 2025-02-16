const express = require("express");
const multer = require("multer");
const { performEDiscovery } = require("../controllers/eDiscoveryController");
const { isAuthenticatedUser } = require("../middlewares/authMiddleware");

const router = express.Router();
const upload = multer({ dest: "uploads/" }); // Temp storage before upload

router.post("/", isAuthenticatedUser, upload.array("files"), performEDiscovery);

module.exports = router;