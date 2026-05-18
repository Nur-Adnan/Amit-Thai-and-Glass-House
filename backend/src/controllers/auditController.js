import asyncHandler from '../utils/asyncHandler.js';
import AuditLog from '../models/AuditLog.js';
import mongoose from 'mongoose';

// @desc    Get all audit logs
// @route   GET /api/audit
// @access  Private (Owner only)
const getAuditLogs = asyncHandler(async (req, res) => {
  const {
    action,
    entityType,
    performedBy,
    severity,
    status,
    startDate,
    endDate,
    search,
    sortBy = 'timestamp',
    sortOrder = 'desc',
    page = 1,
    limit = 50
  } = req.query;

  // Build query
  const query = {};

  if (action) {
    query.action = action;
  }

  if (entityType) {
    query.entityType = entityType;
  }

  if (performedBy) {
    query.performedBy = performedBy;
  }

  if (severity) {
    query.severity = severity;
  }

  if (status) {
    query.status = status;
  }

  if (startDate || endDate) {
    query.timestamp = {};
    if (startDate) {
      query.timestamp.$gte = new Date(startDate);
    }
    if (endDate) {
      query.timestamp.$lte = new Date(endDate);
    }
  }

  if (search) {
    query.$or = [
      { entityName: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
      { action: { $regex: search, $options: 'i' } }
    ];
  }

  // Calculate pagination
  const skip = (page - 1) * limit;

  // Build sort object
  const sort = {};
  sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

  const auditLogs = await AuditLog.find(query)
    .populate('performedBy', 'name email role')
    .sort(sort)
    .skip(skip)
    .limit(parseInt(limit));

  const total = await AuditLog.countDocuments(query);

  res.status(200).json({
    success: true,
    count: auditLogs.length,
    total,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(total / limit)
    },
    data: auditLogs
  });
});

// @desc    Get single audit log
// @route   GET /api/audit/:id
// @access  Private (Owner only)
const getAuditLog = asyncHandler(async (req, res) => {
  const auditLog = await AuditLog.findById(req.params.id)
    .populate('performedBy', 'name email role');

  if (!auditLog) {
    return res.status(404).json({
      success: false,
      message: 'Audit log not found'
    });
  }

  res.status(200).json({
    success: true,
    data: auditLog
  });
});

// @desc    Get audit logs for specific entity
// @route   GET /api/audit/entity/:entityType/:entityId
// @access  Private (Owner only)
const getEntityAuditLogs = asyncHandler(async (req, res) => {
  const { entityType, entityId } = req.params;
  const { limit = 50, page = 1 } = req.query;

  // Validate entity ID format
  if (!mongoose.Types.ObjectId.isValid(entityId)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid entity ID format'
    });
  }

  const skip = (page - 1) * limit;

  const auditLogs = await AuditLog.getEntityLogs(entityType, entityId, {
    limit: parseInt(limit),
    skip
  });

  const total = await AuditLog.countDocuments({ entityType, entityId });

  res.status(200).json({
    success: true,
    count: auditLogs.length,
    total,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(total / limit)
    },
    data: auditLogs
  });
});

// @desc    Get user activity logs
// @route   GET /api/audit/user/:userId
// @access  Private (Owner only)
const getUserActivity = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const {
    startDate,
    endDate,
    actions,
    entityTypes,
    limit = 100,
    page = 1
  } = req.query;

  // Validate user ID format
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid user ID format'
    });
  }

  const skip = (page - 1) * limit;

  const options = {
    limit: parseInt(limit),
    skip,
    startDate,
    endDate
  };

  if (actions) {
    options.actions = Array.isArray(actions) ? actions : actions.split(',');
  }

  if (entityTypes) {
    options.entityTypes = Array.isArray(entityTypes) ? entityTypes : entityTypes.split(',');
  }

  const auditLogs = await AuditLog.getUserActivity(userId, options);

  // Get total count for pagination
  const countQuery = { performedBy: userId };
  if (startDate || endDate) {
    countQuery.timestamp = {};
    if (startDate) countQuery.timestamp.$gte = new Date(startDate);
    if (endDate) countQuery.timestamp.$lte = new Date(endDate);
  }
  if (options.actions) countQuery.action = { $in: options.actions };
  if (options.entityTypes) countQuery.entityType = { $in: options.entityTypes };

  const total = await AuditLog.countDocuments(countQuery);

  res.status(200).json({
    success: true,
    count: auditLogs.length,
    total,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(total / limit)
    },
    data: auditLogs
  });
});

// @desc    Get audit statistics
// @route   GET /api/audit/stats
// @access  Private (Owner only)
const getAuditStats = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;

  const options = {};
  if (startDate) options.startDate = new Date(startDate);
  if (endDate) options.endDate = new Date(endDate);

  // Get activity summary
  const activitySummary = await AuditLog.getActivitySummary(options);

  // Get top users by activity
  const dateFilter = {};
  if (startDate || endDate) {
    dateFilter.timestamp = {};
    if (startDate) dateFilter.timestamp.$gte = new Date(startDate);
    if (endDate) dateFilter.timestamp.$lte = new Date(endDate);
  }

  const topUsers = await AuditLog.aggregate([
    { $match: dateFilter },
    {
      $group: {
        _id: '$performedBy',
        actionCount: { $sum: 1 },
        lastActivity: { $max: '$timestamp' },
        actions: { $addToSet: '$action' }
      }
    },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'user'
      }
    },
    { $unwind: '$user' },
    {
      $project: {
        userId: '$_id',
        userName: '$user.name',
        userEmail: '$user.email',
        userRole: '$user.role',
        actionCount: 1,
        lastActivity: 1,
        uniqueActions: { $size: '$actions' }
      }
    },
    { $sort: { actionCount: -1 } },
    { $limit: 10 }
  ]);

  // Get activity by hour (last 24 hours)
  const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const hourlyActivity = await AuditLog.aggregate([
    { $match: { timestamp: { $gte: last24Hours } } },
    {
      $group: {
        _id: { $hour: '$timestamp' },
        count: { $sum: 1 }
      }
    },
    { $sort: { '_id': 1 } }
  ]);

  // Get critical actions in the last 7 days
  const last7Days = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const criticalActions = await AuditLog.find({
    severity: 'critical',
    timestamp: { $gte: last7Days }
  })
    .populate('performedBy', 'name email role')
    .sort({ timestamp: -1 })
    .limit(20);

  // Get failed actions
  const failedActions = await AuditLog.find({
    status: 'failed',
    timestamp: { $gte: dateFilter.timestamp?.$gte || last7Days }
  })
    .populate('performedBy', 'name email role')
    .sort({ timestamp: -1 })
    .limit(10);

  res.status(200).json({
    success: true,
    data: {
      summary: activitySummary,
      topUsers,
      hourlyActivity,
      criticalActions,
      failedActions,
      period: {
        startDate: options.startDate || last7Days,
        endDate: options.endDate || new Date()
      }
    }
  });
});

// @desc    Get available audit actions and entity types
// @route   GET /api/audit/metadata
// @access  Private (Owner only)
const getAuditMetadata = asyncHandler(async (req, res) => {
  // Get unique actions and entity types from schema
  const actions = AuditLog.schema.paths.action.enumValues;
  const entityTypes = AuditLog.schema.paths.entityType.enumValues;
  const severities = AuditLog.schema.paths.severity.enumValues;
  const statuses = AuditLog.schema.paths.status.enumValues;

  // Get actual data statistics
  const actionStats = await AuditLog.aggregate([
    {
      $group: {
        _id: '$action',
        count: { $sum: 1 },
        lastOccurrence: { $max: '$timestamp' }
      }
    },
    { $sort: { count: -1 } }
  ]);

  const entityTypeStats = await AuditLog.aggregate([
    {
      $group: {
        _id: '$entityType',
        count: { $sum: 1 },
        lastOccurrence: { $max: '$timestamp' }
      }
    },
    { $sort: { count: -1 } }
  ]);

  res.status(200).json({
    success: true,
    data: {
      availableFilters: {
        actions,
        entityTypes,
        severities,
        statuses
      },
      statistics: {
        actionStats,
        entityTypeStats
      }
    }
  });
});

// @desc    Export audit logs
// @route   GET /api/audit/export
// @access  Private (Owner only)
const exportAuditLogs = asyncHandler(async (req, res) => {
  const {
    format = 'json',
    startDate,
    endDate,
    action,
    entityType,
    severity
  } = req.query;

  // Build query
  const query = {};
  if (startDate || endDate) {
    query.timestamp = {};
    if (startDate) query.timestamp.$gte = new Date(startDate);
    if (endDate) query.timestamp.$lte = new Date(endDate);
  }
  if (action) query.action = action;
  if (entityType) query.entityType = entityType;
  if (severity) query.severity = severity;

  const auditLogs = await AuditLog.find(query)
    .populate('performedBy', 'name email role')
    .sort({ timestamp: -1 })
    .limit(10000); // Limit to prevent memory issues

  if (format === 'csv') {
    // Convert to CSV format
    const csvHeader = 'Timestamp,Action,Entity Type,Entity Name,Performed By,Description,Severity,Status\n';
    const csvData = auditLogs.map(log => {
      return [
        log.timestamp.toISOString(),
        log.action,
        log.entityType,
        log.entityName,
        log.performedBy ? `${log.performedBy.name} (${log.performedBy.email})` : 'Unknown',
        `"${log.description.replace(/"/g, '""')}"`, // Escape quotes
        log.severity,
        log.status
      ].join(',');
    }).join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="audit-logs-${new Date().toISOString().split('T')[0]}.csv"`);
    res.send(csvHeader + csvData);
  } else {
    // JSON format
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="audit-logs-${new Date().toISOString().split('T')[0]}.json"`);
    res.json({
      exportDate: new Date(),
      totalRecords: auditLogs.length,
      filters: { startDate, endDate, action, entityType, severity },
      data: auditLogs
    });
  }
});

export {
  getAuditLogs,
  getAuditLog,
  getEntityAuditLogs,
  getUserActivity,
  getAuditStats,
  getAuditMetadata,
  exportAuditLogs
};