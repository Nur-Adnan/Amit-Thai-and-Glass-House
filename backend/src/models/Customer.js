import mongoose from 'mongoose';
import { MoneyValidator, GeneralValidator } from '../utils/validation.js';
import CurrencyService from '../services/currencyService.js';
import DateService from '../services/dateService.js';

const customerSchema = new mongoose.Schema({
  customerId: {
    type: String,
    unique: true,
    trim: true,
    uppercase: true,
    match: [/^CUST-\d{4}$/, 'Customer ID must follow format CUST-XXXX']
  },
  name: {
    type: String,
    required: [true, 'Customer name is required'],
    trim: true,
    minlength: [2, 'Customer name must be at least 2 characters'],
    maxlength: [100, 'Customer name cannot exceed 100 characters'],
    validate: {
      validator: function(value) {
        const validation = GeneralValidator.validateString(value, 'Customer name', {
          minLength: 2,
          maxLength: 100
        });
        return validation.isValid;
      },
      message: 'Customer name must be between 2 and 100 characters'
    }
  },
  phone: {
    type: String,
    trim: true,
    maxlength: [20, 'Phone number cannot exceed 20 characters'],
    index: true,
    validate: {
      validator: function(value) {
        if (!value) return true; // Optional field
        const validation = GeneralValidator.validatePhone(value, 'Phone number');
        return validation.isValid;
      },
      message: function(props) {
        if (!props.value) return true;
        const validation = GeneralValidator.validatePhone(props.value, 'Phone number');
        return validation.errors[0] || 'Invalid phone number';
      }
    }
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    maxlength: [100, 'Email cannot exceed 100 characters'],
    validate: {
      validator: function(value) {
        if (!value) return true; // Optional field
        const validation = GeneralValidator.validateEmail(value, 'Email');
        return validation.isValid;
      },
      message: function(props) {
        if (!props.value) return true;
        const validation = GeneralValidator.validateEmail(props.value, 'Email');
        return validation.errors[0] || 'Invalid email address';
      }
    }
  },
  address: {
    street: {
      type: String,
      trim: true,
      maxlength: [200, 'Street address cannot be more than 200 characters']
    },
    city: {
      type: String,
      trim: true,
      maxlength: [50, 'City cannot be more than 50 characters']
    },
    state: {
      type: String,
      trim: true,
      maxlength: [50, 'State cannot be more than 50 characters']
    },
    zipCode: {
      type: String,
      trim: true,
      maxlength: [20, 'Zip code cannot be more than 20 characters']
    },
    country: {
      type: String,
      trim: true,
      maxlength: [50, 'Country cannot be more than 50 characters'],
      default: 'USA'
    }
  },
  // Auto-calculated fields with proper validation
  totalDue: {
    type: Number,
    default: 0,
    min: [0, 'Total due cannot be negative'],
    validate: {
      validator: function(value) {
        const validation = MoneyValidator.validateAmount(value, 'Total due', {
          allowZero: true,
          maxAmount: 10000000 // 1 crore BDT
        });
        return validation.isValid;
      },
      message: function(props) {
        const validation = MoneyValidator.validateAmount(props.value, 'Total due', {
          allowZero: true,
          maxAmount: 10000000
        });
        return validation.errors[0] || 'Invalid total due amount';
      }
    }
  },
  totalSales: {
    type: Number,
    default: 0,
    min: [0, 'Total sales cannot be negative'],
    validate: {
      validator: function(value) {
        const validation = MoneyValidator.validateAmount(value, 'Total sales', {
          allowZero: true,
          maxAmount: 10000000 // 1 crore BDT
        });
        return validation.isValid;
      },
      message: function(props) {
        const validation = MoneyValidator.validateAmount(props.value, 'Total sales', {
          allowZero: true,
          maxAmount: 10000000
        });
        return validation.errors[0] || 'Invalid total sales amount';
      }
    }
  },
  totalPaid: {
    type: Number,
    default: 0,
    min: [0, 'Total paid cannot be negative'],
    validate: {
      validator: function(value) {
        const validation = MoneyValidator.validateAmount(value, 'Total paid', {
          allowZero: true,
          maxAmount: 10000000 // 1 crore BDT
        });
        return validation.isValid;
      },
      message: function(props) {
        const validation = MoneyValidator.validateAmount(props.value, 'Total paid', {
          allowZero: true,
          maxAmount: 10000000
        });
        return validation.errors[0] || 'Invalid total paid amount';
      }
    }
  },
  invoiceCount: {
    type: Number,
    default: 0,
    min: [0, 'Invoice count cannot be negative'],
    validate: {
      validator: function(value) {
        return Number.isInteger(value) && value >= 0;
      },
      message: 'Invoice count must be a non-negative integer'
    }
  },
  lastInvoiceDate: {
    type: Date,
    validate: {
      validator: function(value) {
        if (!value) return true; // Optional field
        return !isNaN(new Date(value).getTime());
      },
      message: 'Last invoice date must be a valid date'
    }
  },
  // Customer type
  customerType: {
    type: String,
    enum: {
      values: ['regular', 'walk-in', 'corporate', 'vip'],
      message: 'Customer type must be regular, walk-in, corporate, or vip'
    },
    default: 'regular'
  },
  // Credit limit for corporate customers
  creditLimit: {
    type: Number,
    default: 0,
    min: [0, 'Credit limit cannot be negative'],
    validate: {
      validator: function(value) {
        const validation = MoneyValidator.validateAmount(value, 'Credit limit', {
          allowZero: true,
          maxAmount: 10000000 // 1 crore BDT
        });
        return validation.isValid;
      },
      message: function(props) {
        const validation = MoneyValidator.validateAmount(props.value, 'Credit limit', {
          allowZero: true,
          maxAmount: 10000000
        });
        return validation.errors[0] || 'Invalid credit limit amount';
      }
    }
  },
  
  // Due aging breakdown
  dueAging: {
    current: {
      type: Number,
      default: 0,
      min: [0, 'Current due cannot be negative']
    },
    days0to30: {
      type: Number,
      default: 0,
      min: [0, 'Due 0-30 days cannot be negative']
    },
    days31to60: {
      type: Number,
      default: 0,
      min: [0, 'Due 31-60 days cannot be negative']
    },
    days60plus: {
      type: Number,
      default: 0,
      min: [0, 'Due 60+ days cannot be negative']
    }
  },
  
  // Credit status and risk assessment
  creditStatus: {
    type: String,
    enum: {
      values: ['good', 'warning', 'blocked', 'overdue'],
      message: 'Credit status must be good, warning, blocked, or overdue'
    },
    default: 'good'
  },
  
  // Last credit review date
  lastCreditReview: {
    type: Date,
    default: Date.now
  },
  // Customer status
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
    type: mongoose.Schema.ObjectId,
    ref: 'User'
  },
  // Notes
  notes: {
    type: String,
    maxlength: [1000, 'Notes cannot be more than 1000 characters']
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

// Generate customer ID
customerSchema.statics.generateCustomerId = async function() {
  // Find the last customer
  const lastCustomer = await this.findOne({
    customerId: { $regex: /^CUST-\d{4}$/ }
  }).sort({ customerId: -1 });
  
  let sequence = 1;
  if (lastCustomer) {
    const lastSequence = parseInt(lastCustomer.customerId.split('-')[1]);
    sequence = lastSequence + 1;
  }
  
  const sequenceStr = String(sequence).padStart(4, '0');
  return `CUST-${sequenceStr}`;
};

// Method to recalculate totals from invoices
customerSchema.methods.recalculateTotals = async function() {
  const Invoice = mongoose.model('Invoice');
  
  const totals = await Invoice.aggregate([
    {
      $match: {
        customer: this._id,
        isActive: true
      }
    },
    {
      $group: {
        _id: null,
        totalSales: { $sum: '$grandTotal' },
        totalPaid: { $sum: '$paidAmount' },
        totalDue: { $sum: '$dueAmount' },
        invoiceCount: { $sum: 1 },
        lastInvoiceDate: { $max: '$createdAt' }
      }
    }
  ]);
  
  if (totals.length > 0) {
    const result = totals[0];
    this.totalSales = result.totalSales || 0;
    this.totalPaid = result.totalPaid || 0;
    this.totalDue = result.totalDue || 0;
    this.invoiceCount = result.invoiceCount || 0;
    this.lastInvoiceDate = result.lastInvoiceDate;
  } else {
    this.totalSales = 0;
    this.totalPaid = 0;
    this.totalDue = 0;
    this.invoiceCount = 0;
    this.lastInvoiceDate = null;
  }
  
  return this.save();
};

// Static method to recalculate totals for a specific customer
customerSchema.statics.recalculateCustomerTotals = async function(customerId) {
  const customer = await this.findById(customerId);
  if (customer) {
    return await customer.recalculateTotals();
  }
  return null;
};

// Pre-save middleware to generate customer ID
customerSchema.pre('save', async function() {
  if (this.isNew && !this.customerId) {
    try {
      const customerId = await this.constructor.generateCustomerId();
      this.customerId = customerId;
    } catch (error) {
      console.error('Error generating customer ID:', error);
      throw error;
    }
  }
});

// Static method to calculate due aging for all customers
customerSchema.statics.calculateDueAging = async function() {
  const Invoice = mongoose.model('Invoice');
  
  // Get all customers with dues
  const customers = await this.find({ 
    totalDue: { $gt: 0 },
    isDeleted: { $ne: true }
  });
  
  const results = [];
  
  for (const customer of customers) {
    try {
      // Get all unpaid/partial invoices for this customer
      const invoices = await Invoice.find({
        customer: customer._id,
        paymentStatus: { $in: ['due', 'partial'] },
        isDeleted: { $ne: true }
      }).sort({ invoiceDate: 1 });
      
      // Calculate aging
      const aging = {
        current: 0,
        days0to30: 0,
        days31to60: 0,
        days60plus: 0
      };
      
      const today = new Date();
      
      for (const invoice of invoices) {
        const daysDiff = Math.floor((today - invoice.invoiceDate) / (1000 * 60 * 60 * 24));
        const dueAmount = invoice.totalAmount - invoice.paidAmount;
        
        if (daysDiff <= 0) {
          aging.current += dueAmount;
        } else if (daysDiff <= 30) {
          aging.days0to30 += dueAmount;
        } else if (daysDiff <= 60) {
          aging.days31to60 += dueAmount;
        } else {
          aging.days60plus += dueAmount;
        }
      }
      
      // Update customer due aging
      customer.dueAging = aging;
      
      // Update credit status based on aging
      if (aging.days60plus > 0) {
        customer.creditStatus = 'overdue';
      } else if (customer.totalDue > customer.creditLimit && customer.creditLimit > 0) {
        customer.creditStatus = 'blocked';
      } else if (customer.creditUtilization >= 90) {
        customer.creditStatus = 'warning';
      } else {
        customer.creditStatus = 'good';
      }
      
      customer.lastCreditReview = new Date();
      await customer.save();
      
      results.push({
        customerId: customer.customerId,
        name: customer.name,
        aging: customer.formattedDueAging,
        creditStatus: customer.creditStatus,
        creditRisk: customer.creditRisk
      });
    } catch (error) {
      console.warn(`Skipping customer ${customer.customerId || customer._id} due to validation error:`, error.message);
      // Continue with next customer instead of failing the entire operation
      continue;
    }
  }
  
  return results;
};

// Static method to get due aging report
customerSchema.statics.getDueAgingReport = async function(options = {}) {
  const {
    includeZeroDue = false,
    sortBy = 'totalDue',
    sortOrder = 'desc',
    limit = 100
  } = options;
  
  // Build query
  const query = { isDeleted: { $ne: true } };
  if (!includeZeroDue) {
    query.totalDue = { $gt: 0 };
  }
  
  // Sort options
  const sortOptions = {};
  sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;
  
  const customers = await this.find(query)
    .sort(sortOptions)
    .limit(limit)
    .populate('createdBy', 'name email');
  
  // Calculate summary statistics
  const summary = {
    totalCustomers: customers.length,
    totalDueAmount: 0,
    currentDue: 0,
    days0to30: 0,
    days31to60: 0,
    days60plus: 0,
    overLimitCustomers: 0,
    blockedCustomers: 0,
    overdueCustomers: 0
  };
  
  const customerDetails = customers.map(customer => {
    // Update summary
    summary.totalDueAmount += customer.totalDue;
    summary.currentDue += customer.dueAging.current;
    summary.days0to30 += customer.dueAging.days0to30;
    summary.days31to60 += customer.dueAging.days31to60;
    summary.days60plus += customer.dueAging.days60plus;
    
    if (customer.totalDue > customer.creditLimit && customer.creditLimit > 0) {
      summary.overLimitCustomers++;
    }
    if (customer.creditStatus === 'blocked') {
      summary.blockedCustomers++;
    }
    if (customer.creditStatus === 'overdue') {
      summary.overdueCustomers++;
    }
    
    return {
      customerId: customer.customerId,
      name: customer.name,
      customerType: customer.customerType,
      totalDue: customer.totalDue,
      formattedTotalDue: customer.formattedTotalDue,
      creditLimit: customer.creditLimit,
      formattedCreditLimit: customer.formattedCreditLimit,
      creditUtilization: customer.creditUtilization,
      creditAvailable: customer.creditAvailable,
      formattedCreditAvailable: customer.formattedCreditAvailable,
      dueAging: customer.dueAging,
      formattedDueAging: customer.formattedDueAging,
      creditStatus: customer.creditStatus,
      creditRisk: customer.creditRisk,
      creditRiskBadge: customer.creditRiskBadge,
      canCreateInvoice: customer.canCreateInvoice,
      invoiceBlockReason: customer.invoiceBlockReason,
      lastCreditReview: customer.lastCreditReview,
      formattedLastCreditReview: DateService.format(customer.lastCreditReview, 'medium')
    };
  });
  
  // Format summary
  const formattedSummary = {
    ...summary,
    formattedTotalDueAmount: CurrencyService.formatBDT(summary.totalDueAmount),
    formattedCurrentDue: CurrencyService.formatBDT(summary.currentDue),
    formattedDays0to30: CurrencyService.formatBDT(summary.days0to30),
    formattedDays31to60: CurrencyService.formatBDT(summary.days31to60),
    formattedDays60plus: CurrencyService.formatBDT(summary.days60plus),
    agingPercentages: {
      current: summary.totalDueAmount > 0 ? Math.round((summary.currentDue / summary.totalDueAmount) * 100) : 0,
      days0to30: summary.totalDueAmount > 0 ? Math.round((summary.days0to30 / summary.totalDueAmount) * 100) : 0,
      days31to60: summary.totalDueAmount > 0 ? Math.round((summary.days31to60 / summary.totalDueAmount) * 100) : 0,
      days60plus: summary.totalDueAmount > 0 ? Math.round((summary.days60plus / summary.totalDueAmount) * 100) : 0
    }
  };
  
  return {
    summary: formattedSummary,
    customers: customerDetails
  };
};

// Static method to get customers at risk
customerSchema.statics.getCustomersAtRisk = async function() {
  const customers = await this.find({
    isDeleted: { $ne: true },
    $or: [
      { creditStatus: { $in: ['blocked', 'overdue', 'warning'] } },
      { 'dueAging.days60plus': { $gt: 0 } },
      { $expr: { $gt: ['$totalDue', '$creditLimit'] } }
    ]
  }).sort({ totalDue: -1 });
  
  return customers.map(customer => ({
    customerId: customer.customerId,
    name: customer.name,
    totalDue: customer.formattedTotalDue,
    creditLimit: customer.formattedCreditLimit,
    creditUtilization: customer.creditUtilization,
    creditRisk: customer.creditRisk,
    creditStatus: customer.creditStatus,
    overdueAmount: CurrencyService.formatBDT(customer.dueAging.days60plus),
    canCreateInvoice: customer.canCreateInvoice,
    invoiceBlockReason: customer.invoiceBlockReason
  }));
};

// Virtual for full address
customerSchema.virtual('fullAddress').get(function() {
  const parts = [];
  if (this.address.street) parts.push(this.address.street);
  if (this.address.city) parts.push(this.address.city);
  if (this.address.state) parts.push(this.address.state);
  if (this.address.zipCode) parts.push(this.address.zipCode);
  if (this.address.country && this.address.country !== 'Bangladesh') parts.push(this.address.country);
  return parts.join(', ');
});

// Virtual for customer status
customerSchema.virtual('status').get(function() {
  if (!this.isActive) return 'inactive';
  if (this.totalDue > 0) return 'has-due';
  if (this.invoiceCount > 0) return 'active';
  return 'new';
});

// Virtual for credit utilization (for corporate customers)
customerSchema.virtual('creditUtilization').get(function() {
  if (this.creditLimit === 0) return 0;
  return Math.round((this.totalDue / this.creditLimit) * 10000) / 100; // Round to 2 decimal places
});

// Virtual fields for currency formatting
customerSchema.virtual('formattedTotalDue').get(function() {
  return CurrencyService.formatBDT(this.totalDue);
});

customerSchema.virtual('formattedTotalSales').get(function() {
  return CurrencyService.formatBDT(this.totalSales);
});

customerSchema.virtual('formattedTotalPaid').get(function() {
  return CurrencyService.formatBDT(this.totalPaid);
});

customerSchema.virtual('formattedCreditLimit').get(function() {
  return CurrencyService.formatBDT(this.creditLimit);
});

// Virtual fields for due aging formatting
customerSchema.virtual('formattedDueAging').get(function() {
  return {
    current: CurrencyService.formatBDT(this.dueAging.current),
    days0to30: CurrencyService.formatBDT(this.dueAging.days0to30),
    days31to60: CurrencyService.formatBDT(this.dueAging.days31to60),
    days60plus: CurrencyService.formatBDT(this.dueAging.days60plus),
    total: CurrencyService.formatBDT(
      this.dueAging.current + this.dueAging.days0to30 + 
      this.dueAging.days31to60 + this.dueAging.days60plus
    )
  };
});

// Virtual for credit availability
customerSchema.virtual('creditAvailable').get(function() {
  if (this.creditLimit === 0) return 0;
  return Math.max(0, this.creditLimit - this.totalDue);
});

customerSchema.virtual('formattedCreditAvailable').get(function() {
  return CurrencyService.formatBDT(this.creditAvailable);
});

// Virtual for credit risk assessment
customerSchema.virtual('creditRisk').get(function() {
  if (this.creditLimit === 0) return 'no-limit';
  
  const utilization = this.creditUtilization;
  const overdueAmount = this.dueAging.days60plus;
  
  if (this.totalDue > this.creditLimit) return 'over-limit';
  if (overdueAmount > 0) return 'overdue';
  if (utilization >= 90) return 'high';
  if (utilization >= 70) return 'medium';
  return 'low';
});

// Virtual for credit risk badge
customerSchema.virtual('creditRiskBadge').get(function() {
  const riskMap = {
    'low': { text: 'Low Risk', class: 'success' },
    'medium': { text: 'Medium Risk', class: 'warning' },
    'high': { text: 'High Risk', class: 'danger' },
    'overdue': { text: 'Overdue', class: 'danger' },
    'over-limit': { text: 'Over Limit', class: 'danger' },
    'no-limit': { text: 'No Limit', class: 'secondary' }
  };
  
  return riskMap[this.creditRisk] || { text: 'Unknown', class: 'secondary' };
});

// Virtual for invoice creation eligibility
customerSchema.virtual('canCreateInvoice').get(function() {
  // Walk-in customers can always create invoices
  if (this.customerType === 'walk-in') return true;
  
  // If no credit limit set, allow invoice creation
  if (this.creditLimit === 0) return true;
  
  // Check if customer is blocked
  if (this.creditStatus === 'blocked') return false;
  
  // Check if total due exceeds credit limit
  return this.totalDue < this.creditLimit;
});

// Virtual for invoice creation block reason
customerSchema.virtual('invoiceBlockReason').get(function() {
  if (this.canCreateInvoice) return null;
  
  if (this.creditStatus === 'blocked') return 'Customer is blocked';
  if (this.totalDue >= this.creditLimit) return 'Credit limit exceeded';
  
  return 'Unknown reason';
});

// Virtual field for formatted last invoice date
customerSchema.virtual('formattedLastInvoiceDate').get(function() {
  if (!this.lastInvoiceDate) return 'Never';
  return DateService.format(this.lastInvoiceDate, 'medium');
});

// Virtual field for customer type badge
customerSchema.virtual('customerTypeBadge').get(function() {
  const typeMap = {
    'regular': { text: 'Regular', class: 'primary' },
    'walk-in': { text: 'Walk-in', class: 'secondary' },
    'corporate': { text: 'Corporate', class: 'info' },
    'vip': { text: 'VIP', class: 'warning' }
  };
  return typeMap[this.customerType] || { text: 'Unknown', class: 'secondary' };
});

// Virtual field for status badge
customerSchema.virtual('statusBadge').get(function() {
  const statusMap = {
    'active': { text: 'Active', class: 'success' },
    'inactive': { text: 'Inactive', class: 'secondary' },
    'has-due': { text: 'Has Due', class: 'warning' },
    'new': { text: 'New', class: 'info' }
  };
  return statusMap[this.status] || { text: 'Unknown', class: 'secondary' };
});

// Indexes for better query performance
customerSchema.index({ customerId: 1 });
customerSchema.index({ name: 1 });
customerSchema.index({ phone: 1 });
customerSchema.index({ email: 1 });
customerSchema.index({ customerType: 1 });
customerSchema.index({ isActive: 1 });
customerSchema.index({ isDeleted: 1 });
customerSchema.index({ totalDue: -1 });
customerSchema.index({ totalSales: -1 });
customerSchema.index({ createdAt: -1 });

// Add soft delete method
customerSchema.methods.softDelete = function(userId) {
  this.isDeleted = true;
  this.deletedAt = new Date();
  this.deletedBy = userId;
  return this.save();
};

// Add restore method
customerSchema.methods.restore = function() {
  this.isDeleted = false;
  this.deletedAt = undefined;
  this.deletedBy = undefined;
  return this.save();
};

// Include virtuals when converting to JSON
customerSchema.set('toJSON', { virtuals: true });
customerSchema.set('toObject', { virtuals: true });

export default mongoose.model('Customer', customerSchema);