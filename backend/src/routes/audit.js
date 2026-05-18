import express from 'express';
import {
  getAuditLogs,
  getAuditLog,
  getEntityAuditLogs,
  getUserActivity,
  getAuditStats,
  getAuditMetadata,
  exportAuditLogs
} from '../controllers/auditController.js';
import { protect, ownerOnly } from '../middleware/auth.js';

const router = express.Router();

// All audit routes require owner authentication
router.use(protect);
router.use(ownerOnly);

// Metadata and statistics routes (specific routes first)
router.get('/metadata', getAuditMetadata);
router.get('/stats', getAuditStats);
router.get('/export', exportAuditLogs);

// Entity and user specific routes
router.get('/entity/:entityType/:entityId', getEntityAuditLogs);
router.get('/user/:userId', getUserActivity);

// General routes
router.get('/', getAuditLogs);
router.get('/:id', getAuditLog);

export default router;