const express = require('express');
const { updateWhitelistedEmailList } = require('../controllers/adminController');
const { updateBlacklistedEmailList } = require('../controllers/adminController');
const { isAuthenticatedAdmin } = require('../middlewares/authMiddleware');
const { getEmailLists } = require('../controllers/adminController');

const router = express.Router();

// Routes
// router.post('/create-record', isAuthenticatedAdmin, createWhitelistBlacklistRecord); // add to whitelisted email list
router.post('/whitelist-email', isAuthenticatedAdmin, updateWhitelistedEmailList); // add to whitelisted email list
router.post('/blacklist-email', isAuthenticatedAdmin, updateBlacklistedEmailList); // add to blacklisted email list
router.post('/fetch-email-list', isAuthenticatedAdmin, getEmailLists); // add to blacklisted email list

module.exports = router;