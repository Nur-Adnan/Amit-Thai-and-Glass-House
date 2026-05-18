import mongoose from 'mongoose';

const salaryPaymentSchema = new mongoose.Schema({
  employee: {
    type: mongoose.Schema.ObjectId,
    ref: 'Employee',
    required: [true, 'Employee reference is required']
  },
  paymentMonth: {
    type: Number,
    required: [true, 'Payment month is required'],
    min: [1, 'Month must be between 1 and 12'],
    max: [12, 'Month must be between 1 and 12']
  },
  paymentYear: {
    type: Number,
    required: [true, 'Payment year is required'],
    min: [2020, 'Year must be 2020 or later'],
    max: [2050, 'Year must be 2050 or earlier']
  },
  baseSalary: {
    type: Number,
    required: [true, 'Base salary is required'],
    min: [0, 'Base salary cannot be negative']
  },
  allowances: {
    hra: {
      type: Number,
      default: 0,
      min: [0, 'HRA cannot be negative']
    },
    transport: {
      type: Number,
      default: 0,
      min: [0, 'Transport allowance cannot be negative']
    },
    medical: {
      type: Number,
      default: 0,
      min: [0, 'Medical allowance cannot be negative']
    },
    other: {
      type: Number,
      default: 0,
      min: [0, 'Other allowances cannot be negative']
    }
  },
  deductions: {
    pf: {
      type: Number,
      default: 0,
      min: [0, 'PF deduction cannot be negative']
    },
    esi: {
      type: Number,
      default: 0,
      min: [0, 'ESI deduction cannot be negative']
    },
    tax: {
      type: Number,
      default: 0,
      min: [0, 'Tax deduction cannot be negative']
    },
    advance: {
      type: Number,
      default: 0,
      min: [0, 'Advance deduction cannot be negative']
    },
    other: {
      type: Number,
      default: 0,
      min: [0, 'Other deductions cannot be negative']
    }
  },
  grossSalary: {
    type: Number,
    min: [0, 'Gross salary cannot be negative'],
    default: 0
  },
  totalDeductions: {
    type: Number,
    min: [0, 'Total deductions cannot be negative'],
    default: 0
  },
  netSalary: {
    type: Number,
    min: [0, 'Net salary cannot be negative'],
    default: 0
  },
  paymentDate: {
    type: Date
  },
  paymentMethod: {
    type: String,
    enum: {
      values: ['bank_transfer', 'cash', 'cheque'],
      message: 'Payment method must be bank_transfer, cash, or cheque'
    },
    default: 'bank_transfer'
  },
  referenceNumber: {
    type: String,
    trim: true,
    maxlength: [100, 'Reference number cannot be more than 100 characters']
  },
  status: {
    type: String,
    enum: {
      values: ['due', 'paid'],
      message: 'Status must be due or paid'
    },
    default: 'due'
  },
  workingDays: {
    type: Number,
    min: [0, 'Working days cannot be negative'],
    max: [31, 'Working days cannot exceed 31'],
    default: 30
  },
  actualWorkingDays: {
    type: Number,
    min: [0, 'Actual working days cannot be negative'],
    max: [31, 'Actual working days cannot exceed 31']
  },
  overtime: {
    hours: {
      type: Number,
      default: 0,
      min: [0, 'Overtime hours cannot be negative']
    },
    rate: {
      type: Number,
      default: 0,
      min: [0, 'Overtime rate cannot be negative']
    },
    amount: {
      type: Number,
      default: 0,
      min: [0, 'Overtime amount cannot be negative']
    }
  },
  notes: {
    type: String,
    maxlength: [500, 'Notes cannot be more than 500 characters']
  },
  // Expense tracking
  isExpenseRecorded: {
    type: Boolean,
    default: false
  },
  expenseCategory: {
    type: String,
    default: 'Salary Expense'
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

// Compound index to ensure one salary payment per employee per month/year
salaryPaymentSchema.index({ employee: 1, paymentMonth: 1, paymentYear: 1 }, { unique: true });

// Other indexes for better query performance
salaryPaymentSchema.index({ paymentMonth: 1, paymentYear: 1 });
salaryPaymentSchema.index({ status: 1 });
salaryPaymentSchema.index({ paymentDate: -1 });
salaryPaymentSchema.index({ createdAt: -1 });

// Method to mark salary as paid
salaryPaymentSchema.methods.markAsPaid = function(paymentDate, paymentMethod, referenceNumber) {
  this.status = 'paid';
  this.paymentDate = paymentDate || new Date();
  this.paymentMethod = paymentMethod || 'bank_transfer';
  this.referenceNumber = referenceNumber;
  return this.save();
};

// Static method to get salary summary for a period
salaryPaymentSchema.statics.getSalarySummary = async function(startMonth, startYear, endMonth, endYear) {
  const matchCondition = {};
  
  if (startYear === endYear) {
    matchCondition.paymentYear = startYear;
    matchCondition.paymentMonth = { $gte: startMonth, $lte: endMonth };
  } else {
    matchCondition.$or = [
      { paymentYear: startYear, paymentMonth: { $gte: startMonth } },
      { paymentYear: { $gt: startYear, $lt: endYear } },
      { paymentYear: endYear, paymentMonth: { $lte: endMonth } }
    ];
  }
  
  return await this.aggregate([
    { $match: matchCondition },
    {
      $group: {
        _id: null,
        totalEmployees: { $addToSet: '$employee' },
        totalGrossSalary: { $sum: '$grossSalary' },
        totalDeductions: { $sum: '$totalDeductions' },
        totalNetSalary: { $sum: '$netSalary' },
        paidSalaries: { $sum: { $cond: [{ $eq: ['$status', 'paid'] }, 1, 0] } },
        dueSalaries: { $sum: { $cond: [{ $eq: ['$status', 'due'] }, 1, 0] } },
        totalPaidAmount: { $sum: { $cond: [{ $eq: ['$status', 'paid'] }, '$netSalary', 0] } },
        totalDueAmount: { $sum: { $cond: [{ $eq: ['$status', 'due'] }, '$netSalary', 0] } }
      }
    },
    {
      $project: {
        totalEmployees: { $size: '$totalEmployees' },
        totalGrossSalary: 1,
        totalDeductions: 1,
        totalNetSalary: 1,
        paidSalaries: 1,
        dueSalaries: 1,
        totalPaidAmount: 1,
        totalDueAmount: 1
      }
    }
  ]);
};

export default mongoose.model('SalaryPayment', salaryPaymentSchema);