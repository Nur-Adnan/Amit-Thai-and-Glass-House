import asyncHandler from '../utils/asyncHandler.js';
import StockPurchase from '../models/StockPurchase.js';
import Product from '../models/Product.js';
import Supplier from '../models/Supplier.js';
import Investment from '../models/Investment.js';
import mongoose from 'mongoose';
import { BusinessValidator, MoneyValidator, DateValidator } from '../utils/validation.js';
import AuditService from '../services/auditService.js';
import CurrencyService from '../services/currencyService.js';
import DateService from '../services/dateService.js';

// @desc    Get all stock purchases
// @route   GET /api/stock-purchases
// @access  Private (Manager and above)
export const getStockPurchases = asyncHandler(async (req, res) => {
  const {
    supplier,
    status,
    startDate,
    endDate,
    sortBy = 'purchaseDate',
    sortOrder = 'desc',
    page = 1,
    limit = 10
  } = req.query;

  // Build query - exclude soft deleted items by default
  const query = { isActive: true, isDeleted: { $ne: true } };

  if (supplier) {
    query.supplier = supplier;
  }

  if (status) {
    query.status = status;
  }

  if (startDate || endDate) {
    query.purchaseDate = {};
    if (startDate) {
      query.purchaseDate.$gte = new Date(startDate);
    }
    if (endDate) {
      query.purchaseDate.$lte = new Date(endDate);
    }
  }

  // Calculate pagination
  const skip = (page - 1) * limit;

  // Build sort object
  const sort = {};
  sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

  const purchases = await StockPurchase.find(query)
    .populate('supplier', 'name phone address')
    .populate('items.product', 'name materialType company thicknessMM quality measurementType')
    .populate('createdBy', 'name email')
    .populate('updatedBy', 'name email')
    .sort(sort)
    .skip(skip)
    .limit(parseInt(limit));

  const total = await StockPurchase.countDocuments(query);

  res.status(200).json({
    success: true,
    count: purchases.length,
    total,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(total / limit)
    },
    data: purchases
  });
});

// @desc    Get single stock purchase
// @route   GET /api/stock-purchases/:id
// @access  Private (Manager and above)
export const getStockPurchase = asyncHandler(async (req, res) => {
  const purchase = await StockPurchase.findById(req.params.id)
    .populate('supplier', 'name phone address email')
    .populate('items.product', 'name materialType company thicknessMM quality measurementType unit')
    .populate('investmentRecord')
    .populate('createdBy', 'name email')
    .populate('updatedBy', 'name email');

  if (!purchase) {
    return res.status(404).json({
      success: false,
      message: 'Stock purchase not found',
      suggestion: 'Please check the purchase ID and try again.'
    });
  }

  res.status(200).json({
    success: true,
    data: purchase
  });
});

// @desc    Create new stock purchase
// @route   POST /api/stock-purchases
// @access  Private (Manager and above)
export const createStockPurchase = asyncHandler(async (req, res) => {
  const session = await mongoose.startSession();
  
  try {
    await session.withTransaction(async () => {
      const { 
        supplierId,
        items, 
        discount, 
        discountType, 
        paidAmount,
        paymentMethod,
        purchaseDate,
        deliveryDate,
        invoiceReference,
        transportCost,
        otherCharges,
        notes 
      } = req.body;

      // Validate basic purchase data
      const purchaseValidation = BusinessValidator.validateStockPurchase({
        supplierId,
        items,
        discount,
        discountType,
        paidAmount: paidAmount || 0
      });

      if (!purchaseValidation.isValid) {
        throw new Error(`Stock purchase validation failed: ${purchaseValidation.errors.join(', ')}`);
      }

      // Find and validate supplier
      const supplier = await Supplier.findById(supplierId).session(session);
      if (!supplier) {
        throw new Error('Supplier not found');
      }
      if (!supplier.isActive) {
        throw new Error('Supplier is not active');
      }

      // Validate purchase date
      if (purchaseDate) {
        const dateValidation = DateValidator.validateDate(purchaseDate, 'Purchase date');
        if (!dateValidation.isValid) {
          throw new Error(`Invalid purchase date: ${dateValidation.errors.join(', ')}`);
        }
      }

      // Validate delivery date
      if (deliveryDate) {
        const deliveryDateValidation = DateValidator.validateDate(deliveryDate, 'Delivery date');
        if (!deliveryDateValidation.isValid) {
          throw new Error(`Invalid delivery date: ${deliveryDateValidation.errors.join(', ')}`);
        }
        
        const purchaseDateObj = new Date(purchaseDate || Date.now());
        const deliveryDateObj = new Date(deliveryDate);
        if (deliveryDateObj < purchaseDateObj) {
          throw new Error('Delivery date cannot be before purchase date');
        }
      }

      // Process and validate items
      const purchaseItems = [];
      const stockUpdates = [];
      let subtotal = 0;

      for (const item of items) {
        const product = await Product.findById(item.product).session(session);
        
        if (!product) {
          throw new Error(`Product not found: ${item.product}`);
        }

        if (!product.isActive) {
          throw new Error(`Product is not active: ${product.name}`);
        }

        // Validate item quantities and prices
        const quantityValidation = MoneyValidator.validateAmount(item.quantity, 'Quantity', {
          allowZero: false,
          maxAmount: 100000
        });
        
        if (!quantityValidation.isValid) {
          throw new Error(`Invalid quantity for ${product.name}: ${quantityValidation.errors.join(', ')}`);
        }

        const purchasePrice = item.purchasePrice;
        const purchasePriceValidation = MoneyValidator.validateAmount(purchasePrice, 'Purchase price', {
          allowZero: true,
          maxAmount: 100000
        });
        
        if (!purchasePriceValidation.isValid) {
          throw new Error(`Invalid purchase price for ${product.name}: ${purchasePriceValidation.errors.join(', ')}`);
        }

        // Calculate total cost with proper rounding
        const totalCost = Math.round(quantityValidation.sanitizedAmount * purchasePriceValidation.sanitizedAmount * 100) / 100;

        // Build purchase item with variant tracking
        const purchaseItem = {
          product: product._id,
          productName: product.name,
          quantity: quantityValidation.sanitizedAmount,
          unit: product.measurementType || item.unit || 'SFT',
          purchasePrice: purchasePriceValidation.sanitizedAmount,
          totalCost: totalCost,
          previousStock: product.stockQuantity,
          newStock: product.stockQuantity + quantityValidation.sanitizedAmount
        };

        // Add variant tracking fields for Thai & Glass materials
        if (product.materialType && ['Thai', 'Glass'].includes(product.materialType)) {
          purchaseItem.materialType = product.materialType;
          purchaseItem.company = product.company;
          purchaseItem.thicknessMM = product.thicknessMM;
          purchaseItem.quality = product.quality;
          purchaseItem.measurementType = product.measurementType;
        }

        purchaseItems.push(purchaseItem);
        subtotal += totalCost;

        // Prepare stock update
        stockUpdates.push({
          productId: product._id,
          newStock: purchaseItem.newStock,
          purchasePrice: purchasePriceValidation.sanitizedAmount
        });
      }

      // Validate discount
      let discountAmount = 0;
      if (discount) {
        const discountValidation = MoneyValidator.validateAmount(discount, 'Discount', {
          allowZero: true,
          maxAmount: discountType === 'percentage' ? 100 : subtotal
        });
        
        if (!discountValidation.isValid) {
          throw new Error(`Invalid discount: ${discountValidation.errors.join(', ')}`);
        }
        
        if (discountType === 'percentage') {
          discountAmount = (subtotal * discountValidation.sanitizedAmount) / 100;
        } else {
          discountAmount = discountValidation.sanitizedAmount;
        }
      }

      const grandTotal = Math.max(0, Math.round((subtotal - discountAmount) * 100) / 100);
      
      // Validate payment amount
      const paidAmountValue = paidAmount || 0;
      const paidAmountValidation = MoneyValidator.validateAmount(paidAmountValue, 'Paid amount', {
        allowZero: true,
        maxAmount: grandTotal
      });
      
      if (!paidAmountValidation.isValid) {
        throw new Error(`Invalid paid amount: ${paidAmountValidation.errors.join(', ')}`);
      }

      const finalPaidAmount = paidAmountValidation.sanitizedAmount;
      const dueAmount = Math.round((grandTotal - finalPaidAmount) * 100) / 100;

      // Validate additional costs
      const finalTransportCost = transportCost ? 
        MoneyValidator.validateAmount(transportCost, 'Transport cost', { allowZero: true, maxAmount: 100000 }).sanitizedAmount : 0;
      
      const finalOtherCharges = otherCharges ? 
        MoneyValidator.validateAmount(otherCharges, 'Other charges', { allowZero: true, maxAmount: 100000 }).sanitizedAmount : 0;

      // Create stock purchase
      const stockPurchase = new StockPurchase({
        supplier: supplier._id,
        supplierName: supplier.name,
        supplierPhone: supplier.phone,
        supplierAddress: supplier.address,
        items: purchaseItems,
        subtotal: Math.round(subtotal * 100) / 100,
        discount: discount || 0,
        discountType: discountType || 'amount',
        grandTotal,
        paidAmount: finalPaidAmount,
        dueAmount,
        paymentMethod: paymentMethod || 'cash',
        purchaseDate: purchaseDate ? new Date(purchaseDate) : new Date(),
        deliveryDate: deliveryDate ? new Date(deliveryDate) : undefined,
        invoiceReference: invoiceReference || {},
        transportCost: finalTransportCost,
        otherCharges: finalOtherCharges,
        notes,
        createdBy: req.user.id
      });

      await stockPurchase.save({ session });

      // Create investment record
      const totalInvestment = grandTotal + finalTransportCost + finalOtherCharges;
      
      const investment = new Investment({
        type: 'stock_purchase',
        category: 'inventory',
        description: `Stock purchase from ${supplier.name} - ${stockPurchase.purchaseNo}`,
        amount: totalInvestment,
        relatedDocument: {
          documentType: 'stock_purchase',
          documentId: stockPurchase._id,
          documentNo: stockPurchase.purchaseNo
        },
        supplier: supplier._id,
        supplierName: supplier.name,
        investmentDate: stockPurchase.purchaseDate,
        paymentMethod: paymentMethod || 'cash',
        notes: `Investment for stock purchase ${stockPurchase.purchaseNo}`,
        createdBy: req.user.id
      });

      await investment.save({ session });

      // Link investment to stock purchase
      stockPurchase.investmentRecord = investment._id;
      await stockPurchase.save({ session });

      // Update stock quantities and purchase prices
      for (const update of stockUpdates) {
        await Product.findByIdAndUpdate(
          update.productId,
          { 
            stockQuantity: update.newStock,
            purchasePrice: update.purchasePrice,
            updatedBy: req.user.id
          },
          { session }
        );
      }

      // Update supplier totals if there's a due amount
      if (dueAmount > 0) {
        await supplier.updateTotals();
      }

      // Populate the created purchase
      await stockPurchase.populate('supplier', 'name phone address');
      await stockPurchase.populate('items.product', 'name materialType company thicknessMM quality measurementType unit');
      await stockPurchase.populate('investmentRecord');
      await stockPurchase.populate('createdBy', 'name email');

      // Log audit trail
      await AuditService.logAction({
        action: 'STOCK_PURCHASE_CREATE',
        entityType: 'StockPurchase',
        entityId: stockPurchase._id,
        performedBy: req.user.id,
        details: {
          purchaseNo: stockPurchase.purchaseNo,
          supplier: supplier.name,
          itemCount: purchaseItems.length,
          grandTotal: grandTotal,
          investmentAmount: totalInvestment,
          stockUpdates: stockUpdates.map(update => ({
            productId: update.productId,
            newStock: update.newStock
          }))
        },
        metadata: {
          ipAddress: req.ip,
          userAgent: req.get('User-Agent')
        }
      });

      res.status(201).json({
        success: true,
        message: 'Stock purchase created successfully',
        data: {
          stockPurchase: stockPurchase,
          investment: investment,
          stockUpdates: stockUpdates.length
        }
      });
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
      suggestion: 'Please check your input data and ensure all required fields are properly filled.'
    });
  } finally {
    await session.endSession();
  }
});

// @desc    Update stock purchase payment
// @route   PUT /api/stock-purchases/:id/payment
// @access  Private (Manager and above)
export const updatePayment = asyncHandler(async (req, res) => {
  const session = await mongoose.startSession();
  
  try {
    await session.withTransaction(async () => {
      const { amount, paymentMethod, notes } = req.body;

      const purchase = await StockPurchase.findById(req.params.id)
        .populate('supplier')
        .session(session);

      if (!purchase) {
        throw new Error('Stock purchase not found');
      }

      if (!purchase.isActive) {
        throw new Error('Stock purchase is not active');
      }

      if (purchase.status === 'paid') {
        throw new Error('Stock purchase is already fully paid');
      }

      // Validate payment amount
      const paymentValidation = MoneyValidator.validateAmount(amount, 'Payment amount', {
        allowZero: false,
        maxAmount: purchase.dueAmount
      });

      if (!paymentValidation.isValid) {
        throw new Error(`Invalid payment amount: ${paymentValidation.errors.join(', ')}`);
      }

      const paymentAmount = paymentValidation.sanitizedAmount;

      // Update purchase payment
      purchase.paidAmount += paymentAmount;
      purchase.dueAmount = Math.max(0, purchase.grandTotal - purchase.paidAmount);
      
      // Update status
      if (purchase.dueAmount === 0) {
        purchase.status = 'paid';
      } else {
        purchase.status = 'partial';
      }

      purchase.updatedBy = req.user.id;
      await purchase.save({ session });

      // Update supplier totals
      if (purchase.supplier) {
        await purchase.supplier.updateTotals();
      }

      // Log audit trail
      await AuditService.logAction({
        action: 'STOCK_PURCHASE_PAYMENT',
        entityType: 'StockPurchase',
        entityId: purchase._id,
        performedBy: req.user.id,
        details: {
          purchaseNo: purchase.purchaseNo,
          paymentAmount: paymentAmount,
          newPaidAmount: purchase.paidAmount,
          newDueAmount: purchase.dueAmount,
          newStatus: purchase.status,
          paymentMethod: paymentMethod || 'cash',
          notes: notes
        },
        metadata: {
          ipAddress: req.ip,
          userAgent: req.get('User-Agent')
        }
      });

      res.status(200).json({
        success: true,
        message: 'Payment updated successfully',
        data: {
          purchaseNo: purchase.purchaseNo,
          paidAmount: purchase.paidAmount,
          dueAmount: purchase.dueAmount,
          status: purchase.status,
          formattedPaidAmount: CurrencyService.formatBDT(purchase.paidAmount),
          formattedDueAmount: CurrencyService.formatBDT(purchase.dueAmount)
        }
      });
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  } finally {
    await session.endSession();
  }
});

// @desc    Get stock purchase statistics
// @route   GET /api/stock-purchases/stats
// @access  Private (Manager and above)
export const getStockPurchaseStats = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;

  // Build date filter
  const dateFilter = { isActive: true, isDeleted: { $ne: true } };
  if (startDate || endDate) {
    dateFilter.purchaseDate = {};
    if (startDate) {
      dateFilter.purchaseDate.$gte = new Date(startDate);
    }
    if (endDate) {
      dateFilter.purchaseDate.$lte = new Date(endDate);
    }
  }

  const stats = await StockPurchase.aggregate([
    { $match: dateFilter },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalAmount: { $sum: '$grandTotal' },
        totalPaid: { $sum: '$paidAmount' },
        totalDue: { $sum: '$dueAmount' }
      }
    }
  ]);

  // Overall stats
  const overallStats = await StockPurchase.aggregate([
    { $match: dateFilter },
    {
      $group: {
        _id: null,
        totalPurchases: { $sum: 1 },
        totalInvestment: { $sum: '$grandTotal' },
        totalPaid: { $sum: '$paidAmount' },
        totalDue: { $sum: '$dueAmount' },
        avgPurchaseValue: { $avg: '$grandTotal' }
      }
    }
  ]);

  // Top suppliers
  const topSuppliers = await StockPurchase.aggregate([
    { $match: dateFilter },
    {
      $group: {
        _id: '$supplier',
        supplierName: { $first: '$supplierName' },
        totalPurchases: { $sum: 1 },
        totalAmount: { $sum: '$grandTotal' },
        totalDue: { $sum: '$dueAmount' }
      }
    },
    { $sort: { totalAmount: -1 } },
    { $limit: 10 }
  ]);

  res.status(200).json({
    success: true,
    data: {
      byStatus: stats,
      overall: overallStats[0] || {},
      topSuppliers
    }
  });
});

// @desc    Get pending payments to suppliers
// @route   GET /api/stock-purchases/pending
// @access  Private (Manager and above)
export const getPendingPayments = asyncHandler(async (req, res) => {
  const pendingPurchases = await StockPurchase.find({
    status: { $in: ['due', 'partial'] },
    isActive: true,
    isDeleted: { $ne: true }
  })
    .populate('supplier', 'name phone')
    .populate('createdBy', 'name email')
    .sort({ purchaseDate: -1 })
    .select('purchaseNo supplierName grandTotal paidAmount dueAmount status purchaseDate');

  const totalDue = pendingPurchases.reduce((sum, purchase) => sum + purchase.dueAmount, 0);

  res.status(200).json({
    success: true,
    count: pendingPurchases.length,
    totalDue: parseFloat(totalDue.toFixed(2)),
    formattedTotalDue: CurrencyService.formatBDT(totalDue),
    data: pendingPurchases
  });
});

// @desc    Search stock purchases
// @route   GET /api/stock-purchases/search
// @access  Private (Manager and above)
export const searchStockPurchases = asyncHandler(async (req, res) => {
  const { q } = req.query;

  if (!q) {
    return res.status(400).json({
      success: false,
      message: 'Please provide a search query'
    });
  }

  const purchases = await StockPurchase.find({
    isActive: true,
    isDeleted: { $ne: true },
    $or: [
      { purchaseNo: { $regex: q, $options: 'i' } },
      { supplierName: { $regex: q, $options: 'i' } },
      { 'invoiceReference.supplierInvoiceNo': { $regex: q, $options: 'i' } }
    ]
  })
    .populate('supplier', 'name phone')
    .populate('createdBy', 'name email')
    .sort({ purchaseDate: -1 })
    .limit(20)
    .select('purchaseNo supplierName grandTotal status purchaseDate');

  res.status(200).json({
    success: true,
    count: purchases.length,
    data: purchases
  });
});