import mongoose from 'mongoose';

const invoicePaymentSchema = new mongoose.Schema({
  invoice: {
    type: mongoose.Schema.ObjectId,
    ref: 'Invoice',
    required: [true, 'Invoice reference is required']
  },
  paymentAmount: {
    type: Number,
    required: [true, 'Payment amount is required'],
    min: [0.01, 'Payment amount must be greater than 0']
  },
  paymentMethod: {
    type: String,
    required: [true, 'Payment method is required'],
    enum: {
      values: ['cash', 'card', 'bank_transfer', 'cheque', 'upi', 'other'],
      message: 'Payment method must be cash, card, bank_transfer, cheque, upi, or other'
    }
  },
  paymentDate: {
    type: Date,
    default: Date.now
  },
  referenceNumber: {
    type: String,
    trim: true,
    maxlength: [100, 'Reference number cannot be more than 100 characters']
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [500, 'Notes cannot be more than 500 characters']
  },
  // Invoice status before this payment
  previousStatus: {
    type: String,
    enum: ['paid', 'partial', 'due'],
    required: true
  },
  // Invoice status after this payment
  newStatus: {
    type: String,
    enum: ['paid', 'partial', 'due'],
    required: true
  },
  // Running totals at the time of payment
  previousPaidAmount: {
    type: Number,
    required: true,
    min: [0, 'Previous paid amount cannot be negative']
  },
  newPaidAmount: {
    type: Number,
    required: true,
    min: [0, 'New paid amount cannot be negative']
  },
  remainingDueAmount: {
    type: Number,
    required: true,
    min: [0, 'Remaining due amount cannot be negative']
  },
  // Payment validation
  isValid: {
    type: Boolean,
    default: true
  },
  // Reversal information
  isReversed: {
    type: Boolean,
    default: false
  },
  reversedAt: {
    type: Date
  },
  reversedBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User'
  },
  reversalReason: {
    type: String,
    maxlength: [500, 'Reversal reason cannot be more than 500 characters']
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

// Index for better query performance
invoicePaymentSchema.index({ invoice: 1, createdAt: -1 });
invoicePaymentSchema.index({ paymentDate: -1 });
invoicePaymentSchema.index({ paymentMethod: 1 });
invoicePaymentSchema.index({ isReversed: 1 });

export default mongoose.model('InvoicePayment', invoicePaymentSchema);