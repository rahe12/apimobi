const express = require('express');
const expenseController = require('../controllers/expenseController');
const authMiddleware = require('../middleware/authMiddleware'); // add this line

const router = express.Router();

// Apply authMiddleware to all routes
router.use(authMiddleware);  // 👈 this line ensures req.userId is set

router.get('/', expenseController.getExpenses);
router.post('/', expenseController.createExpense);
router.get('/:id', expenseController.getExpense);
router.put('/:id', expenseController.updateExpense);
router.delete('/:id', expenseController.deleteExpense);
router.get('/summary', expenseController.getExpenseSummary);

module.exports = router;
