const express = require("express");
const { performEDiscovery } = require("../controllers/eDiscoveryController");
const { isAuthenticatedUser } = require("../middlewares/authMiddleware");
const { validateFileUpload, upload, handleFileMulterError } = require("../middlewares/uploadFile");

const router = express.Router();

router.post("/", isAuthenticatedUser, upload.array("files"), validateFileUpload, handleFileMulterError, performEDiscovery);

module.exports = router;