const express = require('express');
const categoryController = require('../controllers/categoryController');
const authenticateToken = require('../middleware/authMiddleware'); // Import the middleware
const router = express.Router();

// Apply middleware to protect all routes
router.use(authenticateToken);

// Then define your routes as before
router.get('/', categoryController.getCategories);
router.post('/', categoryController.createCategory);
router.put('/:id', categoryController.updateCategory);
router.delete('/:id', categoryController.deleteCategory);

module.exports = router;
