const express = require('express');
const authController = require('../controllers/authController');
const auth = require('../middleware/auth'); // Make sure you have auth middleware
const router = express.Router();

router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/me', auth, authController.getMe); // Protected route
router.post('/change-password', auth, authController.changePassword); // New route

module.exports = router;
