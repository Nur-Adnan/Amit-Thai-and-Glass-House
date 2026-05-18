import AuditService from './auditService.js';

/**
 * Soft Delete Service
 * Provides centralized soft delete functionality for all models
 */
class SoftDeleteService {
  
  /**
   * Soft delete an entity
   * @param {Object} entity - The entity to soft delete
   * @param {String} userId - ID of user performing the deletion
   * @param {Object} req - Request object for audit logging
   * @param {String} reason - Reason for deletion (optional)
   */
  static async softDelete(entity, userId, req, reason = null) {
    try {
      // Store original state for audit
      const originalState = { ...entity.toObject() };
      
      // Perform soft delete
      await entity.softDelete(userId);
      
      // Log audit trail
      await AuditService.log({
        action: 'soft_delete',
        entityType: entity.constructor.modelName,
        entityId: entity._id,
        entityName: this.getEntityName(entity),
        performedBy: userId,
        description: `Soft deleted ${entity.constructor.modelName.toLowerCase()}: ${this.getEntityName(entity)}${reason ? ` - Reason: ${reason}` : ''}`,
        changes: {
          softDelete: {
            isDeleted: { from: false, to: true },
            deletedAt: { from: null, to: entity.deletedAt },
            deletedBy: { from: null, to: userId },
            reason: reason
          },
          originalState: originalState
        },
        severity: 'high'
      }, req);

      return {
        success: true,
        message: `${entity.constructor.modelName} soft deleted successfully`,
        entity: entity
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to soft delete ${entity.constructor.modelName.toLowerCase()}: ${error.message}`,
        error: error
      };
    }
  }

  /**
   * Restore a soft deleted entity
   * @param {Object} entity - The entity to restore
   * @param {String} userId - ID of user performing the restoration
   * @param {Object} req - Request object for audit logging
   * @param {String} reason - Reason for restoration (optional)
   */
  static async restore(entity, userId, req, reason = null) {
    try {
      // Store deletion info for audit
      const deletionInfo = {
        deletedAt: entity.deletedAt,
        deletedBy: entity.deletedBy,
        wasDeleted: entity.isDeleted
      };
      
      // Perform restoration
      await entity.restore();
      
      // Log audit trail
      await AuditService.log({
        action: 'restore',
        entityType: entity.constructor.modelName,
        entityId: entity._id,
        entityName: this.getEntityName(entity),
        performedBy: userId,
        description: `Restored ${entity.constructor.modelName.toLowerCase()}: ${this.getEntityName(entity)}${reason ? ` - Reason: ${reason}` : ''}`,
        changes: {
          restore: {
            isDeleted: { from: true, to: false },
            deletedAt: { from: deletionInfo.deletedAt, to: null },
            deletedBy: { from: deletionInfo.deletedBy, to: null },
            reason: reason
          },
          previousDeletion: deletionInfo
        },
        severity: 'medium'
      }, req);

      return {
        success: true,
        message: `${entity.constructor.modelName} restored successfully`,
        entity: entity
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to restore ${entity.constructor.modelName.toLowerCase()}: ${error.message}`,
        error: error
      };
    }
  }

  /**
   * Get all soft deleted entities for a model
   * @param {Object} Model - The mongoose model
   * @param {Object} filters - Additional filters (optional)
   * @param {Object} options - Query options (optional)
   */
  static async getDeleted(Model, filters = {}, options = {}) {
    try {
      const query = { isDeleted: true, ...filters };
      const {
        page = 1,
        limit = 10,
        sortBy = 'deletedAt',
        sortOrder = 'desc',
        populate = []
      } = options;

      const skip = (page - 1) * limit;
      const sort = {};
      sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

      let queryBuilder = Model.find(query)
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit));

      // Add population if specified
      if (populate.length > 0) {
        populate.forEach(pop => {
          queryBuilder = queryBuilder.populate(pop);
        });
      }

      const entities = await queryBuilder;
      const total = await Model.countDocuments(query);

      return {
        success: true,
        data: entities,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to get deleted ${Model.modelName.toLowerCase()}s: ${error.message}`,
        error: error
      };
    }
  }

  /**
   * Permanently delete a soft deleted entity (use with extreme caution)
   * @param {Object} entity - The entity to permanently delete
   * @param {String} userId - ID of user performing the permanent deletion
   * @param {Object} req - Request object for audit logging
   * @param {String} reason - Reason for permanent deletion (required)
   */
  static async permanentDelete(entity, userId, req, reason) {
    if (!reason) {
      throw new Error('Reason is required for permanent deletion');
    }

    if (!entity.isDeleted) {
      throw new Error('Entity must be soft deleted before permanent deletion');
    }

    try {
      // Store complete entity data for audit
      const entityData = { ...entity.toObject() };
      
      // Log audit trail before deletion
      await AuditService.log({
        action: 'permanent_delete',
        entityType: entity.constructor.modelName,
        entityId: entity._id,
        entityName: this.getEntityName(entity),
        performedBy: userId,
        description: `PERMANENTLY DELETED ${entity.constructor.modelName.toLowerCase()}: ${this.getEntityName(entity)} - Reason: ${reason}`,
        changes: {
          permanentDelete: {
            reason: reason,
            deletedData: entityData,
            warning: 'This data has been permanently removed from the database'
          }
        },
        severity: 'critical'
      }, req);

      // Permanently delete the entity
      await entity.deleteOne();

      return {
        success: true,
        message: `${entity.constructor.modelName} permanently deleted`,
        warning: 'This action cannot be undone'
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to permanently delete ${entity.constructor.modelName.toLowerCase()}: ${error.message}`,
        error: error
      };
    }
  }

  /**
   * Get entity name for display purposes
   * @param {Object} entity - The entity
   */
  static getEntityName(entity) {
    // Try common name fields
    if (entity.name) return entity.name;
    if (entity.invoiceNo) return entity.invoiceNo;
    if (entity.employeeId) return entity.employeeId;
    if (entity.customerId) return entity.customerId;
    
    // Fallback to ID
    return entity._id.toString();
  }

  /**
   * Add soft delete filter to query
   * @param {Object} query - The query object
   * @param {Boolean} includeDeleted - Whether to include deleted items
   */
  static addSoftDeleteFilter(query, includeDeleted = false) {
    if (!includeDeleted) {
      query.isDeleted = { $ne: true };
    }
    return query;
  }

  /**
   * Get deletion statistics for a model
   * @param {Object} Model - The mongoose model
   */
  static async getDeletionStats(Model) {
    try {
      const stats = await Model.aggregate([
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            active: { $sum: { $cond: [{ $ne: ['$isDeleted', true] }, 1, 0] } },
            deleted: { $sum: { $cond: ['$isDeleted', 1, 0] } }
          }
        }
      ]);

      const result = stats[0] || { total: 0, active: 0, deleted: 0 };
      
      return {
        success: true,
        stats: {
          total: result.total,
          active: result.active,
          deleted: result.deleted,
          deletionRate: result.total > 0 ? ((result.deleted / result.total) * 100).toFixed(2) : 0
        }
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to get deletion stats: ${error.message}`,
        error: error
      };
    }
  }
}

export default SoftDeleteService;