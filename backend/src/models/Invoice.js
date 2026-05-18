import mongoose from 'mongoose';
import ShopConfig from './ShopConfig.js';
import { MoneyValidator, GeneralValidator } from '../utils/validation.js';
import CurrencyService from '../services/currencyService.js';
import DateService from '../services/dateService.js';

const invoiceItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.ObjectId,
    ref: 'Product',
    required: [true, 'Product is required'],
    validate: {
      validator: function(value) {
        const validation = GeneralValidator.validateObjectId(value, 'Product');
        return validation.isValid;
      },
      message: 'Product must be a valid ID'
    }
  },
  productName: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true,
    minlength: [2, 'Product name must be at least 2 characters'],
    maxlength: [100, 'Product name cannot exceed 100 characters']
  },
  quantity: {
    type: Number,
    required: [true, 'Quantity is required'],
    min: [0.01, 'Quantity must be greater than zero'],
    max: [10000, 'Quantity cannot exceed 10,000'],
    validate: {
      validator: function(value) {
        const validation = MoneyValidator.validateAmount(value, 'Quantity', {
          allowZero: false,
          maxAmount: 10000,
          maxDecimals: 2
        });
        return validation.isValid;
      },
      message: function(props) {
        const validation = MoneyValidator.validateAmount(props.value, 'Quantity', {
          allowZero: false,
          maxAmount: 10000,
          maxDecimals: 2
        });
        return validation.errors[0] || 'Invalid quantity';
      }
    }
  },
  unit: {
    type: String,
    required: [true, 'Unit is required'],
    enum: {
      values: ['sqft', 'piece', 'kg', 'meter'],
      message: 'Unit must be sqft, piece, kg, or meter'
    }
  },
  unitPrice: {
    type: Number,
    required: [true, 'Unit price is required'],
    min: [0.01, 'Unit price must be greater than zero'],
    max: [100000, 'Unit price cannot exceed ৳1,00,000'],
    validate: {
      validator: function(value) {
        const validation = MoneyValidator.validateAmount(value, 'Unit price', {
          allowZero: false,
          maxAmount: 100000,
          maxDecimals: 2
        });
        return validation.isValid;
      },
      message: function(props) {
        const validation = MoneyValidator.validateAmount(props.value, 'Unit price', {
          allowZero: false,
          maxAmount: 100000,
          maxDecimals: 2
        });
        return validation.errors[0] || 'Invalid unit price';
      }
    }
  },
  totalPrice: {
    type: Number,
    min: [0, 'Total price cannot be negative'],
    default: 0,
    validate: {
      validator: function(value) {
        // Auto-calculate total price if not provided
        if (this.quantity && this.unitPrice) {
          const expectedTotal = this.quantity * this.unitPrice;
          return Math.abs(value - expectedTotal) < 0.01; // Allow for rounding differences
        }
        return true;
      },
      message: 'Total price must equal quantity × unit price'
    }
  },
  // Calculator-based item fields
  isCalculatorItem: {
    type: Boolean,
    default: false
  },
  measurementType: {
    type: String,
    enum: {
      values: ['SFT', 'RFT', 'PANEL', 'SHEET', 'CUSTOM'],
      message: 'Measurement type must be SFT, RFT, PANEL, SHEET, or CUSTOM'
    }
  },
  // Variant tracking fields for Thai & Glass materials
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
  calculatedArea: {
    type: Number,
    min: [0, 'Calculated area cannot be negative']
  },
  dimensions: {
    // For SFT (Square Foot) - length × width
    length: {
      type: Number,
      min: [0, 'Length cannot be negative']
    },
    width: {
      type: Number,
      min: [0, 'Width cannot be negative']
    },
    area: {
      type: Number,
      min: [0, 'Area cannot be negative']
    },
    // For RFT (Running Foot) - length only
    runningLength: {
      type: Number,
      min: [0, 'Running length cannot be negative']
    },
    // For PANEL/SHEET - quantity of standard-sized units
    panelCount: {
      type: Number,
      min: [0, 'Panel count cannot be negative']
    },
    sheetCount: {
      type: Number,
      min: [0, 'Sheet count cannot be negative']
    },
    // Standard sizes for panels/sheets
    standardSize: {
      length: {
        type: Number,
        min: [0, 'Standard length cannot be negative']
      },
      width: {
        type: Number,
        min: [0, 'Standard width cannot be negative']
      }
    }
  },
  // Measurement input format (for display purposes)
  measurementInput: {
    // For feet and inches input
    lengthFeet: Number,
    lengthInches: Number,
    widthFeet: Number,
    widthInches: Number,
    // Formatted display strings
    lengthDisplay: String, // e.g., "5ft 6in"
    widthDisplay: String,  // e.g., "3ft 0in"
    runningLengthDisplay: String // e.g., "12ft 3in"
  },
  // Calculation breakdown for transparency
  calculationBreakdown: {
    formula: String, // e.g., "Area = Length × Width"
    calculation: String, // e.g., "5.5 × 3.0 = 16.5 sq ft"
    priceCalculation: String // e.g., "16.5 × 150 = 2,475"
  },
  
  // Glass cutting wastage tracking
  wastage: {
    // Wastage input method
    inputMethod: {
      type: String,
      enum: {
        values: ['percentage', 'manual', 'none'],
        message: 'Wastage input method must be percentage, manual, or none'
      },
      default: 'none'
    },
    
    // Percentage-based wastage (e.g., 5% = 5)
    percentage: {
      type: Number,
      min: [0, 'Wastage percentage cannot be negative'],
      max: [100, 'Wastage percentage cannot exceed 100%'],
      default: 0,
      validate: {
        validator: function(value) {
          if (this.wastage?.inputMethod === 'percentage' && value < 0) {
            return false;
          }
          return true;
        },
        message: 'Wastage percentage must be 0 or greater when input method is percentage'
      }
    },
    
    // Manual wastage amount (in same unit as quantity)
    manualAmount: {
      type: Number,
      min: [0, 'Manual wastage amount cannot be negative'],
      default: 0,
      validate: {
        validator: function(value) {
          if (this.wastage?.inputMethod === 'manual' && value < 0) {
            return false;
          }
          return true;
        },
        message: 'Manual wastage amount must be 0 or greater when input method is manual'
      }
    },
    
    // Calculated wastage amount (auto-calculated)
    calculatedAmount: {
      type: Number,
      min: [0, 'Calculated wastage amount cannot be negative'],
      default: 0
    },
    
    // Total material used (quantity + wastage)
    totalMaterialUsed: {
      type: Number,
      min: [0, 'Total material used cannot be negative'],
      default: 0
    },
    
    // Wastage cost (wastage amount × unit price)
    wastageCost: {
      type: Number,
      min: [0, 'Wastage cost cannot be negative'],
      default: 0
    },
    
    // Wastage notes/reason
    notes: {
      type: String,
      maxlength: [500, 'Wastage notes cannot exceed 500 characters'],
      trim: true
    },
    
    // Wastage category for reporting
    category: {
      type: String,
      enum: {
        values: ['cutting', 'breakage', 'measurement_error', 'quality_issue', 'other'],
        message: 'Wastage category must be cutting, breakage, measurement_error, quality_issue, or other'
      },
      default: 'cutting'
    }
  }
});

const invoiceSchema = new mongoose.Schema({
  invoiceNo: {
    type: String,
    required: [true, 'Invoice number is required'],
    unique: true,
    match: [/^[A-Z]+-\d{6}-\d{4}$/, 'Invoice number must follow format PREFIX-YYYYMM-XXXX']
  },
  // Customer reference (optional for walk-in customers)
  customer: {
    type: mongoose.Schema.ObjectId,
    ref: 'Customer'
  },
  // Customer details (for walk-in or when customer is not in system)
  customerName: {
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
  customerPhone: {
    type: String,
    trim: true,
    maxlength: [20, 'Phone number cannot exceed 20 characters'],
    validate: {
      validator: function(value) {
        if (!value) return true; // Optional field
        const validation = GeneralValidator.validatePhone(value, 'Customer phone');
        return validation.isValid;
      },
      message: function(props) {
        if (!props.value) return true;
        const validation = GeneralValidator.validatePhone(props.value, 'Customer phone');
        return validation.errors[0] || 'Invalid phone number';
      }
    }
  },
  customerAddress: {
    type: String,
    trim: true,
    maxlength: [500, 'Address cannot exceed 500 characters']
  },
  // Customer type for this invoice
  customerType: {
    type: String,
    enum: ['regular', 'walk-in'],
    default: 'walk-in'
  },
  
  // Invoice type for advance payment system
  invoiceType: {
    type: String,
    enum: {
      values: ['BOOKING', 'FINAL'],
      message: 'Invoice type must be BOOKING or FINAL'
    },
    default: 'FINAL',
    required: [true, 'Invoice type is required']
  },
  
  // Advance payment tracking (for BOOKING invoices)
  advancePayment: {
    amount: {
      type: Number,
      default: 0,
      min: [0, 'Advance payment amount cannot be negative'],
      validate: {
        validator: function(value) {
          const validation = MoneyValidator.validateAmount(value, 'Advance payment', {
            allowZero: true,
            maxAmount: 10000000
          });
          return validation.isValid;
        },
        message: function(props) {
          const validation = MoneyValidator.validateAmount(props.value, 'Advance payment', {
            allowZero: true,
            maxAmount: 10000000
          });
          return validation.errors[0] || 'Invalid advance payment amount';
        }
      }
    },
    receivedDate: {
      type: Date,
      default: Date.now
    },
    paymentMethod: {
      type: String,
      enum: ['cash', 'card', 'bank_transfer', 'cheque'],
      default: 'cash'
    },
    notes: {
      type: String,
      maxlength: [500, 'Advance payment notes cannot exceed 500 characters']
    }
  },
  
  // Booking to Final conversion tracking
  bookingReference: {
    bookingInvoice: {
      type: mongoose.Schema.ObjectId,
      ref: 'Invoice'
    },
    bookingInvoiceNo: {
      type: String
    },
    conversionDate: {
      type: Date
    },
    convertedBy: {
      type: mongoose.Schema.ObjectId,
      ref: 'User'
    }
  },
  
  // Final invoice reference (for BOOKING invoices)
  finalInvoiceReference: {
    finalInvoice: {
      type: mongoose.Schema.ObjectId,
      ref: 'Invoice'
    },
    finalInvoiceNo: {
      type: String
    },
    isConverted: {
      type: Boolean,
      default: false
    }
  },
  items: {
    type: [invoiceItemSchema],
    required: [true, 'Invoice must have at least one item'],
    validate: {
      validator: function(items) {
        return items && items.length > 0;
      },
      message: 'Invoice must have at least one item'
    }
  },
  subtotal: {
    type: Number,
    min: [0, 'Subtotal cannot be negative'],
    default: 0,
    validate: {
      validator: function(value) {
        const validation = MoneyValidator.validateAmount(value, 'Subtotal', {
          allowZero: true,
          maxAmount: 10000000 // 1 crore BDT
        });
        return validation.isValid;
      },
      message: function(props) {
        const validation = MoneyValidator.validateAmount(props.value, 'Subtotal', {
          allowZero: true,
          maxAmount: 10000000
        });
        return validation.errors[0] || 'Invalid subtotal amount';
      }
    }
  },
  discount: {
    type: Number,
    default: 0,
    min: [0, 'Discount cannot be negative'],
    validate: {
      validator: function(value) {
        if (value === 0) return true;
        
        // Default to 'amount' if discountType is not set
        const discountType = this.discountType || 'amount';
        const maxDiscount = discountType === 'percentage' ? 100 : (this.subtotal || 10000000);
        const validation = MoneyValidator.validateAmount(value, 'Discount', {
          allowZero: true,
          maxAmount: maxDiscount
        });
        return validation.isValid;
      },
      message: function(props) {
        const discountType = this.discountType || 'amount';
        const maxDiscount = discountType === 'percentage' ? 100 : (this.subtotal || 10000000);
        if (discountType === 'percentage' && props.value > 100) {
          return 'Discount percentage cannot exceed 100%';
        }
        if (discountType === 'amount' && this.subtotal && props.value > this.subtotal) {
          return 'Discount amount cannot exceed subtotal';
        }
        return 'Invalid discount amount';
      }
    }
  },
  discountType: {
    type: String,
    enum: {
      values: ['percentage', 'amount'],
      message: 'Discount type must be either percentage or amount'
    },
    default: 'amount'
  },
  grandTotal: {
    type: Number,
    min: [0, 'Grand total cannot be negative'],
    default: 0,
    validate: {
      validator: function(value) {
        const validation = MoneyValidator.validateAmount(value, 'Grand total', {
          allowZero: true,
          maxAmount: 10000000 // 1 crore BDT
        });
        return validation.isValid;
      },
      message: function(props) {
        const validation = MoneyValidator.validateAmount(props.value, 'Grand total', {
          allowZero: true,
          maxAmount: 10000000
        });
        return validation.errors[0] || 'Invalid grand total amount';
      }
    }
  },
  paidAmount: {
    type: Number,
    default: 0,
    min: [0, 'Paid amount cannot be negative'],
    validate: {
      validator: function(value) {
        const validation = MoneyValidator.validateAmount(value, 'Paid amount', {
          allowZero: true,
          maxAmount: this.grandTotal || 10000000
        });
        return validation.isValid;
      },
      message: function(props) {
        if (props.value > this.grandTotal) {
          return 'Paid amount cannot exceed grand total';
        }
        return 'Invalid paid amount';
      }
    }
  },
  dueAmount: {
    type: Number,
    min: [0, 'Due amount cannot be negative'],
    default: 0,
    validate: {
      validator: function(value) {
        // Due amount should equal grand total - paid amount
        if (this.grandTotal !== undefined && this.paidAmount !== undefined) {
          const expectedDue = this.grandTotal - this.paidAmount;
          return Math.abs(value - expectedDue) < 0.01; // Allow for rounding differences
        }
        return true;
      },
      message: 'Due amount must equal grand total minus paid amount'
    }
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
    enum: ['cash', 'card', 'bank_transfer', 'cheque', 'mixed'],
    default: 'cash'
  },
  notes: {
    type: String,
    maxlength: [1000, 'Notes cannot be more than 1000 characters']
  },
  
  // Service cost tracking for accurate profit calculation
  serviceCharges: {
    // Delivery charge
    deliveryCharge: {
      type: Number,
      default: 0,
      min: [0, 'Delivery charge cannot be negative'],
      max: [50000, 'Delivery charge cannot exceed ৳50,000'],
      validate: {
        validator: function(value) {
          const validation = MoneyValidator.validateAmount(value, 'Delivery charge', {
            allowZero: true,
            maxAmount: 50000,
            maxDecimals: 2
          });
          return validation.isValid;
        },
        message: function(props) {
          const validation = MoneyValidator.validateAmount(props.value, 'Delivery charge', {
            allowZero: true,
            maxAmount: 50000,
            maxDecimals: 2
          });
          return validation.errors[0] || 'Invalid delivery charge';
        }
      }
    },
    
    // Installation charge
    installationCharge: {
      type: Number,
      default: 0,
      min: [0, 'Installation charge cannot be negative'],
      max: [100000, 'Installation charge cannot exceed ৳1,00,000'],
      validate: {
        validator: function(value) {
          const validation = MoneyValidator.validateAmount(value, 'Installation charge', {
            allowZero: true,
            maxAmount: 100000,
            maxDecimals: 2
          });
          return validation.isValid;
        },
        message: function(props) {
          const validation = MoneyValidator.validateAmount(props.value, 'Installation charge', {
            allowZero: true,
            maxAmount: 100000,
            maxDecimals: 2
          });
          return validation.errors[0] || 'Invalid installation charge';
        }
      }
    },
    
    // Installer name/details
    installerName: {
      type: String,
      trim: true,
      maxlength: [100, 'Installer name cannot exceed 100 characters'],
      validate: {
        validator: function(value) {
          if (!value) return true; // Optional field
          const validation = GeneralValidator.validateString(value, 'Installer name', {
            minLength: 2,
            maxLength: 100
          });
          return validation.isValid;
        },
        message: 'Installer name must be between 2 and 100 characters'
      }
    },
    
    // Installer phone (optional)
    installerPhone: {
      type: String,
      trim: true,
      maxlength: [20, 'Installer phone cannot exceed 20 characters'],
      validate: {
        validator: function(value) {
          if (!value) return true; // Optional field
          const validation = GeneralValidator.validatePhone(value, 'Installer phone');
          return validation.isValid;
        },
        message: function(props) {
          if (!props.value) return true;
          const validation = GeneralValidator.validatePhone(props.value, 'Installer phone');
          return validation.errors[0] || 'Invalid installer phone number';
        }
      }
    },
    
    // Service notes
    serviceNotes: {
      type: String,
      trim: true,
      maxlength: [500, 'Service notes cannot exceed 500 characters']
    },
    
    // Total service charges (auto-calculated)
    totalServiceCharges: {
      type: Number,
      default: 0,
      min: [0, 'Total service charges cannot be negative']
    }
  },
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

// Calculate status based on payment amounts
invoiceSchema.methods.calculateStatus = function() {
  if (this.paidAmount === 0) {
    this.status = 'due';
  } else if (this.paidAmount >= this.grandTotal) {
    this.status = 'paid';
    this.paidAmount = this.grandTotal; // Ensure paid amount doesn't exceed grand total
  } else {
    this.status = 'partial';
  }
  
  this.dueAmount = this.grandTotal - this.paidAmount;
  return this.status;
};

// Calculate totals with proper validation
invoiceSchema.methods.calculateTotals = function() {
  // Calculate subtotal from items and wastage
  this.subtotal = this.items.reduce((sum, item) => {
    // Calculate item total
    const itemTotal = item.quantity * item.unitPrice;
    item.totalPrice = Math.round(itemTotal * 100) / 100; // Round to 2 decimal places
    
    // Calculate wastage if specified
    this.calculateItemWastage(item);
    
    return sum + item.totalPrice;
  }, 0);
  
  // Round subtotal
  this.subtotal = Math.round(this.subtotal * 100) / 100;
  
  // Calculate service charges total
  if (this.serviceCharges) {
    const deliveryCharge = this.serviceCharges.deliveryCharge || 0;
    const installationCharge = this.serviceCharges.installationCharge || 0;
    this.serviceCharges.totalServiceCharges = Math.round((deliveryCharge + installationCharge) * 100) / 100;
  } else {
    this.serviceCharges = {
      deliveryCharge: 0,
      installationCharge: 0,
      totalServiceCharges: 0
    };
  }
  
  // Calculate grand total after discount and including service charges
  let discountAmount = 0;
  if (this.discountType === 'percentage') {
    discountAmount = (this.subtotal * this.discount) / 100;
  } else {
    discountAmount = this.discount;
  }
  
  // Round discount amount
  discountAmount = Math.round(discountAmount * 100) / 100;
  
  // Grand total = subtotal - discount + service charges
  this.grandTotal = this.subtotal - discountAmount + this.serviceCharges.totalServiceCharges;
  
  // Ensure grand total is not negative
  if (this.grandTotal < 0) {
    this.grandTotal = 0;
  }
  
  // Round grand total
  this.grandTotal = Math.round(this.grandTotal * 100) / 100;
  
  // Recalculate due amount and status
  this.calculateStatus();
};

// Method to calculate wastage for an individual item
invoiceSchema.methods.calculateItemWastage = function(item) {
  if (!item.wastage || item.wastage.inputMethod === 'none') {
    // Reset wastage values if no wastage tracking
    item.wastage = {
      inputMethod: 'none',
      percentage: 0,
      manualAmount: 0,
      calculatedAmount: 0,
      totalMaterialUsed: item.quantity,
      wastageCost: 0,
      notes: '',
      category: 'cutting'
    };
    return;
  }
  
  let wastageAmount = 0;
  
  if (item.wastage.inputMethod === 'percentage') {
    // Calculate wastage based on percentage
    wastageAmount = (item.quantity * item.wastage.percentage) / 100;
  } else if (item.wastage.inputMethod === 'manual') {
    // Use manually entered wastage amount
    wastageAmount = item.wastage.manualAmount || 0;
  }
  
  // Round wastage amount
  wastageAmount = Math.round(wastageAmount * 100) / 100;
  
  // Update calculated values
  item.wastage.calculatedAmount = wastageAmount;
  item.wastage.totalMaterialUsed = Math.round((item.quantity + wastageAmount) * 100) / 100;
  item.wastage.wastageCost = Math.round((wastageAmount * item.unitPrice) * 100) / 100;
};

// Method to convert booking invoice to final invoice
invoiceSchema.methods.convertToFinalInvoice = async function(finalInvoiceData, convertedBy) {
  if (this.invoiceType !== 'BOOKING') {
    throw new Error('Only BOOKING invoices can be converted to FINAL invoices');
  }
  
  if (this.finalInvoiceReference.isConverted) {
    throw new Error('This booking invoice has already been converted to a final invoice');
  }
  
  // Generate final invoice number
  const finalInvoiceNo = await this.constructor.generateInvoiceNumber();
  
  // Create final invoice with booking reference
  const finalInvoice = new this.constructor({
    invoiceNo: finalInvoiceNo,
    invoiceType: 'FINAL',
    customer: this.customer,
    customerName: this.customerName,
    customerPhone: this.customerPhone,
    customerAddress: this.customerAddress,
    customerType: this.customerType,
    
    // Use provided final invoice data or copy from booking
    items: finalInvoiceData.items || this.items,
    subtotal: finalInvoiceData.subtotal || this.subtotal,
    discount: finalInvoiceData.discount || this.discount,
    discountType: finalInvoiceData.discountType || this.discountType,
    grandTotal: finalInvoiceData.grandTotal || this.grandTotal,
    
    // Apply advance payment from booking
    paidAmount: this.advancePayment.amount,
    dueAmount: (finalInvoiceData.grandTotal || this.grandTotal) - this.advancePayment.amount,
    
    // Payment details
    paymentMethod: finalInvoiceData.paymentMethod || 'mixed',
    notes: finalInvoiceData.notes || this.notes,
    
    // Booking reference
    bookingReference: {
      bookingInvoice: this._id,
      bookingInvoiceNo: this.invoiceNo,
      conversionDate: new Date(),
      convertedBy: convertedBy
    },
    
    // Audit fields
    createdBy: convertedBy,
    updatedBy: convertedBy
  });
  
  // Calculate final invoice totals and status
  finalInvoice.calculateTotals();
  finalInvoice.calculateStatus();
  
  // Save final invoice
  await finalInvoice.save();
  
  // Update booking invoice with final reference
  this.finalInvoiceReference = {
    finalInvoice: finalInvoice._id,
    finalInvoiceNo: finalInvoice.invoiceNo,
    isConverted: true
  };
  this.updatedBy = convertedBy;
  await this.save();
  
  return finalInvoice;
};

// Method to record advance payment for booking invoice
invoiceSchema.methods.recordAdvancePayment = function(paymentData) {
  if (this.invoiceType !== 'BOOKING') {
    throw new Error('Advance payments can only be recorded for BOOKING invoices');
  }
  
  this.advancePayment = {
    amount: paymentData.amount,
    receivedDate: paymentData.receivedDate || new Date(),
    paymentMethod: paymentData.paymentMethod || 'cash',
    notes: paymentData.notes || ''
  };
  
  // Update paid amount and status for booking
  this.paidAmount = paymentData.amount;
  this.calculateStatus();
  
  return this;
};

// Static method to get booking invoices ready for conversion
invoiceSchema.statics.getBookingsReadyForConversion = async function(options = {}) {
  const {
    customerId,
    startDate,
    endDate,
    hasAdvancePayment = true,
    limit = 50
  } = options;
  
  const query = {
    invoiceType: 'BOOKING',
    'finalInvoiceReference.isConverted': false,
    isDeleted: { $ne: true }
  };
  
  if (customerId) {
    query.customer = customerId;
  }
  
  if (hasAdvancePayment) {
    query['advancePayment.amount'] = { $gt: 0 };
  }
  
  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = new Date(startDate);
    if (endDate) query.createdAt.$lte = new Date(endDate);
  }
  
  return await this.find(query)
    .populate('customer', 'customerId name phone')
    .populate('createdBy', 'name email')
    .sort({ createdAt: -1 })
    .limit(limit);
};

// Static method to get advance payment summary
invoiceSchema.statics.getAdvancePaymentSummary = async function(options = {}) {
  const {
    startDate,
    endDate,
    customerId
  } = options;
  
  const matchStage = {
    invoiceType: 'BOOKING',
    'advancePayment.amount': { $gt: 0 },
    isDeleted: { $ne: true }
  };
  
  if (customerId) {
    matchStage.customer = new mongoose.Types.ObjectId(customerId);
  }
  
  if (startDate || endDate) {
    matchStage.createdAt = {};
    if (startDate) matchStage.createdAt.$gte = new Date(startDate);
    if (endDate) matchStage.createdAt.$lte = new Date(endDate);
  }
  
  const summary = await this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: null,
        totalBookings: { $sum: 1 },
        totalAdvanceAmount: { $sum: '$advancePayment.amount' },
        convertedBookings: {
          $sum: { $cond: ['$finalInvoiceReference.isConverted', 1, 0] }
        },
        pendingBookings: {
          $sum: { $cond: ['$finalInvoiceReference.isConverted', 0, 1] }
        },
        pendingAdvanceAmount: {
          $sum: {
            $cond: ['$finalInvoiceReference.isConverted', 0, '$advancePayment.amount']
          }
        }
      }
    }
  ]);
  
  return summary.length > 0 ? summary[0] : {
    totalBookings: 0,
    totalAdvanceAmount: 0,
    convertedBookings: 0,
    pendingBookings: 0,
    pendingAdvanceAmount: 0
  };
};

// Static method to get monthly wastage report
invoiceSchema.statics.getMonthlyWastageReport = async function(year, month, options = {}) {
  const {
    category,
    productId,
    includeZeroWastage = false
  } = options;
  
  // Build date range for the month
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59, 999);
  
  // Build match stage
  const matchStage = {
    createdAt: { $gte: startDate, $lte: endDate },
    isDeleted: { $ne: true },
    'items.wastage.inputMethod': { $ne: 'none' }
  };
  
  if (!includeZeroWastage) {
    matchStage['items.wastage.calculatedAmount'] = { $gt: 0 };
  }
  
  const pipeline = [
    { $match: matchStage },
    { $unwind: '$items' },
    {
      $match: {
        'items.wastage.inputMethod': { $ne: 'none' },
        ...(category && { 'items.wastage.category': category }),
        ...(productId && { 'items.product': new mongoose.Types.ObjectId(productId) }),
        ...(!includeZeroWastage && { 'items.wastage.calculatedAmount': { $gt: 0 } })
      }
    },
    {
      $lookup: {
        from: 'products',
        localField: 'items.product',
        foreignField: '_id',
        as: 'productDetails'
      }
    },
    { $unwind: '$productDetails' },
    {
      $group: {
        _id: {
          product: '$items.product',
          category: '$items.wastage.category'
        },
        productName: { $first: '$productDetails.name' },
        unit: { $first: '$items.unit' },
        category: { $first: '$items.wastage.category' },
        totalQuantitySold: { $sum: '$items.quantity' },
        totalWastageAmount: { $sum: '$items.wastage.calculatedAmount' },
        totalWastageCost: { $sum: '$items.wastage.wastageCost' },
        totalMaterialUsed: { $sum: '$items.wastage.totalMaterialUsed' },
        invoiceCount: { $sum: 1 },
        averageWastagePercentage: {
          $avg: {
            $cond: [
              { $gt: ['$items.quantity', 0] },
              { $multiply: [{ $divide: ['$items.wastage.calculatedAmount', '$items.quantity'] }, 100] },
              0
            ]
          }
        }
      }
    },
    {
      $sort: { totalWastageCost: -1 }
    }
  ];
  
  const wastageData = await this.aggregate(pipeline);
  
  // Calculate summary statistics
  const summary = {
    totalInvoicesWithWastage: 0,
    totalWastageAmount: 0,
    totalWastageCost: 0,
    totalQuantitySold: 0,
    totalMaterialUsed: 0,
    overallWastagePercentage: 0,
    categoryBreakdown: {},
    topWastageProducts: []
  };
  
  wastageData.forEach(item => {
    summary.totalInvoicesWithWastage += item.invoiceCount;
    summary.totalWastageAmount += item.totalWastageAmount;
    summary.totalWastageCost += item.totalWastageCost;
    summary.totalQuantitySold += item.totalQuantitySold;
    summary.totalMaterialUsed += item.totalMaterialUsed;
    
    // Category breakdown
    if (!summary.categoryBreakdown[item.category]) {
      summary.categoryBreakdown[item.category] = {
        wastageAmount: 0,
        wastageCost: 0,
        invoiceCount: 0
      };
    }
    summary.categoryBreakdown[item.category].wastageAmount += item.totalWastageAmount;
    summary.categoryBreakdown[item.category].wastageCost += item.totalWastageCost;
    summary.categoryBreakdown[item.category].invoiceCount += item.invoiceCount;
  });
  
  // Calculate overall wastage percentage
  summary.overallWastagePercentage = summary.totalQuantitySold > 0 ? 
    Math.round((summary.totalWastageAmount / summary.totalQuantitySold) * 10000) / 100 : 0;
  
  // Format currency values
  const formattedSummary = {
    ...summary,
    formattedTotalWastageCost: CurrencyService.formatBDT(summary.totalWastageCost),
    formattedTotalWastageAmount: `${summary.totalWastageAmount.toFixed(2)} sqft`,
    formattedTotalQuantitySold: `${summary.totalQuantitySold.toFixed(2)} sqft`,
    formattedTotalMaterialUsed: `${summary.totalMaterialUsed.toFixed(2)} sqft`
  };
  
  // Format wastage data
  const formattedWastageData = wastageData.map(item => ({
    ...item,
    formattedTotalWastageCost: CurrencyService.formatBDT(item.totalWastageCost),
    formattedTotalWastageAmount: `${item.totalWastageAmount.toFixed(2)} ${item.unit}`,
    formattedTotalQuantitySold: `${item.totalQuantitySold.toFixed(2)} ${item.unit}`,
    formattedTotalMaterialUsed: `${item.totalMaterialUsed.toFixed(2)} ${item.unit}`,
    formattedAverageWastagePercentage: `${item.averageWastagePercentage.toFixed(2)}%`,
    wastagePercentage: Math.round((item.totalWastageAmount / item.totalQuantitySold) * 10000) / 100
  }));
  
  return {
    period: {
      year,
      month,
      monthName: new Date(year, month - 1).toLocaleString('default', { month: 'long' }),
      startDate,
      endDate
    },
    summary: formattedSummary,
    wastageData: formattedWastageData,
    generatedAt: new Date()
  };
};

// Static method to get wastage trends over time
invoiceSchema.statics.getWastageTrends = async function(startDate, endDate, groupBy = 'month') {
  const matchStage = {
    createdAt: { $gte: startDate, $lte: endDate },
    isDeleted: { $ne: true },
    'items.wastage.calculatedAmount': { $gt: 0 }
  };
  
  // Group by period
  let groupStage;
  if (groupBy === 'month') {
    groupStage = {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' }
        },
        totalWastageAmount: { $sum: '$items.wastage.calculatedAmount' },
        totalWastageCost: { $sum: '$items.wastage.wastageCost' },
        totalQuantitySold: { $sum: '$items.quantity' },
        invoiceCount: { $sum: 1 }
      }
    };
  } else {
    groupStage = {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
          day: { $dayOfMonth: '$createdAt' }
        },
        totalWastageAmount: { $sum: '$items.wastage.calculatedAmount' },
        totalWastageCost: { $sum: '$items.wastage.wastageCost' },
        totalQuantitySold: { $sum: '$items.quantity' },
        invoiceCount: { $sum: 1 }
      }
    };
  }
  
  const pipeline = [
    { $match: matchStage },
    { $unwind: '$items' },
    { $match: { 'items.wastage.calculatedAmount': { $gt: 0 } } },
    groupStage,
    {
      $addFields: {
        wastagePercentage: {
          $cond: [
            { $gt: ['$totalQuantitySold', 0] },
            { $multiply: [{ $divide: ['$totalWastageAmount', '$totalQuantitySold'] }, 100] },
            0
          ]
        }
      }
    },
    { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
  ];
  
  const trends = await this.aggregate(pipeline);
  
  return trends.map(trend => ({
    period: trend._id,
    totalWastageAmount: Math.round(trend.totalWastageAmount * 100) / 100,
    totalWastageCost: Math.round(trend.totalWastageCost * 100) / 100,
    totalQuantitySold: Math.round(trend.totalQuantitySold * 100) / 100,
    wastagePercentage: Math.round(trend.wastagePercentage * 100) / 100,
    invoiceCount: trend.invoiceCount,
    formattedWastageCost: CurrencyService.formatBDT(trend.totalWastageCost),
    formattedWastageAmount: `${Math.round(trend.totalWastageAmount * 100) / 100} sqft`
  }));
};

// Static method to get top wastage products
invoiceSchema.statics.getTopWastageProducts = async function(startDate, endDate, limit = 10) {
  const pipeline = [
    {
      $match: {
        createdAt: { $gte: startDate, $lte: endDate },
        isDeleted: { $ne: true },
        'items.wastage.calculatedAmount': { $gt: 0 }
      }
    },
    { $unwind: '$items' },
    { $match: { 'items.wastage.calculatedAmount': { $gt: 0 } } },
    {
      $lookup: {
        from: 'products',
        localField: 'items.product',
        foreignField: '_id',
        as: 'productDetails'
      }
    },
    { $unwind: '$productDetails' },
    {
      $group: {
        _id: '$items.product',
        productName: { $first: '$productDetails.name' },
        category: { $first: '$productDetails.category' },
        unit: { $first: '$items.unit' },
        totalWastageAmount: { $sum: '$items.wastage.calculatedAmount' },
        totalWastageCost: { $sum: '$items.wastage.wastageCost' },
        totalQuantitySold: { $sum: '$items.quantity' },
        invoiceCount: { $sum: 1 }
      }
    },
    {
      $addFields: {
        wastagePercentage: {
          $multiply: [{ $divide: ['$totalWastageAmount', '$totalQuantitySold'] }, 100]
        }
      }
    },
    { $sort: { totalWastageCost: -1 } },
    { $limit: limit }
  ];
  
  const topProducts = await this.aggregate(pipeline);
  
  return topProducts.map(product => ({
    ...product,
    formattedTotalWastageCost: CurrencyService.formatBDT(product.totalWastageCost),
    formattedTotalWastageAmount: `${product.totalWastageAmount.toFixed(2)} ${product.unit}`,
    formattedWastagePercentage: `${product.wastagePercentage.toFixed(2)}%`
  }));
};

// Virtual fields for currency formatting
invoiceSchema.virtual('formattedSubtotal').get(function() {
  return CurrencyService.formatBDT(this.subtotal);
});

// Virtual field for variant display in invoice items
invoiceItemSchema.virtual('variantDisplay').get(function() {
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

// Virtual field for formatted variant info
invoiceItemSchema.virtual('variantInfo').get(function() {
  if (!this.materialType || !this.company) {
    return null;
  }
  
  return {
    materialType: this.materialType,
    company: this.company,
    thicknessMM: this.thicknessMM,
    quality: this.quality,
    measurementType: this.measurementType,
    calculatedArea: this.calculatedArea,
    display: this.variantDisplay
  };
});

invoiceSchema.virtual('formattedDiscount').get(function() {
  if (this.discountType === 'percentage') {
    return `${this.discount}%`;
  }
  return CurrencyService.formatBDT(this.discount);
});

invoiceSchema.virtual('formattedGrandTotal').get(function() {
  return CurrencyService.formatBDT(this.grandTotal);
});

invoiceSchema.virtual('formattedPaidAmount').get(function() {
  return CurrencyService.formatBDT(this.paidAmount);
});

invoiceSchema.virtual('formattedDueAmount').get(function() {
  return CurrencyService.formatBDT(this.dueAmount);
});

// Virtual field for formatted date
invoiceSchema.virtual('formattedDate').get(function() {
  return DateService.format(this.createdAt, 'invoice');
});

// Virtual field for status badge
invoiceSchema.virtual('statusBadge').get(function() {
  const statusMap = {
    'paid': { text: 'Paid', class: 'success' },
    'partial': { text: 'Partial', class: 'warning' },
    'due': { text: 'Due', class: 'danger' }
  };
  return statusMap[this.status] || { text: 'Unknown', class: 'secondary' };
});

// Virtual fields for advance payment formatting
invoiceSchema.virtual('formattedAdvancePayment').get(function() {
  return CurrencyService.formatBDT(this.advancePayment?.amount || 0);
});

// Virtual field for invoice type badge
invoiceSchema.virtual('invoiceTypeBadge').get(function() {
  const typeMap = {
    'BOOKING': { text: 'Booking', class: 'info' },
    'FINAL': { text: 'Final', class: 'primary' }
  };
  return typeMap[this.invoiceType] || { text: 'Unknown', class: 'secondary' };
});

// Virtual field for conversion status (for booking invoices)
invoiceSchema.virtual('conversionStatus').get(function() {
  if (this.invoiceType !== 'BOOKING') return null;
  
  return {
    isConverted: this.finalInvoiceReference?.isConverted || false,
    finalInvoiceNo: this.finalInvoiceReference?.finalInvoiceNo || null,
    canConvert: !this.finalInvoiceReference?.isConverted && this.advancePayment?.amount > 0
  };
});

// Virtual field for booking reference info (for final invoices)
invoiceSchema.virtual('bookingInfo').get(function() {
  if (this.invoiceType !== 'FINAL' || !this.bookingReference?.bookingInvoiceNo) return null;
  
  return {
    bookingInvoiceNo: this.bookingReference.bookingInvoiceNo,
    conversionDate: this.bookingReference.conversionDate,
    formattedConversionDate: DateService.format(this.bookingReference.conversionDate, 'medium')
  };
});

// Virtual field for remaining balance after advance (for final invoices)
invoiceSchema.virtual('remainingBalance').get(function() {
  if (this.invoiceType !== 'FINAL') return this.dueAmount;
  
  // For final invoices converted from booking, remaining balance is due amount
  return this.dueAmount;
});

invoiceSchema.virtual('formattedRemainingBalance').get(function() {
  return CurrencyService.formatBDT(this.remainingBalance);
});

// Virtual fields for wastage summary
invoiceSchema.virtual('wastageInfo').get(function() {
  if (!this.items || this.items.length === 0) return null;
  
  let totalWastageAmount = 0;
  let totalWastageCost = 0;
  let totalMaterialUsed = 0;
  let hasWastage = false;
  
  this.items.forEach(item => {
    if (item.wastage && item.wastage.inputMethod !== 'none') {
      totalWastageAmount += item.wastage.calculatedAmount || 0;
      totalWastageCost += item.wastage.wastageCost || 0;
      totalMaterialUsed += item.wastage.totalMaterialUsed || item.quantity;
      hasWastage = true;
    } else {
      totalMaterialUsed += item.quantity;
    }
  });
  
  if (!hasWastage) return null;
  
  const totalQuantitySold = this.items.reduce((sum, item) => sum + item.quantity, 0);
  const wastagePercentage = totalQuantitySold > 0 ? 
    Math.round((totalWastageAmount / totalQuantitySold) * 10000) / 100 : 0;
  
  return {
    totalWastageAmount: Math.round(totalWastageAmount * 100) / 100,
    totalWastageCost: Math.round(totalWastageCost * 100) / 100,
    totalMaterialUsed: Math.round(totalMaterialUsed * 100) / 100,
    wastagePercentage: wastagePercentage,
    formattedTotalWastageAmount: `${Math.round(totalWastageAmount * 100) / 100} sqft`,
    formattedTotalWastageCost: CurrencyService.formatBDT(totalWastageCost),
    formattedTotalMaterialUsed: `${Math.round(totalMaterialUsed * 100) / 100} sqft`,
    formattedWastagePercentage: `${wastagePercentage}%`
  };
});

// Virtual field for wastage badge
invoiceSchema.virtual('wastageBadge').get(function() {
  const wastageInfo = this.wastageInfo;
  if (!wastageInfo) return { text: 'No Wastage', class: 'success' };
  
  const percentage = wastageInfo.wastagePercentage;
  if (percentage === 0) return { text: 'No Wastage', class: 'success' };
  if (percentage <= 5) return { text: 'Low Wastage', class: 'info' };
  if (percentage <= 10) return { text: 'Medium Wastage', class: 'warning' };
  return { text: 'High Wastage', class: 'danger' };
});

// Virtual fields for service charges formatting
invoiceSchema.virtual('formattedDeliveryCharge').get(function() {
  return CurrencyService.formatBDT(this.serviceCharges?.deliveryCharge || 0);
});

invoiceSchema.virtual('formattedInstallationCharge').get(function() {
  return CurrencyService.formatBDT(this.serviceCharges?.installationCharge || 0);
});

invoiceSchema.virtual('formattedTotalServiceCharges').get(function() {
  return CurrencyService.formatBDT(this.serviceCharges?.totalServiceCharges || 0);
});

// Virtual field for service charges info
invoiceSchema.virtual('serviceChargesInfo').get(function() {
  if (!this.serviceCharges) return null;
  
  const deliveryCharge = this.serviceCharges.deliveryCharge || 0;
  const installationCharge = this.serviceCharges.installationCharge || 0;
  const totalServiceCharges = this.serviceCharges.totalServiceCharges || 0;
  
  if (totalServiceCharges === 0) return null;
  
  return {
    deliveryCharge,
    installationCharge,
    totalServiceCharges,
    installerName: this.serviceCharges.installerName || null,
    installerPhone: this.serviceCharges.installerPhone || null,
    serviceNotes: this.serviceCharges.serviceNotes || null,
    formattedDeliveryCharge: CurrencyService.formatBDT(deliveryCharge),
    formattedInstallationCharge: CurrencyService.formatBDT(installationCharge),
    formattedTotalServiceCharges: CurrencyService.formatBDT(totalServiceCharges),
    hasDelivery: deliveryCharge > 0,
    hasInstallation: installationCharge > 0,
    hasInstaller: !!(this.serviceCharges.installerName)
  };
});

// Virtual field for service charges badge
invoiceSchema.virtual('serviceChargesBadge').get(function() {
  const serviceInfo = this.serviceChargesInfo;
  if (!serviceInfo) return { text: 'No Service Charges', class: 'secondary' };
  
  const services = [];
  if (serviceInfo.hasDelivery) services.push('Delivery');
  if (serviceInfo.hasInstallation) services.push('Installation');
  
  if (services.length === 0) return { text: 'No Service Charges', class: 'secondary' };
  
  return {
    text: services.join(' + '),
    class: 'info',
    amount: serviceInfo.formattedTotalServiceCharges
  };
});

// Include virtuals when converting to JSON
invoiceSchema.set('toJSON', { virtuals: true });
invoiceSchema.set('toObject', { virtuals: true });

// Generate invoice number using shop configuration
invoiceSchema.statics.generateInvoiceNumber = async function() {
  try {
    // Get shop configuration for invoice prefix
    const shopConfig = await ShopConfig.getActiveConfig();
    const prefix = shopConfig.invoicePrefix || 'INV';
    
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const yearMonth = `${year}${month}`;
    
    // Find the last invoice for this month with this prefix
    const lastInvoice = await this.findOne({
      invoiceNo: { $regex: `^${prefix}-${yearMonth}-` }
    }).sort({ invoiceNo: -1 });
    
    let sequence = 1;
    if (lastInvoice) {
      const lastSequence = parseInt(lastInvoice.invoiceNo.split('-')[2]);
      sequence = lastSequence + 1;
    }
    
    const sequenceStr = String(sequence).padStart(4, '0');
    return `${prefix}-${yearMonth}-${sequenceStr}`;
  } catch (error) {
    // Fallback to default format if shop config fails
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const yearMonth = `${year}${month}`;
    
    const lastInvoice = await this.findOne({
      invoiceNo: { $regex: `^INV-${yearMonth}-` }
    }).sort({ invoiceNo: -1 });
    
    let sequence = 1;
    if (lastInvoice) {
      const lastSequence = parseInt(lastInvoice.invoiceNo.split('-')[2]);
      sequence = lastSequence + 1;
    }
    
    const sequenceStr = String(sequence).padStart(4, '0');
    return `INV-${yearMonth}-${sequenceStr}`;
  }
};

// Pre-save middleware to generate invoice number
invoiceSchema.pre('save', async function() {
  if (this.isNew && !this.invoiceNo) {
    try {
      const invoiceNo = await this.constructor.generateInvoiceNumber();
      this.invoiceNo = invoiceNo;
    } catch (error) {
      console.error('Error generating invoice number:', error);
      throw error;
    }
  }
});

// Index for better query performance
invoiceSchema.index({ invoiceNo: 1 });
invoiceSchema.index({ status: 1 });
invoiceSchema.index({ createdAt: -1 });
invoiceSchema.index({ customerName: 1 });
invoiceSchema.index({ isDeleted: 1 });

// Add soft delete method
invoiceSchema.methods.softDelete = function(userId) {
  this.isDeleted = true;
  this.deletedAt = new Date();
  this.deletedBy = userId;
  return this.save();
};

// Add restore method
invoiceSchema.methods.restore = function() {
  this.isDeleted = false;
  this.deletedAt = undefined;
  this.deletedBy = undefined;
  return this.save();
};

export default mongoose.model('Invoice', invoiceSchema);