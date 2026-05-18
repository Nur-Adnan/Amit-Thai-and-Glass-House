import express from 'express';
import {
  getDailySummary,
  getWeeklySummary,
  getMonthlySummary
} from '../controllers/dailySummaryController.js';
import { protect, managerAndAbove } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Daily summary - available to all authenticated users
router.get('/', getDailySummary);

// Weekly and monthly summaries - manager and above only
router.get('/weekly', managerAndAbove, getWeeklySummary);
router.get('/monthly', managerAndAbove, getMonthlySummary);

export default router;