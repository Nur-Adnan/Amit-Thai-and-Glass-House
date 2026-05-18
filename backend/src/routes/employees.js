import express from 'express';
import {
  getEmployees,
  getEmployee,
  createEmployee,
  updateEmployee,
  deactivateEmployee,
  activateEmployee,
  deleteEmployee,
  restoreEmployee,
  getDeletedEmployees,
  getEmployeeStats
} from '../controllers/employeeController.js';
import { protect, managerAndAbove, ownerOnly } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Statistics route (must be before /:id routes)
router.get('/stats', managerAndAbove, getEmployeeStats);
router.get('/deleted', ownerOnly, getDeletedEmployees);

// Basic CRUD routes
router.route('/')
  .get(getEmployees)
  .post(managerAndAbove, createEmployee);

router.route('/:id')
  .get(getEmployee)
  .put(managerAndAbove, updateEmployee)
  .delete(ownerOnly, deleteEmployee);

// Soft delete management
router.put('/:id/restore', ownerOnly, restoreEmployee);

// Employee status management
router.put('/:id/deactivate', managerAndAbove, deactivateEmployee);
router.put('/:id/activate', managerAndAbove, activateEmployee);

export default router;