const express = require('express');
const authController = require('../controllers/authController');
const authenticateToken = require('../middleware/auth');
const router = express.Router();

router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/me', authenticateToken, authController.getMe); // Protected route
router.post('/change-password', authenticateToken, authController.changePassword); // New route

module.exports = router;
