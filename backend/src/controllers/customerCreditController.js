/**
 * Customer Credit Controller
 * Handles customer credit management, due aging, and credit control
 */

import asyncHandler from '../utils/asyncHandler.js';
import Customer from '../models/Customer.js';
import Invoice from '../models/Invoice.js';
import { MoneyValidator } from '../utils/validation.js';
import CurrencyService from '../services/currencyService.js';
import DateService from '../services/dateService.js';
import AuditService from '../services/auditService.js';

// @desc    Get due aging report
// @route   GET /api/customer-credit/due-aging
// @access  Private (All authenticated users)
export const getDueAgingReport = asyncHandler(async (req, res) => {
  const {
    includeZeroDue = false,
    sortBy = 'totalDue',
    sortOrder = 'desc',
    limit = 100,
    customerType,
    creditStatus,
    riskLevel
  } = req.query;

  // Build options for the report
  const options = {
    includeZeroDue: includeZeroDue === 'true',
    sortBy,
    sortOrder,
    limit: parseInt(limit)
  };

  // Get the due aging report
  const report = await Customer.getDueAgingReport(options);

  // Apply additional filters
  let filteredCustomers = report.customers;

  if (customerType && customerType !== 'all') {
    filteredCustomers = filteredCustomers.filter(c => c.customerType === customerType);
  }

  if (creditStatus && creditStatus !== 'all') {
    filteredCustomers = filteredCustomers.filter(c => c.creditStatus === creditStatus);
  }

  if (riskLevel && riskLevel !== 'all') {
    filteredCustomers = filteredCustomers.filter(c => c.creditRisk === riskLevel);
  }

  // Recalculate summary for filtered results
  const filteredSummary = {
    totalCustomers: filteredCustomers.length,
    totalDueAmount: filteredCustomers.reduce((sum, c) => sum + c.totalDue, 0),
    currentDue: filteredCustomers.reduce((sum, c) => sum + c.dueAging.current, 0),
    days0to30: filteredCustomers.reduce((sum, c) => sum + c.dueAging.days0to30, 0),
    days31to60: filteredCustomers.reduce((sum, c) => sum + c.dueAging.days31to60, 0),
    days60plus: filteredCustomers.reduce((sum, c) => sum + c.dueAging.days60plus, 0),
    overLimitCustomers: filteredCustomers.filter(c => c.totalDue > c.creditLimit && c.creditLimit > 0).length,
    blockedCustomers: filteredCustomers.filter(c => c.creditStatus === 'blocked').length,
    overdueCustomers: filteredCustomers.filter(c => c.creditStatus === 'overdue').length
  };

  // Format filtered summary
  const formattedFilteredSummary = {
    ...filteredSummary,
    formattedTotalDueAmount: CurrencyService.formatBDT(filteredSummary.totalDueAmount),
    formattedCurrentDue: CurrencyService.formatBDT(filteredSummary.currentDue),
    formattedDays0to30: CurrencyService.formatBDT(filteredSummary.days0to30),
    formattedDays31to60: CurrencyService.formatBDT(filteredSummary.days31to60),
    formattedDays60plus: CurrencyService.formatBDT(filteredSummary.days60plus),
    agingPercentages: {
      current: filteredSummary.totalDueAmount > 0 ? Math.round((filteredSummary.currentDue / filteredSummary.totalDueAmount) * 100) : 0,
      days0to30: filteredSummary.totalDueAmount > 0 ? Math.round((filteredSummary.days0to30 / filteredSummary.totalDueAmount) * 100) : 0,
      days31to60: filteredSummary.totalDueAmount > 0 ? Math.round((filteredSummary.days31to60 / filteredSummary.totalDueAmount) * 100) : 0,
      days60plus: filteredSummary.totalDueAmount > 0 ? Math.round((filteredSummary.days60plus / filteredSummary.totalDueAmount) * 100) : 0
    }
  };

  res.status(200).json({
    success: true,
    data: {
      summary: report.summary,
      filteredSummary: formattedFilteredSummary,
      customers: filteredCustomers,
      filters: {
        customerType,
        creditStatus,
        riskLevel,
        includeZeroDue,
        sortBy,
        sortOrder
      },
      generatedAt: DateService.format(new Date(), 'datetime')
    }
  });
});

// @desc    Calculate due aging for all customers
// @route   POST /api/customer-credit/calculate-aging
// @access  Private (Manager and above)
export const calculateDueAging = asyncHandler(async (req, res) => {
  const results = await Customer.calculateDueAging();

  // Log the aging calculation
  await AuditService.logAction({
    action: 'DUE_AGING_CALCULATION',
    entityType: 'Customer',
    performedBy: req.user.id,
    details: {
      customersProcessed: results.length,
      calculationDate: new Date()
    },
    severity: 'medium',
    metadata: {
      triggeredBy: 'manual',
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    }
  });

  res.status(200).json({
    success: true,
    message: 'Due aging calculated successfully',
    data: {
      customersProcessed: results.length,
      results: results,
      calculatedAt: DateService.format(new Date(), 'datetime')
    }
  });
});

// @desc    Get customers at risk
// @route   GET /api/customer-credit/at-risk
// @access  Private (All authenticated users)
export const getCustomersAtRisk = asyncHandler(async (req, res) => {
  const customersAtRisk = await Customer.getCustomersAtRisk();

  // Categorize by risk level
  const riskCategories = {
    overLimit: customersAtRisk.filter(c => c.creditRisk === 'over-limit'),
    overdue: customersAtRisk.filter(c => c.creditRisk === 'overdue'),
    high: customersAtRisk.filter(c => c.creditRisk === 'high'),
    medium: customersAtRisk.filter(c => c.creditRisk === 'medium')
  };

  const summary = {
    totalAtRisk: customersAtRisk.length,
    overLimit: riskCategories.overLimit.length,
    overdue: riskCategories.overdue.length,
    highRisk: riskCategories.high.length,
    mediumRisk: riskCategories.medium.length,
    totalRiskAmount: customersAtRisk.reduce((sum, c) => {
      // Parse formatted currency back to number for calculation
      const amount = parseFloat(c.totalDue.replace(/[৳,]/g, '')) || 0;
      return sum + amount;
    }, 0)
  };

  res.status(200).json({
    success: true,
    data: {
      summary: {
        ...summary,
        formattedTotalRiskAmount: CurrencyService.formatBDT(summary.totalRiskAmount)
      },
      categories: riskCategories,
      allCustomers: customersAtRisk,
      generatedAt: DateService.format(new Date(), 'datetime')
    }
  });
});

// @desc    Update customer credit limit
// @route   PUT /api/customer-credit/:id/credit-limit
// @access  Private (Manager and above)
export const updateCreditLimit = asyncHandler(async (req, res) => {
  const customer = await Customer.findById(req.params.id);

  if (!customer || customer.isDeleted) {
    return res.status(404).json({
      success: false,
      message: 'Customer not found',
      suggestion: 'Please check the customer ID and try again'
    });
  }

  const { creditLimit, reason } = req.body;

  // Validate credit limit
  if (creditLimit === undefined || creditLimit === null) {
    return res.status(400).json({
      success: false,
      message: 'Please provide credit limit',
      suggestion: 'Credit limit is required'
    });
  }

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

  const previousCreditLimit = customer.creditLimit;
  customer.creditLimit = creditValidation.sanitizedAmount;
  customer.lastCreditReview = new Date();
  customer.updatedBy = req.user.id;

  // Update credit status based on new limit
  if (customer.totalDue > customer.creditLimit && customer.creditLimit > 0) {
    customer.creditStatus = 'blocked';
  } else if (customer.creditUtilization >= 90) {
    customer.creditStatus = 'warning';
  } else {
    customer.creditStatus = 'good';
  }

  await customer.save();

  // Log the credit limit change
  await AuditService.logAction({
    action: 'CREDIT_LIMIT_UPDATE',
    entityType: 'Customer',
    entityId: customer._id,
    performedBy: req.user.id,
    details: {
      customerId: customer.customerId,
      customerName: customer.name,
      previousCreditLimit: previousCreditLimit,
      newCreditLimit: creditValidation.sanitizedAmount,
      currentDue: customer.totalDue,
      newCreditStatus: customer.creditStatus,
      reason: reason || 'Credit limit update'
    },
    severity: 'medium',
    metadata: {
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    }
  });

  res.status(200).json({
    success: true,
    message: 'Credit limit updated successfully',
    data: {
      customerId: customer.customerId,
      name: customer.name,
      previousCreditLimit: CurrencyService.formatBDT(previousCreditLimit),
      newCreditLimit: customer.formattedCreditLimit,
      currentDue: customer.formattedTotalDue,
      creditAvailable: customer.formattedCreditAvailable,
      creditUtilization: customer.creditUtilization,
      creditStatus: customer.creditStatus,
      creditRisk: customer.creditRisk,
      canCreateInvoice: customer.canCreateInvoice,
      updatedAt: DateService.format(customer.updatedAt, 'datetime')
    }
  });
});

// @desc    Update customer credit status
// @route   PUT /api/customer-credit/:id/status
// @access  Private (Manager and above)
export const updateCreditStatus = asyncHandler(async (req, res) => {
  const customer = await Customer.findById(req.params.id);

  if (!customer || customer.isDeleted) {
    return res.status(404).json({
      success: false,
      message: 'Customer not found',
      suggestion: 'Please check the customer ID and try again'
    });
  }

  const { creditStatus, reason } = req.body;

  // Validate credit status
  const validStatuses = ['good', 'warning', 'blocked', 'overdue'];
  if (!validStatuses.includes(creditStatus)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid credit status',
      suggestion: `Credit status must be one of: ${validStatuses.join(', ')}`
    });
  }

  const previousStatus = customer.creditStatus;
  customer.creditStatus = creditStatus;
  customer.lastCreditReview = new Date();
  customer.updatedBy = req.user.id;

  await customer.save();

  // Log the status change
  await AuditService.logAction({
    action: 'CREDIT_STATUS_UPDATE',
    entityType: 'Customer',
    entityId: customer._id,
    performedBy: req.user.id,
    details: {
      customerId: customer.customerId,
      customerName: customer.name,
      previousStatus: previousStatus,
      newStatus: creditStatus,
      currentDue: customer.totalDue,
      creditLimit: customer.creditLimit,
      reason: reason || 'Credit status update'
    },
    severity: creditStatus === 'blocked' ? 'high' : 'medium',
    metadata: {
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    }
  });

  res.status(200).json({
    success: true,
    message: 'Credit status updated successfully',
    data: {
      customerId: customer.customerId,
      name: customer.name,
      previousStatus: previousStatus,
      newStatus: creditStatus,
      creditRisk: customer.creditRisk,
      canCreateInvoice: customer.canCreateInvoice,
      invoiceBlockReason: customer.invoiceBlockReason,
      updatedAt: DateService.format(customer.updatedAt, 'datetime')
    }
  });
});

// @desc    Check customer credit eligibility for invoice
// @route   GET /api/customer-credit/:id/eligibility
// @access  Private (All authenticated users)
export const checkCreditEligibility = asyncHandler(async (req, res) => {
  const customer = await Customer.findById(req.params.id);

  if (!customer || customer.isDeleted) {
    return res.status(404).json({
      success: false,
      message: 'Customer not found',
      suggestion: 'Please check the customer ID and try again'
    });
  }

  const { invoiceAmount = 0 } = req.query;

  // Validate invoice amount if provided
  let validatedInvoiceAmount = 0;
  if (invoiceAmount > 0) {
    const amountValidation = MoneyValidator.validateAmount(invoiceAmount, 'Invoice amount', {
      allowZero: true,
      maxAmount: 10000000,
      maxDecimals: 2
    });

    if (!amountValidation.isValid) {
      return res.status(400).json({
        success: false,
        message: `Invalid invoice amount: ${amountValidation.errors.join(', ')}`,
        suggestion: 'Please provide a valid invoice amount'
      });
    }

    validatedInvoiceAmount = amountValidation.sanitizedAmount;
  }

  // Calculate projected totals
  const projectedTotalDue = customer.totalDue + validatedInvoiceAmount;
  const projectedCreditUtilization = customer.creditLimit > 0 ? 
    Math.round((projectedTotalDue / customer.creditLimit) * 100) : 0;

  // Determine eligibility
  let eligible = customer.canCreateInvoice;
  let warnings = [];
  let blockReasons = [];

  if (validatedInvoiceAmount > 0) {
    // Check if new invoice would exceed credit limit
    if (customer.creditLimit > 0 && projectedTotalDue > customer.creditLimit) {
      eligible = false;
      const excessAmount = projectedTotalDue - customer.creditLimit;
      blockReasons.push(`Would exceed credit limit by ${CurrencyService.formatBDT(excessAmount)}`);
    }

    // Add warnings for high utilization
    if (projectedCreditUtilization >= 90 && projectedCreditUtilization < 100) {
      warnings.push(`High credit utilization: ${projectedCreditUtilization}%`);
    }

    if (customer.dueAging.days60plus > 0) {
      warnings.push(`Has overdue amount: ${CurrencyService.formatBDT(customer.dueAging.days60plus)}`);
    }
  }

  // Add existing block reasons
  if (customer.invoiceBlockReason) {
    blockReasons.push(customer.invoiceBlockReason);
  }

  res.status(200).json({
    success: true,
    data: {
      customer: {
        customerId: customer.customerId,
        name: customer.name,
        customerType: customer.customerType
      },
      creditInfo: {
        currentDue: customer.totalDue,
        formattedCurrentDue: customer.formattedTotalDue,
        creditLimit: customer.creditLimit,
        formattedCreditLimit: customer.formattedCreditLimit,
        creditAvailable: customer.creditAvailable,
        formattedCreditAvailable: customer.formattedCreditAvailable,
        creditUtilization: customer.creditUtilization,
        creditStatus: customer.creditStatus,
        creditRisk: customer.creditRisk
      },
      invoiceEligibility: {
        eligible: eligible,
        canOverride: req.user.role === 'owner',
        warnings: warnings,
        blockReasons: blockReasons
      },
      projectedImpact: validatedInvoiceAmount > 0 ? {
        invoiceAmount: validatedInvoiceAmount,
        formattedInvoiceAmount: CurrencyService.formatBDT(validatedInvoiceAmount),
        projectedTotalDue: projectedTotalDue,
        formattedProjectedTotalDue: CurrencyService.formatBDT(projectedTotalDue),
        projectedCreditUtilization: projectedCreditUtilization,
        projectedCreditAvailable: Math.max(0, customer.creditLimit - projectedTotalDue),
        formattedProjectedCreditAvailable: CurrencyService.formatBDT(Math.max(0, customer.creditLimit - projectedTotalDue))
      } : null,
      dueAging: customer.formattedDueAging,
      lastCreditReview: DateService.format(customer.lastCreditReview, 'medium')
    }
  });
});

// @desc    Get credit control dashboard
// @route   GET /api/customer-credit/dashboard
// @access  Private (All authenticated users)
export const getCreditControlDashboard = asyncHandler(async (req, res) => {
  // Get due aging report summary
  const agingReport = await Customer.getDueAgingReport({ limit: 1000 });
  
  // Get customers at risk
  const customersAtRisk = await Customer.getCustomersAtRisk();
  
  // Get recent credit activities (from audit logs)
  const recentActivities = await AuditService.getRecentActivities({
    actions: ['CREDIT_LIMIT_UPDATE', 'CREDIT_STATUS_UPDATE', 'CREDIT_LIMIT_OVERRIDE'],
    limit: 10
  });

  // Calculate key metrics
  const metrics = {
    totalCustomersWithCredit: agingReport.summary.totalCustomers,
    totalOutstandingAmount: agingReport.summary.totalDueAmount,
    customersAtRisk: customersAtRisk.length,
    blockedCustomers: agingReport.summary.blockedCustomers,
    overdueCustomers: agingReport.summary.overdueCustomers,
    overLimitCustomers: agingReport.summary.overLimitCustomers,
    
    // Aging breakdown
    currentDue: agingReport.summary.currentDue,
    days0to30: agingReport.summary.days0to30,
    days31to60: agingReport.summary.days31to60,
    days60plus: agingReport.summary.days60plus,
    
    // Risk distribution
    highRiskCustomers: customersAtRisk.filter(c => c.creditRisk === 'high').length,
    mediumRiskCustomers: customersAtRisk.filter(c => c.creditRisk === 'medium').length,
    lowRiskCustomers: agingReport.summary.totalCustomers - customersAtRisk.length
  };

  // Format metrics
  const formattedMetrics = {
    ...metrics,
    formattedTotalOutstandingAmount: CurrencyService.formatBDT(metrics.totalOutstandingAmount),
    formattedCurrentDue: CurrencyService.formatBDT(metrics.currentDue),
    formattedDays0to30: CurrencyService.formatBDT(metrics.days0to30),
    formattedDays31to60: CurrencyService.formatBDT(metrics.days31to60),
    formattedDays60plus: CurrencyService.formatBDT(metrics.days60plus)
  };

  res.status(200).json({
    success: true,
    data: {
      metrics: formattedMetrics,
      agingBreakdown: agingReport.summary.agingPercentages,
      topRiskCustomers: customersAtRisk.slice(0, 10),
      recentActivities: recentActivities,
      generatedAt: DateService.format(new Date(), 'datetime')
    }
  });
});