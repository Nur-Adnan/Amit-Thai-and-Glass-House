import express from 'express';
import {
  getTodaysSales,
  getMonthlyProfit,
  getTotalInvestments,
  getInventoryAlerts,
  getDueInvoices,
  getSalarySummary,
  getDashboardOverview
} from '../controllers/dashboardController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// Apply authentication to all routes
router.use(protect);

// Dashboard overview (Manager and above)
router.get('/overview', authorize('manager', 'owner'), getDashboardOverview);

// Individual dashboard components
router.get('/todays-sales', getTodaysSales);
router.get('/monthly-profit', authorize('manager', 'owner'), getMonthlyProfit);
router.get('/total-investments', authorize('manager', 'owner'), getTotalInvestments);
router.get('/inventory-alerts', getInventoryAlerts);
router.get('/due-invoices', getDueInvoices);
router.get('/salary-summary', authorize('manager', 'owner'), getSalarySummary);

export default router;