/**
 * Purchase Controller
 * Handles product purchases from suppliers with automatic supplier due updates
 */

import asyncHandler from '../utils/asyncHandler.js';
import Purchase from '../models/Purchase.js';
import Supplier from '../models/Supplier.js';
import Product from '../models/Product.js';
import Investment from '../models/Investment.js';
import { MoneyValidator, GeneralValidator } from '../utils/validation.js';
import CurrencyService from '../services/currencyService.js';
import DateService from '../services/dateService.js';
import mongoose from 'mongoose';

// @desc    Get all purchases with filtering and pagination
// @route   GET /api/purchases
// @access  Private (All authenticated users)
export const getPurchases = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 20,
    supplier,
    status,
    paymentStatus,
    startDate,
    endDate,
    sortBy = 'purchaseDate',
    sortOrder = 'desc'
  } = req.query;

  // Build query
  const query = { isDeleted: { $ne: true } };

  // Filter by supplier
  if (supplier) {
    query.supplier = supplier;
  }

  // Filter by status
  if (status && status !== 'all') {
    query.status = status;
  }

  // Filter by payment status
  if (paymentStatus && paymentStatus !== 'all') {
    query.paymentStatus = paymentStatus;
  }

  // Filter by date range
  if (startDate || endDate) {
    query.purchaseDate = {};
    if (startDate) query.purchaseDate.$gte = new Date(startDate);
    if (endDate) query.purchaseDate.$lte = new Date(endDate);
  }

  // Sort options
  const sortOptions = {};
  sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

  // Execute query with pagination
  const purchases = await Purchase.find(query)
    .populate('supplier', 'name supplierId phone supplierType')
    .populate('items.product', 'name category')
    .populate('createdBy', 'name email')
    .populate('updatedBy', 'name email')
    .sort(sortOptions)
    .limit(parseInt(limit))
    .skip((parseInt(page) - 1) * parseInt(limit));

  // Get total count for pagination
  const totalPurchases = await Purchase.countDocuments(query);
  const totalPages = Math.ceil(totalPurchases / parseInt(limit));

  // Format purchases with additional info
  const formattedPurchases = purchases.map(purchase => ({
    ...purchase.toObject(),
    purchaseSummary: purchase.purchaseSummary,
    formattedPurchaseDate: purchase.formattedPurchaseDate,
    formattedCreatedAt: purchase.formattedCreatedAt
  }));

  res.status(200).json({
    success: true,
    count: purchases.length,
    totalPurchases,
    totalPages,
    currentPage: parseInt(page),
    data: formattedPurchases
  });
});

// @desc    Get single purchase by ID
// @route   GET /api/purchases/:id
// @access  Private (All authenticated users)
export const getPurchase = asyncHandler(async (req, res) => {
  const purchase = await Purchase.findById(req.params.id)
    .populate('supplier', 'name supplierId phone address supplierType')
    .populate('items.product', 'name category unit')
    .populate('createdBy', 'name email')
    .populate('updatedBy', 'name email');

  if (!purchase || purchase.isDeleted) {
    return res.status(404).json({
      success: false,
      message: 'Purchase not found',
      suggestion: 'Please check the purchase ID and try again'
    });
  }

  res.status(200).json({
    success: true,
    data: {
      ...purchase.toObject(),
      purchaseSummary: purchase.purchaseSummary,
      formattedPurchaseDate: purchase.formattedPurchaseDate,
      formattedCreatedAt: purchase.formattedCreatedAt
    }
  });
});

// @desc    Create new purchase
// @route   POST /api/purchases
// @access  Private (Manager and above)
export const createPurchase = asyncHandler(async (req, res) => {
  const {
    supplier: supplierId,
    purchaseDate,
    items,
    discount = 0,
    tax = 0,
    paidAmount = 0,
    paymentMethod = 'Credit',
    purchaseType = 'Stock',
    invoiceNumber,
    challanNumber,
    description,
    notes,
    createInvestment = false
  } = req.body;

  // Validate required fields
  if (!supplierId || !items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Please provide supplier and purchase items',
      suggestion: 'Supplier ID and items array are required'
    });
  }

  // Validate supplier exists
  const supplier = await Supplier.findById(supplierId);
  if (!supplier || supplier.isDeleted) {
    return res.status(404).json({
      success: false,
      message: 'Supplier not found',
      suggestion: 'Please select a valid supplier'
    });
  }

  // Validate and process items
  const processedItems = [];
  let subtotal = 0;

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    
    if (!item.product || !item.quantity || !item.unitCost) {
      return res.status(400).json({
        success: false,
        message: `Item ${i + 1}: Product, quantity, and unit cost are required`,
        suggestion: 'Please provide complete item information'
      });
    }

    // Validate product exists
    const product = await Product.findById(item.product);
    if (!product || product.isDeleted) {
      return res.status(404).json({
        success: false,
        message: `Item ${i + 1}: Product not found`,
        suggestion: 'Please select valid products'
      });
    }

    // Validate quantity and unit cost
    const quantityValidation = MoneyValidator.validateAmount(item.quantity, 'Quantity', {
      allowZero: false,
      maxAmount: 100000,
      maxDecimals: 3
    });

    const costValidation = MoneyValidator.validateAmount(item.unitCost, 'Unit cost', {
      allowZero: false,
      maxAmount: 100000,
      maxDecimals: 2
    });

    if (!quantityValidation.isValid) {
      return res.status(400).json({
        success: false,
        message: `Item ${i + 1}: Invalid quantity - ${quantityValidation.errors.join(', ')}`,
        suggestion: 'Please provide valid quantity'
      });
    }

    if (!costValidation.isValid) {
      return res.status(400).json({
        success: false,
        message: `Item ${i + 1}: Invalid unit cost - ${costValidation.errors.join(', ')}`,
        suggestion: 'Please provide valid unit cost'
      });
    }

    const totalCost = quantityValidation.sanitizedAmount * costValidation.sanitizedAmount;
    subtotal += totalCost;

    processedItems.push({
      product: product._id,
      productName: product.name,
      quantity: quantityValidation.sanitizedAmount,
      unit: item.unit || product.unit || 'pcs',
      unitCost: costValidation.sanitizedAmount,
      totalCost: totalCost
    });
  }

  // Validate discount and tax
  const discountValidation = MoneyValidator.validateAmount(discount, 'Discount', {
    allowZero: true,
    maxAmount: subtotal,
    maxDecimals: 2
  });

  const taxValidation = MoneyValidator.validateAmount(tax, 'Tax', {
    allowZero: true,
    maxAmount: subtotal,
    maxDecimals: 2
  });

  if (!discountValidation.isValid) {
    return res.status(400).json({
      success: false,
      message: `Invalid discount: ${discountValidation.errors.join(', ')}`,
      suggestion: 'Discount cannot exceed subtotal'
    });
  }

  if (!taxValidation.isValid) {
    return res.status(400).json({
      success: false,
      message: `Invalid tax: ${taxValidation.errors.join(', ')}`,
      suggestion: 'Please provide valid tax amount'
    });
  }

  const totalAmount = subtotal - discountValidation.sanitizedAmount + taxValidation.sanitizedAmount;

  // Validate paid amount
  let validatedPaidAmount = 0;
  if (paidAmount > 0) {
    const paidValidation = MoneyValidator.validateAmount(paidAmount, 'Paid amount', {
      allowZero: true,
      maxAmount: totalAmount,
      maxDecimals: 2
    });

    if (!paidValidation.isValid) {
      return res.status(400).json({
        success: false,
        message: `Invalid paid amount: ${paidValidation.errors.join(', ')}`,
        suggestion: 'Paid amount cannot exceed total amount'
      });
    }

    validatedPaidAmount = paidValidation.sanitizedAmount;
  }

  // Start transaction for data consistency
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Create purchase
    const purchaseData = {
      supplier: supplier._id,
      purchaseDate: purchaseDate ? new Date(purchaseDate) : new Date(),
      items: processedItems,
      subtotal,
      discount: discountValidation.sanitizedAmount,
      tax: taxValidation.sanitizedAmount,
      totalAmount,
      paidAmount: validatedPaidAmount,
      paymentMethod,
      purchaseType,
      invoiceNumber,
      challanNumber,
      description,
      notes,
      createdBy: req.user.id
    };

    const purchase = await Purchase.create([purchaseData], { session });
    const createdPurchase = purchase[0];

    // Update supplier due amount
    const dueAmount = totalAmount - validatedPaidAmount;
    await supplier.updateDueAmount(totalAmount, validatedPaidAmount);

    // Update product stock for stock purchases
    if (purchaseType === 'Stock') {
      for (const item of processedItems) {
        const product = await Product.findById(item.product).session(session);
        if (product) {
          product.stock += item.quantity;
          product.updatedBy = req.user.id;
          await product.save({ session });
        }
      }
    }

    // Create investment entry if requested
    let investmentEntry = null;
    if (createInvestment) {
      const investmentData = {
        title: `Stock Purchase - ${supplier.name}`,
        description: `Purchase from ${supplier.name} (${createdPurchase.purchaseId})`,
        amount: totalAmount,
        investmentType: 'Stock Purchase',
        category: 'Operational Investment',
        supplier: supplier._id,
        purchase: createdPurchase._id,
        investmentDate: createdPurchase.purchaseDate,
        paymentMethod: paymentMethod,
        isAutoGenerated: true,
        createdBy: req.user.id
      };

      investmentEntry = await Investment.create([investmentData], { session });
    }

    await session.commitTransaction();

    // Populate the created purchase
    await createdPurchase.populate('supplier', 'name supplierId phone');
    await createdPurchase.populate('items.product', 'name category');
    await createdPurchase.populate('createdBy', 'name email');

    res.status(201).json({
      success: true,
      message: 'Purchase created successfully',
      data: {
        purchase: {
          ...createdPurchase.toObject(),
          purchaseSummary: createdPurchase.purchaseSummary,
          formattedPurchaseDate: createdPurchase.formattedPurchaseDate
        },
        supplierUpdate: {
          supplierId: supplier.supplierId,
          name: supplier.name,
          newTotalDue: supplier.formattedTotalDue
        },
        ...(investmentEntry && {
          investmentCreated: {
            investmentId: investmentEntry[0].investmentId,
            amount: CurrencyService.formatBDT(investmentEntry[0].amount)
          }
        })
      }
    });

  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
});

// @desc    Update purchase
// @route   PUT /api/purchases/:id
// @access  Private (Manager and above)
export const updatePurchase = asyncHandler(async (req, res) => {
  const purchase = await Purchase.findById(req.params.id);

  if (!purchase || purchase.isDeleted) {
    return res.status(404).json({
      success: false,
      message: 'Purchase not found',
      suggestion: 'Please check the purchase ID and try again'
    });
  }

  const {
    status,
    description,
    notes,
    invoiceNumber,
    challanNumber
  } = req.body;

  // Update allowed fields
  if (status) purchase.status = status;
  if (description !== undefined) purchase.description = description;
  if (notes !== undefined) purchase.notes = notes;
  if (invoiceNumber !== undefined) purchase.invoiceNumber = invoiceNumber;
  if (challanNumber !== undefined) purchase.challanNumber = challanNumber;

  purchase.updatedBy = req.user.id;
  await purchase.save();

  await purchase.populate('supplier', 'name supplierId phone');
  await purchase.populate('items.product', 'name category');
  await purchase.populate('updatedBy', 'name email');

  res.status(200).json({
    success: true,
    message: 'Purchase updated successfully',
    data: {
      ...purchase.toObject(),
      purchaseSummary: purchase.purchaseSummary,
      formattedPurchaseDate: purchase.formattedPurchaseDate
    }
  });
});

// @desc    Make payment for purchase
// @route   POST /api/purchases/:id/payment
// @access  Private (Manager and above)
export const makePurchasePayment = asyncHandler(async (req, res) => {
  const purchase = await Purchase.findById(req.params.id).populate('supplier');

  if (!purchase || purchase.isDeleted) {
    return res.status(404).json({
      success: false,
      message: 'Purchase not found',
      suggestion: 'Please check the purchase ID and try again'
    });
  }

  const { paymentAmount, paymentMethod = 'Cash', description } = req.body;

  // Validate payment amount
  if (!paymentAmount || paymentAmount <= 0) {
    return res.status(400).json({
      success: false,
      message: 'Please provide a valid payment amount',
      suggestion: 'Payment amount must be greater than 0'
    });
  }

  if (paymentAmount > purchase.dueAmount) {
    return res.status(400).json({
      success: false,
      message: 'Payment amount cannot exceed due amount',
      suggestion: `Maximum payment amount is ${purchase.formattedDueAmount}`,
      currentDue: purchase.formattedDueAmount
    });
  }

  const paymentValidation = MoneyValidator.validateAmount(paymentAmount, 'Payment amount', {
    allowZero: false,
    maxAmount: purchase.dueAmount,
    maxDecimals: 2
  });

  if (!paymentValidation.isValid) {
    return res.status(400).json({
      success: false,
      message: `Invalid payment amount: ${paymentValidation.errors.join(', ')}`,
      suggestion: 'Please provide a valid payment amount'
    });
  }

  // Start transaction
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Update purchase payment
    const previousDue = purchase.dueAmount;
    await purchase.makePayment(paymentValidation.sanitizedAmount, req.user.id);

    // Update supplier due amount
    await purchase.supplier.makePayment(paymentValidation.sanitizedAmount, req.user.id);

    // Add payment note
    const paymentNote = `Payment: ${CurrencyService.formatBDT(paymentValidation.sanitizedAmount)} (${paymentMethod})`;
    const descNote = description ? ` - ${description}` : '';
    
    purchase.notes = (purchase.notes ? purchase.notes + '\n' : '') + 
      `${DateService.format(new Date(), 'short')}: ${paymentNote}${descNote}`;
    await purchase.save({ session });

    await session.commitTransaction();

    res.status(200).json({
      success: true,
      message: 'Payment recorded successfully',
      data: {
        purchaseId: purchase.purchaseId,
        paymentAmount: CurrencyService.formatBDT(paymentValidation.sanitizedAmount),
        paymentMethod,
        previousDue: CurrencyService.formatBDT(previousDue),
        newDue: purchase.formattedDueAmount,
        purchaseSummary: purchase.purchaseSummary
      }
    });

  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
});

// @desc    Get purchase statistics
// @route   GET /api/purchases/stats
// @access  Private (All authenticated users)
export const getPurchaseStats = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;
  
  const stats = await Purchase.getPurchaseStats(startDate, endDate);

  // Format the statistics
  const formattedStats = {
    overview: {
      ...stats.overview,
      formattedTotalAmount: CurrencyService.formatBDT(stats.overview.totalAmount),
      formattedTotalPaid: CurrencyService.formatBDT(stats.overview.totalPaid),
      formattedTotalDue: CurrencyService.formatBDT(stats.overview.totalDue),
      formattedAverageAmount: CurrencyService.formatBDT(stats.overview.averagePurchaseAmount)
    },
    topSuppliers: stats.topSuppliers.map(supplier => ({
      ...supplier,
      formattedTotalAmount: CurrencyService.formatBDT(supplier.totalAmount),
      formattedTotalDue: CurrencyService.formatBDT(supplier.totalDue)
    }))
  };

  res.status(200).json({
    success: true,
    data: formattedStats
  });
});

// @desc    Get supplier purchase history
// @route   GET /api/purchases/supplier/:supplierId
// @access  Private (All authenticated users)
export const getSupplierPurchases = asyncHandler(async (req, res) => {
  const { supplierId } = req.params;
  const { limit = 20 } = req.query;

  // Validate supplier exists
  const supplier = await Supplier.findById(supplierId);
  if (!supplier || supplier.isDeleted) {
    return res.status(404).json({
      success: false,
      message: 'Supplier not found',
      suggestion: 'Please check the supplier ID and try again'
    });
  }

  const purchases = await Purchase.getSupplierPurchases(supplierId, parseInt(limit));

  const formattedPurchases = purchases.map(purchase => ({
    ...purchase.toObject(),
    purchaseSummary: purchase.purchaseSummary,
    formattedPurchaseDate: purchase.formattedPurchaseDate
  }));

  res.status(200).json({
    success: true,
    supplier: {
      name: supplier.name,
      supplierId: supplier.supplierId,
      totalDue: supplier.formattedTotalDue
    },
    count: purchases.length,
    data: formattedPurchases
  });
});

// @desc    Soft delete purchase
// @route   DELETE /api/purchases/:id
// @access  Private (Manager and above)
export const deletePurchase = asyncHandler(async (req, res) => {
  const purchase = await Purchase.findById(req.params.id).populate('supplier');

  if (!purchase || purchase.isDeleted) {
    return res.status(404).json({
      success: false,
      message: 'Purchase not found',
      suggestion: 'Please check the purchase ID and try again'
    });
  }

  // Check if purchase has payments
  if (purchase.paidAmount > 0) {
    return res.status(400).json({
      success: false,
      message: 'Cannot delete purchase with payments',
      suggestion: 'Please reverse payments before deleting the purchase',
      paidAmount: purchase.formattedPaidAmount
    });
  }

  const { reason } = req.body;
  
  // Start transaction
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Soft delete purchase
    await purchase.softDelete(req.user.id, reason);

    // Reverse supplier due amount
    await purchase.supplier.updateDueAmount(-purchase.totalAmount, 0);

    // Reverse stock updates for stock purchases
    if (purchase.purchaseType === 'Stock') {
      for (const item of purchase.items) {
        const product = await Product.findById(item.product).session(session);
        if (product && product.stock >= item.quantity) {
          product.stock -= item.quantity;
          product.updatedBy = req.user.id;
          await product.save({ session });
        }
      }
    }

    await session.commitTransaction();

    res.status(200).json({
      success: true,
      message: 'Purchase deleted successfully',
      data: {
        purchaseId: purchase.purchaseId,
        deletedAt: DateService.format(new Date(), 'datetime')
      }
    });

  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
});