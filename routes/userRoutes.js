const express = require('express');
const { signup, login, resetPassword, logout, updatePassword, getUser } = require('../controllers/userController');

const router = express.Router();

// Routes
router.post('/signup', signup); // Signup endpoint
router.post('/login', login);   // Login endpoint
router.post("/logout", logout); // Logout User
router.post('/reset-password-request', resetPassword);  // Request Reset Password
router.get('/getUser', getUser);  // Request Reset Password

module.exports = router;