import Invoice from '../models/Invoice.js';
import Expense from '../models/Expense.js';
import Investment from '../models/Investment.js';
import Product from '../models/Product.js';
import SalaryPayment from '../models/SalaryPayment.js';
import ProfitAnalytics from '../models/ProfitAnalytics.js';
import { calculateMonthlyProfit } from '../services/profitCalculationService.js';

// @desc    Get today's sales summary
// @route   GET /api/dashboard/todays-sales
// @access  Private (All authenticated users)
export const getTodaysSales = async (req, res, next) => {
  try {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);

    // Get today's sales data
    const salesData = await Invoice.aggregate([
      {
        $match: {
          createdAt: { $gte: startOfDay, $lte: endOfDay },
          isActive: true
        }
      },
      {
        $group: {
          _id: null,
          totalInvoices: { $sum: 1 },
          totalSales: { $sum: '$grandTotal' },
          totalPaid: { $sum: '$paidAmount' },
          totalDue: { $sum: '$dueAmount' },
          paidInvoices: { $sum: { $cond: [{ $eq: ['$status', 'paid'] }, 1, 0] } },
          partialInvoices: { $sum: { $cond: [{ $eq: ['$status', 'partial'] }, 1, 0] } },
          dueInvoices: { $sum: { $cond: [{ $eq: ['$status', 'due'] }, 1, 0] } },
          avgOrderValue: { $avg: '$grandTotal' }
        }
      }
    ]);

    // Get hourly sales trend for today
    const hourlySales = await Invoice.aggregate([
      {
        $match: {
          createdAt: { $gte: startOfDay, $lte: endOfDay },
          isActive: true
        }
      },
      {
        $group: {
          _id: { $hour: '$createdAt' },
          sales: { $sum: '$grandTotal' },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id': 1 } }
    ]);

    // Get top products sold today
    const topProducts = await Invoice.aggregate([
      {
        $match: {
          createdAt: { $gte: startOfDay, $lte: endOfDay },
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
          category: { $first: '$productDetails.category' },
          quantitySold: { $sum: '$items.quantity' },
          revenue: { $sum: '$items.totalPrice' }
        }
      },
      { $sort: { quantitySold: -1 } },
      { $limit: 5 }
    ]);

    // Get payment method breakdown
    const paymentMethods = await Invoice.aggregate([
      {
        $match: {
          createdAt: { $gte: startOfDay, $lte: endOfDay },
          isActive: true,
          status: { $in: ['paid', 'partial'] }
        }
      },
      {
        $group: {
          _id: '$paymentMethod',
          count: { $sum: 1 },
          amount: { $sum: '$paidAmount' }
        }
      },
      { $sort: { amount: -1 } }
    ]);

    const result = salesData[0] || {
      totalInvoices: 0,
      totalSales: 0,
      totalPaid: 0,
      totalDue: 0,
      paidInvoices: 0,
      partialInvoices: 0,
      dueInvoices: 0,
      avgOrderValue: 0
    };

    res.status(200).json({
      success: true,
      data: {
        date: today.toDateString(),
        summary: {
          totalInvoices: result.totalInvoices,
          totalSales: result.totalSales,
          totalPaid: result.totalPaid,
          totalDue: result.totalDue,
          avgOrderValue: result.avgOrderValue,
          paidInvoices: result.paidInvoices,
          partialInvoices: result.partialInvoices,
          dueInvoices: result.dueInvoices,
          collectionRate: result.totalSales > 0 ? (result.totalPaid / result.totalSales) * 100 : 0
        },
        trends: {
          hourlySales,
          topProducts,
          paymentMethods
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get monthly profit summary
// @route   GET /api/dashboard/monthly-profit
// @access  Private (Manager and above)
export const getMonthlyProfit = async (req, res, next) => {
  try {
    const { month, year } = req.query;
    const currentDate = new Date();
    const targetMonth = month ? parseInt(month) : currentDate.getMonth() + 1;
    const targetYear = year ? parseInt(year) : currentDate.getFullYear();

    // Calculate current month profit
    const currentMonthProfit = await calculateMonthlyProfit(targetMonth, targetYear, req.user);

    // Calculate previous month for comparison
    let prevMonth = targetMonth - 1;
    let prevYear = targetYear;
    if (prevMonth === 0) {
      prevMonth = 12;
      prevYear = targetYear - 1;
    }

    let previousMonthProfit = null;
    try {
      previousMonthProfit = await calculateMonthlyProfit(prevMonth, prevYear, req.user);
    } catch (error) {
      // Previous month data might not exist
      console.log('Previous month data not available:', error.message);
    }

    // Get monthly trends for the last 6 months
    const monthlyTrends = await ProfitAnalytics.aggregate([
      {
        $match: {
          analysisType: 'monthly',
          periodStart: {
            $gte: new Date(targetYear - 1, targetMonth - 1, 1),
            $lte: new Date(targetYear, targetMonth, 0)
          }
        }
      },
      {
        $project: {
          month: { $month: '$periodStart' },
          year: { $year: '$periodStart' },
          totalSales: '$revenue.totalSales',
          totalCosts: '$costs.totalCosts',
          netProfit: '$profit.netProfit',
          profitMargin: '$profit.profitMargin'
        }
      },
      { $sort: { year: 1, month: 1 } },
      { $limit: 6 }
    ]);

    // Calculate month-over-month changes
    let profitChange = 0;
    let salesChange = 0;
    let marginChange = 0;

    if (previousMonthProfit) {
      if (previousMonthProfit.profit.netProfit !== 0) {
        profitChange = ((currentMonthProfit.profit.netProfit - previousMonthProfit.profit.netProfit) / Math.abs(previousMonthProfit.profit.netProfit)) * 100;
      }
      if (previousMonthProfit.revenue.totalSales !== 0) {
        salesChange = ((currentMonthProfit.revenue.totalSales - previousMonthProfit.revenue.totalSales) / previousMonthProfit.revenue.totalSales) * 100;
      }
      marginChange = currentMonthProfit.profit.profitMargin - previousMonthProfit.profit.profitMargin;
    }

    res.status(200).json({
      success: true,
      data: {
        period: {
          month: targetMonth,
          year: targetYear,
          monthName: new Date(targetYear, targetMonth - 1).toLocaleString('default', { month: 'long' })
        },
        currentMonth: {
          totalSales: currentMonthProfit.revenue.totalSales,
          totalCosts: currentMonthProfit.costs.totalCosts,
          netProfit: currentMonthProfit.profit.netProfit,
          profitMargin: currentMonthProfit.profit.profitMargin,
          profitStatus: currentMonthProfit.profitStatus,
          invoiceCount: currentMonthProfit.revenue.invoiceCount,
          avgOrderValue: currentMonthProfit.revenue.averageOrderValue
        },
        comparison: {
          profitChange,
          salesChange,
          marginChange,
          previousMonth: previousMonthProfit ? {
            netProfit: previousMonthProfit.profit.netProfit,
            totalSales: previousMonthProfit.revenue.totalSales,
            profitMargin: previousMonthProfit.profit.profitMargin
          } : null
        },
        trends: monthlyTrends,
        costBreakdown: currentMonthProfit.costBreakdownPercentages
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get total investments summary
// @route   GET /api/dashboard/total-investments
// @access  Private (Manager and above)
export const getTotalInvestments = async (req, res, next) => {
  try {
    // Get overall investment statistics
    const investmentStats = await Investment.aggregate([
      {
        $group: {
          _id: null,
          totalInvestments: { $sum: 1 },
          totalAmount: { $sum: '$amount' },
          totalROI: { $sum: '$actualROI.amount' },
          avgInvestmentAmount: { $avg: '$amount' },
          pendingInvestments: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
          approvedInvestments: { $sum: { $cond: [{ $eq: ['$status', 'approved'] }, 1, 0] } },
          completedInvestments: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
          pendingAmount: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, '$amount', 0] } },
          approvedAmount: { $sum: { $cond: [{ $eq: ['$status', 'approved'] }, '$amount', 0] } },
          completedAmount: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, '$amount', 0] } }
        }
      }
    ]);

    // Get investments by category
    const categoryBreakdown = await Investment.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' },
          avgAmount: { $avg: '$amount' },
          totalROI: { $sum: '$actualROI.amount' }
        }
      },
      { $sort: { totalAmount: -1 } }
    ]);

    // Get investments by type
    const typeBreakdown = await Investment.aggregate([
      {
        $group: {
          _id: '$investmentType',
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' },
          avgROI: { $avg: '$actualROI.percentage' }
        }
      },
      { $sort: { totalAmount: -1 } }
    ]);

    // Get recent investments (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentInvestments = await Investment.find({
      createdAt: { $gte: thirtyDaysAgo }
    })
    .select('investmentId title amount investmentType status createdAt')
    .sort({ createdAt: -1 })
    .limit(10);

    // Get monthly investment trends (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyTrends = await Investment.aggregate([
      {
        $match: {
          investmentDate: { $gte: sixMonthsAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$investmentDate' },
            month: { $month: '$investmentDate' }
          },
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' },
          avgAmount: { $avg: '$amount' }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    // Get top performing investments
    const topPerformers = await Investment.find({
      'actualROI.amount': { $gt: 0 }
    })
    .select('investmentId title amount actualROI investmentType')
    .sort({ 'actualROI.percentage': -1 })
    .limit(5);

    const stats = investmentStats[0] || {
      totalInvestments: 0,
      totalAmount: 0,
      totalROI: 0,
      avgInvestmentAmount: 0,
      pendingInvestments: 0,
      approvedInvestments: 0,
      completedInvestments: 0,
      pendingAmount: 0,
      approvedAmount: 0,
      completedAmount: 0
    };

    // Calculate overall ROI percentage
    const overallROIPercentage = stats.totalAmount > 0 ? 
      ((stats.totalROI - stats.totalAmount) / stats.totalAmount) * 100 : 0;

    res.status(200).json({
      success: true,
      data: {
        summary: {
          totalInvestments: stats.totalInvestments,
          totalAmount: stats.totalAmount,
          totalROI: stats.totalROI,
          overallROIPercentage,
          avgInvestmentAmount: stats.avgInvestmentAmount,
          pendingInvestments: stats.pendingInvestments,
          approvedInvestments: stats.approvedInvestments,
          completedInvestments: stats.completedInvestments
        },
        statusBreakdown: {
          pending: {
            count: stats.pendingInvestments,
            amount: stats.pendingAmount
          },
          approved: {
            count: stats.approvedInvestments,
            amount: stats.approvedAmount
          },
          completed: {
            count: stats.completedInvestments,
            amount: stats.completedAmount
          }
        },
        categoryBreakdown,
        typeBreakdown,
        recentInvestments,
        monthlyTrends,
        topPerformers
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get inventory alerts
// @route   GET /api/dashboard/inventory-alerts
// @access  Private (All authenticated users)
export const getInventoryAlerts = async (req, res, next) => {
  try {
    const { threshold = 10 } = req.query;
    const stockThreshold = parseInt(threshold);

    // Get low stock products
    const lowStockProducts = await Product.find({
      stockQuantity: { $lte: stockThreshold },
      isActive: true
    })
    .select('name category stockQuantity unit sellingPrice purchasePrice')
    .sort({ stockQuantity: 1 });

    // Get out of stock products
    const outOfStockProducts = await Product.find({
      stockQuantity: 0,
      isActive: true
    })
    .select('name category unit sellingPrice purchasePrice')
    .sort({ name: 1 });

    // Get overstocked products (more than 100 units)
    const overstockedProducts = await Product.find({
      stockQuantity: { $gte: 100 },
      isActive: true
    })
    .select('name category stockQuantity unit purchasePrice')
    .sort({ stockQuantity: -1 })
    .limit(10);

    // Get inventory value by category
    const inventoryValue = await Product.aggregate([
      {
        $match: { isActive: true }
      },
      {
        $group: {
          _id: '$category',
          totalProducts: { $sum: 1 },
          totalQuantity: { $sum: '$stockQuantity' },
          totalValue: { $sum: { $multiply: ['$stockQuantity', '$purchasePrice'] } },
          avgStockLevel: { $avg: '$stockQuantity' },
          lowStockCount: { $sum: { $cond: [{ $lte: ['$stockQuantity', stockThreshold] }, 1, 0] } },
          outOfStockCount: { $sum: { $cond: [{ $eq: ['$stockQuantity', 0] }, 1, 0] } }
        }
      },
      { $sort: { totalValue: -1 } }
    ]);

    // Get recent stock movements (from recent invoices)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentMovements = await Invoice.aggregate([
      {
        $match: {
          createdAt: { $gte: sevenDaysAgo },
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
          category: { $first: '$productDetails.category' },
          currentStock: { $first: '$productDetails.stockQuantity' },
          totalSold: { $sum: '$items.quantity' },
          totalRevenue: { $sum: '$items.totalPrice' }
        }
      },
      { $sort: { totalSold: -1 } },
      { $limit: 10 }
    ]);

    // Calculate overall inventory metrics
    const overallMetrics = await Product.aggregate([
      {
        $match: { isActive: true }
      },
      {
        $group: {
          _id: null,
          totalProducts: { $sum: 1 },
          totalInventoryValue: { $sum: { $multiply: ['$stockQuantity', '$purchasePrice'] } },
          totalQuantity: { $sum: '$stockQuantity' },
          avgStockLevel: { $avg: '$stockQuantity' },
          lowStockProducts: { $sum: { $cond: [{ $lte: ['$stockQuantity', stockThreshold] }, 1, 0] } },
          outOfStockProducts: { $sum: { $cond: [{ $eq: ['$stockQuantity', 0] }, 1, 0] } }
        }
      }
    ]);

    const metrics = overallMetrics[0] || {
      totalProducts: 0,
      totalInventoryValue: 0,
      totalQuantity: 0,
      avgStockLevel: 0,
      lowStockProducts: 0,
      outOfStockProducts: 0
    };

    // Calculate alert levels
    const criticalAlerts = outOfStockProducts.length;
    const warningAlerts = lowStockProducts.length - criticalAlerts;
    const totalAlerts = criticalAlerts + warningAlerts;

    res.status(200).json({
      success: true,
      data: {
        alertSummary: {
          totalAlerts,
          criticalAlerts,
          warningAlerts,
          threshold: stockThreshold,
          alertRate: metrics.totalProducts > 0 ? (totalAlerts / metrics.totalProducts) * 100 : 0
        },
        inventoryMetrics: {
          totalProducts: metrics.totalProducts,
          totalInventoryValue: metrics.totalInventoryValue,
          totalQuantity: metrics.totalQuantity,
          avgStockLevel: metrics.avgStockLevel,
          lowStockProducts: metrics.lowStockProducts,
          outOfStockProducts: metrics.outOfStockProducts
        },
        alerts: {
          outOfStock: outOfStockProducts,
          lowStock: lowStockProducts,
          overstocked: overstockedProducts
        },
        categoryBreakdown: inventoryValue,
        recentMovements
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get due invoices summary
// @route   GET /api/dashboard/due-invoices
// @access  Private (All authenticated users)
export const getDueInvoices = async (req, res, next) => {
  try {
    const { daysOverdue = 30 } = req.query;
    const overdueThreshold = parseInt(daysOverdue);
    
    const now = new Date();
    const overdueDate = new Date();
    overdueDate.setDate(overdueDate.getDate() - overdueThreshold);

    // Get all due and partial invoices
    const dueInvoices = await Invoice.find({
      status: { $in: ['due', 'partial'] },
      isActive: true
    })
    .select('invoiceNo customerName customerPhone grandTotal paidAmount dueAmount createdAt status')
    .sort({ createdAt: 1 });

    // Categorize invoices by age
    const categorizedInvoices = {
      current: [], // 0-7 days
      recent: [],  // 8-30 days
      overdue: [], // 31-60 days
      critical: [] // 60+ days
    };

    let totalDueAmount = 0;
    let totalOverdueAmount = 0;

    dueInvoices.forEach(invoice => {
      const daysSinceCreated = Math.floor((now - invoice.createdAt) / (1000 * 60 * 60 * 24));
      totalDueAmount += invoice.dueAmount;

      if (daysSinceCreated <= 7) {
        categorizedInvoices.current.push({ ...invoice.toObject(), daysOld: daysSinceCreated });
      } else if (daysSinceCreated <= 30) {
        categorizedInvoices.recent.push({ ...invoice.toObject(), daysOld: daysSinceCreated });
      } else if (daysSinceCreated <= 60) {
        categorizedInvoices.overdue.push({ ...invoice.toObject(), daysOld: daysSinceCreated });
        totalOverdueAmount += invoice.dueAmount;
      } else {
        categorizedInvoices.critical.push({ ...invoice.toObject(), daysOld: daysSinceCreated });
        totalOverdueAmount += invoice.dueAmount;
      }
    });

    // Get top customers by due amount
    const topDebtors = await Invoice.aggregate([
      {
        $match: {
          status: { $in: ['due', 'partial'] },
          isActive: true
        }
      },
      {
        $group: {
          _id: '$customerName',
          customerPhone: { $first: '$customerPhone' },
          totalDue: { $sum: '$dueAmount' },
          invoiceCount: { $sum: 1 },
          oldestInvoice: { $min: '$createdAt' }
        }
      },
      { $sort: { totalDue: -1 } },
      { $limit: 10 }
    ]);

    // Get aging analysis
    const agingAnalysis = await Invoice.aggregate([
      {
        $match: {
          status: { $in: ['due', 'partial'] },
          isActive: true
        }
      },
      {
        $addFields: {
          daysOld: {
            $floor: {
              $divide: [
                { $subtract: [new Date(), '$createdAt'] },
                1000 * 60 * 60 * 24
              ]
            }
          }
        }
      },
      {
        $bucket: {
          groupBy: '$daysOld',
          boundaries: [0, 8, 31, 61, 1000],
          default: 'other',
          output: {
            count: { $sum: 1 },
            totalAmount: { $sum: '$dueAmount' },
            avgAmount: { $avg: '$dueAmount' }
          }
        }
      }
    ]);

    // Get monthly collection trends
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const collectionTrends = await Invoice.aggregate([
      {
        $match: {
          createdAt: { $gte: sixMonthsAgo },
          isActive: true
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          totalInvoices: { $sum: 1 },
          totalAmount: { $sum: '$grandTotal' },
          totalCollected: { $sum: '$paidAmount' },
          totalDue: { $sum: '$dueAmount' }
        }
      },
      {
        $addFields: {
          collectionRate: {
            $cond: {
              if: { $gt: ['$totalAmount', 0] },
              then: { $multiply: [{ $divide: ['$totalCollected', '$totalAmount'] }, 100] },
              else: 0
            }
          }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    // Calculate summary statistics
    const summary = {
      totalDueInvoices: dueInvoices.length,
      totalDueAmount,
      totalOverdueAmount,
      currentInvoices: categorizedInvoices.current.length,
      recentInvoices: categorizedInvoices.recent.length,
      overdueInvoices: categorizedInvoices.overdue.length,
      criticalInvoices: categorizedInvoices.critical.length,
      avgDueAmount: dueInvoices.length > 0 ? totalDueAmount / dueInvoices.length : 0,
      overdueRate: dueInvoices.length > 0 ? 
        ((categorizedInvoices.overdue.length + categorizedInvoices.critical.length) / dueInvoices.length) * 100 : 0
    };

    res.status(200).json({
      success: true,
      data: {
        summary,
        categorizedInvoices,
        topDebtors,
        agingAnalysis,
        collectionTrends
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get salary summary
// @route   GET /api/dashboard/salary-summary
// @access  Private (Manager and above)
export const getSalarySummary = async (req, res, next) => {
  try {
    const { month, year } = req.query;
    const currentDate = new Date();
    const targetMonth = month ? parseInt(month) : currentDate.getMonth() + 1;
    const targetYear = year ? parseInt(year) : currentDate.getFullYear();

    // Get current month salary summary
    const currentMonthSalaries = await SalaryPayment.aggregate([
      {
        $match: {
          paymentMonth: targetMonth,
          paymentYear: targetYear
        }
      },
      {
        $lookup: {
          from: 'employees',
          localField: 'employee',
          foreignField: '_id',
          as: 'employeeDetails'
        }
      },
      { $unwind: '$employeeDetails' },
      {
        $group: {
          _id: null,
          totalEmployees: { $sum: 1 },
          totalGrossSalary: { $sum: '$grossSalary' },
          totalDeductions: { $sum: '$totalDeductions' },
          totalNetSalary: { $sum: '$netSalary' },
          paidSalaries: { $sum: { $cond: [{ $eq: ['$status', 'paid'] }, 1, 0] } },
          dueSalaries: { $sum: { $cond: [{ $eq: ['$status', 'due'] }, 1, 0] } },
          totalPaidAmount: { $sum: { $cond: [{ $eq: ['$status', 'paid'] }, '$netSalary', 0] } },
          totalDueAmount: { $sum: { $cond: [{ $eq: ['$status', 'due'] }, '$netSalary', 0] } },
          avgGrossSalary: { $avg: '$grossSalary' },
          avgNetSalary: { $avg: '$netSalary' }
        }
      }
    ]);

    // Get department-wise salary breakdown
    const departmentBreakdown = await SalaryPayment.aggregate([
      {
        $match: {
          paymentMonth: targetMonth,
          paymentYear: targetYear
        }
      },
      {
        $lookup: {
          from: 'employees',
          localField: 'employee',
          foreignField: '_id',
          as: 'employeeDetails'
        }
      },
      { $unwind: '$employeeDetails' },
      {
        $group: {
          _id: '$employeeDetails.department',
          employeeCount: { $sum: 1 },
          totalGrossSalary: { $sum: '$grossSalary' },
          totalNetSalary: { $sum: '$netSalary' },
          avgSalary: { $avg: '$netSalary' },
          paidCount: { $sum: { $cond: [{ $eq: ['$status', 'paid'] }, 1, 0] } },
          dueCount: { $sum: { $cond: [{ $eq: ['$status', 'due'] }, 1, 0] } }
        }
      },
      { $sort: { totalNetSalary: -1 } }
    ]);

    // Get salary status breakdown
    const statusBreakdown = await SalaryPayment.aggregate([
      {
        $match: {
          paymentMonth: targetMonth,
          paymentYear: targetYear
        }
      },
      {
        $lookup: {
          from: 'employees',
          localField: 'employee',
          foreignField: '_id',
          as: 'employeeDetails'
        }
      },
      { $unwind: '$employeeDetails' },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$netSalary' },
          employees: {
            $push: {
              employeeId: '$employeeDetails.employeeId',
              name: '$employeeDetails.name',
              department: '$employeeDetails.department',
              netSalary: '$netSalary',
              paymentDate: '$paymentDate'
            }
          }
        }
      }
    ]);

    // Get monthly salary trends (last 6 months)
    const sixMonthsAgo = new Date(targetYear, targetMonth - 7, 1);
    const endDate = new Date(targetYear, targetMonth, 0);

    const monthlyTrends = await SalaryPayment.aggregate([
      {
        $match: {
          $expr: {
            $and: [
              { $gte: [{ $dateFromParts: { year: '$paymentYear', month: '$paymentMonth' } }, sixMonthsAgo] },
              { $lte: [{ $dateFromParts: { year: '$paymentYear', month: '$paymentMonth' } }, endDate] }
            ]
          }
        }
      },
      {
        $group: {
          _id: {
            year: '$paymentYear',
            month: '$paymentMonth'
          },
          employeeCount: { $sum: 1 },
          totalGrossSalary: { $sum: '$grossSalary' },
          totalNetSalary: { $sum: '$netSalary' },
          totalDeductions: { $sum: '$totalDeductions' },
          paidCount: { $sum: { $cond: [{ $eq: ['$status', 'paid'] }, 1, 0] } }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    // Get upcoming salary dues (employees without salary for current month)
    const allActiveEmployees = await SalaryPayment.aggregate([
      {
        $lookup: {
          from: 'employees',
          localField: 'employee',
          foreignField: '_id',
          as: 'employeeDetails'
        }
      },
      { $unwind: '$employeeDetails' },
      {
        $match: {
          'employeeDetails.isActive': true
        }
      },
      {
        $group: {
          _id: '$employee',
          hasSalaryThisMonth: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ['$paymentMonth', targetMonth] },
                    { $eq: ['$paymentYear', targetYear] }
                  ]
                },
                1,
                0
              ]
            }
          },
          employeeDetails: { $first: '$employeeDetails' }
        }
      },
      {
        $match: {
          hasSalaryThisMonth: 0
        }
      },
      {
        $project: {
          employeeId: '$employeeDetails.employeeId',
          name: '$employeeDetails.name',
          department: '$employeeDetails.department',
          monthlySalary: '$employeeDetails.monthlySalary'
        }
      }
    ]);

    const summary = currentMonthSalaries[0] || {
      totalEmployees: 0,
      totalGrossSalary: 0,
      totalDeductions: 0,
      totalNetSalary: 0,
      paidSalaries: 0,
      dueSalaries: 0,
      totalPaidAmount: 0,
      totalDueAmount: 0,
      avgGrossSalary: 0,
      avgNetSalary: 0
    };

    // Calculate additional metrics
    const paymentRate = summary.totalEmployees > 0 ? (summary.paidSalaries / summary.totalEmployees) * 100 : 0;
    const deductionRate = summary.totalGrossSalary > 0 ? (summary.totalDeductions / summary.totalGrossSalary) * 100 : 0;

    res.status(200).json({
      success: true,
      data: {
        period: {
          month: targetMonth,
          year: targetYear,
          monthName: new Date(targetYear, targetMonth - 1).toLocaleString('default', { month: 'long' })
        },
        summary: {
          ...summary,
          paymentRate,
          deductionRate,
          pendingEmployees: allActiveEmployees.length
        },
        departmentBreakdown,
        statusBreakdown,
        monthlyTrends,
        upcomingSalaries: allActiveEmployees
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get complete dashboard overview
// @route   GET /api/dashboard/overview
// @access  Private (Manager and above)
export const getDashboardOverview = async (req, res, next) => {
  try {
    // Get quick summaries from all dashboard endpoints
    const today = new Date();
    const currentMonth = today.getMonth() + 1;
    const currentYear = today.getFullYear();

    // Parallel execution of all dashboard queries for better performance
    const [
      todaysSalesData,
      monthlyProfitData,
      investmentData,
      inventoryData,
      dueInvoicesData,
      salaryData
    ] = await Promise.allSettled([
      // Today's sales summary
      Invoice.aggregate([
        {
          $match: {
            createdAt: {
              $gte: new Date(today.getFullYear(), today.getMonth(), today.getDate()),
              $lte: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999)
            },
            isActive: true
          }
        },
        {
          $group: {
            _id: null,
            totalSales: { $sum: '$grandTotal' },
            totalPaid: { $sum: '$paidAmount' },
            invoiceCount: { $sum: 1 }
          }
        }
      ]),

      // Monthly profit summary
      ProfitAnalytics.findOne({
        analysisType: 'monthly',
        $expr: {
          $and: [
            { $eq: [{ $month: '$periodStart' }, currentMonth] },
            { $eq: [{ $year: '$periodStart' }, currentYear] }
          ]
        }
      }).sort({ createdAt: -1 }),

      // Investment summary
      Investment.aggregate([
        {
          $group: {
            _id: null,
            totalAmount: { $sum: '$amount' },
            totalROI: { $sum: '$actualROI.amount' },
            pendingCount: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } }
          }
        }
      ]),

      // Inventory alerts
      Product.aggregate([
        {
          $match: { isActive: true }
        },
        {
          $group: {
            _id: null,
            lowStockCount: { $sum: { $cond: [{ $lte: ['$stockQuantity', 10] }, 1, 0] } },
            outOfStockCount: { $sum: { $cond: [{ $eq: ['$stockQuantity', 0] }, 1, 0] } },
            totalValue: { $sum: { $multiply: ['$stockQuantity', '$purchasePrice'] } }
          }
        }
      ]),

      // Due invoices summary
      Invoice.aggregate([
        {
          $match: {
            status: { $in: ['due', 'partial'] },
            isActive: true
          }
        },
        {
          $group: {
            _id: null,
            totalDue: { $sum: '$dueAmount' },
            invoiceCount: { $sum: 1 }
          }
        }
      ]),

      // Salary summary
      SalaryPayment.aggregate([
        {
          $match: {
            paymentMonth: currentMonth,
            paymentYear: currentYear
          }
        },
        {
          $group: {
            _id: null,
            totalNetSalary: { $sum: '$netSalary' },
            paidCount: { $sum: { $cond: [{ $eq: ['$status', 'paid'] }, 1, 0] } },
            dueCount: { $sum: { $cond: [{ $eq: ['$status', 'due'] }, 1, 0] } }
          }
        }
      ])
    ]);

    // Process results with error handling
    const processResult = (result, defaultValue = {}) => {
      return result.status === 'fulfilled' && result.value ? 
        (Array.isArray(result.value) ? result.value[0] || defaultValue : result.value) : 
        defaultValue;
    };

    const todaysSales = processResult(todaysSalesData, { totalSales: 0, totalPaid: 0, invoiceCount: 0 });
    const monthlyProfit = processResult(monthlyProfitData, { profit: { netProfit: 0 }, revenue: { totalSales: 0 } });
    const investments = processResult(investmentData, { totalAmount: 0, totalROI: 0, pendingCount: 0 });
    const inventory = processResult(inventoryData, { lowStockCount: 0, outOfStockCount: 0, totalValue: 0 });
    const dueInvoices = processResult(dueInvoicesData, { totalDue: 0, invoiceCount: 0 });
    const salaries = processResult(salaryData, { totalNetSalary: 0, paidCount: 0, dueCount: 0 });

    res.status(200).json({
      success: true,
      data: {
        lastUpdated: new Date(),
        todaysSales: {
          totalSales: todaysSales.totalSales,
          totalPaid: todaysSales.totalPaid,
          invoiceCount: todaysSales.invoiceCount,
          collectionRate: todaysSales.totalSales > 0 ? (todaysSales.totalPaid / todaysSales.totalSales) * 100 : 0
        },
        monthlyProfit: {
          netProfit: monthlyProfit.profit?.netProfit || 0,
          totalSales: monthlyProfit.revenue?.totalSales || 0,
          profitMargin: monthlyProfit.profit?.profitMargin || 0,
          status: monthlyProfit.profit?.netProfit > 0 ? 'profitable' : monthlyProfit.profit?.netProfit === 0 ? 'break-even' : 'loss'
        },
        investments: {
          totalAmount: investments.totalAmount,
          totalROI: investments.totalROI,
          pendingCount: investments.pendingCount,
          roiPercentage: investments.totalAmount > 0 ? ((investments.totalROI - investments.totalAmount) / investments.totalAmount) * 100 : 0
        },
        inventory: {
          lowStockAlerts: inventory.lowStockCount,
          outOfStockAlerts: inventory.outOfStockCount,
          totalValue: inventory.totalValue,
          totalAlerts: inventory.lowStockCount + inventory.outOfStockCount
        },
        dueInvoices: {
          totalDue: dueInvoices.totalDue,
          invoiceCount: dueInvoices.invoiceCount,
          avgDueAmount: dueInvoices.invoiceCount > 0 ? dueInvoices.totalDue / dueInvoices.invoiceCount : 0
        },
        salaries: {
          totalAmount: salaries.totalNetSalary,
          paidCount: salaries.paidCount,
          dueCount: salaries.dueCount,
          paymentRate: (salaries.paidCount + salaries.dueCount) > 0 ? (salaries.paidCount / (salaries.paidCount + salaries.dueCount)) * 100 : 0
        }
      }
    });
  } catch (error) {
    next(error);
  }
};