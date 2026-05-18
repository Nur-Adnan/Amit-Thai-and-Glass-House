import Invoice from '../models/Invoice.js';
import Expense from '../models/Expense.js';
import SalaryPayment from '../models/SalaryPayment.js';
import ProfitAnalytics from '../models/ProfitAnalytics.js';
import mongoose from 'mongoose';

/**
 * Calculate profit for a specific date range
 * @param {Date} startDate - Start date for calculation
 * @param {Date} endDate - End date for calculation
 * @param {String} analysisType - Type of analysis (daily, monthly, product-wise, custom-period)
 * @param {Object} user - User performing the calculation
 * @returns {Object} Profit calculation results
 */
export const calculateProfit = async (startDate, endDate, analysisType, user) => {
  try {
    // 1. Calculate Total Sales (Revenue from paid invoices)
    const salesData = await calculateTotalSales(startDate, endDate);
    
    // 2. Calculate Product Costs and Service Costs (COGS from sold items)
    const productAndServiceCosts = await calculateProductCosts(startDate, endDate);
    
    // 3. Calculate Salary Expenses
    const salaryExpenses = await calculateSalaryExpenses(startDate, endDate);
    
    // 4. Calculate Other Expenses
    const otherExpenses = await calculateOtherExpenses(startDate, endDate);
    
    // 5. Get Product-wise breakdown if needed
    const productBreakdown = analysisType === 'product-wise' ? 
      await calculateProductWiseProfitBreakdown(startDate, endDate) : [];
    
    // 6. Get Expense breakdown
    const expenseBreakdown = await calculateExpenseBreakdown(startDate, endDate);
    
    // 7. Generate analysis ID
    const analysisId = await ProfitAnalytics.generateAnalysisId();
    
    // 8. Create profit analytics record
    const profitAnalytics = new ProfitAnalytics({
      analysisId,
      analysisType,
      periodStart: startDate,
      periodEnd: endDate,
      revenue: {
        totalSales: salesData.totalSales,
        invoiceCount: salesData.invoiceCount,
        averageOrderValue: salesData.averageOrderValue
      },
      costs: {
        productCosts: productAndServiceCosts.productCosts,
        serviceCosts: productAndServiceCosts.serviceCosts,
        salaryExpenses: salaryExpenses.total,
        otherExpenses: otherExpenses.total
      },
      productBreakdown,
      expenseBreakdown,
      serviceBreakdown: productAndServiceCosts.serviceBreakdown,
      calculatedBy: user._id,
      calculationMethod: 'automatic'
    });
    
    await profitAnalytics.save();
    
    return {
      analysisId: profitAnalytics.analysisId,
      period: {
        start: startDate,
        end: endDate,
        type: analysisType
      },
      revenue: profitAnalytics.revenue,
      costs: profitAnalytics.costs,
      profit: profitAnalytics.profit,
      profitStatus: profitAnalytics.profitStatus,
      costBreakdownPercentages: profitAnalytics.costBreakdownPercentages,
      productBreakdown: profitAnalytics.productBreakdown,
      expenseBreakdown: profitAnalytics.expenseBreakdown,
      serviceBreakdown: productAndServiceCosts.serviceBreakdown,
      metadata: {
        calculatedAt: profitAnalytics.createdAt,
        calculatedBy: user.name
      }
    };
  } catch (error) {
    throw new Error(`Profit calculation failed: ${error.message}`);
  }
};

/**
 * Calculate total sales from paid invoices
 */
const calculateTotalSales = async (startDate, endDate) => {
  const salesAggregation = await Invoice.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate, $lte: endDate },
        status: { $in: ['paid', 'partial'] }, // Include paid and partially paid invoices
        invoiceType: 'FINAL', // Only include final invoices for profit calculation
        isActive: true
      }
    },
    {
      $group: {
        _id: null,
        totalSales: { $sum: '$paidAmount' }, // Use paid amount, not grand total
        invoiceCount: { $sum: 1 },
        totalGrandTotal: { $sum: '$grandTotal' }
      }
    }
  ]);
  
  const result = salesAggregation[0] || { totalSales: 0, invoiceCount: 0, totalGrandTotal: 0 };
  
  return {
    totalSales: result.totalSales,
    invoiceCount: result.invoiceCount,
    averageOrderValue: result.invoiceCount > 0 ? result.totalSales / result.invoiceCount : 0
  };
};

/**
 * Calculate product costs (COGS) and service costs from sold items
 */
const calculateProductCosts = async (startDate, endDate) => {
  const costAggregation = await Invoice.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate, $lte: endDate },
        status: { $in: ['paid', 'partial'] },
        invoiceType: 'FINAL', // Only include final invoices for cost calculation
        isActive: true
      }
    },
    { $unwind: '$items' },
    {
      $lookup: {
        from: 'products',
        localField: 'items.product',
        foreignField: '_id',
        as: 'productDetails'
      }
    },
    { $unwind: '$productDetails' },
    {
      $group: {
        _id: null,
        totalProductCost: {
          $sum: {
            $multiply: [
              '$items.quantity',
              '$productDetails.purchasePrice'
            ]
          }
        },
        totalItemsSold: { $sum: '$items.quantity' }
      }
    }
  ]);
  
  // Calculate service costs separately
  const serviceCostAggregation = await Invoice.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate, $lte: endDate },
        status: { $in: ['paid', 'partial'] },
        invoiceType: 'FINAL', // Only include final invoices for service cost calculation
        isActive: true
      }
    },
    {
      $group: {
        _id: null,
        totalDeliveryCharges: { $sum: { $ifNull: ['$serviceCharges.deliveryCharge', 0] } },
        totalInstallationCharges: { $sum: { $ifNull: ['$serviceCharges.installationCharge', 0] } },
        totalServiceCharges: { $sum: { $ifNull: ['$serviceCharges.totalServiceCharges', 0] } },
        invoicesWithDelivery: {
          $sum: {
            $cond: [{ $gt: [{ $ifNull: ['$serviceCharges.deliveryCharge', 0] }, 0] }, 1, 0]
          }
        },
        invoicesWithInstallation: {
          $sum: {
            $cond: [{ $gt: [{ $ifNull: ['$serviceCharges.installationCharge', 0] }, 0] }, 1, 0]
          }
        }
      }
    }
  ]);
  
  const productResult = costAggregation[0] || { totalProductCost: 0, totalItemsSold: 0 };
  const serviceResult = serviceCostAggregation[0] || { 
    totalDeliveryCharges: 0, 
    totalInstallationCharges: 0, 
    totalServiceCharges: 0,
    invoicesWithDelivery: 0,
    invoicesWithInstallation: 0
  };
  
  return {
    total: productResult.totalProductCost + serviceResult.totalServiceCharges,
    productCosts: productResult.totalProductCost,
    serviceCosts: serviceResult.totalServiceCharges,
    itemsSold: productResult.totalItemsSold,
    serviceBreakdown: {
      deliveryCharges: serviceResult.totalDeliveryCharges,
      installationCharges: serviceResult.totalInstallationCharges,
      invoicesWithDelivery: serviceResult.invoicesWithDelivery,
      invoicesWithInstallation: serviceResult.invoicesWithInstallation
    }
  };
};

/**
 * Calculate salary expenses for the period
 */
const calculateSalaryExpenses = async (startDate, endDate) => {
  const salaryAggregation = await Expense.aggregate([
    {
      $match: {
        expenseDate: { $gte: startDate, $lte: endDate },
        category: 'Salary Expense',
        status: 'approved'
      }
    },
    {
      $group: {
        _id: null,
        totalSalaryExpenses: { $sum: '$amount' },
        salaryExpenseCount: { $sum: 1 }
      }
    }
  ]);
  
  const result = salaryAggregation[0] || { totalSalaryExpenses: 0, salaryExpenseCount: 0 };
  
  return {
    total: result.totalSalaryExpenses,
    count: result.salaryExpenseCount
  };
};

/**
 * Calculate other expenses (non-salary) for the period
 */
const calculateOtherExpenses = async (startDate, endDate) => {
  const expenseAggregation = await Expense.aggregate([
    {
      $match: {
        expenseDate: { $gte: startDate, $lte: endDate },
        category: { $ne: 'Salary Expense' },
        status: 'approved'
      }
    },
    {
      $group: {
        _id: null,
        totalOtherExpenses: { $sum: '$amount' },
        otherExpenseCount: { $sum: 1 }
      }
    }
  ]);
  
  const result = expenseAggregation[0] || { totalOtherExpenses: 0, otherExpenseCount: 0 };
  
  return {
    total: result.totalOtherExpenses,
    count: result.otherExpenseCount
  };
};

/**
 * Calculate product-wise profit breakdown (internal function)
 */
const calculateProductWiseProfitBreakdown = async (startDate, endDate) => {
  const productProfitAggregation = await Invoice.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate, $lte: endDate },
        status: { $in: ['paid', 'partial'] },
        invoiceType: 'FINAL', // Only include final invoices for product profit breakdown
        isActive: true
      }
    },
    { $unwind: '$items' },
    {
      $lookup: {
        from: 'products',
        localField: 'items.product',
        foreignField: '_id',
        as: 'productDetails'
      }
    },
    { $unwind: '$productDetails' },
    {
      $group: {
        _id: '$items.product',
        productName: { $first: '$productDetails.name' },
        quantitySold: { $sum: '$items.quantity' },
        revenue: { $sum: '$items.totalPrice' },
        cost: {
          $sum: {
            $multiply: [
              '$items.quantity',
              '$productDetails.purchasePrice'
            ]
          }
        }
      }
    },
    {
      $project: {
        product: '$_id',
        productName: 1,
        quantitySold: 1,
        revenue: 1,
        cost: 1,
        profit: { $subtract: ['$revenue', '$cost'] },
        profitMargin: {
          $cond: {
            if: { $gt: ['$revenue', 0] },
            then: {
              $multiply: [
                { $divide: [{ $subtract: ['$revenue', '$cost'] }, '$revenue'] },
                100
              ]
            },
            else: 0
          }
        }
      }
    },
    { $sort: { profit: -1 } }
  ]);
  
  return productProfitAggregation;
};

/**
 * Calculate detailed expense breakdown
 */
const calculateExpenseBreakdown = async (startDate, endDate) => {
  // Salary expense breakdown
  const salaryBreakdown = await Expense.aggregate([
    {
      $match: {
        expenseDate: { $gte: startDate, $lte: endDate },
        category: 'Salary Expense',
        status: 'approved'
      }
    },
    {
      $group: {
        _id: '$subcategory',
        amount: { $sum: '$amount' },
        count: { $sum: 1 }
      }
    },
    {
      $project: {
        _id: 0,
        category: { $ifNull: ['$_id', 'General Salary'] },
        amount: 1,
        count: 1
      }
    }
  ]);
  
  // Other expense breakdown
  const otherBreakdown = await Expense.aggregate([
    {
      $match: {
        expenseDate: { $gte: startDate, $lte: endDate },
        category: { $ne: 'Salary Expense' },
        status: 'approved'
      }
    },
    {
      $group: {
        _id: '$category',
        amount: { $sum: '$amount' },
        count: { $sum: 1 }
      }
    },
    {
      $project: {
        _id: 0,
        category: '$_id',
        amount: 1,
        count: 1
      }
    },
    { $sort: { amount: -1 } }
  ]);
  
  return {
    salaryExpenseDetails: salaryBreakdown,
    otherExpenseDetails: otherBreakdown
  };
};

/**
 * Calculate daily profit for a specific date
 */
export const calculateDailyProfit = async (date, user) => {
  const startDate = new Date(date);
  startDate.setHours(0, 0, 0, 0);
  
  const endDate = new Date(date);
  endDate.setHours(23, 59, 59, 999);
  
  return await calculateProfit(startDate, endDate, 'daily', user);
};

/**
 * Calculate monthly profit for a specific month/year
 */
export const calculateMonthlyProfit = async (month, year, user) => {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59, 999);
  
  return await calculateProfit(startDate, endDate, 'monthly', user);
};

/**
 * Calculate product-wise profit for a date range
 */
export const calculateProductWiseProfit = async (startDate, endDate, user) => {
  return await calculateProfit(startDate, endDate, 'product-wise', user);
};

/**
 * Get profit trends over time
 */
export const getProfitTrends = async (startDate, endDate, groupBy = 'daily') => {
  let groupStage;
  
  switch (groupBy) {
    case 'daily':
      groupStage = {
        $group: {
          _id: {
            year: { $year: '$periodStart' },
            month: { $month: '$periodStart' },
            day: { $dayOfMonth: '$periodStart' }
          },
          totalSales: { $sum: '$revenue.totalSales' },
          totalCosts: { $sum: '$costs.totalCosts' },
          netProfit: { $sum: '$profit.netProfit' },
          profitMargin: { $avg: '$profit.profitMargin' },
          count: { $sum: 1 }
        }
      };
      break;
    case 'monthly':
      groupStage = {
        $group: {
          _id: {
            year: { $year: '$periodStart' },
            month: { $month: '$periodStart' }
          },
          totalSales: { $sum: '$revenue.totalSales' },
          totalCosts: { $sum: '$costs.totalCosts' },
          netProfit: { $sum: '$profit.netProfit' },
          profitMargin: { $avg: '$profit.profitMargin' },
          count: { $sum: 1 }
        }
      };
      break;
    default:
      throw new Error('Invalid groupBy parameter. Use "daily" or "monthly"');
  }
  
  const trends = await ProfitAnalytics.aggregate([
    {
      $match: {
        periodStart: { $gte: startDate },
        periodEnd: { $lte: endDate },
        analysisType: { $in: ['daily', 'monthly'] }
      }
    },
    groupStage,
    { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
  ]);
  
  return trends;
};

/**
 * Get top performing products by profit
 */
export const getTopPerformingProducts = async (startDate, endDate, limit = 10) => {
  const topProducts = await ProfitAnalytics.aggregate([
    {
      $match: {
        periodStart: { $gte: startDate },
        periodEnd: { $lte: endDate },
        analysisType: 'product-wise'
      }
    },
    { $unwind: '$productBreakdown' },
    {
      $group: {
        _id: '$productBreakdown.product',
        productName: { $first: '$productBreakdown.productName' },
        totalQuantitySold: { $sum: '$productBreakdown.quantitySold' },
        totalRevenue: { $sum: '$productBreakdown.revenue' },
        totalCost: { $sum: '$productBreakdown.cost' },
        totalProfit: { $sum: '$productBreakdown.profit' }
      }
    },
    {
      $project: {
        productName: 1,
        totalQuantitySold: 1,
        totalRevenue: 1,
        totalCost: 1,
        totalProfit: 1,
        profitMargin: {
          $cond: {
            if: { $gt: ['$totalRevenue', 0] },
            then: {
              $multiply: [
                { $divide: ['$totalProfit', '$totalRevenue'] },
                100
              ]
            },
            else: 0
          }
        }
      }
    },
    { $sort: { totalProfit: -1 } },
    { $limit: limit }
  ]);
  
  return topProducts;
};