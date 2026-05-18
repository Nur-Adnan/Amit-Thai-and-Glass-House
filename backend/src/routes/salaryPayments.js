import express from 'express';
import {
  getSalaryPayments,
  getSalaryPayment,
  createSalaryPayment,
  markSalaryAsPaid,
  updateSalaryPayment,
  deleteSalaryPayment,
  generateMonthlySalaries,
  getSalaryStats,
  getDueSalaries
} from '../controllers/salaryPaymentController.js';
import { protect } from '../middleware/auth.js';
import { 
  canPaySalary,
  canViewPayroll,
  canEditEmployee
} from '../middleware/permissions.js';
import { requiresConfirmation } from '../middleware/confirmationRequired.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Special routes (must be before /:id routes)
router.get('/stats', canViewPayroll, getSalaryStats);
router.get('/due', canViewPayroll, getDueSalaries);
router.post('/generate', canPaySalary, generateMonthlySalaries);

// Basic CRUD routes
router.route('/')
  .get(canViewPayroll, getSalaryPayments)
  .post(canPaySalary, createSalaryPayment);

router.route('/:id')
  .get(canViewPayroll, getSalaryPayment)
  .put(canEditEmployee, requiresConfirmation('salary_edit'), updateSalaryPayment)
  .delete(canEditEmployee, requiresConfirmation('salary_delete'), deleteSalaryPayment);

// Payment management
router.put('/:id/pay', canPaySalary, markSalaryAsPaid);

export default router;