const express = require("express");
const { automateDocument } = require("../controllers/documentAutomationController");
const { isAuthenticatedUser } = require("../middlewares/authMiddleware");
const { upload, validateFileUpload, handleFileMulterError } = require("../middlewares/uploadFile");
const router = express.Router();

router.post("/", isAuthenticatedUser, upload.single("file"), validateFileUpload, handleFileMulterError, automateDocument);

module.exports = router;
 