import mongoose from 'mongoose';
import { MoneyValidator, GeneralValidator, DateValidator } from '../utils/validation.js';
import CurrencyService from '../services/currencyService.js';
import DateService from '../services/dateService.js';

const employeeSchema = new mongoose.Schema({
  employeeId: {
    type: String,
    required: [true, 'Employee ID is required'],
    unique: true,
    trim: true,
    uppercase: true,
    match: [/^EMP-\d{4}$/, 'Employee ID must follow format EMP-XXXX']
  },
  name: {
    type: String,
    required: [true, 'Employee name is required'],
    trim: true,
    minlength: [2, 'Employee name must be at least 2 characters'],
    maxlength: [100, 'Employee name cannot exceed 100 characters'],
    validate: {
      validator: function(value) {
        const validation = GeneralValidator.validateString(value, 'Employee name', {
          minLength: 2,
          maxLength: 100
        });
        return validation.isValid;
      },
      message: 'Employee name must be between 2 and 100 characters'
    }
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    validate: {
      validator: function(value) {
        const validation = GeneralValidator.validateEmail(value, 'Email');
        return validation.isValid;
      },
      message: function(props) {
        const validation = GeneralValidator.validateEmail(props.value, 'Email');
        return validation.errors[0] || 'Invalid email address';
      }
    }
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true,
    maxlength: [20, 'Phone number cannot exceed 20 characters'],
    validate: {
      validator: function(value) {
        const validation = GeneralValidator.validatePhone(value, 'Phone number');
        return validation.isValid;
      },
      message: function(props) {
        const validation = GeneralValidator.validatePhone(props.value, 'Phone number');
        return validation.errors[0] || 'Invalid phone number';
      }
    }
  },
  address: {
    type: String,
    trim: true,
    maxlength: [500, 'Address cannot exceed 500 characters']
  },
  position: {
    type: String,
    required: [true, 'Position is required'],
    trim: true,
    minlength: [2, 'Position must be at least 2 characters'],
    maxlength: [100, 'Position cannot exceed 100 characters']
  },
  department: {
    type: String,
    required: [true, 'Department is required'],
    enum: {
      values: ['Administration', 'Sales', 'Production', 'Warehouse', 'Finance', 'HR'],
      message: 'Department must be Administration, Sales, Production, Warehouse, Finance, or HR'
    }
  },
  monthlySalary: {
    type: Number,
    required: [true, 'Monthly salary is required'],
    min: [1000, 'Monthly salary must be at least ৳1,000'],
    max: [1000000, 'Monthly salary cannot exceed ৳10,00,000'],
    validate: {
      validator: function(value) {
        const validation = MoneyValidator.validateAmount(value, 'Monthly salary', {
          allowZero: false,
          minAmount: 1000,
          maxAmount: 1000000,
          maxDecimals: 2
        });
        return validation.isValid;
      },
      message: function(props) {
        const validation = MoneyValidator.validateAmount(props.value, 'Monthly salary', {
          allowZero: false,
          minAmount: 1000,
          maxAmount: 1000000,
          maxDecimals: 2
        });
        return validation.errors[0] || 'Invalid monthly salary amount';
      }
    }
  },
  joiningDate: {
    type: Date,
    required: [true, 'Joining date is required'],
    default: Date.now,
    validate: {
      validator: function(value) {
        const validation = DateValidator.validateDate(value, 'Joining date', {
          allowFuture: false,
          maxDate: new Date()
        });
        return validation.isValid;
      },
      message: function(props) {
        const validation = DateValidator.validateDate(props.value, 'Joining date', {
          allowFuture: false,
          maxDate: new Date()
        });
        return validation.errors[0] || 'Invalid joining date';
      }
    }
  },
  employmentType: {
    type: String,
    required: [true, 'Employment type is required'],
    enum: {
      values: ['full-time', 'part-time', 'contract', 'intern'],
      message: 'Employment type must be full-time, part-time, contract, or intern'
    },
    default: 'full-time'
  },
  bankDetails: {
    accountNumber: {
      type: String,
      trim: true,
      maxlength: [50, 'Account number cannot be more than 50 characters']
    },
    bankName: {
      type: String,
      trim: true,
      maxlength: [100, 'Bank name cannot be more than 100 characters']
    },
    ifscCode: {
      type: String,
      trim: true,
      uppercase: true,
      maxlength: [20, 'IFSC code cannot be more than 20 characters']
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
  terminationDate: {
    type: Date,
    validate: {
      validator: function(value) {
        if (!value) return true; // Optional field
        const validation = DateValidator.validateDate(value, 'Termination date', {
          allowFuture: true,
          minDate: this.joiningDate
        });
        return validation.isValid;
      },
      message: function(props) {
        if (!props.value) return true;
        const validation = DateValidator.validateDate(props.value, 'Termination date', {
          allowFuture: true,
          minDate: this.joiningDate
        });
        return validation.errors[0] || 'Termination date must be after joining date';
      }
    }
  },
  terminationReason: {
    type: String,
    maxlength: [500, 'Termination reason cannot be more than 500 characters']
  },
  notes: {
    type: String,
    maxlength: [1000, 'Notes cannot be more than 1000 characters']
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

// Virtual for employee's full employment duration
employeeSchema.virtual('employmentDuration').get(function() {
  const endDate = this.terminationDate || new Date();
  const startDate = this.joiningDate;
  const diffTime = Math.abs(endDate - startDate);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  const years = Math.floor(diffDays / 365);
  const months = Math.floor((diffDays % 365) / 30);
  return { 
    years, 
    months, 
    totalDays: diffDays,
    formatted: `${years} years, ${months} months`
  };
});

// Virtual fields for currency formatting
employeeSchema.virtual('formattedMonthlySalary').get(function() {
  return CurrencyService.formatBDT(this.monthlySalary);
});

employeeSchema.virtual('formattedAnnualSalary').get(function() {
  const annualSalary = this.monthlySalary * 12;
  return CurrencyService.formatBDT(annualSalary);
});

// Virtual fields for date formatting
employeeSchema.virtual('formattedJoiningDate').get(function() {
  return DateService.format(this.joiningDate, 'medium');
});

employeeSchema.virtual('formattedTerminationDate').get(function() {
  if (!this.terminationDate) return null;
  return DateService.format(this.terminationDate, 'medium');
});

// Virtual field for employment status
employeeSchema.virtual('employmentStatus').get(function() {
  if (!this.isActive) return 'inactive';
  if (this.terminationDate && this.terminationDate <= new Date()) return 'terminated';
  return 'active';
});

// Virtual field for employment status badge
employeeSchema.virtual('employmentStatusBadge').get(function() {
  const statusMap = {
    'active': { text: 'Active', class: 'success' },
    'inactive': { text: 'Inactive', class: 'secondary' },
    'terminated': { text: 'Terminated', class: 'danger' }
  };
  return statusMap[this.employmentStatus] || { text: 'Unknown', class: 'secondary' };
});

// Virtual field for department badge
employeeSchema.virtual('departmentBadge').get(function() {
  const departmentMap = {
    'Administration': { text: 'Admin', class: 'primary' },
    'Sales': { text: 'Sales', class: 'success' },
    'Production': { text: 'Production', class: 'info' },
    'Warehouse': { text: 'Warehouse', class: 'warning' },
    'Finance': { text: 'Finance', class: 'danger' },
    'HR': { text: 'HR', class: 'secondary' }
  };
  return departmentMap[this.department] || { text: this.department, class: 'secondary' };
});

// Virtual field for employment type badge
employeeSchema.virtual('employmentTypeBadge').get(function() {
  const typeMap = {
    'full-time': { text: 'Full-time', class: 'success' },
    'part-time': { text: 'Part-time', class: 'info' },
    'contract': { text: 'Contract', class: 'warning' },
    'intern': { text: 'Intern', class: 'secondary' }
  };
  return typeMap[this.employmentType] || { text: this.employmentType, class: 'secondary' };
});

// Generate employee ID
employeeSchema.statics.generateEmployeeId = async function() {
  // Find the last employee
  const lastEmployee = await this.findOne({
    employeeId: { $regex: /^EMP-\d{4}$/ }
  }).sort({ employeeId: -1 });
  
  let sequence = 1;
  if (lastEmployee) {
    const lastSequence = parseInt(lastEmployee.employeeId.split('-')[1]);
    sequence = lastSequence + 1;
  }
  
  const sequenceStr = String(sequence).padStart(4, '0');
  return `EMP-${sequenceStr}`;
};

// Index for better query performance
employeeSchema.index({ employeeId: 1 });
employeeSchema.index({ email: 1 });
employeeSchema.index({ department: 1 });
employeeSchema.index({ isActive: 1 });
employeeSchema.index({ isDeleted: 1 });
employeeSchema.index({ joiningDate: -1 });

// Add soft delete method
employeeSchema.methods.softDelete = function(userId) {
  this.isDeleted = true;
  this.deletedAt = new Date();
  this.deletedBy = userId;
  return this.save();
};

// Add restore method
employeeSchema.methods.restore = function() {
  this.isDeleted = false;
  this.deletedAt = undefined;
  this.deletedBy = undefined;
  return this.save();
};

// Include virtuals when converting to JSON
employeeSchema.set('toJSON', { virtuals: true });
employeeSchema.set('toObject', { virtuals: true });

export default mongoose.model('Employee', employeeSchema);