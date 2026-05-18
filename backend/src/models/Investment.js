import mongoose from 'mongoose';
import { MoneyValidator, GeneralValidator } from '../utils/validation.js';
import CurrencyService from '../services/currencyService.js';
import DateService from '../services/dateService.js';

const investmentSchema = new mongoose.Schema({
  investmentNo: {
    type: String,
    required: [true, 'Investment number is required'],
    unique: true,
    trim: true
  },
  type: {
    type: String,
    required: [true, 'Investment type is required'],
    enum: {
      values: ['stock_purchase', 'equipment', 'infrastructure', 'marketing', 'other'],
      message: 'Investment type must be stock_purchase, equipment, infrastructure, marketing, or other'
    }
  },
  category: {
    type: String,
    required: [true, 'Investment category is required'],
    enum: {
      values: ['inventory', 'fixed_asset', 'operational', 'marketing', 'miscellaneous'],
      message: 'Investment category must be inventory, fixed_asset, operational, marketing, or miscellaneous'
    }
  },
  description: {
    type: String,
    required: [true, 'Investment description is required'],
    trim: true,
    minlength: [5, 'Description must be at least 5 characters'],
    maxlength: [200, 'Description cannot exceed 200 characters']
  },
  amount: {
    type: Number,
    required: [true, 'Investment amount is required'],
    min: [0.01, 'Investment amount must be greater than 0'],
    validate: {
      validator: function(value) {
        const validation = MoneyValidator.validateAmount(value, 'Investment amount', {
          allowZero: false,
          maxAmount: 10000000
        });
        return validation.isValid;
      },
      message: 'Invalid investment amount'
    }
  },
  // Reference to related documents
  relatedDocument: {
    documentType: {
      type: String,
      enum: {
        values: ['stock_purchase', 'expense', 'manual_entry'],
        message: 'Document type must be stock_purchase, expense, or manual_entry'
      }
    },
    documentId: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'relatedDocument.documentType'
    },
    documentNo: {
      type: String,
      trim: true
    }
  },
  // Supplier information (for stock purchases)
  supplier: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Supplier'
  },
  supplierName: {
    type: String,
    trim: true
  },
  // Investment details
  investmentDate: {
    type: Date,
    required: [true, 'Investment date is required'],
    default: Date.now,
    validate: {
      validator: function(value) {
        return value <= new Date();
      },
      message: 'Investment date cannot be in the future'
    }
  },
  paymentMethod: {
    type: String,
    required: [true, 'Payment method is required'],
    enum: {
      values: ['cash', 'bank', 'check', 'mobile_banking', 'credit_card'],
      message: 'Payment method must be cash, bank, check, mobile_banking, or credit_card'
    },
    default: 'cash'
  },
  paymentReference: {
    type: String,
    trim: true
  },
  // ROI tracking
  expectedROI: {
    percentage: {
      type: Number,
      min: [0, 'Expected ROI percentage cannot be negative'],
      max: [1000, 'Expected ROI percentage cannot exceed 1000%']
    },
    timeframe: {
      type: String,
      enum: {
        values: ['monthly', 'quarterly', 'yearly'],
        message: 'ROI timeframe must be monthly, quarterly, or yearly'
      }
    }
  },
  actualROI: {
    amount: {
      type: Number,
      default: 0,
      min: [0, 'Actual ROI amount cannot be negative']
    },
    calculatedAt: {
      type: Date
    }
  },
  // Depreciation (for fixed assets)
  depreciation: {
    method: {
      type: String,
      enum: {
        values: ['straight_line', 'declining_balance', 'none'],
        message: 'Depreciation method must be straight_line, declining_balance, or none'
      },
      default: 'none'
    },
    rate: {
      type: Number,
      min: [0, 'Depreciation rate cannot be negative'],
      max: [100, 'Depreciation rate cannot exceed 100%']
    },
    usefulLife: {
      type: Number,
      min: [1, 'Useful life must be at least 1 year']
    },
    currentValue: {
      type: Number,
      min: [0, 'Current value cannot be negative']
    },
    lastDepreciationDate: {
      type: Date
    }
  },
  // Tags for categorization
  tags: [{
    type: String,
    trim: true,
    maxlength: [30, 'Tag cannot exceed 30 characters']
  }],
  notes: {
    type: String,
    trim: true,
    maxlength: [500, 'Notes cannot exceed 500 characters']
  },
  // Approval workflow
  approvalStatus: {
    type: String,
    enum: {
      values: ['pending', 'approved', 'rejected'],
      message: 'Approval status must be pending, approved, or rejected'
    },
    default: 'approved' // Auto-approve for now, can be changed later
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedAt: {
    type: Date
  },
  // Audit fields
  isActive: {
    type: Boolean,
    default: true
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedAt: {
    type: Date
  },
  deletedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Created by is required']
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual fields for currency formatting
investmentSchema.virtual('formattedAmount').get(function() {
  return CurrencyService.formatBDT(this.amount);
});

investmentSchema.virtual('formattedCurrentValue').get(function() {
  return this.depreciation?.currentValue ? 
    CurrencyService.formatBDT(this.depreciation.currentValue) : 
    this.formattedAmount;
});

investmentSchema.virtual('formattedActualROI').get(function() {
  return CurrencyService.formatBDT(this.actualROI?.amount || 0);
});

// Virtual field for formatted dates
investmentSchema.virtual('formattedInvestmentDate').get(function() {
  return DateService.format(this.investmentDate, 'medium');
});

investmentSchema.virtual('formattedApprovedAt').get(function() {
  return this.approvedAt ? DateService.format(this.approvedAt, 'medium') : null;
});

// Virtual field for approval status badge
investmentSchema.virtual('approvalBadge').get(function() {
  const statusMap = {
    'pending': { text: 'Pending', class: 'warning' },
    'approved': { text: 'Approved', class: 'success' },
    'rejected': { text: 'Rejected', class: 'danger' }
  };
  return statusMap[this.approvalStatus] || { text: 'Unknown', class: 'secondary' };
});

// Virtual field for investment type badge
investmentSchema.virtual('typeBadge').get(function() {
  const typeMap = {
    'stock_purchase': { text: 'Stock Purchase', class: 'primary' },
    'equipment': { text: 'Equipment', class: 'info' },
    'infrastructure': { text: 'Infrastructure', class: 'secondary' },
    'marketing': { text: 'Marketing', class: 'success' },
    'other': { text: 'Other', class: 'light' }
  };
  return typeMap[this.type] || { text: 'Unknown', class: 'secondary' };
});

// Virtual field for category badge
investmentSchema.virtual('categoryBadge').get(function() {
  const categoryMap = {
    'inventory': { text: 'Inventory', class: 'primary' },
    'fixed_asset': { text: 'Fixed Asset', class: 'info' },
    'operational': { text: 'Operational', class: 'warning' },
    'marketing': { text: 'Marketing', class: 'success' },
    'miscellaneous': { text: 'Miscellaneous', class: 'secondary' }
  };
  return categoryMap[this.category] || { text: 'Unknown', class: 'secondary' };
});

// Virtual field for depreciation info
investmentSchema.virtual('depreciationInfo').get(function() {
  if (!this.depreciation || this.depreciation.method === 'none') {
    return null;
  }
  
  const currentValue = this.depreciation.currentValue || this.amount;
  const depreciatedAmount = this.amount - currentValue;
  const depreciationPercentage = this.amount > 0 ? (depreciatedAmount / this.amount) * 100 : 0;
  
  return {
    method: this.depreciation.method,
    rate: this.depreciation.rate,
    usefulLife: this.depreciation.usefulLife,
    originalValue: this.amount,
    currentValue: currentValue,
    depreciatedAmount: depreciatedAmount,
    depreciationPercentage: Math.round(depreciationPercentage * 100) / 100,
    formattedOriginalValue: CurrencyService.formatBDT(this.amount),
    formattedCurrentValue: CurrencyService.formatBDT(currentValue),
    formattedDepreciatedAmount: CurrencyService.formatBDT(depreciatedAmount)
  };
});

// Static method to generate investment number
investmentSchema.statics.generateInvestmentNumber = async function() {
  try {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const yearMonth = `${year}${month}`;
    
    // Find the last investment for this month
    const lastInvestment = await this.findOne({
      investmentNo: { $regex: `^INV-${yearMonth}-` }
    }).sort({ investmentNo: -1 });
    
    let sequence = 1;
    if (lastInvestment) {
      const lastSequence = parseInt(lastInvestment.investmentNo.split('-')[2]);
      sequence = lastSequence + 1;
    }
    
    const sequenceStr = String(sequence).padStart(4, '0');
    return `INV-${yearMonth}-${sequenceStr}`;
  } catch (error) {
    console.error('Error generating investment number:', error);
    throw error;
  }
};

// Static method to get investment summary
investmentSchema.statics.getInvestmentSummary = async function(startDate, endDate) {
  const matchStage = {
    isDeleted: { $ne: true },
    approvalStatus: 'approved'
  };
  
  if (startDate || endDate) {
    matchStage.investmentDate = {};
    if (startDate) matchStage.investmentDate.$gte = startDate;
    if (endDate) matchStage.investmentDate.$lte = endDate;
  }
  
  const summary = await this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: null,
        totalInvestments: { $sum: 1 },
        totalAmount: { $sum: '$amount' },
        byType: {
          $push: {
            type: '$type',
            amount: '$amount'
          }
        },
        byCategory: {
          $push: {
            category: '$category',
            amount: '$amount'
          }
        }
      }
    }
  ]);
  
  if (summary.length === 0) {
    return {
      totalInvestments: 0,
      totalAmount: 0,
      formattedTotalAmount: CurrencyService.formatBDT(0),
      byType: {},
      byCategory: {}
    };
  }
  
  const result = summary[0];
  
  // Group by type
  const typeGroups = {};
  result.byType.forEach(item => {
    if (!typeGroups[item.type]) {
      typeGroups[item.type] = { count: 0, amount: 0 };
    }
    typeGroups[item.type].count++;
    typeGroups[item.type].amount += item.amount;
  });
  
  // Group by category
  const categoryGroups = {};
  result.byCategory.forEach(item => {
    if (!categoryGroups[item.category]) {
      categoryGroups[item.category] = { count: 0, amount: 0 };
    }
    categoryGroups[item.category].count++;
    categoryGroups[item.category].amount += item.amount;
  });
  
  return {
    totalInvestments: result.totalInvestments,
    totalAmount: result.totalAmount,
    formattedTotalAmount: CurrencyService.formatBDT(result.totalAmount),
    byType: typeGroups,
    byCategory: categoryGroups
  };
};

// Pre-save middleware to generate investment number
investmentSchema.pre('save', async function() {
  if (this.isNew && !this.investmentNo) {
    try {
      const investmentNo = await this.constructor.generateInvestmentNumber();
      this.investmentNo = investmentNo;
    } catch (error) {
      console.error('Error generating investment number:', error);
      throw error;
    }
  }
  
  // Set current value for depreciation
  if (this.depreciation && this.depreciation.method !== 'none' && !this.depreciation.currentValue) {
    this.depreciation.currentValue = this.amount;
  }
  
  // Auto-approve if not set
  if (this.isNew && !this.approvalStatus) {
    this.approvalStatus = 'approved';
    this.approvedAt = new Date();
  }
});

// Index for better query performance
investmentSchema.index({ investmentNo: 1 });
investmentSchema.index({ type: 1 });
investmentSchema.index({ category: 1 });
investmentSchema.index({ investmentDate: -1 });
investmentSchema.index({ approvalStatus: 1 });
investmentSchema.index({ isDeleted: 1 });
investmentSchema.index({ 'relatedDocument.documentType': 1, 'relatedDocument.documentId': 1 });

// Add soft delete method
investmentSchema.methods.softDelete = function(userId) {
  this.isDeleted = true;
  this.deletedAt = new Date();
  this.deletedBy = userId;
  return this.save();
};

// Add restore method
investmentSchema.methods.restore = function() {
  this.isDeleted = false;
  this.deletedAt = undefined;
  this.deletedBy = undefined;
  return this.save();
};

export default mongoose.model('Investment', investmentSchema);