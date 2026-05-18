import express from 'express';
import {
  getExpenses,
  getExpense,
  createExpense,
  updateExpense,
  deleteExpense,
  approveExpense,
  rejectExpense,
  getExpenseStats,
  autoGenerateExpenseFromSalary
} from '../controllers/expenseController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// Apply authentication to all routes
router.use(protect);

// Public routes (all authenticated users)
router.get('/', getExpenses);
router.get('/stats', authorize('manager', 'owner'), getExpenseStats);
router.get('/:id', getExpense);

// Protected routes (manager and above)
router.post('/', authorize('manager', 'owner'), createExpense);
router.put('/:id', authorize('manager', 'owner'), updateExpense);
router.delete('/:id', authorize('manager', 'owner'), deleteExpense);
router.put('/:id/approve', authorize('manager', 'owner'), approveExpense);
router.put('/:id/reject', authorize('manager', 'owner'), rejectExpense);

// Auto-generation routes
router.post('/auto-generate/salary/:salaryPaymentId', authorize('manager', 'owner'), autoGenerateExpenseFromSalary);

export default router;