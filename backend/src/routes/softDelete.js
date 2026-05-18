import express from 'express';
import {
  getSoftDeleteStats,
  getAllSoftDeleted,
  bulkRestore,
  permanentDelete,
  cleanupOldDeleted,
  searchSoftDeleted
} from '../controllers/softDeleteController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// Apply authentication to all routes
router.use(protect);

// @route   GET /api/soft-delete/stats
// @desc    Get soft delete statistics for all models
// @access  Private (Manager and above)
router.get('/stats', authorize('manager', 'owner'), getSoftDeleteStats);

// @route   GET /api/soft-delete/all
// @desc    Get all soft deleted items across models
// @access  Private (Manager and above)
router.get('/all', authorize('manager', 'owner'), getAllSoftDeleted);

// @route   GET /api/soft-delete/search
// @desc    Search across all soft deleted items
// @access  Private (Manager and above)
router.get('/search', authorize('manager', 'owner'), searchSoftDeleted);

// @route   PUT /api/soft-delete/bulk-restore
// @desc    Bulk restore soft deleted items
// @access  Private (Manager and above)
router.put('/bulk-restore', authorize('manager', 'owner'), bulkRestore);

// @route   DELETE /api/soft-delete/permanent
// @desc    Permanently delete soft deleted items (DANGEROUS)
// @access  Private (Owner only)
router.delete('/permanent', authorize('owner'), permanentDelete);

// @route   DELETE /api/soft-delete/cleanup
// @desc    Clean up old soft deleted items
// @access  Private (Owner only)
router.delete('/cleanup', authorize('owner'), cleanupOldDeleted);

export default router;