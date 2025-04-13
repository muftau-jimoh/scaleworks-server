const express = require("express");
const { reviewContract } = require("../controllers/contractReviewController");
const {upload, validateFileUpload, handleFileMulterError} = require("../middlewares/uploadFile");
const { isAuthenticatedUser } = require("../middlewares/authMiddleware");
const router = express.Router();

router.post("/", isAuthenticatedUser, upload.array("files"), validateFileUpload, handleFileMulterError, reviewContract);

module.exports = router;