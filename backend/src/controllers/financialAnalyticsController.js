import asyncHandler from '../utils/asyncHandler.js';
import Invoice from '../models/Invoice.js';
import Customer from '../models/Customer.js';
import ShopConfig from '../models/ShopConfig.js';
import AuditService from '../services/auditService.js';
import CurrencyService from '../services/currencyService.js';
import DateService from '../services/dateService.js';

// @desc    Get financial analytics with warning signals
// @route   GET /api/financial-analytics/overview
// @access  Private (Owner, Manager)
const getFinancialOverview = asyncHandler(async (req, res) => {
  const { 
    startDate, 
    endDate, 
    period = '30' // Default to last 30 days
  } = req.query;

  // Calculate date range
  const endDateObj = endDate ? new Date(endDate) : new Date();
  const startDateObj = startDate ? new Date(startDate) : new Date(Date.now() - (parseInt(period) * 24 * 60 * 60 * 1000));

  // Set end of day for endDate
  endDateObj.setHours(23, 59, 59, 999);
  startDateObj.setHours(0, 0, 0, 0);

  try {
    // Get all invoices in the period
    const invoices = await Invoice.find({
      createdAt: { $gte: startDateObj, $lte: endDateObj },
      isActive: true,
      isDeleted: { $ne: true },
      invoiceType: { $ne: 'BOOKING' } // Exclude booking invoices from financial analysis
    }).populate('customer', 'name customerType creditLimit');

    // Calculate sales analytics
    const totalSales = invoices.reduce((sum, invoice) => sum + invoice.grandTotal, 0);
    const totalPaid = invoices.reduce((sum, invoice) => sum + invoice.paidAmount, 0);
    const totalDue = invoices.reduce((sum, invoice) => sum + invoice.dueAmount, 0);

    // Calculate cash vs due percentages
    const cashSalesPercentage = totalSales > 0 ? (totalPaid / totalSales) * 100 : 0;
    const dueSalesPercentage = totalSales > 0 ? (totalDue / totalSales) * 100 : 0;

    // Get invoice status breakdown
    const statusBreakdown = {
      paid: invoices.filter(inv => inv.status === 'paid').length,
      partial: invoices.filter(inv => inv.status === 'partial').length,
      unpaid: invoices.filter(inv => inv.status === 'unpaid').length
    };

    // Calculate payment method breakdown
    const paymentMethodBreakdown = invoices.reduce((acc, invoice) => {
      const method = invoice.paymentMethod || 'unknown';
      acc[method] = (acc[method] || 0) + invoice.paidAmount;
      return acc;
    }, {});

    // Get customer due analysis
    const customerDueAnalysis = await getCustomerDueAnalysis();

    // Calculate warning signals
    const warningSignals = await calculateWarningSignals(totalDue, totalSales, customerDueAnalysis);

    // Get trend data (compare with previous period)
    const trendData = await getTrendData(startDateObj, endDateObj, period);

    const analytics = {
      period: {
        startDate: DateService.format(startDateObj, 'short'),
        endDate: DateService.format(endDateObj, 'short'),
        days: Math.ceil((endDateObj - startDateObj) / (1000 * 60 * 60 * 24))
      },
      salesOverview: {
        totalSales: {
          amount: totalSales,
          formatted: CurrencyService.formatBDT(totalSales)
        },
        totalPaid: {
          amount: totalPaid,
          formatted: CurrencyService.formatBDT(totalPaid)
        },
        totalDue: {
          amount: totalDue,
          formatted: CurrencyService.formatBDT(totalDue)
        },
        cashSalesPercentage: Math.round(cashSalesPercentage * 100) / 100,
        dueSalesPercentage: Math.round(dueSalesPercentage * 100) / 100
      },
      invoiceBreakdown: {
        total: invoices.length,
        ...statusBreakdown,
        averageInvoiceValue: {
          amount: invoices.length > 0 ? totalSales / invoices.length : 0,
          formatted: CurrencyService.formatBDT(invoices.length > 0 ? totalSales / invoices.length : 0)
        }
      },
      paymentMethods: Object.keys(paymentMethodBreakdown).map(method => ({
        method,
        amount: paymentMethodBreakdown[method],
        formatted: CurrencyService.formatBDT(paymentMethodBreakdown[method]),
        percentage: totalPaid > 0 ? Math.round((paymentMethodBreakdown[method] / totalPaid) * 10000) / 100 : 0
      })),
      customerAnalysis: customerDueAnalysis,
      warningSignals,
      trends: trendData
    };

    // Log analytics access
    await AuditService.log({
      action: 'analytics_view',
      entityType: 'FinancialAnalytics',
      entityName: 'Financial Overview',
      performedBy: req.user.id,
      description: `Viewed financial analytics for ${analytics.period.days} days`,
      metadata: {
        period: analytics.period,
        totalSales: totalSales,
        warningCount: warningSignals.alerts.length
      },
      severity: 'low'
    }, req);

    res.status(200).json({
      success: true,
      data: analytics
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to generate financial analytics',
      error: error.message
    });
  }
});

// Helper function to get customer due analysis
const getCustomerDueAnalysis = async () => {
  const customers = await Customer.find({
    isActive: true,
    isDeleted: { $ne: true },
    totalDue: { $gt: 0 }
  }).sort({ totalDue: -1 });

  const totalCustomersWithDue = customers.length;
  const totalDueAmount = customers.reduce((sum, customer) => sum + customer.totalDue, 0);

  // Categorize customers by due amount
  const dueCategories = {
    high: customers.filter(c => c.totalDue > 50000).length,
    medium: customers.filter(c => c.totalDue > 20000 && c.totalDue <= 50000).length,
    low: customers.filter(c => c.totalDue > 0 && c.totalDue <= 20000).length
  };

  // Get top 5 customers with highest due
  const topDueCustomers = customers.slice(0, 5).map(customer => ({
    id: customer._id,
    name: customer.name,
    totalDue: {
      amount: customer.totalDue,
      formatted: CurrencyService.formatBDT(customer.totalDue)
    },
    creditLimit: {
      amount: customer.creditLimit,
      formatted: CurrencyService.formatBDT(customer.creditLimit)
    },
    creditUtilization: customer.creditLimit > 0 ? Math.round((customer.totalDue / customer.creditLimit) * 100) : 0,
    riskLevel: customer.creditRisk || 'medium'
  }));

  return {
    totalCustomersWithDue,
    totalDueAmount: {
      amount: totalDueAmount,
      formatted: CurrencyService.formatBDT(totalDueAmount)
    },
    dueCategories,
    topDueCustomers
  };
};

// Helper function to calculate warning signals
const calculateWarningSignals = async (totalDue, totalSales, customerDueAnalysis) => {
  const alerts = [];
  const warnings = [];
  const recommendations = [];

  // Get shop configuration for thresholds
  const shopConfig = await ShopConfig.getActiveConfig();
  
  // Default thresholds (can be configured in shop settings)
  const thresholds = {
    dueSalesPercentage: 30, // Alert if due sales > 30%
    totalDueAmount: 100000, // Alert if total due > 100k BDT
    customerDueLimit: 50000, // Alert if any customer due > 50k BDT
    cashFlowRatio: 0.7 // Alert if cash/total sales < 70%
  };

  // Calculate ratios
  const dueSalesPercentage = totalSales > 0 ? (totalDue / totalSales) * 100 : 0;
  const cashFlowRatio = totalSales > 0 ? (totalSales - totalDue) / totalSales : 0;

  // Check due sales percentage
  if (dueSalesPercentage > thresholds.dueSalesPercentage) {
    alerts.push({
      type: 'HIGH_DUE_PERCENTAGE',
      severity: 'high',
      title: 'High Due Sales Percentage',
      message: `${Math.round(dueSalesPercentage)}% of sales are on credit, exceeding safe threshold of ${thresholds.dueSalesPercentage}%`,
      value: dueSalesPercentage,
      threshold: thresholds.dueSalesPercentage,
      recommendation: 'Consider implementing stricter credit policies or offering cash discounts'
    });
  }

  // Check total due amount
  if (totalDue > thresholds.totalDueAmount) {
    alerts.push({
      type: 'HIGH_TOTAL_DUE',
      severity: 'high',
      title: 'High Total Due Amount',
      message: `Total due amount of ${CurrencyService.formatBDT(totalDue)} exceeds safe threshold`,
      value: totalDue,
      threshold: thresholds.totalDueAmount,
      recommendation: 'Focus on collecting outstanding payments and review credit limits'
    });
  }

  // Check cash flow ratio
  if (cashFlowRatio < thresholds.cashFlowRatio) {
    warnings.push({
      type: 'LOW_CASH_FLOW',
      severity: 'medium',
      title: 'Low Cash Flow Ratio',
      message: `Only ${Math.round(cashFlowRatio * 100)}% of sales are collected in cash`,
      value: cashFlowRatio,
      threshold: thresholds.cashFlowRatio,
      recommendation: 'Encourage cash payments with discounts or incentives'
    });
  }

  // Check individual customer due limits
  const highRiskCustomers = customerDueAnalysis.topDueCustomers.filter(
    customer => customer.totalDue.amount > thresholds.customerDueLimit
  );

  if (highRiskCustomers.length > 0) {
    warnings.push({
      type: 'HIGH_CUSTOMER_DUE',
      severity: 'medium',
      title: 'Customers with High Due Amounts',
      message: `${highRiskCustomers.length} customers have due amounts exceeding ${CurrencyService.formatBDT(thresholds.customerDueLimit)}`,
      value: highRiskCustomers.length,
      customers: highRiskCustomers.map(c => ({ name: c.name, due: c.totalDue.formatted })),
      recommendation: 'Contact these customers for payment collection'
    });
  }

  // Generate recommendations based on analysis
  if (dueSalesPercentage > 20) {
    recommendations.push({
      type: 'CREDIT_POLICY',
      priority: 'high',
      title: 'Review Credit Policy',
      description: 'Consider tightening credit terms or requiring deposits for large orders',
      expectedImpact: 'Reduce due sales percentage by 10-15%'
    });
  }

  if (customerDueAnalysis.totalCustomersWithDue > 10) {
    recommendations.push({
      type: 'COLLECTION_PROCESS',
      priority: 'medium',
      title: 'Improve Collection Process',
      description: 'Implement systematic follow-up process for overdue accounts',
      expectedImpact: 'Reduce average collection time by 20%'
    });
  }

  return {
    alerts,
    warnings,
    recommendations,
    summary: {
      totalAlerts: alerts.length,
      totalWarnings: warnings.length,
      overallRiskLevel: alerts.length > 0 ? 'high' : warnings.length > 0 ? 'medium' : 'low'
    }
  };
};

// Helper function to get trend data
const getTrendData = async (currentStartDate, currentEndDate, period) => {
  const periodDays = parseInt(period);
  const previousStartDate = new Date(currentStartDate.getTime() - (periodDays * 24 * 60 * 60 * 1000));
  const previousEndDate = new Date(currentEndDate.getTime() - (periodDays * 24 * 60 * 60 * 1000));

  // Get previous period data
  const previousInvoices = await Invoice.find({
    createdAt: { $gte: previousStartDate, $lte: previousEndDate },
    isActive: true,
    isDeleted: { $ne: true },
    invoiceType: { $ne: 'BOOKING' }
  });

  const previousTotalSales = previousInvoices.reduce((sum, invoice) => sum + invoice.grandTotal, 0);
  const previousTotalPaid = previousInvoices.reduce((sum, invoice) => sum + invoice.paidAmount, 0);
  const previousTotalDue = previousInvoices.reduce((sum, invoice) => sum + invoice.dueAmount, 0);

  // Get current period data for comparison
  const currentInvoices = await Invoice.find({
    createdAt: { $gte: currentStartDate, $lte: currentEndDate },
    isActive: true,
    isDeleted: { $ne: true },
    invoiceType: { $ne: 'BOOKING' }
  });

  const currentTotalSales = currentInvoices.reduce((sum, invoice) => sum + invoice.grandTotal, 0);
  const currentTotalPaid = currentInvoices.reduce((sum, invoice) => sum + invoice.paidAmount, 0);
  const currentTotalDue = currentInvoices.reduce((sum, invoice) => sum + invoice.dueAmount, 0);

  // Calculate trends
  const calculateTrend = (current, previous) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 10000) / 100;
  };

  return {
    sales: {
      current: currentTotalSales,
      previous: previousTotalSales,
      trend: calculateTrend(currentTotalSales, previousTotalSales),
      direction: currentTotalSales >= previousTotalSales ? 'up' : 'down'
    },
    cashCollection: {
      current: currentTotalPaid,
      previous: previousTotalPaid,
      trend: calculateTrend(currentTotalPaid, previousTotalPaid),
      direction: currentTotalPaid >= previousTotalPaid ? 'up' : 'down'
    },
    dueAmount: {
      current: currentTotalDue,
      previous: previousTotalDue,
      trend: calculateTrend(currentTotalDue, previousTotalDue),
      direction: currentTotalDue <= previousTotalDue ? 'up' : 'down' // Lower due is better
    }
  };
};

// @desc    Get cash flow analysis
// @route   GET /api/financial-analytics/cash-flow
// @access  Private (Owner, Manager)
const getCashFlowAnalysis = asyncHandler(async (req, res) => {
  const { days = 30 } = req.query;
  
  const endDate = new Date();
  const startDate = new Date(Date.now() - (parseInt(days) * 24 * 60 * 60 * 1000));

  // Get daily cash flow data
  const dailyCashFlow = await Invoice.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate, $lte: endDate },
        isActive: true,
        isDeleted: { $ne: true },
        invoiceType: { $ne: 'BOOKING' }
      }
    },
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
          day: { $dayOfMonth: '$createdAt' }
        },
        totalSales: { $sum: '$grandTotal' },
        totalPaid: { $sum: '$paidAmount' },
        totalDue: { $sum: '$dueAmount' },
        invoiceCount: { $sum: 1 }
      }
    },
    {
      $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 }
    }
  ]);

  const formattedCashFlow = dailyCashFlow.map(day => ({
    date: `${day._id.year}-${String(day._id.month).padStart(2, '0')}-${String(day._id.day).padStart(2, '0')}`,
    totalSales: day.totalSales,
    totalPaid: day.totalPaid,
    totalDue: day.totalDue,
    cashPercentage: day.totalSales > 0 ? Math.round((day.totalPaid / day.totalSales) * 100) : 0,
    invoiceCount: day.invoiceCount
  }));

  res.status(200).json({
    success: true,
    data: {
      period: {
        startDate: DateService.format(startDate, 'short'),
        endDate: DateService.format(endDate, 'short'),
        days: parseInt(days)
      },
      dailyCashFlow: formattedCashFlow,
      summary: {
        averageCashPercentage: formattedCashFlow.length > 0 
          ? Math.round(formattedCashFlow.reduce((sum, day) => sum + day.cashPercentage, 0) / formattedCashFlow.length)
          : 0,
        totalDays: formattedCashFlow.length,
        bestCashDay: formattedCashFlow.reduce((best, day) => 
          day.cashPercentage > (best?.cashPercentage || 0) ? day : best, null),
        worstCashDay: formattedCashFlow.reduce((worst, day) => 
          day.cashPercentage < (worst?.cashPercentage || 100) ? day : worst, null)
      }
    }
  });
});

// @desc    Get due collection recommendations
// @route   GET /api/financial-analytics/collection-recommendations
// @access  Private (Owner, Manager)
const getCollectionRecommendations = asyncHandler(async (req, res) => {
  // Get customers with overdue amounts
  const overdueCustomers = await Customer.find({
    isActive: true,
    isDeleted: { $ne: true },
    totalDue: { $gt: 0 }
  });

  // Get overdue invoices for these customers
  const customerIds = overdueCustomers.map(c => c._id);
  const overdueInvoices = await Invoice.find({
    customer: { $in: customerIds },
    status: { $in: ['partial', 'due'] },
    createdAt: { $lt: new Date(Date.now() - (30 * 24 * 60 * 60 * 1000)) }, // Older than 30 days
    isActive: true,
    isDeleted: { $ne: true }
  }).populate('customer', 'name phone totalDue');

  // Group invoices by customer and find oldest for each
  const customerInvoiceMap = {};
  overdueInvoices.forEach(invoice => {
    const customerId = invoice.customer._id.toString();
    if (!customerInvoiceMap[customerId] || invoice.createdAt < customerInvoiceMap[customerId].createdAt) {
      customerInvoiceMap[customerId] = invoice;
    }
  });

  const recommendations = Object.values(customerInvoiceMap).map(invoice => {
    const customer = invoice.customer;
    const daysPastDue = Math.floor((new Date() - invoice.createdAt) / (1000 * 60 * 60 * 24));
    
    return {
      customer: {
        id: customer._id,
        name: customer.name,
        phone: customer.phone,
        totalDue: {
          amount: customer.totalDue,
          formatted: CurrencyService.formatBDT(customer.totalDue)
        }
      },
      oldestInvoice: {
        invoiceNo: invoice.invoiceNo,
        amount: {
          amount: invoice.dueAmount,
          formatted: CurrencyService.formatBDT(invoice.dueAmount)
        },
        daysPastDue
      },
      priority: daysPastDue > 60 ? 'high' : daysPastDue > 30 ? 'medium' : 'low',
      recommendedAction: daysPastDue > 60 
        ? 'Immediate collection call required'
        : daysPastDue > 30 
        ? 'Send payment reminder'
        : 'Monitor closely'
    };
  }).sort((a, b) => b.oldestInvoice.daysPastDue - a.oldestInvoice.daysPastDue);

  res.status(200).json({
    success: true,
    data: {
      totalCustomers: recommendations.length,
      highPriority: recommendations.filter(r => r.priority === 'high').length,
      mediumPriority: recommendations.filter(r => r.priority === 'medium').length,
      lowPriority: recommendations.filter(r => r.priority === 'low').length,
      recommendations: recommendations.slice(0, 20) // Top 20 recommendations
    }
  });
});

export {
  getFinancialOverview,
  getCashFlowAnalysis,
  getCollectionRecommendations
};