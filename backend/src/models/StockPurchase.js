import mongoose from 'mongoose';
import { MoneyValidator, GeneralValidator } from '../utils/validation.js';
import CurrencyService from '../services/currencyService.js';
import DateService from '../services/dateService.js';

const stockPurchaseItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: [true, 'Product is required']
  },
  productName: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true
  },
  // Variant information for Thai & Glass materials
  materialType: {
    type: String,
    enum: {
      values: ['Thai', 'Glass'],
      message: 'Material type must be either Thai or Glass'
    }
  },
  company: {
    type: String,
    trim: true,
    maxlength: [50, 'Company name cannot exceed 50 characters']
  },
  thicknessMM: {
    type: Number,
    min: [1, 'Thickness must be at least 1mm'],
    max: [50, 'Thickness cannot exceed 50mm']
  },
  quality: {
    type: String,
    enum: {
      values: ['Local', 'Imported'],
      message: 'Quality must be either Local or Imported'
    }
  },
  measurementType: {
    type: String,
    required: [true, 'Measurement type is required'],
    enum: {
      values: ['SFT', 'RFT', 'PANEL', 'SHEET', 'PIECE'],
      message: 'Measurement type must be SFT, RFT, PANEL, SHEET, or PIECE'
    }
  },
  quantity: {
    type: Number,
    required: [true, 'Quantity is required'],
    min: [0.01, 'Quantity must be greater than 0'],
    validate: {
      validator: function(value) {
        const validation = MoneyValidator.validateAmount(value, 'Quantity', {
          allowZero: false,
          maxAmount: 100000
        });
        return validation.isValid;
      },
      message: 'Invalid quantity value'
    }
  },
  unit: {
    type: String,
    required: [true, 'Unit is required'],
    enum: {
      values: ['SFT', 'RFT', 'PANEL', 'SHEET', 'PIECE'],
      message: 'Unit must be SFT, RFT, PANEL, SHEET, or PIECE'
    }
  },
  purchasePrice: {
    type: Number,
    required: [true, 'Purchase price is required'],
    min: [0, 'Purchase price cannot be negative'],
    validate: {
      validator: function(value) {
        const validation = MoneyValidator.validateAmount(value, 'Purchase price', {
          allowZero: true,
          maxAmount: 100000
        });
        return validation.isValid;
      },
      message: 'Invalid purchase price value'
    }
  },
  totalCost: {
    type: Number,
    required: [true, 'Total cost is required'],
    min: [0, 'Total cost cannot be negative']
  },
  // Stock tracking
  previousStock: {
    type: Number,
    min: [0, 'Previous stock cannot be negative'],
    default: 0
  },
  newStock: {
    type: Number,
    min: [0, 'New stock cannot be negative'],
    default: 0
  }
});

const stockPurchaseSchema = new mongoose.Schema({
  purchaseNo: {
    type: String,
    unique: true,
    trim: true
  },
  supplier: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Supplier',
    required: [true, 'Supplier is required']
  },
  supplierName: {
    type: String,
    required: [true, 'Supplier name is required'],
    trim: true
  },
  supplierPhone: {
    type: String,
    trim: true
  },
  supplierAddress: {
    type: String,
    trim: true
  },
  items: [stockPurchaseItemSchema],
  subtotal: {
    type: Number,
    required: [true, 'Subtotal is required'],
    min: [0, 'Subtotal cannot be negative'],
    validate: {
      validator: function(value) {
        const validation = MoneyValidator.validateAmount(value, 'Subtotal', {
          allowZero: true,
          maxAmount: 10000000
        });
        return validation.isValid;
      },
      message: 'Invalid subtotal value'
    }
  },
  discount: {
    type: Number,
    default: 0,
    min: [0, 'Discount cannot be negative'],
    validate: {
      validator: function(value) {
        if (value === 0) return true;
        const validation = MoneyValidator.validateAmount(value, 'Discount', {
          allowZero: true,
          maxAmount: this.discountType === 'percentage' ? 100 : this.subtotal
        });
        return validation.isValid;
      },
      message: 'Invalid discount value'
    }
  },
  discountType: {
    type: String,
    enum: {
      values: ['amount', 'percentage'],
      message: 'Discount type must be amount or percentage'
    },
    default: 'amount'
  },
  grandTotal: {
    type: Number,
    required: [true, 'Grand total is required'],
    min: [0, 'Grand total cannot be negative']
  },
  paidAmount: {
    type: Number,
    default: 0,
    min: [0, 'Paid amount cannot be negative'],
    validate: {
      validator: function(value) {
        const validation = MoneyValidator.validateAmount(value, 'Paid amount', {
          allowZero: true,
          maxAmount: this.grandTotal
        });
        return validation.isValid;
      },
      message: 'Paid amount cannot exceed grand total'
    }
  },
  dueAmount: {
    type: Number,
    default: 0,
    min: [0, 'Due amount cannot be negative']
  },
  status: {
    type: String,
    enum: {
      values: ['paid', 'partial', 'due'],
      message: 'Status must be paid, partial, or due'
    },
    default: 'due'
  },
  paymentMethod: {
    type: String,
    enum: {
      values: ['cash', 'bank', 'check', 'mobile_banking', 'credit'],
      message: 'Payment method must be cash, bank, check, mobile_banking, or credit'
    },
    default: 'cash'
  },
  purchaseDate: {
    type: Date,
    default: Date.now,
    validate: {
      validator: function(value) {
        return value <= new Date();
      },
      message: 'Purchase date cannot be in the future'
    }
  },
  deliveryDate: {
    type: Date,
    validate: {
      validator: function(value) {
        if (!value) return true;
        return value >= this.purchaseDate;
      },
      message: 'Delivery date cannot be before purchase date'
    }
  },
  invoiceReference: {
    supplierInvoiceNo: {
      type: String,
      trim: true
    },
    supplierInvoiceDate: {
      type: Date
    }
  },
  transportCost: {
    type: Number,
    default: 0,
    min: [0, 'Transport cost cannot be negative']
  },
  otherCharges: {
    type: Number,
    default: 0,
    min: [0, 'Other charges cannot be negative']
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [500, 'Notes cannot exceed 500 characters']
  },
  // Investment tracking
  investmentRecord: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Investment'
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
stockPurchaseSchema.virtual('formattedSubtotal').get(function() {
  return CurrencyService.formatBDT(this.subtotal);
});

stockPurchaseSchema.virtual('formattedDiscount').get(function() {
  if (this.discountType === 'percentage') {
    return `${this.discount}%`;
  }
  return CurrencyService.formatBDT(this.discount);
});

stockPurchaseSchema.virtual('formattedGrandTotal').get(function() {
  return CurrencyService.formatBDT(this.grandTotal);
});

stockPurchaseSchema.virtual('formattedPaidAmount').get(function() {
  return CurrencyService.formatBDT(this.paidAmount);
});

stockPurchaseSchema.virtual('formattedDueAmount').get(function() {
  return CurrencyService.formatBDT(this.dueAmount);
});

stockPurchaseSchema.virtual('formattedTransportCost').get(function() {
  return CurrencyService.formatBDT(this.transportCost);
});

stockPurchaseSchema.virtual('formattedOtherCharges').get(function() {
  return CurrencyService.formatBDT(this.otherCharges);
});

// Virtual field for formatted dates
stockPurchaseSchema.virtual('formattedPurchaseDate').get(function() {
  return DateService.format(this.purchaseDate, 'medium');
});

stockPurchaseSchema.virtual('formattedDeliveryDate').get(function() {
  return this.deliveryDate ? DateService.format(this.deliveryDate, 'medium') : null;
});

// Virtual field for status badge
stockPurchaseSchema.virtual('statusBadge').get(function() {
  const statusMap = {
    'paid': { text: 'Paid', class: 'success' },
    'partial': { text: 'Partial', class: 'warning' },
    'due': { text: 'Due', class: 'danger' }
  };
  return statusMap[this.status] || { text: 'Unknown', class: 'secondary' };
});

// Virtual field for total investment
stockPurchaseSchema.virtual('totalInvestment').get(function() {
  return this.grandTotal + this.transportCost + this.otherCharges;
});

stockPurchaseSchema.virtual('formattedTotalInvestment').get(function() {
  return CurrencyService.formatBDT(this.totalInvestment);
});

// Virtual field for variant display in items
stockPurchaseItemSchema.virtual('variantDisplay').get(function() {
  if (!this.materialType || !this.company) {
    return this.productName;
  }
  
  let display = `${this.materialType} (${this.company}`;
  
  if (this.thicknessMM) {
    display += `, ${this.thicknessMM}mm`;
  }
  
  if (this.quality) {
    display += `, ${this.quality}`;
  }
  
  display += ')';
  return display;
});

// Static method to generate purchase number
stockPurchaseSchema.statics.generatePurchaseNumber = async function() {
  try {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const yearMonth = `${year}${month}`;
    
    // Find the last purchase for this month
    const lastPurchase = await this.findOne({
      purchaseNo: { $regex: `^PUR-${yearMonth}-` }
    }).sort({ purchaseNo: -1 });
    
    let sequence = 1;
    if (lastPurchase) {
      const lastSequence = parseInt(lastPurchase.purchaseNo.split('-')[2]);
      sequence = lastSequence + 1;
    }
    
    const sequenceStr = String(sequence).padStart(4, '0');
    return `PUR-${yearMonth}-${sequenceStr}`;
  } catch (error) {
    console.error('Error generating purchase number:', error);
    throw error;
  }
};

// Pre-save middleware to generate purchase number
stockPurchaseSchema.pre('save', async function() {
  if (!this.purchaseNo) {
    try {
      const purchaseNo = await this.constructor.generatePurchaseNumber();
      this.purchaseNo = purchaseNo;
    } catch (error) {
      console.error('Error generating purchase number:', error);
      throw error;
    }
  }
  
  // Calculate due amount
  this.dueAmount = Math.max(0, this.grandTotal - this.paidAmount);
  
  // Update status based on payment
  if (this.paidAmount === 0) {
    this.status = 'due';
  } else if (this.paidAmount >= this.grandTotal) {
    this.status = 'paid';
  } else {
    this.status = 'partial';
  }
});

// Post-save validation to ensure purchaseNo was generated
stockPurchaseSchema.post('save', function(doc) {
  if (!doc.purchaseNo) {
    throw new Error('Purchase number generation failed');
  }
});

// Index for better query performance
stockPurchaseSchema.index({ supplier: 1 });
stockPurchaseSchema.index({ status: 1 });
stockPurchaseSchema.index({ purchaseDate: -1 });
stockPurchaseSchema.index({ isDeleted: 1 });

// Add soft delete method
stockPurchaseSchema.methods.softDelete = function(userId) {
  this.isDeleted = true;
  this.deletedAt = new Date();
  this.deletedBy = userId;
  return this.save();
};

// Add restore method
stockPurchaseSchema.methods.restore = function() {
  this.isDeleted = false;
  this.deletedAt = undefined;
  this.deletedBy = undefined;
  return this.save();
};

export default mongoose.model('StockPurchase', stockPurchaseSchema);