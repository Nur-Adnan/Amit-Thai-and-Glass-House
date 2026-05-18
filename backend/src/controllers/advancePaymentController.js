/**
 * Advance Payment Controller
 * Handles booking invoices, advance payments, and conversion to final invoices
 */

import asyncHandler from '../utils/asyncHandler.js';
import Invoice from '../models/Invoice.js';
import Customer from '../models/Customer.js';
import Product from '../models/Product.js';
import mongoose from 'mongoose';
import { MoneyValidator, GeneralValidator } from '../utils/validation.js';
import CurrencyService from '../services/currencyService.js';
import DateService from '../services/dateService.js';
import AuditService from '../services/auditService.js';

// @desc    Create booking invoice with advance payment
// @route   POST /api/advance-payment/booking
// @access  Private (All authenticated users)
export const createBookingInvoice = asyncHandler(async (req, res) => {
  const {
    customer,
    customerName,
    customerPhone,
    customerAddress,
    customerType = 'regular',
    items,
    discount = 0,
    discountType = 'amount',
    advancePayment,
    paymentMethod = 'cash',
    notes
  } = req.body;

  // Validate required fields
  if (!customerName) {
    return res.status(400).json({
      success: false,
      message: 'Customer name is required',
      suggestion: 'Please provide customer name'
    });
  }

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Invoice items are required',
      suggestion: 'Please provide at least one item'
    });
  }

  if (!advancePayment || !advancePayment.amount || advancePayment.amount <= 0) {
    return res.status(400).json({
      success: false,
      message: 'Advance payment amount is required for booking invoices',
      suggestion: 'Please provide a valid advance payment amount'
    });
  }

  // Validate advance payment amount
  const advanceValidation = MoneyValidator.validateAmount(advancePayment.amount, 'Advance payment', {
    allowZero: false,
    maxAmount: 10000000,
    maxDecimals: 2
  });

  if (!advanceValidation.isValid) {
    return res.status(400).json({
      success: false,
      message: `Invalid advance payment: ${advanceValidation.errors.join(', ')}`,
      suggestion: 'Please provide a valid advance payment amount'
    });
  }

  // Validate customer if provided
  let customerDoc = null;
  if (customer) {
    customerDoc = await Customer.findById(customer);
    if (!customerDoc || customerDoc.isDeleted) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found',
        suggestion: 'Please select a valid customer or create a new one'
      });
    }
  }

  // Validate and populate items
  const populatedItems = [];
  for (const item of items) {
    const product = await Product.findById(item.product);
    if (!product || product.isDeleted) {
      return res.status(404).json({
        success: false,
        message: `Product not found: ${item.product}`,
        suggestion: 'Please select valid products'
      });
    }

    populatedItems.push({
      product: product._id,
      productName: product.name,
      quantity: item.quantity,
      unit: item.unit || product.unit,
      unitPrice: item.unitPrice || product.sellingPrice,
      totalPrice: item.quantity * (item.unitPrice || product.sellingPrice),
      isCalculatorItem: item.isCalculatorItem || false,
      calculatorData: item.calculatorData || {},
      measurementInput: item.measurementInput || {},
      calculationBreakdown: item.calculationBreakdown || {}
    });
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Generate booking invoice number
    const invoiceNo = await Invoice.generateInvoiceNumber();

    // Create booking invoice
    const bookingInvoice = new Invoice({
      invoiceNo,
      invoiceType: 'BOOKING',
      customer: customerDoc?._id,
      customerName: customerDoc?.name || customerName,
      customerPhone: customerDoc?.phone || customerPhone,
      customerAddress: customerDoc?.fullAddress || customerAddress,
      customerType,
      items: populatedItems,
      discount,
      discountType,
      paymentMethod,
      notes,
      createdBy: req.user.id,
      updatedBy: req.user.id
    });

    // Calculate totals
    bookingInvoice.calculateTotals();

    // Validate advance payment doesn't exceed grand total
    if (advanceValidation.sanitizedAmount > bookingInvoice.grandTotal) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: 'Advance payment cannot exceed invoice total',
        suggestion: `Maximum advance payment: ${CurrencyService.formatBDT(bookingInvoice.grandTotal)}`
      });
    }

    // Record advance payment
    bookingInvoice.recordAdvancePayment({
      amount: advanceValidation.sanitizedAmount,
      receivedDate: advancePayment.receivedDate || new Date(),
      paymentMethod: advancePayment.paymentMethod || paymentMethod,
      notes: advancePayment.notes || ''
    });

    // Save booking invoice
    await bookingInvoice.save({ session });

    // Update customer totals if customer exists
    if (customerDoc) {
      await customerDoc.recalculateTotals();
    }

    // Log the booking creation
    await AuditService.logAction({
      action: 'BOOKING_INVOICE_CREATED',
      entityType: 'Invoice',
      entityId: bookingInvoice._id,
      performedBy: req.user.id,
      details: {
        invoiceNo: bookingInvoice.invoiceNo,
        customerName: bookingInvoice.customerName,
        grandTotal: bookingInvoice.grandTotal,
        advancePayment: advanceValidation.sanitizedAmount,
        itemCount: populatedItems.length
      },
      severity: 'medium',
      metadata: {
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      }
    });

    await session.commitTransaction();

    res.status(201).json({
      success: true,
      message: 'Booking invoice created successfully',
      data: {
        invoice: {
          ...bookingInvoice.toObject(),
          formattedSubtotal: bookingInvoice.formattedSubtotal,
          formattedGrandTotal: bookingInvoice.formattedGrandTotal,
          formattedAdvancePayment: bookingInvoice.formattedAdvancePayment,
          formattedRemainingBalance: bookingInvoice.formattedRemainingBalance,
          invoiceTypeBadge: bookingInvoice.invoiceTypeBadge,
          conversionStatus: bookingInvoice.conversionStatus
        }
      }
    });

  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
});

// @desc    Convert booking invoice to final invoice
// @route   POST /api/advance-payment/convert/:bookingId
// @access  Private (All authenticated users)
export const convertBookingToFinal = asyncHandler(async (req, res) => {
  const { bookingId } = req.params;
  const {
    items,
    discount,
    discountType,
    additionalPayment = 0,
    paymentMethod = 'cash',
    notes
  } = req.body;

  // Find booking invoice
  const bookingInvoice = await Invoice.findById(bookingId);
  if (!bookingInvoice || bookingInvoice.isDeleted) {
    return res.status(404).json({
      success: false,
      message: 'Booking invoice not found',
      suggestion: 'Please check the booking invoice ID'
    });
  }

  if (bookingInvoice.invoiceType !== 'BOOKING') {
    return res.status(400).json({
      success: false,
      message: 'Only booking invoices can be converted to final invoices',
      suggestion: 'Please select a valid booking invoice'
    });
  }

  if (bookingInvoice.finalInvoiceReference?.isConverted) {
    return res.status(400).json({
      success: false,
      message: 'This booking invoice has already been converted',
      suggestion: `Final invoice: ${bookingInvoice.finalInvoiceReference.finalInvoiceNo}`
    });
  }

  // Validate additional payment if provided
  let additionalPaymentAmount = 0;
  if (additionalPayment > 0) {
    const paymentValidation = MoneyValidator.validateAmount(additionalPayment, 'Additional payment', {
      allowZero: true,
      maxAmount: 10000000,
      maxDecimals: 2
    });

    if (!paymentValidation.isValid) {
      return res.status(400).json({
        success: false,
        message: `Invalid additional payment: ${paymentValidation.errors.join(', ')}`,
        suggestion: 'Please provide a valid additional payment amount'
      });
    }

    additionalPaymentAmount = paymentValidation.sanitizedAmount;
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Prepare final invoice data
    const finalInvoiceData = {
      items: items || bookingInvoice.items,
      discount: discount !== undefined ? discount : bookingInvoice.discount,
      discountType: discountType || bookingInvoice.discountType,
      paymentMethod,
      notes: notes || bookingInvoice.notes
    };

    // Calculate final invoice totals
    let finalSubtotal = 0;
    if (finalInvoiceData.items) {
      finalSubtotal = finalInvoiceData.items.reduce((sum, item) => {
        return sum + (item.quantity * item.unitPrice);
      }, 0);
    }

    let finalDiscountAmount = 0;
    if (finalInvoiceData.discountType === 'percentage') {
      finalDiscountAmount = (finalSubtotal * finalInvoiceData.discount) / 100;
    } else {
      finalDiscountAmount = finalInvoiceData.discount;
    }

    const finalGrandTotal = finalSubtotal - finalDiscountAmount;
    finalInvoiceData.subtotal = finalSubtotal;
    finalInvoiceData.grandTotal = finalGrandTotal;

    // Convert booking to final invoice
    const finalInvoice = await bookingInvoice.convertToFinalInvoice(finalInvoiceData, req.user.id);

    // Add additional payment if provided
    if (additionalPaymentAmount > 0) {
      finalInvoice.paidAmount += additionalPaymentAmount;
      finalInvoice.calculateStatus();
      await finalInvoice.save({ session });
    }

    // Update customer totals if customer exists
    if (bookingInvoice.customer) {
      const customer = await Customer.findById(bookingInvoice.customer);
      if (customer) {
        await customer.recalculateTotals();
      }
    }

    // Log the conversion
    await AuditService.logAction({
      action: 'BOOKING_CONVERTED_TO_FINAL',
      entityType: 'Invoice',
      entityId: finalInvoice._id,
      performedBy: req.user.id,
      details: {
        bookingInvoiceNo: bookingInvoice.invoiceNo,
        finalInvoiceNo: finalInvoice.invoiceNo,
        bookingAdvancePayment: bookingInvoice.advancePayment.amount,
        finalGrandTotal: finalInvoice.grandTotal,
        additionalPayment: additionalPaymentAmount,
        remainingBalance: finalInvoice.dueAmount
      },
      severity: 'medium',
      metadata: {
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      }
    });

    await session.commitTransaction();

    res.status(200).json({
      success: true,
      message: 'Booking invoice converted to final invoice successfully',
      data: {
        bookingInvoice: {
          ...bookingInvoice.toObject(),
          conversionStatus: bookingInvoice.conversionStatus
        },
        finalInvoice: {
          ...finalInvoice.toObject(),
          formattedSubtotal: finalInvoice.formattedSubtotal,
          formattedGrandTotal: finalInvoice.formattedGrandTotal,
          formattedPaidAmount: finalInvoice.formattedPaidAmount,
          formattedDueAmount: finalInvoice.formattedDueAmount,
          invoiceTypeBadge: finalInvoice.invoiceTypeBadge,
          bookingInfo: finalInvoice.bookingInfo
        }
      }
    });

  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
});

// @desc    Get bookings ready for conversion
// @route   GET /api/advance-payment/bookings-ready
// @access  Private (All authenticated users)
export const getBookingsReadyForConversion = asyncHandler(async (req, res) => {
  const {
    customerId,
    startDate,
    endDate,
    hasAdvancePayment = 'true',
    limit = 50
  } = req.query;

  const options = {
    customerId,
    startDate,
    endDate,
    hasAdvancePayment: hasAdvancePayment === 'true',
    limit: parseInt(limit)
  };

  const bookings = await Invoice.getBookingsReadyForConversion(options);

  // Format bookings with additional info
  const formattedBookings = bookings.map(booking => ({
    ...booking.toObject(),
    formattedSubtotal: booking.formattedSubtotal,
    formattedGrandTotal: booking.formattedGrandTotal,
    formattedAdvancePayment: booking.formattedAdvancePayment,
    formattedRemainingBalance: booking.formattedRemainingBalance,
    invoiceTypeBadge: booking.invoiceTypeBadge,
    conversionStatus: booking.conversionStatus,
    formattedDate: booking.formattedDate
  }));

  res.status(200).json({
    success: true,
    count: formattedBookings.length,
    data: formattedBookings
  });
});

// @desc    Get advance payment summary
// @route   GET /api/advance-payment/summary
// @access  Private (All authenticated users)
export const getAdvancePaymentSummary = asyncHandler(async (req, res) => {
  const {
    startDate,
    endDate,
    customerId
  } = req.query;

  const options = {
    startDate,
    endDate,
    customerId
  };

  const summary = await Invoice.getAdvancePaymentSummary(options);

  // Format summary with currency
  const formattedSummary = {
    ...summary,
    formattedTotalAdvanceAmount: CurrencyService.formatBDT(summary.totalAdvanceAmount),
    formattedPendingAdvanceAmount: CurrencyService.formatBDT(summary.pendingAdvanceAmount),
    conversionRate: summary.totalBookings > 0 ? 
      Math.round((summary.convertedBookings / summary.totalBookings) * 100) : 0
  };

  res.status(200).json({
    success: true,
    data: formattedSummary
  });
});

// @desc    Update advance payment for booking invoice
// @route   PUT /api/advance-payment/:bookingId/advance
// @access  Private (All authenticated users)
export const updateAdvancePayment = asyncHandler(async (req, res) => {
  const { bookingId } = req.params;
  const { amount, paymentMethod, notes } = req.body;

  // Find booking invoice
  const bookingInvoice = await Invoice.findById(bookingId);
  if (!bookingInvoice || bookingInvoice.isDeleted) {
    return res.status(404).json({
      success: false,
      message: 'Booking invoice not found',
      suggestion: 'Please check the booking invoice ID'
    });
  }

  if (bookingInvoice.invoiceType !== 'BOOKING') {
    return res.status(400).json({
      success: false,
      message: 'Advance payment can only be updated for booking invoices',
      suggestion: 'Please select a valid booking invoice'
    });
  }

  if (bookingInvoice.finalInvoiceReference?.isConverted) {
    return res.status(400).json({
      success: false,
      message: 'Cannot update advance payment for converted booking invoices',
      suggestion: 'This booking has already been converted to a final invoice'
    });
  }

  // Validate advance payment amount
  const advanceValidation = MoneyValidator.validateAmount(amount, 'Advance payment', {
    allowZero: false,
    maxAmount: bookingInvoice.grandTotal,
    maxDecimals: 2
  });

  if (!advanceValidation.isValid) {
    return res.status(400).json({
      success: false,
      message: `Invalid advance payment: ${advanceValidation.errors.join(', ')}`,
      suggestion: `Maximum advance payment: ${bookingInvoice.formattedGrandTotal}`
    });
  }

  const previousAdvanceAmount = bookingInvoice.advancePayment.amount;

  // Update advance payment
  bookingInvoice.recordAdvancePayment({
    amount: advanceValidation.sanitizedAmount,
    receivedDate: new Date(),
    paymentMethod: paymentMethod || bookingInvoice.advancePayment.paymentMethod,
    notes: notes || bookingInvoice.advancePayment.notes
  });

  bookingInvoice.updatedBy = req.user.id;
  await bookingInvoice.save();

  // Update customer totals if customer exists
  if (bookingInvoice.customer) {
    const customer = await Customer.findById(bookingInvoice.customer);
    if (customer) {
      await customer.recalculateTotals();
    }
  }

  // Log the advance payment update
  await AuditService.logAction({
    action: 'ADVANCE_PAYMENT_UPDATED',
    entityType: 'Invoice',
    entityId: bookingInvoice._id,
    performedBy: req.user.id,
    details: {
      invoiceNo: bookingInvoice.invoiceNo,
      previousAmount: previousAdvanceAmount,
      newAmount: advanceValidation.sanitizedAmount,
      paymentMethod: bookingInvoice.advancePayment.paymentMethod
    },
    severity: 'medium',
    metadata: {
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    }
  });

  res.status(200).json({
    success: true,
    message: 'Advance payment updated successfully',
    data: {
      invoice: {
        ...bookingInvoice.toObject(),
        formattedAdvancePayment: bookingInvoice.formattedAdvancePayment,
        formattedRemainingBalance: bookingInvoice.formattedRemainingBalance,
        conversionStatus: bookingInvoice.conversionStatus
      }
    }
  });
});

// @desc    Get booking invoice details
// @route   GET /api/advance-payment/booking/:id
// @access  Private (All authenticated users)
export const getBookingInvoice = asyncHandler(async (req, res) => {
  const booking = await Invoice.findById(req.params.id)
    .populate('customer', 'customerId name phone email')
    .populate('items.product', 'name category unit')
    .populate('createdBy', 'name email')
    .populate('updatedBy', 'name email');

  if (!booking || booking.isDeleted) {
    return res.status(404).json({
      success: false,
      message: 'Booking invoice not found',
      suggestion: 'Please check the booking invoice ID'
    });
  }

  if (booking.invoiceType !== 'BOOKING') {
    return res.status(400).json({
      success: false,
      message: 'This is not a booking invoice',
      suggestion: 'Please select a valid booking invoice'
    });
  }

  res.status(200).json({
    success: true,
    data: {
      ...booking.toObject(),
      formattedSubtotal: booking.formattedSubtotal,
      formattedGrandTotal: booking.formattedGrandTotal,
      formattedAdvancePayment: booking.formattedAdvancePayment,
      formattedRemainingBalance: booking.formattedRemainingBalance,
      invoiceTypeBadge: booking.invoiceTypeBadge,
      conversionStatus: booking.conversionStatus,
      formattedDate: booking.formattedDate
    }
  });
});