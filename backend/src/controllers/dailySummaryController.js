import asyncHandler from '../utils/asyncHandler.js';
import Invoice from '../models/Invoice.js';
import Expense from '../models/Expense.js';
import SalaryPayment from '../models/SalaryPayment.js';
import mongoose from 'mongoose';

// @desc    Get daily business summary
// @route   GET /api/daily-summary
// @access  Private (All authenticated users)
export const getDailySummary = asyncHandler(async (req, res) => {
  const { date } = req.query;
  
  // Use provided date or today
  const targetDate = date ? new Date(date) : new Date();
  
  // Set date range for the target day (start and end of day)
  const startOfDay = new Date(targetDate);
  startOfDay.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date(targetDate);
  endOfDay.setHours(23, 59, 59, 999);

  try {
    // Get invoice statistics for the day
    const invoiceStats = await Invoice.aggregate([
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
          paidInvoices: {
            $sum: { $cond: [{ $eq: ['$status', 'paid'] }, 1, 0] }
          },
          partialInvoices: {
            $sum: { $cond: [{ $eq: ['$status', 'partial'] }, 1, 0] }
          },
          dueInvoices: {
            $sum: { $cond: [{ $eq: ['$status', 'due'] }, 1, 0] }
          }
        }
      }
    ]);

    // Get new dues created today (invoices with due amount > 0)
    const newDues = await Invoice.aggregate([
      {
        $match: {
          createdAt: { $gte: startOfDay, $lte: endOfDay },
          isActive: true,
          dueAmount: { $gt: 0 }
        }
      },
      {
        $group: {
          _id: null,
          count: { $sum: 1 },
          totalAmount: { $sum: '$dueAmount' }
        }
      }
    ]);

    // Get expenses for the day
    const expenseStats = await Expense.aggregate([
      {
        $match: {
          date: { $gte: startOfDay, $lte: endOfDay },
          isActive: true
        }
      },
      {
        $group: {
          _id: null,
          totalExpenses: { $sum: '$amount' },
          expenseCount: { $sum: 1 }
        }
      }
    ]);

    // Get salary payments for the day
    const salaryStats = await SalaryPayment.aggregate([
      {
        $match: {
          paidDate: { $gte: startOfDay, $lte: endOfDay },
          status: 'paid'
        }
      },
      {
        $group: {
          _id: null,
          totalSalaries: { $sum: '$netSalary' },
          salaryCount: { $sum: 1 }
        }
      }
    ]);

    // Calculate basic profit (Sales - Expenses - Salaries)
    const sales = invoiceStats[0]?.totalSales || 0;
    const expenses = expenseStats[0]?.totalExpenses || 0;
    const salaries = salaryStats[0]?.totalSalaries || 0;
    const basicProfit = sales - expenses - salaries;

    // Get top selling items for the day
    const topItems = await Invoice.aggregate([
      {
        $match: {
          createdAt: { $gte: startOfDay, $lte: endOfDay },
          isActive: true
        }
      },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.productName',
          totalQuantity: { $sum: '$items.quantity' },
          totalRevenue: { $sum: '$items.totalPrice' },
          invoiceCount: { $sum: 1 }
        }
      },
      { $sort: { totalRevenue: -1 } },
      { $limit: 5 }
    ]);

    // Get payment method breakdown
    const paymentMethods = await Invoice.aggregate([
      {
        $match: {
          createdAt: { $gte: startOfDay, $lte: endOfDay },
          isActive: true,
          paidAmount: { $gt: 0 }
        }
      },
      {
        $group: {
          _id: '$paymentMethod',
          count: { $sum: 1 },
          totalAmount: { $sum: '$paidAmount' }
        }
      },
      { $sort: { totalAmount: -1 } }
    ]);

    // Get hourly sales distribution
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

    // Prepare response data
    const summary = {
      date: targetDate.toISOString().split('T')[0],
      dateFormatted: targetDate.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      
      // Invoice metrics
      invoices: {
        total: invoiceStats[0]?.totalInvoices || 0,
        paid: invoiceStats[0]?.paidInvoices || 0,
        partial: invoiceStats[0]?.partialInvoices || 0,
        due: invoiceStats[0]?.dueInvoices || 0
      },
      
      // Financial metrics
      sales: {
        total: sales,
        paid: invoiceStats[0]?.totalPaid || 0,
        due: invoiceStats[0]?.totalDue || 0
      },
      
      // New dues created today
      newDues: {
        count: newDues[0]?.count || 0,
        amount: newDues[0]?.totalAmount || 0
      },
      
      // Expense metrics
      expenses: {
        total: expenses,
        count: expenseStats[0]?.expenseCount || 0,
        salaries: salaries,
        salaryCount: salaryStats[0]?.salaryCount || 0,
        other: expenses - salaries
      },
      
      // Profit calculation
      profit: {
        basic: basicProfit,
        margin: sales > 0 ? ((basicProfit / sales) * 100).toFixed(2) : 0
      },
      
      // Additional insights
      insights: {
        topItems: topItems.map(item => ({
          name: item._id,
          quantity: item.totalQuantity,
          revenue: item.totalRevenue,
          invoices: item.invoiceCount
        })),
        paymentMethods: paymentMethods.map(method => ({
          method: method._id,
          count: method.count,
          amount: method.totalAmount
        })),
        hourlySales: hourlySales.map(hour => ({
          hour: hour._id,
          sales: hour.sales,
          count: hour.count
        }))
      }
    };

    res.status(200).json({
      success: true,
      data: summary
    });

  } catch (error) {
    console.error('Error generating daily summary:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating daily summary'
    });
  }
});

// @desc    Get weekly summary comparison
// @route   GET /api/daily-summary/weekly
// @access  Private (Manager and above)
export const getWeeklySummary = asyncHandler(async (req, res) => {
  const { date } = req.query;
  
  // Use provided date or today
  const targetDate = date ? new Date(date) : new Date();
  
  // Get the last 7 days including target date
  const summaries = [];
  
  for (let i = 6; i >= 0; i--) {
    const currentDate = new Date(targetDate);
    currentDate.setDate(currentDate.getDate() - i);
    
    const startOfDay = new Date(currentDate);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(currentDate);
    endOfDay.setHours(23, 59, 59, 999);

    // Get basic stats for this day
    const dayStats = await Invoice.aggregate([
      {
        $match: {
          createdAt: { $gte: startOfDay, $lte: endOfDay },
          isActive: true
        }
      },
      {
        $group: {
          _id: null,
          invoices: { $sum: 1 },
          sales: { $sum: '$grandTotal' },
          paid: { $sum: '$paidAmount' }
        }
      }
    ]);

    const expenseStats = await Expense.aggregate([
      {
        $match: {
          date: { $gte: startOfDay, $lte: endOfDay },
          isActive: true
        }
      },
      {
        $group: {
          _id: null,
          expenses: { $sum: '$amount' }
        }
      }
    ]);

    const sales = dayStats[0]?.sales || 0;
    const expenses = expenseStats[0]?.expenses || 0;

    summaries.push({
      date: currentDate.toISOString().split('T')[0],
      dayName: currentDate.toLocaleDateString('en-US', { weekday: 'short' }),
      invoices: dayStats[0]?.invoices || 0,
      sales: sales,
      paid: dayStats[0]?.paid || 0,
      expenses: expenses,
      profit: sales - expenses
    });
  }

  // Calculate week totals
  const weekTotals = summaries.reduce((acc, day) => ({
    invoices: acc.invoices + day.invoices,
    sales: acc.sales + day.sales,
    paid: acc.paid + day.paid,
    expenses: acc.expenses + day.expenses,
    profit: acc.profit + day.profit
  }), { invoices: 0, sales: 0, paid: 0, expenses: 0, profit: 0 });

  res.status(200).json({
    success: true,
    data: {
      period: `${summaries[0].date} to ${summaries[6].date}`,
      dailySummaries: summaries,
      weekTotals: weekTotals,
      averages: {
        dailySales: weekTotals.sales / 7,
        dailyProfit: weekTotals.profit / 7,
        dailyInvoices: weekTotals.invoices / 7
      }
    }
  });
});

// @desc    Get monthly summary
// @route   GET /api/daily-summary/monthly
// @access  Private (Manager and above)
export const getMonthlySummary = asyncHandler(async (req, res) => {
  const { year, month } = req.query;
  
  // Use provided year/month or current
  const targetYear = year ? parseInt(year) : new Date().getFullYear();
  const targetMonth = month ? parseInt(month) - 1 : new Date().getMonth(); // month is 0-indexed
  
  // Get start and end of month
  const startOfMonth = new Date(targetYear, targetMonth, 1);
  const endOfMonth = new Date(targetYear, targetMonth + 1, 0, 23, 59, 59, 999);

  // Get monthly statistics
  const monthlyStats = await Invoice.aggregate([
    {
      $match: {
        createdAt: { $gte: startOfMonth, $lte: endOfMonth },
        isActive: true
      }
    },
    {
      $group: {
        _id: null,
        totalInvoices: { $sum: 1 },
        totalSales: { $sum: '$grandTotal' },
        totalPaid: { $sum: '$paidAmount' },
        totalDue: { $sum: '$dueAmount' }
      }
    }
  ]);

  const monthlyExpenses = await Expense.aggregate([
    {
      $match: {
        date: { $gte: startOfMonth, $lte: endOfMonth },
        isActive: true
      }
    },
    {
      $group: {
        _id: null,
        totalExpenses: { $sum: '$amount' }
      }
    }
  ]);

  // Get daily breakdown for the month
  const dailyBreakdown = await Invoice.aggregate([
    {
      $match: {
        createdAt: { $gte: startOfMonth, $lte: endOfMonth },
        isActive: true
      }
    },
    {
      $group: {
        _id: { $dayOfMonth: '$createdAt' },
        sales: { $sum: '$grandTotal' },
        invoices: { $sum: 1 }
      }
    },
    { $sort: { '_id': 1 } }
  ]);

  const sales = monthlyStats[0]?.totalSales || 0;
  const expenses = monthlyExpenses[0]?.totalExpenses || 0;
  const profit = sales - expenses;

  res.status(200).json({
    success: true,
    data: {
      period: `${startOfMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`,
      summary: {
        invoices: monthlyStats[0]?.totalInvoices || 0,
        sales: sales,
        paid: monthlyStats[0]?.totalPaid || 0,
        due: monthlyStats[0]?.totalDue || 0,
        expenses: expenses,
        profit: profit,
        profitMargin: sales > 0 ? ((profit / sales) * 100).toFixed(2) : 0
      },
      dailyBreakdown: dailyBreakdown.map(day => ({
        day: day._id,
        sales: day.sales,
        invoices: day.invoices
      }))
    }
  });
});

export default {
  getDailySummary,
  getWeeklySummary,
  getMonthlySummary
};