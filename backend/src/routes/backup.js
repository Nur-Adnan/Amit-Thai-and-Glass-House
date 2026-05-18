import express from 'express';
import {
  exportInvoices,
  exportCustomers,
  exportProducts,
  exportExpenses,
  exportEmployees,
  createFullBackup,
  getBackupList,
  downloadBackup,
  downloadFullBackup,
  deleteBackup,
  cleanupOldBackups,
  getBackupStats
} from '../controllers/backupController.js';
import {
  getScheduledBackupStatus,
  startScheduledBackup,
  stopScheduledBackup,
  triggerManualBackup
} from '../controllers/scheduledBackupController.js';
import { protect, ownerOnly } from '../middleware/auth.js';

const router = express.Router();

// All backup routes require owner authentication
router.use(protect);
router.use(ownerOnly);

// Scheduled backup routes (specific routes first)
router.get('/scheduled/status', getScheduledBackupStatus);
router.post('/scheduled/start', startScheduledBackup);
router.post('/scheduled/stop', stopScheduledBackup);
router.post('/scheduled/trigger', triggerManualBackup);

// Statistics and management routes
router.get('/stats', getBackupStats);
router.get('/list', getBackupList);
router.post('/cleanup', cleanupOldBackups);

// Full backup routes
router.post('/full', createFullBackup);
router.get('/download/full/:backupId', downloadFullBackup);

// Export routes for individual modules
router.get('/export/invoices', exportInvoices);
router.get('/export/customers', exportCustomers);
router.get('/export/products', exportProducts);
router.get('/export/expenses', exportExpenses);
router.get('/export/employees', exportEmployees);

// Download and delete routes
router.get('/download/:filename', downloadBackup);
router.delete('/:filename', deleteBackup);

export default router;