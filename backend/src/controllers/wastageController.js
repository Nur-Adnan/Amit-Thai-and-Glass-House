/**
 * Wastage Controller
 * Handles glass cutting wastage tracking and reporting
 */

import asyncHandler from '../utils/asyncHandler.js';
import Invoice from '../models/Invoice.js';
import Product from '../models/Product.js';
import { MoneyValidator } from '../utils/validation.js';
import CurrencyService from '../services/currencyService.js';
import DateService from '../services/dateService.js';
import AuditService from '../services/auditService.js';

// @desc    Get monthly wastage report
// @route   GET /api/wastage/monthly-report
// @access  Private (All authenticated users)
export const getMonthlyWastageReport = asyncHandler(async (req, res) => {
  const {
    year = new Date().getFullYear(),
    month = new Date().getMonth() + 1,
    category,
    productId,
    includeZeroWastage = 'false'
  } = req.query;

  // Validate year and month
  const yearNum = parseInt(year);
  const monthNum = parseInt(month);

  if (yearNum < 2020 || yearNum > 2030) {
    return res.status(400).json({
      success: false,
      message: 'Invalid year',
      suggestion: 'Year must be between 2020 and 2030'
    });
  }

  if (monthNum < 1 || monthNum > 12) {
    return res.status(400).json({
      success: false,
      message: 'Invalid month',
      suggestion: 'Month must be between 1 and 12'
    });
  }

  const options = {
    category,
    productId,
    includeZeroWastage: includeZeroWastage === 'true'
  };

  const report = await Invoice.getMonthlyWastageReport(yearNum, monthNum, options);

  res.status(200).json({
    success: true,
    data: report
  });
});

// @desc    Get wastage trends
// @route   GET /api/wastage/trends
// @access  Private (All authenticated users)
export const getWastageTrends = asyncHandler(async (req, res) => {
  const {
    startDate,
    endDate,
    groupBy = 'month'
  } = req.query;

  // Default to last 6 months if no dates provided
  let start, end;
  if (startDate && endDate) {
    start = new Date(startDate);
    end = new Date(endDate);
  } else {
    end = new Date();
    start = new Date();
    start.setMonth(start.getMonth() - 6);
  }

  // Validate dates
  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return res.status(400).json({
      success: false,
      message: 'Invalid date format',
      suggestion: 'Please provide dates in YYYY-MM-DD format'
    });
  }

  if (start >= end) {
    return res.status(400).json({
      success: false,
      message: 'Start date must be before end date',
      suggestion: 'Please check your date range'
    });
  }

  const trends = await Invoice.getWastageTrends(start, end, groupBy);

  res.status(200).json({
    success: true,
    data: {
      period: {
        startDate: start,
        endDate: end,
        groupBy
      },
      trends,
      generatedAt: new Date()
    }
  });
});

// @desc    Get top wastage products
// @route   GET /api/wastage/top-products
// @access  Private (All authenticated users)
export const getTopWastageProducts = asyncHandler(async (req, res) => {
  const {
    startDate,
    endDate,
    limit = 10
  } = req.query;

  // Default to current month if no dates provided
  let start, end;
  if (startDate && endDate) {
    start = new Date(startDate);
    end = new Date(endDate);
  } else {
    const now = new Date();
    start = new Date(now.getFullYear(), now.getMonth(), 1);
    end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  }

  // Validate limit
  const limitNum = parseInt(limit);
  if (limitNum < 1 || limitNum > 50) {
    return res.status(400).json({
      success: false,
      message: 'Invalid limit',
      suggestion: 'Limit must be between 1 and 50'
    });
  }

  const topProducts = await Invoice.getTopWastageProducts(start, end, limitNum);

  res.status(200).json({
    success: true,
    data: {
      period: {
        startDate: start,
        endDate: end
      },
      topProducts,
      generatedAt: new Date()
    }
  });
});

// @desc    Update invoice item wastage
// @route   PUT /api/wastage/invoice/:invoiceId/item/:itemIndex
// @access  Private (All authenticated users)
export const updateInvoiceItemWastage = asyncHandler(async (req, res) => {
  const { invoiceId, itemIndex } = req.params;
  const {
    inputMethod,
    percentage,
    manualAmount,
    notes,
    category = 'cutting'
  } = req.body;

  // Find invoice
  const invoice = await Invoice.findById(invoiceId);
  if (!invoice || invoice.isDeleted) {
    return res.status(404).json({
      success: false,
      message: 'Invoice not found',
      suggestion: 'Please check the invoice ID'
    });
  }

  // Validate item index
  const index = parseInt(itemIndex);
  if (index < 0 || index >= invoice.items.length) {
    return res.status(400).json({
      success: false,
      message: 'Invalid item index',
      suggestion: `Item index must be between 0 and ${invoice.items.length - 1}`
    });
  }

  // Validate input method
  const validMethods = ['percentage', 'manual', 'none'];
  if (!validMethods.includes(inputMethod)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid input method',
      suggestion: `Input method must be one of: ${validMethods.join(', ')}`
    });
  }

  const item = invoice.items[index];

  // Validate wastage values based on input method
  if (inputMethod === 'percentage') {
    if (percentage === undefined || percentage < 0 || percentage > 100) {
      return res.status(400).json({
        success: false,
        message: 'Invalid percentage',
        suggestion: 'Percentage must be between 0 and 100'
      });
    }
  } else if (inputMethod === 'manual') {
    if (manualAmount === undefined || manualAmount < 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid manual amount',
        suggestion: 'Manual amount must be 0 or greater'
      });
    }
  }

  // Update wastage information
  item.wastage = {
    inputMethod,
    percentage: inputMethod === 'percentage' ? percentage : 0,
    manualAmount: inputMethod === 'manual' ? manualAmount : 0,
    calculatedAmount: 0, // Will be calculated
    totalMaterialUsed: 0, // Will be calculated
    wastageCost: 0, // Will be calculated
    notes: notes || '',
    category: category
  };

  // Recalculate totals (this will also calculate wastage)
  invoice.calculateTotals();
  invoice.updatedBy = req.user.id;
  await invoice.save();

  // Log the wastage update
  await AuditService.logAction({
    action: 'WASTAGE_UPDATED',
    entityType: 'Invoice',
    entityId: invoice._id,
    performedBy: req.user.id,
    details: {
      invoiceNo: invoice.invoiceNo,
      itemIndex: index,
      productName: item.productName,
      inputMethod,
      percentage: item.wastage.percentage,
      manualAmount: item.wastage.manualAmount,
      calculatedAmount: item.wastage.calculatedAmount,
      wastageCost: item.wastage.wastageCost,
      category
    },
    severity: 'low',
    metadata: {
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    }
  });

  res.status(200).json({
    success: true,
    message: 'Wastage updated successfully',
    data: {
      invoice: {
        invoiceNo: invoice.invoiceNo,
        item: {
          productName: item.productName,
          quantity: item.quantity,
          unit: item.unit,
          wastage: {
            ...item.wastage,
            formattedCalculatedAmount: `${item.wastage.calculatedAmount.toFixed(2)} ${item.unit}`,
            formattedWastageCost: CurrencyService.formatBDT(item.wastage.wastageCost),
            formattedTotalMaterialUsed: `${item.wastage.totalMaterialUsed.toFixed(2)} ${item.unit}`
          }
        },
        wastageInfo: invoice.wastageInfo,
        wastageBadge: invoice.wastageBadge
      }
    }
  });
});

// @desc    Get invoice wastage details
// @route   GET /api/wastage/invoice/:invoiceId
// @access  Private (All authenticated users)
export const getInvoiceWastageDetails = asyncHandler(async (req, res) => {
  const { invoiceId } = req.params;

  const invoice = await Invoice.findById(invoiceId)
    .populate('items.product', 'name category unit')
    .populate('createdBy', 'name email');

  if (!invoice || invoice.isDeleted) {
    return res.status(404).json({
      success: false,
      message: 'Invoice not found',
      suggestion: 'Please check the invoice ID'
    });
  }

  // Format items with wastage information
  const itemsWithWastage = invoice.items.map((item, index) => ({
    index,
    productName: item.productName,
    quantity: item.quantity,
    unit: item.unit,
    unitPrice: item.unitPrice,
    totalPrice: item.totalPrice,
    formattedTotalPrice: CurrencyService.formatBDT(item.totalPrice),
    wastage: item.wastage ? {
      ...item.wastage,
      formattedCalculatedAmount: `${(item.wastage.calculatedAmount || 0).toFixed(2)} ${item.unit}`,
      formattedWastageCost: CurrencyService.formatBDT(item.wastage.wastageCost || 0),
      formattedTotalMaterialUsed: `${(item.wastage.totalMaterialUsed || item.quantity).toFixed(2)} ${item.unit}`,
      wastagePercentage: item.quantity > 0 ? 
        Math.round(((item.wastage.calculatedAmount || 0) / item.quantity) * 10000) / 100 : 0
    } : {
      inputMethod: 'none',
      percentage: 0,
      manualAmount: 0,
      calculatedAmount: 0,
      totalMaterialUsed: item.quantity,
      wastageCost: 0,
      notes: '',
      category: 'cutting',
      formattedCalculatedAmount: `0.00 ${item.unit}`,
      formattedWastageCost: CurrencyService.formatBDT(0),
      formattedTotalMaterialUsed: `${item.quantity.toFixed(2)} ${item.unit}`,
      wastagePercentage: 0
    }
  }));

  res.status(200).json({
    success: true,
    data: {
      invoice: {
        invoiceNo: invoice.invoiceNo,
        invoiceType: invoice.invoiceType,
        customerName: invoice.customerName,
        createdAt: invoice.createdAt,
        formattedDate: DateService.format(invoice.createdAt, 'medium'),
        grandTotal: invoice.grandTotal,
        formattedGrandTotal: invoice.formattedGrandTotal,
        items: itemsWithWastage,
        wastageInfo: invoice.wastageInfo,
        wastageBadge: invoice.wastageBadge
      }
    }
  });
});

// @desc    Get wastage dashboard summary
// @route   GET /api/wastage/dashboard
// @access  Private (All authenticated users)
export const getWastageDashboard = asyncHandler(async (req, res) => {
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();
  
  // Get current month report
  const currentMonthReport = await Invoice.getMonthlyWastageReport(currentYear, currentMonth);
  
  // Get previous month for comparison
  const prevMonth = currentMonth === 1 ? 12 : currentMonth - 1;
  const prevYear = currentMonth === 1 ? currentYear - 1 : currentYear;
  const previousMonthReport = await Invoice.getMonthlyWastageReport(prevYear, prevMonth);
  
  // Get last 6 months trends
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  const trends = await Invoice.getWastageTrends(sixMonthsAgo, now, 'month');
  
  // Get top wastage products for current month
  const monthStart = new Date(currentYear, currentMonth - 1, 1);
  const monthEnd = new Date(currentYear, currentMonth, 0, 23, 59, 59, 999);
  const topProducts = await Invoice.getTopWastageProducts(monthStart, monthEnd, 5);
  
  // Calculate month-over-month changes
  const currentWastage = currentMonthReport.summary.totalWastageCost;
  const previousWastage = previousMonthReport.summary.totalWastageCost;
  const wastageChange = previousWastage > 0 ? 
    Math.round(((currentWastage - previousWastage) / previousWastage) * 10000) / 100 : 0;
  
  const currentPercentage = currentMonthReport.summary.overallWastagePercentage;
  const previousPercentage = previousMonthReport.summary.overallWastagePercentage;
  const percentageChange = previousPercentage > 0 ? 
    Math.round(((currentPercentage - previousPercentage) / previousPercentage) * 10000) / 100 : 0;

  res.status(200).json({
    success: true,
    data: {
      currentMonth: {
        ...currentMonthReport.summary,
        monthName: currentMonthReport.period.monthName,
        year: currentYear
      },
      previousMonth: {
        ...previousMonthReport.summary,
        monthName: previousMonthReport.period.monthName,
        year: prevYear
      },
      changes: {
        wastageChange: wastageChange,
        percentageChange: percentageChange,
        formattedWastageChange: `${wastageChange >= 0 ? '+' : ''}${wastageChange}%`,
        formattedPercentageChange: `${percentageChange >= 0 ? '+' : ''}${percentageChange}%`
      },
      trends: trends.slice(-6), // Last 6 months
      topProducts,
      generatedAt: new Date()
    }
  });
});