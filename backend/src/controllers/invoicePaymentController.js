import asyncHandler from '../utils/asyncHandler.js';
import InvoicePayment from '../models/InvoicePayment.js';
import Invoice from '../models/Invoice.js';
import Customer from '../models/Customer.js';
import mongoose from 'mongoose';
import AuditService from '../services/auditService.js';

// @desc    Add payment to invoice
// @route   POST /api/invoices/:invoiceId/payments
// @access  Private (Manager and above)
export const addPayment = asyncHandler(async (req, res) => {
  const session = await mongoose.startSession();
  
  try {
    await session.withTransaction(async () => {
      const { paymentAmount, paymentMethod, referenceNumber, notes, paymentDate } = req.body;
      const { invoiceId } = req.params;

      // Validate required fields
      if (!paymentAmount || !paymentMethod) {
        throw new Error('Payment amount and payment method are required');
      }

      if (paymentAmount <= 0) {
        throw new Error('Payment amount must be greater than 0');
      }

      // Get invoice with session
      const invoice = await Invoice.findById(invoiceId)
        .populate('customer')
        .session(session);
      if (!invoice) {
        throw new Error('Invoice not found');
      }

      if (!invoice.isActive) {
        throw new Error('Cannot add payment to cancelled invoice');
      }

      if (invoice.status === 'paid') {
        throw new Error('Invoice is already fully paid');
      }

      // Validate payment amount doesn't exceed due amount
      if (paymentAmount > invoice.dueAmount) {
        throw new Error(`Payment amount (${paymentAmount}) cannot exceed due amount (${invoice.dueAmount})`);
      }

      // Store previous state
      const previousStatus = invoice.status;
      const previousPaidAmount = invoice.paidAmount;

      // Calculate new amounts
      const newPaidAmount = previousPaidAmount + paymentAmount;
      const newDueAmount = invoice.grandTotal - newPaidAmount;

      // Determine new status
      let newStatus;
      if (newDueAmount <= 0) {
        newStatus = 'paid';
      } else if (newPaidAmount > 0) {
        newStatus = 'partial';
      } else {
        newStatus = 'due';
      }

      // Create payment record
      const payment = new InvoicePayment({
        invoice: invoiceId,
        paymentAmount,
        paymentMethod,
        paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
        referenceNumber,
        notes,
        previousStatus,
        newStatus,
        previousPaidAmount,
        newPaidAmount,
        remainingDueAmount: Math.max(0, newDueAmount),
        createdBy: req.user.id
      });

      await payment.save({ session });

      // Update invoice
      invoice.paidAmount = newPaidAmount;
      invoice.dueAmount = Math.max(0, newDueAmount);
      invoice.status = newStatus;
      invoice.updatedBy = req.user.id;

      // Update payment method if it's the first payment or different
      if (previousPaidAmount === 0) {
        invoice.paymentMethod = paymentMethod;
      } else if (invoice.paymentMethod !== paymentMethod) {
        invoice.paymentMethod = 'mixed';
      }

      await invoice.save({ session });

      // Update customer totals if customer is assigned
      if (invoice.customer) {
        await invoice.customer.recalculateTotals();
      }

      // Populate the payment for response
      await payment.populate('createdBy', 'name email');
      await payment.populate('invoice', 'invoiceNo customerName grandTotal');

      // Log audit trail
      await AuditService.logInvoicePayment(payment, invoice, req.user, req);

      res.status(201).json({
        success: true,
        message: 'Payment added successfully',
        data: {
          payment,
          invoice: {
            id: invoice._id,
            invoiceNo: invoice.invoiceNo,
            grandTotal: invoice.grandTotal,
            paidAmount: invoice.paidAmount,
            dueAmount: invoice.dueAmount,
            status: invoice.status
          }
        }
      });
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  } finally {
    await session.endSession();
  }
});

// @desc    Get payment history for invoice
// @route   GET /api/invoices/:invoiceId/payments
// @access  Private (All authenticated users)
export const getPaymentHistory = asyncHandler(async (req, res) => {
  const { invoiceId } = req.params;
  const { page = 1, limit = 10 } = req.query;

  // Verify invoice exists
  const invoice = await Invoice.findById(invoiceId);
  if (!invoice) {
    return res.status(404).json({
      success: false,
      message: 'Invoice not found'
    });
  }

  // Calculate pagination
  const skip = (page - 1) * limit;

  const payments = await InvoicePayment.find({ 
    invoice: invoiceId,
    isReversed: false 
  })
    .populate('createdBy', 'name email')
    .populate('updatedBy', 'name email')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  const total = await InvoicePayment.countDocuments({ 
    invoice: invoiceId,
    isReversed: false 
  });

  // Calculate payment summary
  const paymentSummary = await InvoicePayment.aggregate([
    { 
      $match: { 
        invoice: new mongoose.Types.ObjectId(invoiceId),
        isReversed: false 
      } 
    },
    {
      $group: {
        _id: '$paymentMethod',
        totalAmount: { $sum: '$paymentAmount' },
        count: { $sum: 1 }
      }
    }
  ]);

  res.status(200).json({
    success: true,
    count: payments.length,
    total,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(total / limit)
    },
    summary: {
      invoice: {
        invoiceNo: invoice.invoiceNo,
        customerName: invoice.customerName,
        grandTotal: invoice.grandTotal,
        paidAmount: invoice.paidAmount,
        dueAmount: invoice.dueAmount,
        status: invoice.status
      },
      paymentsByMethod: paymentSummary
    },
    data: payments
  });
});

// @desc    Get single payment details
// @route   GET /api/payments/:paymentId
// @access  Private (All authenticated users)
export const getPayment = asyncHandler(async (req, res) => {
  const payment = await InvoicePayment.findById(req.params.paymentId)
    .populate('invoice', 'invoiceNo customerName grandTotal paidAmount dueAmount status')
    .populate('createdBy', 'name email')
    .populate('updatedBy', 'name email')
    .populate('reversedBy', 'name email');

  if (!payment) {
    return res.status(404).json({
      success: false,
      message: 'Payment not found'
    });
  }

  res.status(200).json({
    success: true,
    data: payment
  });
});

// @desc    Reverse payment
// @route   PUT /api/payments/:paymentId/reverse
// @access  Private (Manager and above)
export const reversePayment = asyncHandler(async (req, res) => {
  const session = await mongoose.startSession();
  
  try {
    await session.withTransaction(async () => {
      const { reversalReason } = req.body;
      const { paymentId } = req.params;

      if (!reversalReason) {
        throw new Error('Reversal reason is required');
      }

      // Get payment with session
      const payment = await InvoicePayment.findById(paymentId).session(session);
      if (!payment) {
        throw new Error('Payment not found');
      }

      if (payment.isReversed) {
        throw new Error('Payment is already reversed');
      }

      // Get invoice
      const invoice = await Invoice.findById(payment.invoice).session(session);
      if (!invoice) {
        throw new Error('Invoice not found');
      }

      // Calculate new amounts after reversal
      const newPaidAmount = invoice.paidAmount - payment.paymentAmount;
      const newDueAmount = invoice.grandTotal - newPaidAmount;

      // Determine new status
      let newStatus;
      if (newPaidAmount <= 0) {
        newStatus = 'due';
      } else if (newDueAmount <= 0) {
        newStatus = 'paid';
      } else {
        newStatus = 'partial';
      }

      // Mark payment as reversed
      payment.isReversed = true;
      payment.reversedAt = new Date();
      payment.reversedBy = req.user.id;
      payment.reversalReason = reversalReason;
      payment.updatedBy = req.user.id;

      await payment.save({ session });

      // Update invoice
      invoice.paidAmount = Math.max(0, newPaidAmount);
      invoice.dueAmount = Math.max(0, newDueAmount);
      invoice.status = newStatus;
      invoice.updatedBy = req.user.id;

      // Recalculate payment method
      const remainingPayments = await InvoicePayment.find({
        invoice: invoice._id,
        isReversed: false
      }).session(session);

      if (remainingPayments.length === 0) {
        invoice.paymentMethod = 'cash'; // Default
      } else {
        const methods = [...new Set(remainingPayments.map(p => p.paymentMethod))];
        invoice.paymentMethod = methods.length > 1 ? 'mixed' : methods[0];
      }

      await invoice.save({ session });

      // Populate for response
      await payment.populate('createdBy', 'name email');
      await payment.populate('reversedBy', 'name email');
      await payment.populate('invoice', 'invoiceNo customerName grandTotal paidAmount dueAmount status');

      // Log audit trail
      await AuditService.logPaymentReverse(payment, invoice, req.user, reversalReason, req);

      res.status(200).json({
        success: true,
        message: 'Payment reversed successfully',
        data: {
          payment,
          invoice: {
            id: invoice._id,
            invoiceNo: invoice.invoiceNo,
            grandTotal: invoice.grandTotal,
            paidAmount: invoice.paidAmount,
            dueAmount: invoice.dueAmount,
            status: invoice.status
          }
        }
      });
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  } finally {
    await session.endSession();
  }
});

// @desc    Get all payments (across all invoices)
// @route   GET /api/payments
// @access  Private (Manager and above)
export const getAllPayments = asyncHandler(async (req, res) => {
  const {
    startDate,
    endDate,
    paymentMethod,
    invoiceNo,
    customerName,
    sortBy = 'createdAt',
    sortOrder = 'desc',
    page = 1,
    limit = 10
  } = req.query;

  // Build query
  const query = { isReversed: false };

  if (startDate || endDate) {
    query.paymentDate = {};
    if (startDate) {
      query.paymentDate.$gte = new Date(startDate);
    }
    if (endDate) {
      query.paymentDate.$lte = new Date(endDate);
    }
  }

  if (paymentMethod) {
    query.paymentMethod = paymentMethod;
  }

  // Calculate pagination
  const skip = (page - 1) * limit;

  // Build sort object
  const sort = {};
  sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

  let payments = await InvoicePayment.find(query)
    .populate('invoice', 'invoiceNo customerName grandTotal status')
    .populate('createdBy', 'name email')
    .sort(sort)
    .skip(skip)
    .limit(parseInt(limit));

  // Filter by invoice or customer if specified
  if (invoiceNo || customerName) {
    payments = payments.filter(payment => {
      const invoice = payment.invoice;
      if (invoiceNo && !invoice.invoiceNo.toLowerCase().includes(invoiceNo.toLowerCase())) {
        return false;
      }
      if (customerName && !invoice.customerName.toLowerCase().includes(customerName.toLowerCase())) {
        return false;
      }
      return true;
    });
  }

  const total = await InvoicePayment.countDocuments(query);

  res.status(200).json({
    success: true,
    count: payments.length,
    total,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(total / limit)
    },
    data: payments
  });
});

// @desc    Get payment statistics
// @route   GET /api/payments/stats
// @access  Private (Manager and above)
export const getPaymentStats = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;

  // Build date filter
  const dateFilter = { isReversed: false };
  if (startDate || endDate) {
    dateFilter.paymentDate = {};
    if (startDate) {
      dateFilter.paymentDate.$gte = new Date(startDate);
    }
    if (endDate) {
      dateFilter.paymentDate.$lte = new Date(endDate);
    }
  }

  // Payment method statistics
  const paymentMethodStats = await InvoicePayment.aggregate([
    { $match: dateFilter },
    {
      $group: {
        _id: '$paymentMethod',
        totalAmount: { $sum: '$paymentAmount' },
        count: { $sum: 1 },
        avgAmount: { $avg: '$paymentAmount' }
      }
    },
    { $sort: { totalAmount: -1 } }
  ]);

  // Daily payment trends
  const dailyStats = await InvoicePayment.aggregate([
    { $match: dateFilter },
    {
      $group: {
        _id: {
          year: { $year: '$paymentDate' },
          month: { $month: '$paymentDate' },
          day: { $dayOfMonth: '$paymentDate' }
        },
        totalAmount: { $sum: '$paymentAmount' },
        count: { $sum: 1 }
      }
    },
    { $sort: { '_id.year': -1, '_id.month': -1, '_id.day': -1 } },
    { $limit: 30 }
  ]);

  // Overall statistics
  const overallStats = await InvoicePayment.aggregate([
    { $match: dateFilter },
    {
      $group: {
        _id: null,
        totalPayments: { $sum: 1 },
        totalAmount: { $sum: '$paymentAmount' },
        avgPayment: { $avg: '$paymentAmount' },
        minPayment: { $min: '$paymentAmount' },
        maxPayment: { $max: '$paymentAmount' }
      }
    }
  ]);

  res.status(200).json({
    success: true,
    data: {
      overall: overallStats[0] || {},
      byPaymentMethod: paymentMethodStats,
      dailyTrends: dailyStats
    }
  });
});