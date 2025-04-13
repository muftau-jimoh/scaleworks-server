const express = require('express');
const { updateWhitelistedEmailList, getAllUsers, uploadUsersLogo } = require('../controllers/adminController');
const { updateBlacklistedEmailList } = require('../controllers/adminController');
const { isAuthenticatedAdmin } = require('../middlewares/authMiddleware');
const { getEmailLists } = require('../controllers/adminController');
const { uploadLogo, validateLogoUpload, handleMulterError } = require('../middlewares/uploadLogo');

const router = express.Router();

// Routes
// router.post('/create-record', isAuthenticatedAdmin, createWhitelistBlacklistRecord); // add to whitelisted email list
router.post('/whitelist-email', isAuthenticatedAdmin, updateWhitelistedEmailList); // add to whitelisted email list
router.post('/blacklist-email', isAuthenticatedAdmin, updateBlacklistedEmailList); // add to blacklisted email list
router.get('/fetch-email-list', isAuthenticatedAdmin, getEmailLists); // add to blacklisted email list


router.get('/fetch-all-users', isAuthenticatedAdmin, getAllUsers); 
router.post('/update-users-logo', isAuthenticatedAdmin,  uploadLogo.any(), validateLogoUpload, handleMulterError, uploadUsersLogo); 

module.exports = router;