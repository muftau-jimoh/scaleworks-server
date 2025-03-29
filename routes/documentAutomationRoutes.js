const express = require("express");
const { automateDocument } = require("../controllers/documentAutomationController");
const { isAuthenticatedUser } = require("../middlewares/authMiddleware");
const { upload, validateFileUpload } = require("../middlewares/uploadFile");
const router = express.Router();

router.post("/", upload.single("file"), validateFileUpload, automateDocument);

module.exports = router;
 