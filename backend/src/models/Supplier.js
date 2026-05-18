/**
 * Supplier Model
 * Tracks suppliers for product purchases and investment entries
 * Common in Bangladesh business operations for managing supplier dues
 */

import mongoose from 'mongoose';
import { MoneyValidator, GeneralValidator } from '../utils/validation.js';
import CurrencyService from '../services/currencyService.js';
import DateService from '../services/dateService.js';

const supplierSchema = new mongoose.Schema({
  // Auto-generated supplier ID
  supplierId: {
    type: String,
    unique: true
  },
  
  // Basic supplier information
  name: {
    type: String,
    required: [true, 'Supplier name is required'],
    trim: true,
    minlength: [2, 'Supplier name must be at least 2 characters'],
    maxlength: [100, 'Supplier name cannot exceed 100 characters']
  },
  
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true,
    validate: {
      validator: function(phone) {
        // Bangladesh phone number validation (11 digits starting with 01)
        const bdPhoneRegex = /^01[3-9]\d{8}$/;
        return bdPhoneRegex.test(phone.replace(/[\s-]/g, ''));
      },
      message: 'Please provide a valid Bangladesh phone number (01XXXXXXXXX)'
    }
  },
  
  // Optional contact information
  email: {
    type: String,
    trim: true,
    lowercase: true,
    validate: {
      validator: function(email) {
        if (!email) return true; // Optional field
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
      },
      message: 'Please provide a valid email address'
    }
  },
  
  address: {
    street: {
      type: String,
      trim: true,
      maxlength: [200, 'Street address cannot exceed 200 characters']
    },
    area: {
      type: String,
      trim: true,
      maxlength: [100, 'Area cannot exceed 100 characters']
    },
    city: {
      type: String,
      trim: true,
      maxlength: [50, 'City cannot exceed 50 characters']
    },
    district: {
      type: String,
      trim: true,
      maxlength: [50, 'District cannot exceed 50 characters']
    },
    postalCode: {
      type: String,
      trim: true,
      validate: {
        validator: function(code) {
          if (!code) return true; // Optional
          return /^\d{4}$/.test(code); // Bangladesh postal codes are 4 digits
        },
        message: 'Postal code must be 4 digits'
      }
    }
  },
  
  // Financial tracking
  totalDue: {
    type: Number,
    default: 0,
    min: [0, 'Total due cannot be negative'],
    validate: {
      validator: function(value) {
        const validation = MoneyValidator.validateAmount(value, 'Total due', {
          allowZero: true,
          maxAmount: 10000000, // 1 crore max
          maxDecimals: 2
        });
        return validation.isValid;
      },
      message: function(props) {
        const validation = MoneyValidator.validateAmount(props.value, 'Total due', {
          allowZero: true,
          maxAmount: 10000000,
          maxDecimals: 2
        });
        return validation.errors[0] || 'Invalid total due amount';
      }
    }
  },
  
  totalPurchases: {
    type: Number,
    default: 0,
    min: [0, 'Total purchases cannot be negative']
  },
  
  totalPaid: {
    type: Number,
    default: 0,
    min: [0, 'Total paid cannot be negative']
  },
  
  // Supplier categorization
  supplierType: {
    type: String,
    enum: {
      values: ['Glass', 'Thai', 'Hardware', 'Tools', 'Services', 'Other'],
      message: 'Supplier type must be Glass, Thai, Hardware, Tools, Services, or Other'
    },
    default: 'Other'
  },
  
  // Business relationship
  creditLimit: {
    type: Number,
    default: 0,
    min: [0, 'Credit limit cannot be negative'],
    validate: {
      validator: function(value) {
        const validation = MoneyValidator.validateAmount(value, 'Credit limit', {
          allowZero: true,
          maxAmount: 10000000,
          maxDecimals: 2
        });
        return validation.isValid;
      },
      message: 'Invalid credit limit amount'
    }
  },
  
  paymentTerms: {
    type: String,
    enum: {
      values: ['Cash', 'Credit-7', 'Credit-15', 'Credit-30', 'Credit-45', 'Credit-60', 'Custom'],
      message: 'Invalid payment terms'
    },
    default: 'Cash'
  },
  
  customPaymentTerms: {
    type: String,
    trim: true,
    maxlength: [200, 'Custom payment terms cannot exceed 200 characters']
  },
  
  // Status and notes
  isActive: {
    type: Boolean,
    default: true
  },
  
  notes: {
    type: String,
    trim: true,
    maxlength: [500, 'Notes cannot exceed 500 characters']
  },
  
  // Soft delete
  isDeleted: {
    type: Boolean,
    default: false
  },
  
  deletedAt: {
    type: Date
  },
  
  deletedBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User'
  },
  
  // Audit fields
  createdBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  
  updatedBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Virtual fields for formatted display
supplierSchema.virtual('formattedTotalDue').get(function() {
  return CurrencyService.formatBDT(this.totalDue);
});

supplierSchema.virtual('formattedTotalPurchases').get(function() {
  return CurrencyService.formatBDT(this.totalPurchases);
});

supplierSchema.virtual('formattedTotalPaid').get(function() {
  return CurrencyService.formatBDT(this.totalPaid);
});

supplierSchema.virtual('formattedCreditLimit').get(function() {
  return CurrencyService.formatBDT(this.creditLimit);
});

supplierSchema.virtual('formattedCreatedAt').get(function() {
  return DateService.format(this.createdAt, 'medium');
});

supplierSchema.virtual('formattedUpdatedAt').get(function() {
  return DateService.format(this.updatedAt, 'medium');
});

// Virtual for full address
supplierSchema.virtual('fullAddress').get(function() {
  const parts = [];
  if (this.address.street) parts.push(this.address.street);
  if (this.address.area) parts.push(this.address.area);
  if (this.address.city) parts.push(this.address.city);
  if (this.address.district) parts.push(this.address.district);
  if (this.address.postalCode) parts.push(this.address.postalCode);
  return parts.join(', ') || 'No address provided';
});

// Virtual for credit utilization
supplierSchema.virtual('creditUtilization').get(function() {
  if (this.creditLimit === 0) return 0;
  return Math.round((this.totalDue / this.creditLimit) * 100);
});

// Virtual for payment status
supplierSchema.virtual('paymentStatus').get(function() {
  if (this.totalDue === 0) return 'Clear';
  if (this.creditLimit > 0 && this.totalDue > this.creditLimit) return 'Over Limit';
  if (this.totalDue > 0) return 'Due';
  return 'Clear';
});

// Virtual for supplier summary
supplierSchema.virtual('supplierSummary').get(function() {
  return {
    supplierId: this.supplierId,
    name: this.name,
    phone: this.phone,
    supplierType: this.supplierType,
    totalDue: this.totalDue,
    formattedTotalDue: this.formattedTotalDue,
    paymentStatus: this.paymentStatus,
    creditUtilization: this.creditUtilization,
    isActive: this.isActive
  };
});

// Pre-save middleware to generate supplier ID
supplierSchema.pre('save', async function() {
  if (this.isNew && !this.supplierId) {
    try {
      const count = await this.constructor.countDocuments({});
      this.supplierId = `SUP-${String(count + 1).padStart(4, '0')}`;
    } catch (error) {
      console.error('Error generating supplier ID:', error);
      throw error;
    }
  }
});

// Static method to get supplier statistics
supplierSchema.statics.getSupplierStats = async function() {
  const stats = await this.aggregate([
    {
      $match: { isDeleted: { $ne: true } }
    },
    {
      $group: {
        _id: null,
        totalSuppliers: { $sum: 1 },
        activeSuppliers: {
          $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] }
        },
        totalDueAmount: { $sum: '$totalDue' },
        totalPurchaseAmount: { $sum: '$totalPurchases' },
        totalPaidAmount: { $sum: '$totalPaid' },
        suppliersWithDue: {
          $sum: { $cond: [{ $gt: ['$totalDue', 0] }, 1, 0] }
        },
        averageDueAmount: { $avg: '$totalDue' }
      }
    }
  ]);

  const supplierTypeStats = await this.aggregate([
    {
      $match: { isDeleted: { $ne: true }, isActive: true }
    },
    {
      $group: {
        _id: '$supplierType',
        count: { $sum: 1 },
        totalDue: { $sum: '$totalDue' }
      }
    },
    {
      $sort: { count: -1 }
    }
  ]);

  return {
    overview: stats[0] || {
      totalSuppliers: 0,
      activeSuppliers: 0,
      totalDueAmount: 0,
      totalPurchaseAmount: 0,
      totalPaidAmount: 0,
      suppliersWithDue: 0,
      averageDueAmount: 0
    },
    byType: supplierTypeStats
  };
};

// Static method to get suppliers with high dues
supplierSchema.statics.getHighDueSuppliers = async function(limit = 10) {
  return await this.find({
    isDeleted: { $ne: true },
    isActive: true,
    totalDue: { $gt: 0 }
  })
  .sort({ totalDue: -1 })
  .limit(limit)
  .populate('createdBy', 'name email')
  .populate('updatedBy', 'name email');
};

// Static method to get suppliers over credit limit
supplierSchema.statics.getOverLimitSuppliers = async function() {
  return await this.find({
    isDeleted: { $ne: true },
    isActive: true,
    creditLimit: { $gt: 0 },
    $expr: { $gt: ['$totalDue', '$creditLimit'] }
  })
  .sort({ totalDue: -1 })
  .populate('createdBy', 'name email');
};

// Instance method to update due amount
supplierSchema.methods.updateDueAmount = function(purchaseAmount, paidAmount = 0) {
  this.totalPurchases = (this.totalPurchases || 0) + purchaseAmount;
  this.totalPaid = (this.totalPaid || 0) + paidAmount;
  this.totalDue = (this.totalDue || 0) + purchaseAmount - paidAmount;
  
  // Ensure totalDue doesn't go negative
  if (this.totalDue < 0) {
    this.totalDue = 0;
  }
  
  return this.save();
};

// Instance method to make payment
supplierSchema.methods.makePayment = function(paymentAmount, userId) {
  if (paymentAmount <= 0) {
    throw new Error('Payment amount must be greater than 0');
  }
  
  if (paymentAmount > this.totalDue) {
    throw new Error('Payment amount cannot exceed total due');
  }
  
  this.totalPaid = (this.totalPaid || 0) + paymentAmount;
  this.totalDue = Math.max(0, this.totalDue - paymentAmount);
  this.updatedBy = userId;
  
  return this.save();
};

// Instance method for soft delete
supplierSchema.methods.softDelete = function(userId, reason) {
  this.isDeleted = true;
  this.deletedAt = new Date();
  this.deletedBy = userId;
  this.isActive = false;
  if (reason) {
    this.notes = (this.notes ? this.notes + '\n' : '') + `Deleted: ${reason}`;
  }
  return this.save();
};

// Instance method to restore
supplierSchema.methods.restore = function() {
  this.isDeleted = false;
  this.deletedAt = undefined;
  this.deletedBy = undefined;
  this.isActive = true;
  return this.save();
};

// Indexes for efficient queries
supplierSchema.index({ supplierId: 1 }, { unique: true });
supplierSchema.index({ name: 1 });
supplierSchema.index({ phone: 1 });
supplierSchema.index({ supplierType: 1 });
supplierSchema.index({ totalDue: -1 });
supplierSchema.index({ isActive: 1, isDeleted: 1 });
supplierSchema.index({ createdAt: -1 });

// Text index for search
supplierSchema.index({
  name: 'text',
  'address.area': 'text',
  'address.city': 'text',
  notes: 'text'
});

// Include virtuals when converting to JSON
supplierSchema.set('toJSON', { virtuals: true });
supplierSchema.set('toObject', { virtuals: true });

export default mongoose.model('Supplier', supplierSchema);