const express = require("express");
const multer = require("multer");
const { performEDiscovery } = require("../controllers/eDiscoveryController");
const { isAuthenticatedUser } = require("../middlewares/authMiddleware");
const {upload, validateFileUpload} = require("../middlewares/uploadFile");

const router = express.Router();
router.post("/", isAuthenticatedUser, upload.array("files"), validateFileUpload, performEDiscovery);

module.exports = router;