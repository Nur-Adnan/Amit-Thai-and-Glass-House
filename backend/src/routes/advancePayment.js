/**
 * Advance Payment Routes
 * Routes for booking invoices, advance payments, and conversion to final invoices
 */

import express from 'express';
import {
  createBookingInvoice,
  convertBookingToFinal,
  getBookingsReadyForConversion,
  getAdvancePaymentSummary,
  updateAdvancePayment,
  getBookingInvoice
} from '../controllers/advancePaymentController.js';
import { protect, authorize } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validation.js';
import { body, param, query } from 'express-validator';

const router = express.Router();

// Apply authentication to all routes
router.use(protect);

// Validation rules
const createBookingValidation = [
  body('customerName')
    .notEmpty()
    .withMessage('Customer name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Customer name must be between 2 and 100 characters'),
  
  body('items')
    .isArray({ min: 1 })
    .withMessage('At least one item is required'),
  
  body('items.*.product')
    .isMongoId()
    .withMessage('Valid product ID is required'),
  
  body('items.*.quantity')
    .isFloat({ min: 0.01 })
    .withMessage('Quantity must be greater than 0'),
  
  body('items.*.unitPrice')
    .isFloat({ min: 0.01 })
    .withMessage('Unit price must be greater than 0'),
  
  body('advancePayment.amount')
    .isFloat({ min: 0.01 })
    .withMessage('Advance payment amount must be greater than 0'),
  
  body('advancePayment.paymentMethod')
    .optional()
    .isIn(['cash', 'card', 'bank_transfer', 'cheque'])
    .withMessage('Invalid payment method'),
  
  body('customerType')
    .optional()
    .isIn(['regular', 'walk-in'])
    .withMessage('Customer type must be regular or walk-in'),
  
  body('discountType')
    .optional()
    .isIn(['percentage', 'amount'])
    .withMessage('Discount type must be percentage or amount')
];

const convertBookingValidation = [
  param('bookingId')
    .isMongoId()
    .withMessage('Valid booking ID is required'),
  
  body('additionalPayment')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Additional payment must be 0 or greater'),
  
  body('paymentMethod')
    .optional()
    .isIn(['cash', 'card', 'bank_transfer', 'cheque', 'mixed'])
    .withMessage('Invalid payment method')
];

const updateAdvanceValidation = [
  param('bookingId')
    .isMongoId()
    .withMessage('Valid booking ID is required'),
  
  body('amount')
    .isFloat({ min: 0.01 })
    .withMessage('Advance payment amount must be greater than 0'),
  
  body('paymentMethod')
    .optional()
    .isIn(['cash', 'card', 'bank_transfer', 'cheque'])
    .withMessage('Invalid payment method')
];

// @route   POST /api/advance-payment/booking
// @desc    Create booking invoice with advance payment
// @access  Private (All authenticated users)
router.post('/booking', createBookingValidation, validateRequest, createBookingInvoice);

// @route   POST /api/advance-payment/convert/:bookingId
// @desc    Convert booking invoice to final invoice
// @access  Private (All authenticated users)
router.post('/convert/:bookingId', convertBookingValidation, validateRequest, convertBookingToFinal);

// @route   GET /api/advance-payment/bookings-ready
// @desc    Get bookings ready for conversion
// @access  Private (All authenticated users)
router.get('/bookings-ready', [
  query('customerId')
    .optional()
    .isMongoId()
    .withMessage('Valid customer ID is required'),
  
  query('hasAdvancePayment')
    .optional()
    .isBoolean()
    .withMessage('hasAdvancePayment must be true or false'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
], validateRequest, getBookingsReadyForConversion);

// @route   GET /api/advance-payment/summary
// @desc    Get advance payment summary
// @access  Private (All authenticated users)
router.get('/summary', [
  query('customerId')
    .optional()
    .isMongoId()
    .withMessage('Valid customer ID is required')
], validateRequest, getAdvancePaymentSummary);

// @route   PUT /api/advance-payment/:bookingId/advance
// @desc    Update advance payment for booking invoice
// @access  Private (All authenticated users)
router.put('/:bookingId/advance', updateAdvanceValidation, validateRequest, updateAdvancePayment);

// @route   GET /api/advance-payment/booking/:id
// @desc    Get booking invoice details
// @access  Private (All authenticated users)
router.get('/booking/:id', [
  param('id')
    .isMongoId()
    .withMessage('Valid booking ID is required')
], validateRequest, getBookingInvoice);

export default router;