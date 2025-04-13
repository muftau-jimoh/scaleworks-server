const express = require("express");
const { performEDiscovery } = require("../controllers/eDiscoveryController");
const { isAuthenticatedUser } = require("../middlewares/authMiddleware");
const { validateFileUpload, upload } = require("../middlewares/uploadFile");

const router = express.Router();

router.post("/", isAuthenticatedUser, upload.array("files"), validateFileUpload, performEDiscovery);

module.exports = router;