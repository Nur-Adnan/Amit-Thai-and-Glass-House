import ProfitAnalytics from '../models/ProfitAnalytics.js';
import {
  calculateDailyProfit,
  calculateMonthlyProfit,
  calculateProductWiseProfit,
  getProfitTrends,
  getTopPerformingProducts
} from '../services/profitCalculationService.js';

// @desc    Calculate daily profit
// @route   POST /api/profit/daily
// @access  Private (Manager and above)
export const calculateDailyProfitAnalysis = async (req, res, next) => {
  try {
    const { date } = req.body;
    
    if (!date) {
      return res.status(400).json({
        success: false,
        message: 'Date is required'
      });
    }
    
    const targetDate = new Date(date);
    if (isNaN(targetDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date format'
      });
    }
    
    const profitAnalysis = await calculateDailyProfit(targetDate, req.user);
    
    res.status(200).json({
      success: true,
      message: 'Daily profit calculated successfully',
      data: profitAnalysis
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Calculate monthly profit
// @route   POST /api/profit/monthly
// @access  Private (Manager and above)
export const calculateMonthlyProfitAnalysis = async (req, res, next) => {
  try {
    const { month, year } = req.body;
    
    if (!month || !year) {
      return res.status(400).json({
        success: false,
        message: 'Month and year are required'
      });
    }
    
    if (month < 1 || month > 12) {
      return res.status(400).json({
        success: false,
        message: 'Month must be between 1 and 12'
      });
    }
    
    if (year < 2020 || year > 2050) {
      return res.status(400).json({
        success: false,
        message: 'Year must be between 2020 and 2050'
      });
    }
    
    const profitAnalysis = await calculateMonthlyProfit(month, year, req.user);
    
    res.status(200).json({
      success: true,
      message: 'Monthly profit calculated successfully',
      data: profitAnalysis
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Calculate product-wise profit
// @route   POST /api/profit/product-wise
// @access  Private (Manager and above)
export const calculateProductWiseProfitAnalysis = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.body;
    
    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Start date and end date are required'
      });
    }
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date format'
      });
    }
    
    if (start > end) {
      return res.status(400).json({
        success: false,
        message: 'Start date cannot be after end date'
      });
    }
    
    const profitAnalysis = await calculateProductWiseProfit(start, end, req.user);
    
    res.status(200).json({
      success: true,
      message: 'Product-wise profit calculated successfully',
      data: profitAnalysis
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all profit analyses
// @route   GET /api/profit/analyses
// @access  Private (Manager and above)
export const getProfitAnalyses = async (req, res, next) => {
  try {
    const {
      analysisType,
      startDate,
      endDate,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      page = 1,
      limit = 10
    } = req.query;
    
    // Build filter object
    const filter = {};
    
    if (analysisType) filter.analysisType = analysisType;
    
    // Date range filter for analysis period
    if (startDate || endDate) {
      filter.periodStart = {};
      if (startDate) filter.periodStart.$gte = new Date(startDate);
      if (endDate) filter.periodStart.$lte = new Date(endDate);
    }
    
    // Sort configuration
    const sortConfig = {};
    sortConfig[sortBy] = sortOrder === 'asc' ? 1 : -1;
    
    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Execute query
    const analyses = await ProfitAnalytics.find(filter)
      .populate('calculatedBy', 'name email')
      .sort(sortConfig)
      .skip(skip)
      .limit(parseInt(limit));
    
    // Get total count for pagination
    const total = await ProfitAnalytics.countDocuments(filter);
    
    res.status(200).json({
      success: true,
      data: {
        analyses,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / parseInt(limit)),
          total,
          limit: parseInt(limit)
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single profit analysis
// @route   GET /api/profit/analyses/:id
// @access  Private (Manager and above)
export const getProfitAnalysis = async (req, res, next) => {
  try {
    const analysis = await ProfitAnalytics.findById(req.params.id)
      .populate('calculatedBy', 'name email')
      .populate('productBreakdown.product', 'name category unit');
    
    if (!analysis) {
      return res.status(404).json({
        success: false,
        message: 'Profit analysis not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: analysis
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get profit trends
// @route   GET /api/profit/trends
// @access  Private (Manager and above)
export const getProfitTrendsAnalysis = async (req, res, next) => {
  try {
    const { startDate, endDate, groupBy = 'daily' } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Start date and end date are required'
      });
    }
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date format'
      });
    }
    
    const trends = await getProfitTrends(start, end, groupBy);
    
    res.status(200).json({
      success: true,
      data: {
        trends,
        period: {
          start: startDate,
          end: endDate,
          groupBy
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get top performing products
// @route   GET /api/profit/top-products
// @access  Private (Manager and above)
export const getTopPerformingProductsAnalysis = async (req, res, next) => {
  try {
    const { startDate, endDate, limit = 10 } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Start date and end date are required'
      });
    }
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date format'
      });
    }
    
    const topProducts = await getTopPerformingProducts(start, end, parseInt(limit));
    
    res.status(200).json({
      success: true,
      data: {
        topProducts,
        period: {
          start: startDate,
          end: endDate
        },
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get profit dashboard summary
// @route   GET /api/profit/dashboard
// @access  Private (Manager and above)
export const getProfitDashboard = async (req, res, next) => {
  try {
    const { period = 'current-month' } = req.query;
    
    let startDate, endDate;
    const now = new Date();
    
    switch (period) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
        break;
      case 'current-month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
        break;
      case 'last-month':
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        endDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
        break;
      case 'current-year':
        startDate = new Date(now.getFullYear(), 0, 1);
        endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
        break;
      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid period. Use: today, current-month, last-month, current-year'
        });
    }
    
    // Get overall statistics
    const overallStats = await ProfitAnalytics.aggregate([
      {
        $match: {
          periodStart: { $gte: startDate },
          periodEnd: { $lte: endDate }
        }
      },
      {
        $group: {
          _id: null,
          totalSales: { $sum: '$revenue.totalSales' },
          totalCosts: { $sum: '$costs.totalCosts' },
          totalProfit: { $sum: '$profit.netProfit' },
          avgProfitMargin: { $avg: '$profit.profitMargin' },
          analysesCount: { $sum: 1 },
          profitableAnalyses: {
            $sum: { $cond: [{ $gt: ['$profit.netProfit', 0] }, 1, 0] }
          }
        }
      }
    ]);
    
    // Get recent trends (last 7 periods)
    const recentTrends = await getProfitTrends(
      new Date(startDate.getTime() - (7 * 24 * 60 * 60 * 1000)), // 7 days before
      endDate,
      period === 'today' ? 'daily' : 'monthly'
    );
    
    // Get top 5 products
    const topProducts = await getTopPerformingProducts(startDate, endDate, 5);
    
    const stats = overallStats[0] || {
      totalSales: 0,
      totalCosts: 0,
      totalProfit: 0,
      avgProfitMargin: 0,
      analysesCount: 0,
      profitableAnalyses: 0
    };
    
    res.status(200).json({
      success: true,
      data: {
        period: {
          type: period,
          start: startDate,
          end: endDate
        },
        summary: {
          totalSales: stats.totalSales,
          totalCosts: stats.totalCosts,
          totalProfit: stats.totalProfit,
          profitMargin: stats.avgProfitMargin,
          profitabilityRate: stats.analysesCount > 0 ? 
            (stats.profitableAnalyses / stats.analysesCount) * 100 : 0
        },
        trends: recentTrends,
        topProducts
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete profit analysis
// @route   DELETE /api/profit/analyses/:id
// @access  Private (Owner only)
export const deleteProfitAnalysis = async (req, res, next) => {
  try {
    const analysis = await ProfitAnalytics.findById(req.params.id);
    
    if (!analysis) {
      return res.status(404).json({
        success: false,
        message: 'Profit analysis not found'
      });
    }
    
    await analysis.deleteOne();
    
    res.status(200).json({
      success: true,
      message: 'Profit analysis deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};