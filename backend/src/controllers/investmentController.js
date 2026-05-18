import asyncHandler from '../utils/asyncHandler.js';
import Investment from '../models/Investment.js';
import mongoose from 'mongoose';
import { MoneyValidator, GeneralValidator, DateValidator } from '../utils/validation.js';
import AuditService from '../services/auditService.js';
import CurrencyService from '../services/currencyService.js';
import DateService from '../services/dateService.js';

// @desc    Get all investments
// @route   GET /api/investments
// @access  Private (Manager and above)
export const getInvestments = asyncHandler(async (req, res) => {
  const {
    type,
    category,
    approvalStatus,
    startDate,
    endDate,
    sortBy = 'investmentDate',
    sortOrder = 'desc',
    page = 1,
    limit = 10
  } = req.query;

  // Build query - exclude soft deleted items by default
  const query = { isActive: true, isDeleted: { $ne: true } };

  if (type) {
    query.type = type;
  }

  if (category) {
    query.category = category;
  }

  if (approvalStatus) {
    query.approvalStatus = approvalStatus;
  }

  if (startDate || endDate) {
    query.investmentDate = {};
    if (startDate) {
      query.investmentDate.$gte = new Date(startDate);
    }
    if (endDate) {
      query.investmentDate.$lte = new Date(endDate);
    }
  }

  // Calculate pagination
  const skip = (page - 1) * limit;

  // Build sort object
  const sort = {};
  sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

  const investments = await Investment.find(query)
    .populate('supplier', 'name phone')
    .populate('createdBy', 'name email')
    .populate('updatedBy', 'name email')
    .populate('approvedBy', 'name email')
    .sort(sort)
    .skip(skip)
    .limit(parseInt(limit));

  const total = await Investment.countDocuments(query);

  res.status(200).json({
    success: true,
    count: investments.length,
    total,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(total / limit)
    },
    data: investments
  });
});

// @desc    Get single investment
// @route   GET /api/investments/:id
// @access  Private (Manager and above)
export const getInvestment = asyncHandler(async (req, res) => {
  const investment = await Investment.findById(req.params.id)
    .populate('supplier', 'name phone address email')
    .populate('createdBy', 'name email')
    .populate('updatedBy', 'name email')
    .populate('approvedBy', 'name email');

  if (!investment) {
    return res.status(404).json({
      success: false,
      message: 'Investment not found',
      suggestion: 'Please check the investment ID and try again.'
    });
  }

  res.status(200).json({
    success: true,
    data: investment
  });
});

// @desc    Create new investment
// @route   POST /api/investments
// @access  Private (Manager and above)
export const createInvestment = asyncHandler(async (req, res) => {
  const {
    type,
    category,
    description,
    amount,
    investmentDate,
    paymentMethod,
    paymentReference,
    expectedROI,
    depreciation,
    tags,
    notes
  } = req.body;

  // Validate investment data
  const amountValidation = MoneyValidator.validateAmount(amount, 'Investment amount', {
    allowZero: false,
    maxAmount: 10000000
  });

  if (!amountValidation.isValid) {
    return res.status(400).json({
      success: false,
      message: `Invalid investment amount: ${amountValidation.errors.join(', ')}`
    });
  }

  // Validate investment date
  if (investmentDate) {
    const dateValidation = DateValidator.validateDate(investmentDate, 'Investment date');
    if (!dateValidation.isValid) {
      return res.status(400).json({
        success: false,
        message: `Invalid investment date: ${dateValidation.errors.join(', ')}`
      });
    }
  }

  // Validate description
  const descriptionValidation = GeneralValidator.validateString(description, 'Description', {
    minLength: 5,
    maxLength: 200
  });

  if (!descriptionValidation.isValid) {
    return res.status(400).json({
      success: false,
      message: `Invalid description: ${descriptionValidation.errors.join(', ')}`
    });
  }

  try {
    const investment = new Investment({
      type,
      category,
      description: descriptionValidation.sanitizedString,
      amount: amountValidation.sanitizedAmount,
      investmentDate: investmentDate ? new Date(investmentDate) : new Date(),
      paymentMethod: paymentMethod || 'cash',
      paymentReference,
      expectedROI,
      depreciation,
      tags: tags || [],
      notes,
      createdBy: req.user.id
    });

    await investment.save();

    // Populate the created investment
    await investment.populate('createdBy', 'name email');

    // Log audit trail
    await AuditService.logAction({
      action: 'INVESTMENT_CREATE',
      entityType: 'Investment',
      entityId: investment._id,
      performedBy: req.user.id,
      details: {
        investmentNo: investment.investmentNo,
        type: investment.type,
        category: investment.category,
        amount: investment.amount,
        description: investment.description
      },
      metadata: {
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      }
    });

    res.status(201).json({
      success: true,
      message: 'Investment created successfully',
      data: investment
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
      suggestion: 'Please check your input data and ensure all required fields are properly filled.'
    });
  }
});

// @desc    Update investment
// @route   PUT /api/investments/:id
// @access  Private (Manager and above)
export const updateInvestment = asyncHandler(async (req, res) => {
  const investment = await Investment.findById(req.params.id);

  if (!investment) {
    return res.status(404).json({
      success: false,
      message: 'Investment not found'
    });
  }

  if (investment.isDeleted) {
    return res.status(400).json({
      success: false,
      message: 'Cannot update deleted investment'
    });
  }

  // Only allow updates to certain fields
  const allowedUpdates = [
    'description', 'expectedROI', 'depreciation', 'tags', 'notes'
  ];

  const updates = {};
  Object.keys(req.body).forEach(key => {
    if (allowedUpdates.includes(key)) {
      updates[key] = req.body[key];
    }
  });

  // Validate description if provided
  if (updates.description) {
    const descriptionValidation = GeneralValidator.validateString(updates.description, 'Description', {
      minLength: 5,
      maxLength: 200
    });

    if (!descriptionValidation.isValid) {
      return res.status(400).json({
        success: false,
        message: `Invalid description: ${descriptionValidation.errors.join(', ')}`
      });
    }
    updates.description = descriptionValidation.sanitizedString;
  }

  updates.updatedBy = req.user.id;

  try {
    const updatedInvestment = await Investment.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    ).populate('createdBy updatedBy', 'name email');

    // Log audit trail
    await AuditService.logAction({
      action: 'INVESTMENT_UPDATE',
      entityType: 'Investment',
      entityId: investment._id,
      performedBy: req.user.id,
      details: {
        investmentNo: investment.investmentNo,
        updatedFields: Object.keys(updates),
        changes: updates
      },
      metadata: {
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      }
    });

    res.status(200).json({
      success: true,
      message: 'Investment updated successfully',
      data: updatedInvestment
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// @desc    Get investment summary
// @route   GET /api/investments/summary
// @access  Private (Manager and above)
export const getInvestmentSummary = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;

  let start, end;
  if (startDate) start = new Date(startDate);
  if (endDate) end = new Date(endDate);

  const summary = await Investment.getInvestmentSummary(start, end);

  // Get monthly trends for the last 12 months
  const twelveMonthsAgo = new Date();
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

  const monthlyTrends = await Investment.aggregate([
    {
      $match: {
        isDeleted: { $ne: true },
        approvalStatus: 'approved',
        investmentDate: { $gte: twelveMonthsAgo }
      }
    },
    {
      $group: {
        _id: {
          year: { $year: '$investmentDate' },
          month: { $month: '$investmentDate' }
        },
        totalAmount: { $sum: '$amount' },
        count: { $sum: 1 }
      }
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } }
  ]);

  res.status(200).json({
    success: true,
    data: {
      summary,
      monthlyTrends: monthlyTrends.map(trend => ({
        period: `${trend._id.year}-${String(trend._id.month).padStart(2, '0')}`,
        amount: trend.totalAmount,
        count: trend.count,
        formattedAmount: CurrencyService.formatBDT(trend.totalAmount)
      }))
    }
  });
});

// @desc    Get investment statistics
// @route   GET /api/investments/stats
// @access  Private (Manager and above)
export const getInvestmentStats = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;

  // Build date filter
  const dateFilter = { 
    isActive: true, 
    isDeleted: { $ne: true },
    approvalStatus: 'approved'
  };
  
  if (startDate || endDate) {
    dateFilter.investmentDate = {};
    if (startDate) {
      dateFilter.investmentDate.$gte = new Date(startDate);
    }
    if (endDate) {
      dateFilter.investmentDate.$lte = new Date(endDate);
    }
  }

  // Stats by type
  const statsByType = await Investment.aggregate([
    { $match: dateFilter },
    {
      $group: {
        _id: '$type',
        count: { $sum: 1 },
        totalAmount: { $sum: '$amount' },
        avgAmount: { $avg: '$amount' }
      }
    },
    { $sort: { totalAmount: -1 } }
  ]);

  // Stats by category
  const statsByCategory = await Investment.aggregate([
    { $match: dateFilter },
    {
      $group: {
        _id: '$category',
        count: { $sum: 1 },
        totalAmount: { $sum: '$amount' },
        avgAmount: { $avg: '$amount' }
      }
    },
    { $sort: { totalAmount: -1 } }
  ]);

  // Overall stats
  const overallStats = await Investment.aggregate([
    { $match: dateFilter },
    {
      $group: {
        _id: null,
        totalInvestments: { $sum: 1 },
        totalAmount: { $sum: '$amount' },
        avgInvestment: { $avg: '$amount' },
        minInvestment: { $min: '$amount' },
        maxInvestment: { $max: '$amount' }
      }
    }
  ]);

  res.status(200).json({
    success: true,
    data: {
      overall: overallStats[0] || {
        totalInvestments: 0,
        totalAmount: 0,
        avgInvestment: 0,
        minInvestment: 0,
        maxInvestment: 0
      },
      byType: statsByType,
      byCategory: statsByCategory
    }
  });
});

// @desc    Search investments
// @route   GET /api/investments/search
// @access  Private (Manager and above)
export const searchInvestments = asyncHandler(async (req, res) => {
  const { q } = req.query;

  if (!q) {
    return res.status(400).json({
      success: false,
      message: 'Please provide a search query'
    });
  }

  const investments = await Investment.find({
    isActive: true,
    isDeleted: { $ne: true },
    $or: [
      { investmentNo: { $regex: q, $options: 'i' } },
      { description: { $regex: q, $options: 'i' } },
      { supplierName: { $regex: q, $options: 'i' } },
      { 'relatedDocument.documentNo': { $regex: q, $options: 'i' } }
    ]
  })
    .populate('createdBy', 'name email')
    .sort({ investmentDate: -1 })
    .limit(20)
    .select('investmentNo type category description amount investmentDate approvalStatus');

  res.status(200).json({
    success: true,
    count: investments.length,
    data: investments
  });
});

// @desc    Approve investment
// @route   PUT /api/investments/:id/approve
// @access  Private (Owner only)
export const approveInvestment = asyncHandler(async (req, res) => {
  const investment = await Investment.findById(req.params.id);

  if (!investment) {
    return res.status(404).json({
      success: false,
      message: 'Investment not found'
    });
  }

  if (investment.approvalStatus === 'approved') {
    return res.status(400).json({
      success: false,
      message: 'Investment is already approved'
    });
  }

  investment.approvalStatus = 'approved';
  investment.approvedBy = req.user.id;
  investment.approvedAt = new Date();
  investment.updatedBy = req.user.id;

  await investment.save();

  // Log audit trail
  await AuditService.logAction({
    action: 'INVESTMENT_APPROVE',
    entityType: 'Investment',
    entityId: investment._id,
    performedBy: req.user.id,
    details: {
      investmentNo: investment.investmentNo,
      amount: investment.amount,
      previousStatus: 'pending'
    },
    metadata: {
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    }
  });

  res.status(200).json({
    success: true,
    message: 'Investment approved successfully',
    data: investment
  });
});

// @desc    Reject investment
// @route   PUT /api/investments/:id/reject
// @access  Private (Owner only)
export const rejectInvestment = asyncHandler(async (req, res) => {
  const { reason } = req.body;

  const investment = await Investment.findById(req.params.id);

  if (!investment) {
    return res.status(404).json({
      success: false,
      message: 'Investment not found'
    });
  }

  if (investment.approvalStatus === 'rejected') {
    return res.status(400).json({
      success: false,
      message: 'Investment is already rejected'
    });
  }

  investment.approvalStatus = 'rejected';
  investment.updatedBy = req.user.id;
  
  if (reason) {
    investment.notes = investment.notes ? 
      `${investment.notes}\n\nRejection Reason: ${reason}` : 
      `Rejection Reason: ${reason}`;
  }

  await investment.save();

  // Log audit trail
  await AuditService.logAction({
    action: 'INVESTMENT_REJECT',
    entityType: 'Investment',
    entityId: investment._id,
    performedBy: req.user.id,
    details: {
      investmentNo: investment.investmentNo,
      amount: investment.amount,
      previousStatus: investment.approvalStatus,
      rejectionReason: reason
    },
    metadata: {
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    }
  });

  res.status(200).json({
    success: true,
    message: 'Investment rejected successfully',
    data: investment
  });
});