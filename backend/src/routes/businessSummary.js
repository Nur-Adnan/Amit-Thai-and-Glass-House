import express from 'express';
import { getBusinessSummary } from '../controllers/businessSummaryController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Get business summary for dashboard
router.get('/', protect, getBusinessSummary);

export default router;