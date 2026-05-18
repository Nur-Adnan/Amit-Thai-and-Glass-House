/**
 * Purchase Model
 * Tracks product purchases from suppliers
 * Links suppliers to product purchases and investment entries
 */

import mongoose from 'mongoose';
import { MoneyValidator } from '../utils/validation.js';
import CurrencyService from '../services/currencyService.js';
import DateService from '../services/dateService.js';

const purchaseSchema = new mongoose.Schema({
  // Auto-generated purchase ID
  purchaseId: {
    type: String,
    unique: true
  },
  
  // Supplier reference
  supplier: {
    type: mongoose.Schema.ObjectId,
    ref: 'Supplier',
    required: [true, 'Supplier is required']
  },
  
  // Purchase details
  purchaseDate: {
    type: Date,
    required: [true, 'Purchase date is required'],
    default: Date.now
  },
  
  // Items purchased
  items: [{
    product: {
      type: mongoose.Schema.ObjectId,
      ref: 'Product',
      required: true
    },
    productName: {
      type: String,
      required: true
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: [0.01, 'Quantity must be greater than 0']
    },
    unit: {
      type: String,
      required: true,
      default: 'pcs'
    },
    unitCost: {
      type: Number,
      required: [true, 'Unit cost is required'],
      min: [0.01, 'Unit cost must be greater than 0'],
      validate: {
        validator: function(value) {
          const validation = MoneyValidator.validateAmount(value, 'Unit cost', {
            allowZero: false,
            maxAmount: 100000,
            maxDecimals: 2
          });
          return validation.isValid;
        },
        message: 'Invalid unit cost amount'
      }
    },
    totalCost: {
      type: Number,
      required: true,
      min: [0.01, 'Total cost must be greater than 0']
    }
  }],
  
  // Financial details
  subtotal: {
    type: Number,
    required: true,
    min: [0.01, 'Subtotal must be greater than 0']
  },
  
  discount: {
    type: Number,
    default: 0,
    min: [0, 'Discount cannot be negative']
  },
  
  tax: {
    type: Number,
    default: 0,
    min: [0, 'Tax cannot be negative']
  },
  
  totalAmount: {
    type: Number,
    required: true,
    min: [0.01, 'Total amount must be greater than 0'],
    validate: {
      validator: function(value) {
        const validation = MoneyValidator.validateAmount(value, 'Total amount', {
          allowZero: false,
          maxAmount: 10000000,
          maxDecimals: 2
        });
        return validation.isValid;
      },
      message: 'Invalid total amount'
    }
  },
  
  // Payment tracking
  paidAmount: {
    type: Number,
    default: 0,
    min: [0, 'Paid amount cannot be negative']
  },
  
  dueAmount: {
    type: Number,
    default: 0,
    min: [0, 'Due amount cannot be negative']
  },
  
  paymentStatus: {
    type: String,
    enum: ['paid', 'partial', 'due'],
    default: 'due'
  },
  
  paymentMethod: {
    type: String,
    enum: ['Cash', 'Bank Transfer', 'Check', 'Credit', 'Mobile Banking'],
    default: 'Credit'
  },
  
  // Purchase type
  purchaseType: {
    type: String,
    enum: ['Stock', 'Direct Sale', 'Maintenance', 'Equipment'],
    default: 'Stock'
  },
  
  // Reference numbers
  invoiceNumber: {
    type: String,
    trim: true,
    maxlength: [50, 'Invoice number cannot exceed 50 characters']
  },
  
  challanNumber: {
    type: String,
    trim: true,
    maxlength: [50, 'Challan number cannot exceed 50 characters']
  },
  
  // Notes and description
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  
  notes: {
    type: String,
    trim: true,
    maxlength: [1000, 'Notes cannot exceed 1000 characters']
  },
  
  // Status
  status: {
    type: String,
    enum: ['pending', 'received', 'partial', 'cancelled'],
    default: 'pending'
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
purchaseSchema.virtual('formattedSubtotal').get(function() {
  return CurrencyService.formatBDT(this.subtotal);
});

purchaseSchema.virtual('formattedDiscount').get(function() {
  return CurrencyService.formatBDT(this.discount);
});

purchaseSchema.virtual('formattedTax').get(function() {
  return CurrencyService.formatBDT(this.tax);
});

purchaseSchema.virtual('formattedTotalAmount').get(function() {
  return CurrencyService.formatBDT(this.totalAmount);
});

purchaseSchema.virtual('formattedPaidAmount').get(function() {
  return CurrencyService.formatBDT(this.paidAmount);
});

purchaseSchema.virtual('formattedDueAmount').get(function() {
  return CurrencyService.formatBDT(this.dueAmount);
});

purchaseSchema.virtual('formattedPurchaseDate').get(function() {
  return DateService.format(this.purchaseDate, 'medium');
});

purchaseSchema.virtual('formattedCreatedAt').get(function() {
  return DateService.format(this.createdAt, 'medium');
});

// Virtual for purchase summary
purchaseSchema.virtual('purchaseSummary').get(function() {
  return {
    purchaseId: this.purchaseId,
    purchaseDate: this.formattedPurchaseDate,
    supplierName: this.supplier?.name || 'Unknown',
    totalAmount: this.totalAmount,
    formattedTotalAmount: this.formattedTotalAmount,
    paymentStatus: this.paymentStatus,
    status: this.status,
    itemCount: this.items.length
  };
});

// Pre-save middleware to generate purchase ID and calculate totals
purchaseSchema.pre('save', async function() {
  // Generate purchase ID for new documents
  if (this.isNew && !this.purchaseId) {
    const count = await this.constructor.countDocuments({});
    this.purchaseId = `PUR-${String(count + 1).padStart(6, '0')}`;
  }
  
  // Calculate totals from items
  if (this.items && this.items.length > 0) {
    this.subtotal = this.items.reduce((sum, item) => {
      item.totalCost = item.quantity * item.unitCost;
      return sum + item.totalCost;
    }, 0);
    
    this.totalAmount = this.subtotal - (this.discount || 0) + (this.tax || 0);
    this.dueAmount = this.totalAmount - (this.paidAmount || 0);
    
    // Update payment status
    if (this.paidAmount >= this.totalAmount) {
      this.paymentStatus = 'paid';
      this.dueAmount = 0;
    } else if (this.paidAmount > 0) {
      this.paymentStatus = 'partial';
    } else {
      this.paymentStatus = 'due';
    }
  }
});

// Static method to get purchase statistics
purchaseSchema.statics.getPurchaseStats = async function(startDate, endDate) {
  const matchStage = {
    isDeleted: { $ne: true },
    purchaseDate: {}
  };
  
  if (startDate) matchStage.purchaseDate.$gte = new Date(startDate);
  if (endDate) matchStage.purchaseDate.$lte = new Date(endDate);
  
  const stats = await this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: null,
        totalPurchases: { $sum: 1 },
        totalAmount: { $sum: '$totalAmount' },
        totalPaid: { $sum: '$paidAmount' },
        totalDue: { $sum: '$dueAmount' },
        averagePurchaseAmount: { $avg: '$totalAmount' }
      }
    }
  ]);
  
  const supplierStats = await this.aggregate([
    { $match: matchStage },
    {
      $lookup: {
        from: 'suppliers',
        localField: 'supplier',
        foreignField: '_id',
        as: 'supplierInfo'
      }
    },
    { $unwind: '$supplierInfo' },
    {
      $group: {
        _id: '$supplier',
        supplierName: { $first: '$supplierInfo.name' },
        purchaseCount: { $sum: 1 },
        totalAmount: { $sum: '$totalAmount' },
        totalDue: { $sum: '$dueAmount' }
      }
    },
    { $sort: { totalAmount: -1 } },
    { $limit: 10 }
  ]);
  
  return {
    overview: stats[0] || {
      totalPurchases: 0,
      totalAmount: 0,
      totalPaid: 0,
      totalDue: 0,
      averagePurchaseAmount: 0
    },
    topSuppliers: supplierStats
  };
};

// Static method to get supplier purchase history
purchaseSchema.statics.getSupplierPurchases = async function(supplierId, limit = 20) {
  return await this.find({
    supplier: supplierId,
    isDeleted: { $ne: true }
  })
  .populate('supplier', 'name supplierId phone')
  .populate('items.product', 'name category')
  .populate('createdBy', 'name email')
  .sort({ purchaseDate: -1 })
  .limit(limit);
};

// Instance method to make payment
purchaseSchema.methods.makePayment = function(paymentAmount, userId) {
  if (paymentAmount <= 0) {
    throw new Error('Payment amount must be greater than 0');
  }
  
  if (paymentAmount > this.dueAmount) {
    throw new Error('Payment amount cannot exceed due amount');
  }
  
  this.paidAmount += paymentAmount;
  this.dueAmount = this.totalAmount - this.paidAmount;
  
  // Update payment status
  if (this.dueAmount <= 0) {
    this.paymentStatus = 'paid';
    this.dueAmount = 0;
  } else {
    this.paymentStatus = 'partial';
  }
  
  this.updatedBy = userId;
  return this.save();
};

// Instance method for soft delete
purchaseSchema.methods.softDelete = function(userId, reason) {
  this.isDeleted = true;
  this.deletedAt = new Date();
  this.deletedBy = userId;
  if (reason) {
    this.notes = (this.notes ? this.notes + '\n' : '') + `Deleted: ${reason}`;
  }
  return this.save();
};

// Indexes for efficient queries
purchaseSchema.index({ purchaseId: 1 }, { unique: true });
purchaseSchema.index({ supplier: 1, purchaseDate: -1 });
purchaseSchema.index({ purchaseDate: -1 });
purchaseSchema.index({ paymentStatus: 1 });
purchaseSchema.index({ status: 1 });
purchaseSchema.index({ isDeleted: 1 });
purchaseSchema.index({ createdAt: -1 });

// Include virtuals when converting to JSON
purchaseSchema.set('toJSON', { virtuals: true });
purchaseSchema.set('toObject', { virtuals: true });

export default mongoose.model('Purchase', purchaseSchema);