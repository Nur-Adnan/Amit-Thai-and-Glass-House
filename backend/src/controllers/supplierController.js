/**
 * Supplier Controller
 * Handles supplier management operations including due tracking and purchase history
 */

import asyncHandler from '../utils/asyncHandler.js';
import Supplier from '../models/Supplier.js';
import { MoneyValidator, GeneralValidator } from '../utils/validation.js';
import CurrencyService from '../services/currencyService.js';
import DateService from '../services/dateService.js';

// @desc    Get all suppliers with filtering and pagination
// @route   GET /api/suppliers
// @access  Private (All authenticated users)
export const getSuppliers = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 20,
    search,
    supplierType,
    paymentStatus,
    isActive = 'true',
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = req.query;

  // Build query
  const query = { isDeleted: { $ne: true } };

  // Filter by active status
  if (isActive !== 'all') {
    query.isActive = isActive === 'true';
  }

  // Filter by supplier type
  if (supplierType && supplierType !== 'all') {
    query.supplierType = supplierType;
  }

  // Filter by payment status
  if (paymentStatus) {
    switch (paymentStatus) {
      case 'due':
        query.totalDue = { $gt: 0 };
        break;
      case 'clear':
        query.totalDue = 0;
        break;
      case 'overlimit':
        query.$expr = { 
          $and: [
            { $gt: ['$creditLimit', 0] },
            { $gt: ['$totalDue', '$creditLimit'] }
          ]
        };
        break;
    }
  }

  // Search functionality
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { supplierId: { $regex: search, $options: 'i' } },
      { phone: { $regex: search, $options: 'i' } },
      { 'address.area': { $regex: search, $options: 'i' } },
      { 'address.city': { $regex: search, $options: 'i' } }
    ];
  }

  // Sort options
  const sortOptions = {};
  sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

  // Execute query with pagination
  const suppliers = await Supplier.find(query)
    .populate('createdBy', 'name email')
    .populate('updatedBy', 'name email')
    .sort(sortOptions)
    .limit(parseInt(limit))
    .skip((parseInt(page) - 1) * parseInt(limit));

  // Get total count for pagination
  const totalSuppliers = await Supplier.countDocuments(query);
  const totalPages = Math.ceil(totalSuppliers / parseInt(limit));

  // Format suppliers with additional info
  const formattedSuppliers = suppliers.map(supplier => ({
    ...supplier.toObject(),
    supplierSummary: supplier.supplierSummary,
    formattedCreatedAt: supplier.formattedCreatedAt,
    formattedUpdatedAt: supplier.formattedUpdatedAt
  }));

  res.status(200).json({
    success: true,
    count: suppliers.length,
    totalSuppliers,
    totalPages,
    currentPage: parseInt(page),
    data: formattedSuppliers
  });
});

// @desc    Get single supplier by ID
// @route   GET /api/suppliers/:id
// @access  Private (All authenticated users)
export const getSupplier = asyncHandler(async (req, res) => {
  const supplier = await Supplier.findById(req.params.id)
    .populate('createdBy', 'name email')
    .populate('updatedBy', 'name email');

  if (!supplier || supplier.isDeleted) {
    return res.status(404).json({
      success: false,
      message: 'Supplier not found',
      suggestion: 'Please check the supplier ID and try again'
    });
  }

  res.status(200).json({
    success: true,
    data: {
      ...supplier.toObject(),
      supplierSummary: supplier.supplierSummary,
      formattedCreatedAt: supplier.formattedCreatedAt,
      formattedUpdatedAt: supplier.formattedUpdatedAt
    }
  });
});

// @desc    Get supplier by supplier ID
// @route   GET /api/suppliers/by-supplier-id/:supplierId
// @access  Private (All authenticated users)
export const getSupplierBySupplierId = asyncHandler(async (req, res) => {
  const supplier = await Supplier.findOne({ 
    supplierId: req.params.supplierId,
    isDeleted: { $ne: true }
  })
    .populate('createdBy', 'name email')
    .populate('updatedBy', 'name email');

  if (!supplier) {
    return res.status(404).json({
      success: false,
      message: 'Supplier not found',
      suggestion: 'Please check the supplier ID and try again'
    });
  }

  res.status(200).json({
    success: true,
    data: {
      ...supplier.toObject(),
      supplierSummary: supplier.supplierSummary,
      formattedCreatedAt: supplier.formattedCreatedAt,
      formattedUpdatedAt: supplier.formattedUpdatedAt
    }
  });
});

// @desc    Create new supplier
// @route   POST /api/suppliers
// @access  Private (Manager and above)
export const createSupplier = asyncHandler(async (req, res) => {
  const {
    name,
    phone,
    email,
    address,
    supplierType,
    creditLimit,
    paymentTerms,
    customPaymentTerms,
    notes
  } = req.body;

  // Validate required fields
  if (!name || !phone) {
    return res.status(400).json({
      success: false,
      message: 'Please provide supplier name and phone number',
      suggestion: 'Name and phone are required fields'
    });
  }

  // Validate name
  const nameValidation = GeneralValidator.validateName(name, 'Supplier name');
  if (!nameValidation.isValid) {
    return res.status(400).json({
      success: false,
      message: `Invalid supplier name: ${nameValidation.errors.join(', ')}`,
      suggestion: 'Please provide a valid supplier name (2-100 characters)'
    });
  }

  // Check for duplicate phone number
  const existingSupplier = await Supplier.findOne({ 
    phone: phone.replace(/[\s-]/g, ''),
    isDeleted: { $ne: true }
  });

  if (existingSupplier) {
    return res.status(400).json({
      success: false,
      message: 'Supplier with this phone number already exists',
      suggestion: 'Please use a different phone number or update the existing supplier',
      existingSupplier: existingSupplier.supplierSummary
    });
  }

  // Validate credit limit if provided
  if (creditLimit !== undefined) {
    const creditValidation = MoneyValidator.validateAmount(creditLimit, 'Credit limit', {
      allowZero: true,
      maxAmount: 10000000,
      maxDecimals: 2
    });

    if (!creditValidation.isValid) {
      return res.status(400).json({
        success: false,
        message: `Invalid credit limit: ${creditValidation.errors.join(', ')}`,
        suggestion: 'Please provide a valid credit limit amount'
      });
    }
  }

  // Create supplier data
  const supplierData = {
    name: nameValidation.sanitizedName,
    phone: phone.replace(/[\s-]/g, ''),
    email: email?.toLowerCase().trim(),
    address: address || {},
    supplierType: supplierType || 'Other',
    creditLimit: creditLimit || 0,
    paymentTerms: paymentTerms || 'Cash',
    customPaymentTerms,
    notes,
    createdBy: req.user.id
  };

  const supplier = await Supplier.create(supplierData);
  await supplier.populate('createdBy', 'name email');

  res.status(201).json({
    success: true,
    message: 'Supplier created successfully',
    data: {
      ...supplier.toObject(),
      supplierSummary: supplier.supplierSummary,
      formattedCreatedAt: supplier.formattedCreatedAt
    }
  });
});

// @desc    Update supplier
// @route   PUT /api/suppliers/:id
// @access  Private (Manager and above)
export const updateSupplier = asyncHandler(async (req, res) => {
  const supplier = await Supplier.findById(req.params.id);

  if (!supplier || supplier.isDeleted) {
    return res.status(404).json({
      success: false,
      message: 'Supplier not found',
      suggestion: 'Please check the supplier ID and try again'
    });
  }

  const {
    name,
    phone,
    email,
    address,
    supplierType,
    creditLimit,
    paymentTerms,
    customPaymentTerms,
    notes,
    isActive
  } = req.body;

  // Validate name if provided
  if (name) {
    const nameValidation = GeneralValidator.validateName(name, 'Supplier name');
    if (!nameValidation.isValid) {
      return res.status(400).json({
        success: false,
        message: `Invalid supplier name: ${nameValidation.errors.join(', ')}`,
        suggestion: 'Please provide a valid supplier name (2-100 characters)'
      });
    }
    supplier.name = nameValidation.sanitizedName;
  }

  // Validate phone if provided
  if (phone && phone !== supplier.phone) {
    const cleanPhone = phone.replace(/[\s-]/g, '');
    
    // Check for duplicate phone number
    const existingSupplier = await Supplier.findOne({ 
      phone: cleanPhone,
      _id: { $ne: supplier._id },
      isDeleted: { $ne: true }
    });

    if (existingSupplier) {
      return res.status(400).json({
        success: false,
        message: 'Supplier with this phone number already exists',
        suggestion: 'Please use a different phone number',
        existingSupplier: existingSupplier.supplierSummary
      });
    }

    supplier.phone = cleanPhone;
  }

  // Validate credit limit if provided
  if (creditLimit !== undefined) {
    const creditValidation = MoneyValidator.validateAmount(creditLimit, 'Credit limit', {
      allowZero: true,
      maxAmount: 10000000,
      maxDecimals: 2
    });

    if (!creditValidation.isValid) {
      return res.status(400).json({
        success: false,
        message: `Invalid credit limit: ${creditValidation.errors.join(', ')}`,
        suggestion: 'Please provide a valid credit limit amount'
      });
    }

    supplier.creditLimit = creditValidation.sanitizedAmount;
  }

  // Update other fields
  if (email !== undefined) supplier.email = email?.toLowerCase().trim();
  if (address) supplier.address = { ...supplier.address, ...address };
  if (supplierType) supplier.supplierType = supplierType;
  if (paymentTerms) supplier.paymentTerms = paymentTerms;
  if (customPaymentTerms !== undefined) supplier.customPaymentTerms = customPaymentTerms;
  if (notes !== undefined) supplier.notes = notes;
  if (isActive !== undefined) supplier.isActive = isActive;

  supplier.updatedBy = req.user.id;
  await supplier.save();

  await supplier.populate('createdBy', 'name email');
  await supplier.populate('updatedBy', 'name email');

  res.status(200).json({
    success: true,
    message: 'Supplier updated successfully',
    data: {
      ...supplier.toObject(),
      supplierSummary: supplier.supplierSummary,
      formattedUpdatedAt: supplier.formattedUpdatedAt
    }
  });
});

// @desc    Update supplier due amount
// @route   PUT /api/suppliers/:id/due
// @access  Private (Manager and above)
export const updateSupplierDue = asyncHandler(async (req, res) => {
  const supplier = await Supplier.findById(req.params.id);

  if (!supplier || supplier.isDeleted) {
    return res.status(404).json({
      success: false,
      message: 'Supplier not found',
      suggestion: 'Please check the supplier ID and try again'
    });
  }

  const { purchaseAmount, paidAmount = 0, description } = req.body;

  // Validate purchase amount
  if (!purchaseAmount || purchaseAmount <= 0) {
    return res.status(400).json({
      success: false,
      message: 'Please provide a valid purchase amount',
      suggestion: 'Purchase amount must be greater than 0'
    });
  }

  const purchaseValidation = MoneyValidator.validateAmount(purchaseAmount, 'Purchase amount', {
    allowZero: false,
    maxAmount: 10000000,
    maxDecimals: 2
  });

  if (!purchaseValidation.isValid) {
    return res.status(400).json({
      success: false,
      message: `Invalid purchase amount: ${purchaseValidation.errors.join(', ')}`,
      suggestion: 'Please provide a valid purchase amount'
    });
  }

  // Validate paid amount if provided
  let validatedPaidAmount = 0;
  if (paidAmount > 0) {
    const paidValidation = MoneyValidator.validateAmount(paidAmount, 'Paid amount', {
      allowZero: true,
      maxAmount: purchaseValidation.sanitizedAmount,
      maxDecimals: 2
    });

    if (!paidValidation.isValid) {
      return res.status(400).json({
        success: false,
        message: `Invalid paid amount: ${paidValidation.errors.join(', ')}`,
        suggestion: 'Paid amount cannot exceed purchase amount'
      });
    }

    validatedPaidAmount = paidValidation.sanitizedAmount;
  }

  // Update supplier due amount
  const previousDue = supplier.totalDue;
  await supplier.updateDueAmount(purchaseValidation.sanitizedAmount, validatedPaidAmount);

  // Add note about the update
  const updateNote = `Purchase: ${CurrencyService.formatBDT(purchaseValidation.sanitizedAmount)}`;
  const paidNote = validatedPaidAmount > 0 ? `, Paid: ${CurrencyService.formatBDT(validatedPaidAmount)}` : '';
  const descNote = description ? ` - ${description}` : '';
  
  supplier.notes = (supplier.notes ? supplier.notes + '\n' : '') + 
    `${DateService.format(new Date(), 'short')}: ${updateNote}${paidNote}${descNote}`;
  supplier.updatedBy = req.user.id;
  await supplier.save();

  res.status(200).json({
    success: true,
    message: 'Supplier due amount updated successfully',
    data: {
      supplierId: supplier.supplierId,
      name: supplier.name,
      previousDue: CurrencyService.formatBDT(previousDue),
      newDue: supplier.formattedTotalDue,
      purchaseAmount: CurrencyService.formatBDT(purchaseValidation.sanitizedAmount),
      paidAmount: CurrencyService.formatBDT(validatedPaidAmount),
      supplierSummary: supplier.supplierSummary
    }
  });
});

// @desc    Make payment to supplier
// @route   POST /api/suppliers/:id/payment
// @access  Private (Manager and above)
export const makeSupplierPayment = asyncHandler(async (req, res) => {
  const supplier = await Supplier.findById(req.params.id);

  if (!supplier || supplier.isDeleted) {
    return res.status(404).json({
      success: false,
      message: 'Supplier not found',
      suggestion: 'Please check the supplier ID and try again'
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

  if (paymentAmount > supplier.totalDue) {
    return res.status(400).json({
      success: false,
      message: 'Payment amount cannot exceed total due',
      suggestion: `Maximum payment amount is ${supplier.formattedTotalDue}`,
      currentDue: supplier.formattedTotalDue
    });
  }

  const paymentValidation = MoneyValidator.validateAmount(paymentAmount, 'Payment amount', {
    allowZero: false,
    maxAmount: supplier.totalDue,
    maxDecimals: 2
  });

  if (!paymentValidation.isValid) {
    return res.status(400).json({
      success: false,
      message: `Invalid payment amount: ${paymentValidation.errors.join(', ')}`,
      suggestion: 'Please provide a valid payment amount'
    });
  }

  // Make payment
  const previousDue = supplier.totalDue;
  await supplier.makePayment(paymentValidation.sanitizedAmount, req.user.id);

  // Add payment note
  const paymentNote = `Payment: ${CurrencyService.formatBDT(paymentValidation.sanitizedAmount)} (${paymentMethod})`;
  const descNote = description ? ` - ${description}` : '';
  
  supplier.notes = (supplier.notes ? supplier.notes + '\n' : '') + 
    `${DateService.format(new Date(), 'short')}: ${paymentNote}${descNote}`;
  await supplier.save();

  res.status(200).json({
    success: true,
    message: 'Payment recorded successfully',
    data: {
      supplierId: supplier.supplierId,
      name: supplier.name,
      paymentAmount: CurrencyService.formatBDT(paymentValidation.sanitizedAmount),
      paymentMethod,
      previousDue: CurrencyService.formatBDT(previousDue),
      newDue: supplier.formattedTotalDue,
      supplierSummary: supplier.supplierSummary
    }
  });
});

// @desc    Get supplier statistics
// @route   GET /api/suppliers/stats
// @access  Private (All authenticated users)
export const getSupplierStats = asyncHandler(async (req, res) => {
  const stats = await Supplier.getSupplierStats();
  const highDueSuppliers = await Supplier.getHighDueSuppliers(5);
  const overLimitSuppliers = await Supplier.getOverLimitSuppliers();

  // Format the statistics
  const formattedStats = {
    overview: {
      ...stats.overview,
      formattedTotalDue: CurrencyService.formatBDT(stats.overview.totalDueAmount),
      formattedTotalPurchases: CurrencyService.formatBDT(stats.overview.totalPurchaseAmount),
      formattedTotalPaid: CurrencyService.formatBDT(stats.overview.totalPaidAmount),
      formattedAverageDue: CurrencyService.formatBDT(stats.overview.averageDueAmount)
    },
    byType: stats.byType.map(type => ({
      ...type,
      formattedTotalDue: CurrencyService.formatBDT(type.totalDue)
    })),
    highDueSuppliers: highDueSuppliers.map(supplier => supplier.supplierSummary),
    overLimitSuppliers: overLimitSuppliers.map(supplier => ({
      ...supplier.supplierSummary,
      creditLimit: supplier.formattedCreditLimit,
      overAmount: CurrencyService.formatBDT(supplier.totalDue - supplier.creditLimit)
    }))
  };

  res.status(200).json({
    success: true,
    data: formattedStats
  });
});

// @desc    Search suppliers
// @route   GET /api/suppliers/search
// @access  Private (All authenticated users)
export const searchSuppliers = asyncHandler(async (req, res) => {
  const { q, limit = 10 } = req.query;

  if (!q || q.trim().length < 2) {
    return res.status(400).json({
      success: false,
      message: 'Please provide a search query with at least 2 characters',
      suggestion: 'Search by supplier name, ID, phone, or address'
    });
  }

  const searchQuery = {
    isDeleted: { $ne: true },
    isActive: true,
    $or: [
      { name: { $regex: q.trim(), $options: 'i' } },
      { supplierId: { $regex: q.trim(), $options: 'i' } },
      { phone: { $regex: q.trim().replace(/[\s-]/g, ''), $options: 'i' } },
      { 'address.area': { $regex: q.trim(), $options: 'i' } },
      { 'address.city': { $regex: q.trim(), $options: 'i' } }
    ]
  };

  const suppliers = await Supplier.find(searchQuery)
    .limit(parseInt(limit))
    .sort({ name: 1 });

  const results = suppliers.map(supplier => supplier.supplierSummary);

  res.status(200).json({
    success: true,
    count: results.length,
    data: results
  });
});

// @desc    Soft delete supplier
// @route   DELETE /api/suppliers/:id
// @access  Private (Manager and above)
export const deleteSupplier = asyncHandler(async (req, res) => {
  const supplier = await Supplier.findById(req.params.id);

  if (!supplier || supplier.isDeleted) {
    return res.status(404).json({
      success: false,
      message: 'Supplier not found',
      suggestion: 'Please check the supplier ID and try again'
    });
  }

  // Check if supplier has outstanding dues
  if (supplier.totalDue > 0) {
    return res.status(400).json({
      success: false,
      message: 'Cannot delete supplier with outstanding dues',
      suggestion: 'Please clear all dues before deleting the supplier',
      currentDue: supplier.formattedTotalDue
    });
  }

  const { reason } = req.body;
  await supplier.softDelete(req.user.id, reason);

  res.status(200).json({
    success: true,
    message: 'Supplier deleted successfully',
    data: {
      supplierId: supplier.supplierId,
      name: supplier.name,
      deletedAt: DateService.format(new Date(), 'datetime')
    }
  });
});

// @desc    Restore deleted supplier
// @route   PUT /api/suppliers/:id/restore
// @access  Private (Manager and above)
export const restoreSupplier = asyncHandler(async (req, res) => {
  const supplier = await Supplier.findById(req.params.id);

  if (!supplier) {
    return res.status(404).json({
      success: false,
      message: 'Supplier not found',
      suggestion: 'Please check the supplier ID and try again'
    });
  }

  if (!supplier.isDeleted) {
    return res.status(400).json({
      success: false,
      message: 'Supplier is not deleted',
      suggestion: 'Only deleted suppliers can be restored'
    });
  }

  await supplier.restore();
  supplier.updatedBy = req.user.id;
  await supplier.save();

  res.status(200).json({
    success: true,
    message: 'Supplier restored successfully',
    data: supplier.supplierSummary
  });
});