import Invoice from '../models/Invoice.js';
import { MoneyValidator, GeneralValidator } from '../utils/validation.js';
import CurrencyService from '../services/currencyService.js';
import DateService from '../services/dateService.js';

/**
 * Update service charges for an invoice
 */
export const updateServiceCharges = async (req, res) => {
  try {
    const { invoiceId } = req.params;
    const { 
      deliveryCharge, 
      installationCharge, 
      installerName, 
      installerPhone, 
      serviceNotes 
    } = req.body;

    // Validate invoice ID
    const invoiceValidation = GeneralValidator.validateObjectId(invoiceId, 'Invoice');
    if (!invoiceValidation.isValid) {
      return res.status(400).json({
        success: false,
        message: 'Invalid invoice ID',
        errors: invoiceValidation.errors
      });
    }

    // Find invoice
    const invoice = await Invoice.findById(invoiceId);
    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }

    // Check if invoice is active
    if (!invoice.isActive || invoice.isDeleted) {
      return res.status(400).json({
        success: false,
        message: 'Cannot update service charges for inactive or deleted invoice'
      });
    }

    // Validate service charges
    const validationErrors = [];

    if (deliveryCharge !== undefined) {
      const deliveryValidation = MoneyValidator.validateAmount(deliveryCharge, 'Delivery charge', {
        allowZero: true,
        maxAmount: 50000,
        maxDecimals: 2
      });
      if (!deliveryValidation.isValid) {
        validationErrors.push(...deliveryValidation.errors);
      }
    }

    if (installationCharge !== undefined) {
      const installationValidation = MoneyValidator.validateAmount(installationCharge, 'Installation charge', {
        allowZero: true,
        maxAmount: 100000,
        maxDecimals: 2
      });
      if (!installationValidation.isValid) {
        validationErrors.push(...installationValidation.errors);
      }
    }

    if (installerName && installerName.trim()) {
      const nameValidation = GeneralValidator.validateString(installerName, 'Installer name', {
        minLength: 2,
        maxLength: 100
      });
      if (!nameValidation.isValid) {
        validationErrors.push(...nameValidation.errors);
      }
    }

    if (installerPhone && installerPhone.trim()) {
      const phoneValidation = GeneralValidator.validatePhone(installerPhone, 'Installer phone');
      if (!phoneValidation.isValid) {
        validationErrors.push(...phoneValidation.errors);
      }
    }

    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validationErrors
      });
    }

    // Update service charges
    if (!invoice.serviceCharges) {
      invoice.serviceCharges = {};
    }

    if (deliveryCharge !== undefined) {
      invoice.serviceCharges.deliveryCharge = deliveryCharge;
    }
    if (installationCharge !== undefined) {
      invoice.serviceCharges.installationCharge = installationCharge;
    }
    if (installerName !== undefined) {
      invoice.serviceCharges.installerName = installerName?.trim() || null;
    }
    if (installerPhone !== undefined) {
      invoice.serviceCharges.installerPhone = installerPhone?.trim() || null;
    }
    if (serviceNotes !== undefined) {
      invoice.serviceCharges.serviceNotes = serviceNotes?.trim() || null;
    }

    // Recalculate totals
    invoice.calculateTotals();
    invoice.updatedBy = req.user._id;

    await invoice.save();

    res.json({
      success: true,
      message: 'Service charges updated successfully',
      data: {
        invoiceId: invoice._id,
        invoiceNo: invoice.invoiceNo,
        serviceCharges: invoice.serviceCharges,
        serviceChargesInfo: invoice.serviceChargesInfo,
        formattedTotalServiceCharges: invoice.formattedTotalServiceCharges,
        grandTotal: invoice.grandTotal,
        formattedGrandTotal: invoice.formattedGrandTotal,
        dueAmount: invoice.dueAmount,
        formattedDueAmount: invoice.formattedDueAmount
      }
    });

  } catch (error) {
    console.error('Error updating service charges:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update service charges',
      error: error.message
    });
  }
};

/**
 * Get service cost summary for a date range
 */
export const getServiceCostSummary = async (req, res) => {
  try {
    const { startDate, endDate, groupBy = 'daily' } = req.query;

    // Validate dates
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

    // Build aggregation pipeline
    let groupStage;
    if (groupBy === 'monthly') {
      groupStage = {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
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
          },
          totalInvoices: { $sum: 1 }
        }
      };
    } else {
      groupStage = {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          },
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
          },
          totalInvoices: { $sum: 1 }
        }
      };
    }

    const serviceCostData = await Invoice.aggregate([
      {
        $match: {
          createdAt: { $gte: start, $lte: end },
          invoiceType: 'FINAL',
          isActive: true,
          isDeleted: { $ne: true }
        }
      },
      groupStage,
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
    ]);

    // Calculate overall summary
    const overallSummary = await Invoice.aggregate([
      {
        $match: {
          createdAt: { $gte: start, $lte: end },
          invoiceType: 'FINAL',
          isActive: true,
          isDeleted: { $ne: true }
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
          },
          totalInvoices: { $sum: 1 },
          averageDeliveryCharge: { $avg: { $ifNull: ['$serviceCharges.deliveryCharge', 0] } },
          averageInstallationCharge: { $avg: { $ifNull: ['$serviceCharges.installationCharge', 0] } }
        }
      }
    ]);

    const summary = overallSummary[0] || {
      totalDeliveryCharges: 0,
      totalInstallationCharges: 0,
      totalServiceCharges: 0,
      invoicesWithDelivery: 0,
      invoicesWithInstallation: 0,
      totalInvoices: 0,
      averageDeliveryCharge: 0,
      averageInstallationCharge: 0
    };

    // Format the data
    const formattedData = serviceCostData.map(item => ({
      period: item._id,
      totalDeliveryCharges: item.totalDeliveryCharges,
      totalInstallationCharges: item.totalInstallationCharges,
      totalServiceCharges: item.totalServiceCharges,
      invoicesWithDelivery: item.invoicesWithDelivery,
      invoicesWithInstallation: item.invoicesWithInstallation,
      totalInvoices: item.totalInvoices,
      deliveryPercentage: item.totalInvoices > 0 ? 
        Math.round((item.invoicesWithDelivery / item.totalInvoices) * 10000) / 100 : 0,
      installationPercentage: item.totalInvoices > 0 ? 
        Math.round((item.invoicesWithInstallation / item.totalInvoices) * 10000) / 100 : 0,
      formattedTotalDeliveryCharges: CurrencyService.formatBDT(item.totalDeliveryCharges),
      formattedTotalInstallationCharges: CurrencyService.formatBDT(item.totalInstallationCharges),
      formattedTotalServiceCharges: CurrencyService.formatBDT(item.totalServiceCharges)
    }));

    const formattedSummary = {
      ...summary,
      deliveryPercentage: summary.totalInvoices > 0 ? 
        Math.round((summary.invoicesWithDelivery / summary.totalInvoices) * 10000) / 100 : 0,
      installationPercentage: summary.totalInvoices > 0 ? 
        Math.round((summary.invoicesWithInstallation / summary.totalInvoices) * 10000) / 100 : 0,
      formattedTotalDeliveryCharges: CurrencyService.formatBDT(summary.totalDeliveryCharges),
      formattedTotalInstallationCharges: CurrencyService.formatBDT(summary.totalInstallationCharges),
      formattedTotalServiceCharges: CurrencyService.formatBDT(summary.totalServiceCharges),
      formattedAverageDeliveryCharge: CurrencyService.formatBDT(summary.averageDeliveryCharge),
      formattedAverageInstallationCharge: CurrencyService.formatBDT(summary.averageInstallationCharge)
    };

    res.json({
      success: true,
      data: {
        period: {
          startDate: start,
          endDate: end,
          groupBy
        },
        summary: formattedSummary,
        serviceCostData: formattedData,
        generatedAt: new Date()
      }
    });

  } catch (error) {
    console.error('Error getting service cost summary:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get service cost summary',
      error: error.message
    });
  }
};

/**
 * Get top installers by service volume
 */
export const getTopInstallers = async (req, res) => {
  try {
    const { startDate, endDate, limit = 10 } = req.query;

    // Validate dates
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

    const topInstallers = await Invoice.aggregate([
      {
        $match: {
          createdAt: { $gte: start, $lte: end },
          invoiceType: 'FINAL',
          isActive: true,
          isDeleted: { $ne: true },
          'serviceCharges.installerName': { $exists: true, $ne: null, $ne: '' },
          'serviceCharges.installationCharge': { $gt: 0 }
        }
      },
      {
        $group: {
          _id: '$serviceCharges.installerName',
          installerPhone: { $first: '$serviceCharges.installerPhone' },
          totalInstallationCharges: { $sum: '$serviceCharges.installationCharge' },
          totalJobs: { $sum: 1 },
          averageJobValue: { $avg: '$serviceCharges.installationCharge' },
          totalInvoiceValue: { $sum: '$grandTotal' }
        }
      },
      {
        $project: {
          _id: 0,
          installerName: '$_id',
          installerPhone: 1,
          totalInstallationCharges: 1,
          totalJobs: 1,
          averageJobValue: 1,
          totalInvoiceValue: 1,
          formattedTotalInstallationCharges: {
            $concat: ['৳', { $toString: '$totalInstallationCharges' }]
          },
          formattedAverageJobValue: {
            $concat: ['৳', { $toString: { $round: ['$averageJobValue', 2] } }]
          },
          formattedTotalInvoiceValue: {
            $concat: ['৳', { $toString: '$totalInvoiceValue' }]
          }
        }
      },
      { $sort: { totalInstallationCharges: -1 } },
      { $limit: parseInt(limit) }
    ]);

    // Format the data properly
    const formattedInstallers = topInstallers.map(installer => ({
      ...installer,
      formattedTotalInstallationCharges: CurrencyService.formatBDT(installer.totalInstallationCharges),
      formattedAverageJobValue: CurrencyService.formatBDT(installer.averageJobValue),
      formattedTotalInvoiceValue: CurrencyService.formatBDT(installer.totalInvoiceValue)
    }));

    res.json({
      success: true,
      data: {
        period: {
          startDate: start,
          endDate: end
        },
        topInstallers: formattedInstallers,
        totalInstallers: formattedInstallers.length,
        generatedAt: new Date()
      }
    });

  } catch (error) {
    console.error('Error getting top installers:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get top installers',
      error: error.message
    });
  }
};

/**
 * Get service cost trends over time
 */
export const getServiceCostTrends = async (req, res) => {
  try {
    const { startDate, endDate, groupBy = 'monthly' } = req.query;

    // Validate dates
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

    // Build group stage based on groupBy parameter
    let groupStage;
    if (groupBy === 'yearly') {
      groupStage = {
        $group: {
          _id: { year: { $year: '$createdAt' } },
          totalServiceCharges: { $sum: { $ifNull: ['$serviceCharges.totalServiceCharges', 0] } },
          totalDeliveryCharges: { $sum: { $ifNull: ['$serviceCharges.deliveryCharge', 0] } },
          totalInstallationCharges: { $sum: { $ifNull: ['$serviceCharges.installationCharge', 0] } },
          totalInvoices: { $sum: 1 },
          invoicesWithServices: {
            $sum: {
              $cond: [{ $gt: [{ $ifNull: ['$serviceCharges.totalServiceCharges', 0] }, 0] }, 1, 0]
            }
          }
        }
      };
    } else if (groupBy === 'daily') {
      groupStage = {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          },
          totalServiceCharges: { $sum: { $ifNull: ['$serviceCharges.totalServiceCharges', 0] } },
          totalDeliveryCharges: { $sum: { $ifNull: ['$serviceCharges.deliveryCharge', 0] } },
          totalInstallationCharges: { $sum: { $ifNull: ['$serviceCharges.installationCharge', 0] } },
          totalInvoices: { $sum: 1 },
          invoicesWithServices: {
            $sum: {
              $cond: [{ $gt: [{ $ifNull: ['$serviceCharges.totalServiceCharges', 0] }, 0] }, 1, 0]
            }
          }
        }
      };
    } else {
      // Default to monthly
      groupStage = {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          totalServiceCharges: { $sum: { $ifNull: ['$serviceCharges.totalServiceCharges', 0] } },
          totalDeliveryCharges: { $sum: { $ifNull: ['$serviceCharges.deliveryCharge', 0] } },
          totalInstallationCharges: { $sum: { $ifNull: ['$serviceCharges.installationCharge', 0] } },
          totalInvoices: { $sum: 1 },
          invoicesWithServices: {
            $sum: {
              $cond: [{ $gt: [{ $ifNull: ['$serviceCharges.totalServiceCharges', 0] }, 0] }, 1, 0]
            }
          }
        }
      };
    }

    const trends = await Invoice.aggregate([
      {
        $match: {
          createdAt: { $gte: start, $lte: end },
          invoiceType: 'FINAL',
          isActive: true,
          isDeleted: { $ne: true }
        }
      },
      groupStage,
      {
        $addFields: {
          servicePercentage: {
            $cond: [
              { $gt: ['$totalInvoices', 0] },
              { $multiply: [{ $divide: ['$invoicesWithServices', '$totalInvoices'] }, 100] },
              0
            ]
          },
          averageServiceCharge: {
            $cond: [
              { $gt: ['$invoicesWithServices', 0] },
              { $divide: ['$totalServiceCharges', '$invoicesWithServices'] },
              0
            ]
          }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
    ]);

    // Format the trends data
    const formattedTrends = trends.map(trend => ({
      period: trend._id,
      totalServiceCharges: trend.totalServiceCharges,
      totalDeliveryCharges: trend.totalDeliveryCharges,
      totalInstallationCharges: trend.totalInstallationCharges,
      totalInvoices: trend.totalInvoices,
      invoicesWithServices: trend.invoicesWithServices,
      servicePercentage: Math.round(trend.servicePercentage * 100) / 100,
      averageServiceCharge: Math.round(trend.averageServiceCharge * 100) / 100,
      formattedTotalServiceCharges: CurrencyService.formatBDT(trend.totalServiceCharges),
      formattedTotalDeliveryCharges: CurrencyService.formatBDT(trend.totalDeliveryCharges),
      formattedTotalInstallationCharges: CurrencyService.formatBDT(trend.totalInstallationCharges),
      formattedAverageServiceCharge: CurrencyService.formatBDT(trend.averageServiceCharge)
    }));

    res.json({
      success: true,
      data: {
        period: {
          startDate: start,
          endDate: end,
          groupBy
        },
        trends: formattedTrends,
        generatedAt: new Date()
      }
    });

  } catch (error) {
    console.error('Error getting service cost trends:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get service cost trends',
      error: error.message
    });
  }
};