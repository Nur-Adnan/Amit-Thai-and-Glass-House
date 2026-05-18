import asyncHandler from '../utils/asyncHandler.js';
import Invoice from '../models/Invoice.js';
import Product from '../models/Product.js';
import StockPurchase from '../models/StockPurchase.js';
import mongoose from 'mongoose';
import CurrencyService from '../services/currencyService.js';
import DateService from '../services/dateService.js';

// @desc    Get stock report by company
// @route   GET /api/business-analytics/stock-by-company
// @access  Private (Manager and above)
export const getStockByCompany = asyncHandler(async (req, res) => {
  const { materialType, quality, sortBy = 'totalStock', sortOrder = 'desc' } = req.query;

  // Build match criteria
  const matchCriteria = {
    isActive: true,
    isDeleted: { $ne: true },
    materialType: { $exists: true },
    company: { $exists: true }
  };

  if (materialType) {
    matchCriteria.materialType = materialType;
  }

  if (quality) {
    matchCriteria.quality = quality;
  }

  const pipeline = [
    { $match: matchCriteria },
    {
      $group: {
        _id: {
          company: '$company',
          materialType: '$materialType',
          quality: '$quality'
        },
        totalStock: { $sum: '$stockQuantity' },
        totalValue: { $sum: { $multiply: ['$stockQuantity', '$sellingPrice'] } },
        totalCost: { $sum: { $multiply: ['$stockQuantity', '$purchasePrice'] } },
        productCount: { $sum: 1 },
        avgSellingPrice: { $avg: '$sellingPrice' },
        avgPurchasePrice: { $avg: '$purchasePrice' },
        thicknesses: { $addToSet: '$thicknessMM' },
        products: {
          $push: {
            name: '$name',
            thicknessMM: '$thicknessMM',
            stockQuantity: '$stockQuantity',
            sellingPrice: '$sellingPrice',
            purchasePrice: '$purchasePrice',
            measurementType: '$measurementType'
          }
        }
      }
    },
    {
      $addFields: {
        company: '$_id.company',
        materialType: '$_id.materialType',
        quality: '$_id.quality',
        potentialProfit: { $subtract: ['$totalValue', '$totalCost'] },
        profitMargin: {
          $cond: [
            { $gt: ['$totalCost', 0] },
            { $multiply: [{ $divide: [{ $subtract: ['$totalValue', '$totalCost'] }, '$totalCost'] }, 100] },
            0
          ]
        }
      }
    },
    {
      $sort: { [sortBy]: sortOrder === 'desc' ? -1 : 1 }
    }
  ];

  const stockReport = await Product.aggregate(pipeline);

  // Calculate summary statistics
  const summary = {
    totalCompanies: stockReport.length,
    totalStock: stockReport.reduce((sum, item) => sum + item.totalStock, 0),
    totalValue: stockReport.reduce((sum, item) => sum + item.totalValue, 0),
    totalCost: stockReport.reduce((sum, item) => sum + item.totalCost, 0),
    totalProducts: stockReport.reduce((sum, item) => sum + item.productCount, 0)
  };

  summary.overallPotentialProfit = summary.totalValue - summary.totalCost;
  summary.overallProfitMargin = summary.totalCost > 0 ? 
    ((summary.overallPotentialProfit / summary.totalCost) * 100) : 0;

  // Format the report
  const formattedReport = stockReport.map(item => ({
    ...item,
    formattedTotalStock: `${item.totalStock.toFixed(2)} ${item.products[0]?.measurementType || 'SFT'}`,
    formattedTotalValue: CurrencyService.formatBDT(item.totalValue),
    formattedTotalCost: CurrencyService.formatBDT(item.totalCost),
    formattedPotentialProfit: CurrencyService.formatBDT(item.potentialProfit),
    formattedProfitMargin: `${item.profitMargin.toFixed(2)}%`,
    formattedAvgSellingPrice: CurrencyService.formatBDT(item.avgSellingPrice),
    formattedAvgPurchasePrice: CurrencyService.formatBDT(item.avgPurchasePrice),
    thicknessRange: item.thicknesses.sort((a, b) => a - b).join(', ') + 'mm'
  }));

  res.status(200).json({
    success: true,
    data: {
      summary: {
        ...summary,
        formattedTotalStock: `${summary.totalStock.toFixed(2)} SFT`,
        formattedTotalValue: CurrencyService.formatBDT(summary.totalValue),
        formattedTotalCost: CurrencyService.formatBDT(summary.totalCost),
        formattedPotentialProfit: CurrencyService.formatBDT(summary.overallPotentialProfit),
        formattedProfitMargin: `${summary.overallProfitMargin.toFixed(2)}%`
      },
      companies: formattedReport,
      generatedAt: new Date(),
      filters: { materialType, quality, sortBy, sortOrder }
    }
  });
});

// @desc    Get profit report by thickness
// @route   GET /api/business-analytics/profit-by-thickness
// @access  Private (Manager and above)
export const getProfitByThickness = asyncHandler(async (req, res) => {
  const { 
    materialType, 
    company, 
    startDate, 
    endDate, 
    sortBy = 'totalProfit', 
    sortOrder = 'desc' 
  } = req.query;

  // Build date filter
  const dateFilter = {};
  if (startDate || endDate) {
    dateFilter.createdAt = {};
    if (startDate) dateFilter.createdAt.$gte = new Date(startDate);
    if (endDate) dateFilter.createdAt.$lte = new Date(endDate);
  }

  // Build match criteria for invoices
  const matchCriteria = {
    isActive: true,
    isDeleted: { $ne: true },
    'items.materialType': { $exists: true },
    'items.thicknessMM': { $exists: true },
    ...dateFilter
  };

  const pipeline = [
    { $match: matchCriteria },
    { $unwind: '$items' },
    {
      $match: {
        'items.materialType': materialType ? materialType : { $exists: true },
        'items.company': company ? company : { $exists: true },
        'items.thicknessMM': { $exists: true }
      }
    },
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
        _id: {
          thicknessMM: '$items.thicknessMM',
          materialType: '$items.materialType',
          company: '$items.company',
          quality: '$items.quality'
        },
        totalQuantitySold: { $sum: '$items.quantity' },
        totalRevenue: { $sum: '$items.totalPrice' },
        totalCost: { $sum: { $multiply: ['$items.quantity', '$productDetails.purchasePrice'] } },
        invoiceCount: { $sum: 1 },
        avgSellingPrice: { $avg: '$items.unitPrice' },
        avgPurchasePrice: { $avg: '$productDetails.purchasePrice' },
        companies: { $addToSet: '$items.company' },
        qualities: { $addToSet: '$items.quality' }
      }
    },
    {
      $addFields: {
        thicknessMM: '$_id.thicknessMM',
        materialType: '$_id.materialType',
        company: '$_id.company',
        quality: '$_id.quality',
        totalProfit: { $subtract: ['$totalRevenue', '$totalCost'] },
        profitMargin: {
          $cond: [
            { $gt: ['$totalCost', 0] },
            { $multiply: [{ $divide: [{ $subtract: ['$totalRevenue', '$totalCost'] }, '$totalCost'] }, 100] },
            0
          ]
        },
        profitPerUnit: {
          $cond: [
            { $gt: ['$totalQuantitySold', 0] },
            { $divide: [{ $subtract: ['$totalRevenue', '$totalCost'] }, '$totalQuantitySold'] },
            0
          ]
        }
      }
    },
    {
      $sort: { [sortBy]: sortOrder === 'desc' ? -1 : 1 }
    }
  ];

  const profitReport = await Invoice.aggregate(pipeline);

  // Calculate summary statistics
  const summary = {
    totalThicknesses: profitReport.length,
    totalQuantitySold: profitReport.reduce((sum, item) => sum + item.totalQuantitySold, 0),
    totalRevenue: profitReport.reduce((sum, item) => sum + item.totalRevenue, 0),
    totalCost: profitReport.reduce((sum, item) => sum + item.totalCost, 0),
    totalInvoices: profitReport.reduce((sum, item) => sum + item.invoiceCount, 0)
  };

  summary.overallProfit = summary.totalRevenue - summary.totalCost;
  summary.overallProfitMargin = summary.totalCost > 0 ? 
    ((summary.overallProfit / summary.totalCost) * 100) : 0;

  // Group by thickness for better analysis
  const thicknessGroups = {};
  profitReport.forEach(item => {
    const key = `${item.thicknessMM}mm`;
    if (!thicknessGroups[key]) {
      thicknessGroups[key] = {
        thicknessMM: item.thicknessMM,
        totalQuantitySold: 0,
        totalRevenue: 0,
        totalCost: 0,
        totalProfit: 0,
        companies: new Set(),
        qualities: new Set(),
        variants: []
      };
    }
    
    thicknessGroups[key].totalQuantitySold += item.totalQuantitySold;
    thicknessGroups[key].totalRevenue += item.totalRevenue;
    thicknessGroups[key].totalCost += item.totalCost;
    thicknessGroups[key].totalProfit += item.totalProfit;
    thicknessGroups[key].companies.add(item.company);
    thicknessGroups[key].qualities.add(item.quality);
    thicknessGroups[key].variants.push(item);
  });

  // Format thickness groups
  const formattedThicknessGroups = Object.values(thicknessGroups).map(group => ({
    ...group,
    companies: Array.from(group.companies),
    qualities: Array.from(group.qualities),
    profitMargin: group.totalCost > 0 ? ((group.totalProfit / group.totalCost) * 100) : 0,
    formattedTotalQuantitySold: `${group.totalQuantitySold.toFixed(2)} SFT`,
    formattedTotalRevenue: CurrencyService.formatBDT(group.totalRevenue),
    formattedTotalCost: CurrencyService.formatBDT(group.totalCost),
    formattedTotalProfit: CurrencyService.formatBDT(group.totalProfit),
    formattedProfitMargin: `${group.totalCost > 0 ? ((group.totalProfit / group.totalCost) * 100).toFixed(2) : 0}%`
  })).sort((a, b) => sortOrder === 'desc' ? b.totalProfit - a.totalProfit : a.totalProfit - b.totalProfit);

  // Format detailed report
  const formattedReport = profitReport.map(item => ({
    ...item,
    formattedTotalQuantitySold: `${item.totalQuantitySold.toFixed(2)} SFT`,
    formattedTotalRevenue: CurrencyService.formatBDT(item.totalRevenue),
    formattedTotalCost: CurrencyService.formatBDT(item.totalCost),
    formattedTotalProfit: CurrencyService.formatBDT(item.totalProfit),
    formattedProfitMargin: `${item.profitMargin.toFixed(2)}%`,
    formattedProfitPerUnit: CurrencyService.formatBDT(item.profitPerUnit),
    formattedAvgSellingPrice: CurrencyService.formatBDT(item.avgSellingPrice),
    formattedAvgPurchasePrice: CurrencyService.formatBDT(item.avgPurchasePrice)
  }));

  res.status(200).json({
    success: true,
    data: {
      summary: {
        ...summary,
        formattedTotalQuantitySold: `${summary.totalQuantitySold.toFixed(2)} SFT`,
        formattedTotalRevenue: CurrencyService.formatBDT(summary.totalRevenue),
        formattedTotalCost: CurrencyService.formatBDT(summary.totalCost),
        formattedOverallProfit: CurrencyService.formatBDT(summary.overallProfit),
        formattedOverallProfitMargin: `${summary.overallProfitMargin.toFixed(2)}%`
      },
      thicknessGroups: formattedThicknessGroups,
      detailedReport: formattedReport,
      generatedAt: new Date(),
      filters: { materialType, company, startDate, endDate, sortBy, sortOrder }
    }
  });
});

// @desc    Get sales report by brand/company
// @route   GET /api/business-analytics/sales-by-brand
// @access  Private (Manager and above)
export const getSalesByBrand = asyncHandler(async (req, res) => {
  const { 
    materialType, 
    quality, 
    startDate, 
    endDate, 
    sortBy = 'totalRevenue', 
    sortOrder = 'desc' 
  } = req.query;

  // Build date filter
  const dateFilter = {};
  if (startDate || endDate) {
    dateFilter.createdAt = {};
    if (startDate) dateFilter.createdAt.$gte = new Date(startDate);
    if (endDate) dateFilter.createdAt.$lte = new Date(endDate);
  }

  // Build match criteria
  const matchCriteria = {
    isActive: true,
    isDeleted: { $ne: true },
    'items.materialType': { $exists: true },
    'items.company': { $exists: true },
    ...dateFilter
  };

  const pipeline = [
    { $match: matchCriteria },
    { $unwind: '$items' },
    {
      $match: {
        'items.materialType': materialType ? materialType : { $exists: true },
        'items.quality': quality ? quality : { $exists: true },
        'items.company': { $exists: true }
      }
    },
    {
      $group: {
        _id: {
          company: '$items.company',
          materialType: '$items.materialType',
          quality: '$items.quality'
        },
        totalQuantitySold: { $sum: '$items.quantity' },
        totalRevenue: { $sum: '$items.totalPrice' },
        invoiceCount: { $sum: 1 },
        uniqueCustomers: { $addToSet: '$customerName' },
        avgOrderValue: { $avg: '$items.totalPrice' },
        avgQuantityPerOrder: { $avg: '$items.quantity' },
        thicknesses: { $addToSet: '$items.thicknessMM' },
        firstSale: { $min: '$createdAt' },
        lastSale: { $max: '$createdAt' },
        monthlyData: {
          $push: {
            month: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
            quantity: '$items.quantity',
            revenue: '$items.totalPrice'
          }
        }
      }
    },
    {
      $addFields: {
        company: '$_id.company',
        materialType: '$_id.materialType',
        quality: '$_id.quality',
        customerCount: { $size: '$uniqueCustomers' },
        avgRevenuePerCustomer: {
          $cond: [
            { $gt: [{ $size: '$uniqueCustomers' }, 0] },
            { $divide: ['$totalRevenue', { $size: '$uniqueCustomers' }] },
            0
          ]
        },
        thicknessRange: {
          $concat: [
            { $toString: { $min: '$thicknesses' } },
            'mm - ',
            { $toString: { $max: '$thicknesses' } },
            'mm'
          ]
        }
      }
    },
    {
      $sort: { [sortBy]: sortOrder === 'desc' ? -1 : 1 }
    }
  ];

  const salesReport = await Invoice.aggregate(pipeline);

  // Calculate summary statistics
  const summary = {
    totalBrands: salesReport.length,
    totalQuantitySold: salesReport.reduce((sum, item) => sum + item.totalQuantitySold, 0),
    totalRevenue: salesReport.reduce((sum, item) => sum + item.totalRevenue, 0),
    totalInvoices: salesReport.reduce((sum, item) => sum + item.invoiceCount, 0),
    totalCustomers: new Set(salesReport.flatMap(item => item.uniqueCustomers)).size
  };

  summary.avgRevenuePerBrand = summary.totalBrands > 0 ? (summary.totalRevenue / summary.totalBrands) : 0;
  summary.avgQuantityPerBrand = summary.totalBrands > 0 ? (summary.totalQuantitySold / summary.totalBrands) : 0;

  // Process monthly trends
  const monthlyTrends = {};
  salesReport.forEach(brand => {
    brand.monthlyData.forEach(data => {
      if (!monthlyTrends[data.month]) {
        monthlyTrends[data.month] = { quantity: 0, revenue: 0 };
      }
      monthlyTrends[data.month].quantity += data.quantity;
      monthlyTrends[data.month].revenue += data.revenue;
    });
  });

  const formattedMonthlyTrends = Object.entries(monthlyTrends)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, data]) => ({
      month,
      quantity: data.quantity,
      revenue: data.revenue,
      formattedQuantity: `${data.quantity.toFixed(2)} SFT`,
      formattedRevenue: CurrencyService.formatBDT(data.revenue)
    }));

  // Format the report
  const formattedReport = salesReport.map(item => ({
    ...item,
    formattedTotalQuantitySold: `${item.totalQuantitySold.toFixed(2)} SFT`,
    formattedTotalRevenue: CurrencyService.formatBDT(item.totalRevenue),
    formattedAvgOrderValue: CurrencyService.formatBDT(item.avgOrderValue),
    formattedAvgRevenuePerCustomer: CurrencyService.formatBDT(item.avgRevenuePerCustomer),
    formattedAvgQuantityPerOrder: `${item.avgQuantityPerOrder.toFixed(2)} SFT`,
    formattedFirstSale: DateService.format(item.firstSale, 'medium'),
    formattedLastSale: DateService.format(item.lastSale, 'medium'),
    salesPeriod: `${DateService.format(item.firstSale, 'short')} - ${DateService.format(item.lastSale, 'short')}`
  }));

  res.status(200).json({
    success: true,
    data: {
      summary: {
        ...summary,
        formattedTotalQuantitySold: `${summary.totalQuantitySold.toFixed(2)} SFT`,
        formattedTotalRevenue: CurrencyService.formatBDT(summary.totalRevenue),
        formattedAvgRevenuePerBrand: CurrencyService.formatBDT(summary.avgRevenuePerBrand),
        formattedAvgQuantityPerBrand: `${summary.avgQuantityPerBrand.toFixed(2)} SFT`
      },
      brands: formattedReport,
      monthlyTrends: formattedMonthlyTrends,
      generatedAt: new Date(),
      filters: { materialType, quality, startDate, endDate, sortBy, sortOrder }
    }
  });
});

// @desc    Get fast-moving thickness report
// @route   GET /api/business-analytics/fast-moving-thickness
// @access  Private (Manager and above)
export const getFastMovingThickness = asyncHandler(async (req, res) => {
  const { 
    materialType, 
    company, 
    startDate, 
    endDate, 
    limit = 10,
    sortBy = 'velocity', 
    sortOrder = 'desc' 
  } = req.query;

  // Build date filter
  const dateFilter = {};
  if (startDate || endDate) {
    dateFilter.createdAt = {};
    if (startDate) dateFilter.createdAt.$gte = new Date(startDate);
    if (endDate) dateFilter.createdAt.$lte = new Date(endDate);
  }

  // Calculate date range for velocity calculation
  const endDateObj = endDate ? new Date(endDate) : new Date();
  const startDateObj = startDate ? new Date(startDate) : new Date(endDateObj.getTime() - (30 * 24 * 60 * 60 * 1000)); // Default 30 days
  const daysDiff = Math.max(1, Math.ceil((endDateObj - startDateObj) / (1000 * 60 * 60 * 24)));

  // Build match criteria
  const matchCriteria = {
    isActive: true,
    isDeleted: { $ne: true },
    'items.materialType': { $exists: true },
    'items.thicknessMM': { $exists: true },
    ...dateFilter
  };

  const pipeline = [
    { $match: matchCriteria },
    { $unwind: '$items' },
    {
      $match: {
        'items.materialType': materialType ? materialType : { $exists: true },
        'items.company': company ? company : { $exists: true },
        'items.thicknessMM': { $exists: true }
      }
    },
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
        _id: {
          thicknessMM: '$items.thicknessMM',
          materialType: '$items.materialType'
        },
        totalQuantitySold: { $sum: '$items.quantity' },
        totalRevenue: { $sum: '$items.totalPrice' },
        invoiceCount: { $sum: 1 },
        uniqueCustomers: { $addToSet: '$customerName' },
        companies: { $addToSet: '$items.company' },
        qualities: { $addToSet: '$items.quality' },
        avgSellingPrice: { $avg: '$items.unitPrice' },
        currentStock: { $avg: '$productDetails.stockQuantity' },
        reorderLevel: { $avg: '$productDetails.reorderLevel' },
        firstSale: { $min: '$createdAt' },
        lastSale: { $max: '$createdAt' },
        salesDates: { $push: '$createdAt' }
      }
    },
    {
      $addFields: {
        thicknessMM: '$_id.thicknessMM',
        materialType: '$_id.materialType',
        customerCount: { $size: '$uniqueCustomers' },
        companyCount: { $size: '$companies' },
        qualityCount: { $size: '$qualities' },
        // Velocity = quantity sold per day
        velocity: { $divide: ['$totalQuantitySold', daysDiff] },
        // Turnover rate = sales / average stock
        turnoverRate: {
          $cond: [
            { $gt: ['$currentStock', 0] },
            { $divide: ['$totalQuantitySold', '$currentStock'] },
            0
          ]
        },
        // Stock days = current stock / daily velocity
        stockDays: {
          $cond: [
            { $gt: [{ $divide: ['$totalQuantitySold', daysDiff] }, 0] },
            { $divide: ['$currentStock', { $divide: ['$totalQuantitySold', daysDiff] }] },
            999
          ]
        },
        // Frequency = invoices per day
        frequency: { $divide: ['$invoiceCount', daysDiff] },
        avgOrderSize: {
          $cond: [
            { $gt: ['$invoiceCount', 0] },
            { $divide: ['$totalQuantitySold', '$invoiceCount'] },
            0
          ]
        }
      }
    },
    {
      $addFields: {
        // Movement category based on velocity and frequency
        movementCategory: {
          $switch: {
            branches: [
              {
                case: { $and: [{ $gte: ['$velocity', 10] }, { $gte: ['$frequency', 0.5] }] },
                then: 'Fast Moving'
              },
              {
                case: { $and: [{ $gte: ['$velocity', 5] }, { $gte: ['$frequency', 0.2] }] },
                then: 'Medium Moving'
              },
              {
                case: { $and: [{ $gte: ['$velocity', 1] }, { $gte: ['$frequency', 0.1] }] },
                then: 'Slow Moving'
              }
            ],
            default: 'Very Slow Moving'
          }
        },
        // Stock status
        stockStatus: {
          $switch: {
            branches: [
              { case: { $lte: ['$stockDays', 7] }, then: 'Critical' },
              { case: { $lte: ['$stockDays', 15] }, then: 'Low' },
              { case: { $lte: ['$stockDays', 30] }, then: 'Normal' },
              { case: { $lte: ['$stockDays', 60] }, then: 'High' }
            ],
            default: 'Excess'
          }
        }
      }
    },
    {
      $sort: { [sortBy]: sortOrder === 'desc' ? -1 : 1 }
    },
    { $limit: parseInt(limit) }
  ];

  const movementReport = await Invoice.aggregate(pipeline);

  // Calculate summary statistics
  const summary = {
    totalThicknesses: movementReport.length,
    totalQuantitySold: movementReport.reduce((sum, item) => sum + item.totalQuantitySold, 0),
    totalRevenue: movementReport.reduce((sum, item) => sum + item.totalRevenue, 0),
    avgVelocity: movementReport.length > 0 ? 
      (movementReport.reduce((sum, item) => sum + item.velocity, 0) / movementReport.length) : 0,
    periodDays: daysDiff
  };

  // Group by movement category
  const categoryGroups = {
    'Fast Moving': [],
    'Medium Moving': [],
    'Slow Moving': [],
    'Very Slow Moving': []
  };

  movementReport.forEach(item => {
    categoryGroups[item.movementCategory].push(item);
  });

  // Format the report
  const formattedReport = movementReport.map(item => ({
    ...item,
    formattedTotalQuantitySold: `${item.totalQuantitySold.toFixed(2)} SFT`,
    formattedTotalRevenue: CurrencyService.formatBDT(item.totalRevenue),
    formattedVelocity: `${item.velocity.toFixed(2)} SFT/day`,
    formattedFrequency: `${item.frequency.toFixed(2)} orders/day`,
    formattedAvgOrderSize: `${item.avgOrderSize.toFixed(2)} SFT`,
    formattedCurrentStock: `${item.currentStock.toFixed(2)} SFT`,
    formattedStockDays: item.stockDays < 999 ? `${item.stockDays.toFixed(0)} days` : 'Excess',
    formattedTurnoverRate: `${item.turnoverRate.toFixed(2)}x`,
    formattedAvgSellingPrice: CurrencyService.formatBDT(item.avgSellingPrice),
    companiesList: item.companies.join(', '),
    qualitiesList: item.qualities.join(', '),
    formattedFirstSale: DateService.format(item.firstSale, 'short'),
    formattedLastSale: DateService.format(item.lastSale, 'short')
  }));

  // Format category groups
  const formattedCategoryGroups = Object.entries(categoryGroups).map(([category, items]) => ({
    category,
    count: items.length,
    totalQuantity: items.reduce((sum, item) => sum + item.totalQuantitySold, 0),
    totalRevenue: items.reduce((sum, item) => sum + item.totalRevenue, 0),
    avgVelocity: items.length > 0 ? 
      (items.reduce((sum, item) => sum + item.velocity, 0) / items.length) : 0,
    formattedTotalQuantity: `${items.reduce((sum, item) => sum + item.totalQuantitySold, 0).toFixed(2)} SFT`,
    formattedTotalRevenue: CurrencyService.formatBDT(items.reduce((sum, item) => sum + item.totalRevenue, 0)),
    formattedAvgVelocity: `${items.length > 0 ? 
      (items.reduce((sum, item) => sum + item.velocity, 0) / items.length).toFixed(2) : 0} SFT/day`
  }));

  res.status(200).json({
    success: true,
    data: {
      summary: {
        ...summary,
        formattedTotalQuantitySold: `${summary.totalQuantitySold.toFixed(2)} SFT`,
        formattedTotalRevenue: CurrencyService.formatBDT(summary.totalRevenue),
        formattedAvgVelocity: `${summary.avgVelocity.toFixed(2)} SFT/day`,
        analysisPeriod: `${DateService.format(startDateObj, 'short')} - ${DateService.format(endDateObj, 'short')}`
      },
      thicknesses: formattedReport,
      categoryGroups: formattedCategoryGroups,
      generatedAt: new Date(),
      filters: { materialType, company, startDate, endDate, limit, sortBy, sortOrder }
    }
  });
});

// @desc    Get comprehensive business dashboard
// @route   GET /api/business-analytics/dashboard
// @access  Private (Manager and above)
export const getBusinessDashboard = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;

  // Build date filter
  const dateFilter = {};
  if (startDate || endDate) {
    dateFilter.createdAt = {};
    if (startDate) dateFilter.createdAt.$gte = new Date(startDate);
    if (endDate) dateFilter.createdAt.$lte = new Date(endDate);
  }

  // Get top companies by stock
  const topCompaniesByStock = await Product.aggregate([
    {
      $match: {
        isActive: true,
        materialType: { $exists: true },
        company: { $exists: true }
      }
    },
    {
      $group: {
        _id: '$company',
        totalStock: { $sum: '$stockQuantity' },
        totalValue: { $sum: { $multiply: ['$stockQuantity', '$sellingPrice'] } }
      }
    },
    { $sort: { totalStock: -1 } },
    { $limit: 5 }
  ]);

  // Get top thicknesses by profit
  const topThicknessByProfit = await Invoice.aggregate([
    { $match: { isActive: true, 'items.thicknessMM': { $exists: true }, ...dateFilter } },
    { $unwind: '$items' },
    { $match: { 'items.thicknessMM': { $exists: true } } },
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
        _id: '$items.thicknessMM',
        totalRevenue: { $sum: '$items.totalPrice' },
        totalCost: { $sum: { $multiply: ['$items.quantity', '$productDetails.purchasePrice'] } }
      }
    },
    {
      $addFields: {
        profit: { $subtract: ['$totalRevenue', '$totalCost'] }
      }
    },
    { $sort: { profit: -1 } },
    { $limit: 5 }
  ]);

  // Get fast-moving items
  const fastMovingItems = await Invoice.aggregate([
    { $match: { isActive: true, 'items.thicknessMM': { $exists: true }, ...dateFilter } },
    { $unwind: '$items' },
    { $match: { 'items.thicknessMM': { $exists: true } } },
    {
      $group: {
        _id: {
          thicknessMM: '$items.thicknessMM',
          company: '$items.company'
        },
        totalQuantity: { $sum: '$items.quantity' },
        invoiceCount: { $sum: 1 }
      }
    },
    { $sort: { totalQuantity: -1 } },
    { $limit: 5 }
  ]);

  res.status(200).json({
    success: true,
    data: {
      topCompaniesByStock: topCompaniesByStock.map(item => ({
        ...item,
        company: item._id,
        formattedTotalStock: `${item.totalStock.toFixed(2)} SFT`,
        formattedTotalValue: CurrencyService.formatBDT(item.totalValue)
      })),
      topThicknessByProfit: topThicknessByProfit.map(item => ({
        ...item,
        thicknessMM: item._id,
        formattedTotalRevenue: CurrencyService.formatBDT(item.totalRevenue),
        formattedTotalCost: CurrencyService.formatBDT(item.totalCost),
        formattedProfit: CurrencyService.formatBDT(item.profit)
      })),
      fastMovingItems: fastMovingItems.map(item => ({
        ...item,
        thicknessMM: item._id.thicknessMM,
        company: item._id.company,
        formattedTotalQuantity: `${item.totalQuantity.toFixed(2)} SFT`
      })),
      generatedAt: new Date(),
      filters: { startDate, endDate }
    }
  });
});