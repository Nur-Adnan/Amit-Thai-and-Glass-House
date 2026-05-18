import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema({
  // Action performed
  action: {
    type: String,
    required: [true, 'Action is required'],
    enum: {
      values: [
        // Invoice actions
        'invoice_create', 'invoice_update', 'invoice_cancel', 'invoice_payment_add', 'invoice_payment_reverse',
        // Product actions
        'product_create', 'product_update', 'product_delete', 'product_stock_add', 'product_stock_subtract',
        'product_price_change', 'product_activate', 'product_deactivate',
        // Customer actions
        'customer_create', 'customer_update', 'customer_delete', 'customer_activate', 'customer_deactivate',
        // Employee actions
        'employee_create', 'employee_update', 'employee_delete', 'employee_activate', 'employee_deactivate',
        // Salary actions
        'salary_create', 'salary_update', 'salary_payment', 'salary_cancel',
        // Expense actions
        'expense_create', 'expense_update', 'expense_delete', 'expense_approve', 'expense_reject',
        // Investment actions
        'investment_create', 'investment_update', 'investment_delete', 'investment_approve', 'investment_reject',
        // Configuration actions
        'config_create', 'config_update', 'config_delete',
        // User actions
        'user_create', 'user_update', 'user_delete', 'user_login', 'user_logout',
        // System actions
        'system_backup', 'system_restore', 'data_export', 'data_import'
      ],
      message: 'Invalid action type'
    },
    index: true
  },
  
  // Entity type being acted upon
  entityType: {
    type: String,
    required: [true, 'Entity type is required'],
    enum: {
      values: [
        'Invoice', 'InvoicePayment', 'Product', 'Customer', 'Employee', 
        'SalaryPayment', 'Expense', 'Investment', 'CalculatorConfig', 
        'User', 'System'
      ],
      message: 'Invalid entity type'
    },
    index: true
  },
  
  // ID of the entity being acted upon
  entityId: {
    type: mongoose.Schema.ObjectId,
    required: [true, 'Entity ID is required'],
    index: true
  },
  
  // Human-readable entity identifier (invoice number, product name, etc.)
  entityName: {
    type: String,
    required: [true, 'Entity name is required'],
    maxlength: [200, 'Entity name cannot be more than 200 characters']
  },
  
  // User who performed the action
  performedBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: [true, 'Performed by is required'],
    index: true
  },
  
  // Timestamp of the action
  timestamp: {
    type: Date,
    default: Date.now,
    required: true,
    index: true
  },
  
  // Description of the action
  description: {
    type: String,
    required: [true, 'Description is required'],
    maxlength: [500, 'Description cannot be more than 500 characters']
  },
  
  // Changes made (before and after values)
  changes: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  
  // Additional metadata
  metadata: {
    ipAddress: {
      type: String,
      maxlength: [45, 'IP address cannot be more than 45 characters'] // IPv6 support
    },
    userAgent: {
      type: String,
      maxlength: [500, 'User agent cannot be more than 500 characters']
    },
    sessionId: {
      type: String,
      maxlength: [100, 'Session ID cannot be more than 100 characters']
    },
    // Additional context data
    context: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    }
  },
  
  // Severity level
  severity: {
    type: String,
    enum: {
      values: ['low', 'medium', 'high', 'critical'],
      message: 'Severity must be low, medium, high, or critical'
    },
    default: 'medium',
    index: true
  },
  
  // Status of the action
  status: {
    type: String,
    enum: {
      values: ['success', 'failed', 'pending'],
      message: 'Status must be success, failed, or pending'
    },
    default: 'success',
    index: true
  },
  
  // Error details if action failed
  errorDetails: {
    type: String,
    maxlength: [1000, 'Error details cannot be more than 1000 characters']
  }
}, {
  timestamps: false, // We use our own timestamp field
  collection: 'auditlogs'
});

// Compound indexes for efficient querying
auditLogSchema.index({ entityType: 1, entityId: 1 });
auditLogSchema.index({ performedBy: 1, timestamp: -1 });
auditLogSchema.index({ action: 1, timestamp: -1 });
auditLogSchema.index({ timestamp: -1, severity: 1 });
auditLogSchema.index({ entityType: 1, action: 1, timestamp: -1 });

// Static method to create audit log entry
auditLogSchema.statics.createLog = async function(logData) {
  try {
    // Validate required fields
    const requiredFields = ['action', 'entityType', 'entityId', 'entityName', 'performedBy', 'description'];
    for (const field of requiredFields) {
      if (!logData[field]) {
        throw new Error(`${field} is required for audit log`);
      }
    }
    
    // Set default severity based on action
    if (!logData.severity) {
      logData.severity = this.getDefaultSeverity(logData.action);
    }
    
    const auditLog = new this(logData);
    await auditLog.save();
    return auditLog;
  } catch (error) {
    console.error('Failed to create audit log:', error.message);
    // Don't throw error to prevent disrupting main operations
    return null;
  }
};

// Static method to get default severity for actions
auditLogSchema.statics.getDefaultSeverity = function(action) {
  const criticalActions = [
    'invoice_cancel', 'product_delete', 'customer_delete', 'employee_delete',
    'user_delete', 'system_backup', 'system_restore', 'data_export'
  ];
  
  const highActions = [
    'invoice_payment_reverse', 'product_price_change', 'salary_payment',
    'expense_approve', 'investment_approve', 'user_create'
  ];
  
  const mediumActions = [
    'invoice_create', 'invoice_update', 'product_create', 'product_update',
    'customer_create', 'employee_create', 'salary_create'
  ];
  
  if (criticalActions.includes(action)) return 'critical';
  if (highActions.includes(action)) return 'high';
  if (mediumActions.includes(action)) return 'medium';
  return 'low';
};

// Static method to get logs for specific entity
auditLogSchema.statics.getEntityLogs = async function(entityType, entityId, options = {}) {
  const {
    limit = 50,
    skip = 0,
    sortBy = 'timestamp',
    sortOrder = 'desc'
  } = options;
  
  const sort = {};
  sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
  
  return await this.find({ entityType, entityId })
    .populate('performedBy', 'name email role')
    .sort(sort)
    .limit(limit)
    .skip(skip);
};

// Static method to get user activity logs
auditLogSchema.statics.getUserActivity = async function(userId, options = {}) {
  const {
    limit = 100,
    skip = 0,
    startDate,
    endDate,
    actions,
    entityTypes
  } = options;
  
  const query = { performedBy: userId };
  
  if (startDate || endDate) {
    query.timestamp = {};
    if (startDate) query.timestamp.$gte = new Date(startDate);
    if (endDate) query.timestamp.$lte = new Date(endDate);
  }
  
  if (actions && actions.length > 0) {
    query.action = { $in: actions };
  }
  
  if (entityTypes && entityTypes.length > 0) {
    query.entityType = { $in: entityTypes };
  }
  
  return await this.find(query)
    .sort({ timestamp: -1 })
    .limit(limit)
    .skip(skip);
};

// Static method to get system activity summary
auditLogSchema.statics.getActivitySummary = async function(options = {}) {
  const {
    startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
    endDate = new Date()
  } = options;
  
  const matchStage = {
    timestamp: { $gte: startDate, $lte: endDate }
  };
  
  const summary = await this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: {
          action: '$action',
          entityType: '$entityType',
          severity: '$severity'
        },
        count: { $sum: 1 },
        lastOccurrence: { $max: '$timestamp' }
      }
    },
    {
      $group: {
        _id: null,
        totalActions: { $sum: '$count' },
        actionBreakdown: {
          $push: {
            action: '$_id.action',
            entityType: '$_id.entityType',
            severity: '$_id.severity',
            count: '$count',
            lastOccurrence: '$lastOccurrence'
          }
        },
        severityBreakdown: {
          $push: {
            severity: '$_id.severity',
            count: '$count'
          }
        }
      }
    }
  ]);
  
  return summary[0] || { totalActions: 0, actionBreakdown: [], severityBreakdown: [] };
};

// Virtual for formatted timestamp
auditLogSchema.virtual('formattedTimestamp').get(function() {
  return this.timestamp.toLocaleString();
});

// Virtual for action display name
auditLogSchema.virtual('actionDisplayName').get(function() {
  return this.action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
});

// Include virtuals when converting to JSON
auditLogSchema.set('toJSON', { virtuals: true });
auditLogSchema.set('toObject', { virtuals: true });

export default mongoose.model('AuditLog', auditLogSchema);