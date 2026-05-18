import asyncHandler from '../utils/asyncHandler.js';
import SoftDeleteService from '../services/softDeleteService.js';
import Product from '../models/Product.js';
import Invoice from '../models/Invoice.js';
import Customer from '../models/Customer.js';
import Employee from '../models/Employee.js';

// Model mapping for easier access
const MODEL_MAP = {
  'product': Product,
  'invoice': Invoice,
  'customer': Customer,
  'employee': Employee
};

// @desc    Get soft delete statistics for all models
// @route   GET /api/soft-delete/stats
// @access  Private (Manager and above)
export const getSoftDeleteStats = asyncHandler(async (req, res) => {
  const stats = {};

  // Get stats for each model
  for (const [modelName, Model] of Object.entries(MODEL_MAP)) {
    const result = await SoftDeleteService.getDeletionStats(Model);
    if (result.success) {
      stats[modelName] = result.stats;
    }
  }

  res.status(200).json({
    success: true,
    data: stats
  });
});

// @desc    Get all soft deleted items across models
// @route   GET /api/soft-delete/all
// @access  Private (Manager and above)
export const getAllSoftDeleted = asyncHandler(async (req, res) => {
  const {
    modelType,
    sortBy = 'deletedAt',
    sortOrder = 'desc',
    page = 1,
    limit = 20
  } = req.query;

  const results = {};

  if (modelType && MODEL_MAP[modelType]) {
    // Get deleted items for specific model
    const Model = MODEL_MAP[modelType];
    const result = await SoftDeleteService.getDeleted(Model, {}, {
      page,
      limit,
      sortBy,
      sortOrder,
      populate: ['createdBy', 'updatedBy', 'deletedBy']
    });

    if (result.success) {
      results[modelType] = result;
    }
  } else {
    // Get deleted items for all models
    for (const [modelName, Model] of Object.entries(MODEL_MAP)) {
      const result = await SoftDeleteService.getDeleted(Model, {}, {
        page: 1,
        limit: 5, // Limit per model when showing all
        sortBy,
        sortOrder,
        populate: ['createdBy', 'updatedBy', 'deletedBy']
      });

      if (result.success) {
        results[modelName] = result;
      }
    }
  }

  res.status(200).json({
    success: true,
    data: results
  });
});

// @desc    Bulk restore soft deleted items
// @route   PUT /api/soft-delete/bulk-restore
// @access  Private (Manager and above)
export const bulkRestore = asyncHandler(async (req, res) => {
  const { items, reason } = req.body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Please provide items to restore'
    });
  }

  const results = [];
  const errors = [];

  for (const item of items) {
    const { modelType, id } = item;

    if (!MODEL_MAP[modelType]) {
      errors.push({
        id,
        modelType,
        error: 'Invalid model type'
      });
      continue;
    }

    try {
      const Model = MODEL_MAP[modelType];
      const entity = await Model.findById(id);

      if (!entity) {
        errors.push({
          id,
          modelType,
          error: 'Entity not found'
        });
        continue;
      }

      if (!entity.isDeleted) {
        errors.push({
          id,
          modelType,
          error: 'Entity is not deleted'
        });
        continue;
      }

      const result = await SoftDeleteService.restore(entity, req.user.id, req, reason);

      if (result.success) {
        results.push({
          id,
          modelType,
          entityName: SoftDeleteService.getEntityName(entity),
          status: 'restored'
        });
      } else {
        errors.push({
          id,
          modelType,
          error: result.message
        });
      }
    } catch (error) {
      errors.push({
        id,
        modelType,
        error: error.message
      });
    }
  }

  res.status(200).json({
    success: true,
    message: `Bulk restore completed. ${results.length} items restored, ${errors.length} errors.`,
    data: {
      restored: results,
      errors: errors,
      summary: {
        totalRequested: items.length,
        restored: results.length,
        failed: errors.length
      }
    }
  });
});

// @desc    Permanently delete soft deleted items (DANGEROUS)
// @route   DELETE /api/soft-delete/permanent
// @access  Private (Owner only)
export const permanentDelete = asyncHandler(async (req, res) => {
  const { modelType, id, reason } = req.body;

  if (!reason) {
    return res.status(400).json({
      success: false,
      message: 'Reason is required for permanent deletion'
    });
  }

  if (!MODEL_MAP[modelType]) {
    return res.status(400).json({
      success: false,
      message: 'Invalid model type'
    });
  }

  const Model = MODEL_MAP[modelType];
  const entity = await Model.findById(id);

  if (!entity) {
    return res.status(404).json({
      success: false,
      message: 'Entity not found'
    });
  }

  if (!entity.isDeleted) {
    return res.status(400).json({
      success: false,
      message: 'Entity must be soft deleted before permanent deletion'
    });
  }

  const result = await SoftDeleteService.permanentDelete(entity, req.user.id, req, reason);

  if (!result.success) {
    return res.status(400).json({
      success: false,
      message: result.message
    });
  }

  res.status(200).json({
    success: true,
    message: result.message,
    warning: result.warning
  });
});

// @desc    Clean up old soft deleted items (older than specified days)
// @route   DELETE /api/soft-delete/cleanup
// @access  Private (Owner only)
export const cleanupOldDeleted = asyncHandler(async (req, res) => {
  const { days = 90, reason } = req.body;

  if (!reason) {
    return res.status(400).json({
      success: false,
      message: 'Reason is required for cleanup operation'
    });
  }

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - parseInt(days));

  const results = {};
  let totalCleaned = 0;

  for (const [modelName, Model] of Object.entries(MODEL_MAP)) {
    try {
      const oldDeletedItems = await Model.find({
        isDeleted: true,
        deletedAt: { $lt: cutoffDate }
      });

      const cleaned = [];
      const errors = [];

      for (const item of oldDeletedItems) {
        try {
          const result = await SoftDeleteService.permanentDelete(
            item, 
            req.user.id, 
            req, 
            `${reason} (Auto-cleanup after ${days} days)`
          );

          if (result.success) {
            cleaned.push({
              id: item._id,
              name: SoftDeleteService.getEntityName(item),
              deletedAt: item.deletedAt
            });
          } else {
            errors.push({
              id: item._id,
              error: result.message
            });
          }
        } catch (error) {
          errors.push({
            id: item._id,
            error: error.message
          });
        }
      }

      results[modelName] = {
        found: oldDeletedItems.length,
        cleaned: cleaned.length,
        errors: errors.length,
        cleanedItems: cleaned,
        errorItems: errors
      };

      totalCleaned += cleaned.length;
    } catch (error) {
      results[modelName] = {
        error: error.message
      };
    }
  }

  res.status(200).json({
    success: true,
    message: `Cleanup completed. ${totalCleaned} items permanently deleted.`,
    data: {
      cutoffDate,
      daysOld: parseInt(days),
      totalCleaned,
      results
    }
  });
});

// @desc    Search across all soft deleted items
// @route   GET /api/soft-delete/search
// @access  Private (Manager and above)
export const searchSoftDeleted = asyncHandler(async (req, res) => {
  const { q, modelType } = req.query;

  if (!q) {
    return res.status(400).json({
      success: false,
      message: 'Please provide a search query'
    });
  }

  const results = {};

  const modelsToSearch = modelType && MODEL_MAP[modelType] 
    ? { [modelType]: MODEL_MAP[modelType] }
    : MODEL_MAP;

  for (const [modelName, Model] of Object.entries(modelsToSearch)) {
    try {
      let searchQuery = { isDeleted: true };

      // Add model-specific search fields
      if (modelName === 'product') {
        searchQuery.$or = [
          { name: { $regex: q, $options: 'i' } },
          { category: { $regex: q, $options: 'i' } }
        ];
      } else if (modelName === 'invoice') {
        searchQuery.$or = [
          { invoiceNo: { $regex: q, $options: 'i' } },
          { customerName: { $regex: q, $options: 'i' } }
        ];
      } else if (modelName === 'customer') {
        searchQuery.$or = [
          { name: { $regex: q, $options: 'i' } },
          { customerId: { $regex: q, $options: 'i' } },
          { phone: { $regex: q, $options: 'i' } },
          { email: { $regex: q, $options: 'i' } }
        ];
      } else if (modelName === 'employee') {
        searchQuery.$or = [
          { name: { $regex: q, $options: 'i' } },
          { employeeId: { $regex: q, $options: 'i' } },
          { email: { $regex: q, $options: 'i' } },
          { position: { $regex: q, $options: 'i' } }
        ];
      }

      const items = await Model.find(searchQuery)
        .populate('deletedBy', 'name email')
        .sort({ deletedAt: -1 })
        .limit(10);

      results[modelName] = {
        count: items.length,
        items: items
      };
    } catch (error) {
      results[modelName] = {
        error: error.message
      };
    }
  }

  res.status(200).json({
    success: true,
    query: q,
    data: results
  });
});