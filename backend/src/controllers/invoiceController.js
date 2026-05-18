import asyncHandler from '../utils/asyncHandler.js';
import Invoice from '../models/Invoice.js';
import Product from '../models/Product.js';
import Customer from '../models/Customer.js';
import mongoose from 'mongoose';
import { validateStockAvailability, validatePaymentAmount, validateCalculations, restoreInvoiceStock } from '../utils/businessValidation.js';
import AuditService from '../services/auditService.js';
import BusinessRulesService from '../services/businessRulesService.js';
import { logConfirmedAction } from '../middleware/confirmationRequired.js';
import SoftDeleteService from '../services/softDeleteService.js';
import { BusinessValidator, MoneyValidator, DateValidator } from '../utils/validation.js';
import CurrencyService from '../services/currencyService.js';
import DateService from '../services/dateService.js';

// @desc    Get all invoices
// @route   GET /api/invoices
// @access  Private (All authenticated users)
export const getInvoices = asyncHandler(async (req, res) => {
  const {
    status,
    customerName,
    startDate,
    endDate,
    sortBy = 'createdAt',
    sortOrder = 'desc',
    page = 1,
    limit = 10
  } = req.query;

  // Build query - exclude soft deleted items by default
  const query = { isActive: true, isDeleted: { $ne: true } };

  if (status) {
    query.status = status;
  }

  if (customerName) {
    query.customerName = { $regex: customerName, $options: 'i' };
  }

  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) {
      query.createdAt.$gte = new Date(startDate);
    }
    if (endDate) {
      query.createdAt.$lte = new Date(endDate);
    }
  }

  // Calculate pagination
  const skip = (page - 1) * limit;

  // Build sort object
  const sort = {};
  sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

  const invoices = await Invoice.find(query)
    .populate('items.product', 'name category materialType company thicknessMM quality measurementType')
    .populate('createdBy', 'name email')
    .populate('updatedBy', 'name email')
    .sort(sort)
    .skip(skip)
    .limit(parseInt(limit));

  const total = await Invoice.countDocuments(query);

  // Format invoices with currency and date formatting
  const formattedInvoices = invoices.map(invoice => ({
    ...invoice.toObject(),
    formattedSubtotal: CurrencyService.formatBDT(invoice.subtotal),
    formattedGrandTotal: CurrencyService.formatBDT(invoice.grandTotal),
    formattedPaidAmount: CurrencyService.formatBDT(invoice.paidAmount),
    formattedDueAmount: CurrencyService.formatBDT(invoice.dueAmount),
    formattedCreatedAt: DateService.format(invoice.createdAt, 'medium'),
    formattedUpdatedAt: DateService.format(invoice.updatedAt, 'medium')
  }));

  res.status(200).json({
    success: true,
    count: invoices.length,
    total,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(total / limit)
    },
    data: formattedInvoices
  });
});

// @desc    Get single invoice
// @route   GET /api/invoices/:id
// @access  Private (All authenticated users)
export const getInvoice = asyncHandler(async (req, res) => {
  const invoice = await Invoice.findById(req.params.id)
    .populate('items.product', 'name category materialType company thicknessMM quality measurementType unit')
    .populate('createdBy', 'name email')
    .populate('updatedBy', 'name email');

  if (!invoice) {
    return res.status(404).json({
      success: false,
      message: 'Invoice not found',
      suggestion: 'Please check the invoice ID and try again.'
    });
  }

  res.status(200).json({
    success: true,
    data: {
      ...invoice.toObject(),
      formattedSubtotal: CurrencyService.formatBDT(invoice.subtotal),
      formattedGrandTotal: CurrencyService.formatBDT(invoice.grandTotal),
      formattedPaidAmount: CurrencyService.formatBDT(invoice.paidAmount),
      formattedDueAmount: CurrencyService.formatBDT(invoice.dueAmount),
      formattedCreatedAt: DateService.format(invoice.createdAt, 'datetime'),
      formattedUpdatedAt: DateService.format(invoice.updatedAt, 'datetime')
    }
  });
});

// @desc    Create new invoice
// @route   POST /api/invoices
// @access  Private (Manager and above)
export const createInvoice = asyncHandler(async (req, res) => {
  const session = await mongoose.startSession();
  
  try {
    await session.withTransaction(async () => {
      const { 
        items, 
        customerId, 
        customerName, 
        customerPhone, 
        customerAddress, 
        discount, 
        discountType, 
        paymentMethod, 
        notes 
      } = req.body;

      // Validate basic invoice data using BusinessValidator
      const invoiceValidation = BusinessValidator.validateInvoice({
        customerName,
        items,
        discount,
        discountType,
        paidAmount: req.body.paidAmount || 0
      });

      if (!invoiceValidation.isValid) {
        throw new Error(`Invoice validation failed: ${invoiceValidation.errors.join(', ')}`);
      }

      // Handle customer assignment
      let customer = null;
      let finalCustomerName = customerName;
      let finalCustomerPhone = customerPhone;
      let finalCustomerAddress = customerAddress;
      let customerType = 'walk-in';

      if (customerId) {
        // Find existing customer
        customer = await Customer.findById(customerId).session(session);
        if (!customer) {
          throw new Error('Customer not found');
        }
        if (!customer.isActive) {
          throw new Error('Customer is not active');
        }
        
        // Use customer details
        finalCustomerName = customer.name;
        finalCustomerPhone = customer.phone;
        finalCustomerAddress = customer.fullAddress;
        customerType = 'regular';
      } else if (customerName) {
        // Validate customer details for walk-in
        if (customerPhone) {
          const phoneValidation = GeneralValidator.validatePhone(customerPhone, 'Customer phone');
          if (!phoneValidation.isValid) {
            throw new Error(`Invalid customer phone: ${phoneValidation.errors.join(', ')}`);
          }
          finalCustomerPhone = phoneValidation.sanitizedPhone;
        }
        customerType = 'walk-in';
      } else {
        throw new Error('Customer name is required');
      }

      // Check stock availability for all items first
      const stockValidations = [];
      for (const item of items) {
        const validation = await validateStockAvailability(item.product, item.quantity);
        if (!validation.isValid) {
          throw new Error(validation.message);
        }
        stockValidations.push(validation);
      }

      // Prepare invoice items and stock updates with proper validation
      const invoiceItems = [];
      const stockUpdates = [];

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
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
          maxAmount: 10000
        });
        
        if (!quantityValidation.isValid) {
          throw new Error(`Invalid quantity for ${product.name}: ${quantityValidation.errors.join(', ')}`);
        }

        const unitPrice = item.unitPrice || product.sellingPrice;
        const unitPriceValidation = MoneyValidator.validateAmount(unitPrice, 'Unit price', {
          allowZero: false,
          maxAmount: 100000
        });
        
        if (!unitPriceValidation.isValid) {
          throw new Error(`Invalid unit price for ${product.name}: ${unitPriceValidation.errors.join(', ')}`);
        }

        // Calculate total price with proper rounding
        const totalPrice = Math.round(quantityValidation.sanitizedAmount * unitPriceValidation.sanitizedAmount * 100) / 100;

        // Build invoice item with variant tracking
        const invoiceItem = {
          product: product._id,
          productName: product.name,
          quantity: quantityValidation.sanitizedAmount,
          unit: product.unit,
          unitPrice: unitPriceValidation.sanitizedAmount,
          totalPrice: totalPrice
        };

        // Add variant tracking fields for Thai & Glass materials
        if (product.materialType && ['Thai', 'Glass'].includes(product.materialType)) {
          // Validate that product has complete variant information
          const variantValidation = await BusinessRulesService.validateInvoiceItem(item, product._id);
          if (!variantValidation.isValid) {
            throw new Error(`Variant validation failed for ${product.name}: ${variantValidation.errors.join(', ')}`);
          }

          invoiceItem.materialType = product.materialType;
          invoiceItem.company = product.company;
          invoiceItem.thicknessMM = product.thicknessMM;
          invoiceItem.quality = product.quality;
          invoiceItem.measurementType = product.measurementType;
          
          // Add calculated area if provided in the request
          if (item.calculatedArea) {
            invoiceItem.calculatedArea = item.calculatedArea;
          }
        }

        invoiceItems.push(invoiceItem);

        // Prepare stock update
        stockUpdates.push({
          productId: product._id,
          newStock: product.stockQuantity - quantityValidation.sanitizedAmount
        });
      }

      // Generate invoice number
      const invoiceNo = await Invoice.generateInvoiceNumber();

      // Calculate totals with proper validation
      const subtotal = invoiceItems.reduce((sum, item) => sum + item.totalPrice, 0);
      
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
      const paidAmountValue = req.body.paidAmount || 0;
      const paidAmountValidation = MoneyValidator.validateAmount(paidAmountValue, 'Paid amount', {
        allowZero: true,
        maxAmount: grandTotal
      });
      
      if (!paidAmountValidation.isValid) {
        throw new Error(`Invalid paid amount: ${paidAmountValidation.errors.join(', ')}`);
      }

      const paidAmount = paidAmountValidation.sanitizedAmount;
      const dueAmount = Math.round((grandTotal - paidAmount) * 100) / 100;
      
      // Credit limit check for customers with credit limits
      if (customer && customer.creditLimit > 0 && dueAmount > 0) {
        const newTotalDue = customer.totalDue + dueAmount;
        
        // Check if new total due would exceed credit limit
        if (newTotalDue > customer.creditLimit) {
          // Check if user has override permission (owner role)
          const allowOverride = req.body.overrideCreditLimit === true && req.user.role === 'owner';
          
          if (!allowOverride) {
            const excessAmount = newTotalDue - customer.creditLimit;
            throw new Error(
              `Credit limit exceeded. Customer: ${customer.name} (${customer.customerId})\n` +
              `Current Due: ${CurrencyService.formatBDT(customer.totalDue)}\n` +
              `Credit Limit: ${CurrencyService.formatBDT(customer.creditLimit)}\n` +
              `New Invoice Due: ${CurrencyService.formatBDT(dueAmount)}\n` +
              `Would Exceed By: ${CurrencyService.formatBDT(excessAmount)}\n` +
              `Available Credit: ${CurrencyService.formatBDT(customer.creditAvailable)}\n\n` +
              `To override this limit, contact the owner or pay down existing dues.`
            );
          } else {
            // Log the credit limit override
            await AuditService.logAction({
              action: 'CREDIT_LIMIT_OVERRIDE',
              entityType: 'Invoice',
              entityId: null, // Will be set after invoice creation
              performedBy: req.user.id,
              details: {
                customerId: customer.customerId,
                customerName: customer.name,
                creditLimit: customer.creditLimit,
                currentDue: customer.totalDue,
                newInvoiceDue: dueAmount,
                newTotalDue: newTotalDue,
                excessAmount: newTotalDue - customer.creditLimit
              },
              severity: 'high',
              metadata: {
                reason: 'Owner override for credit limit exceeded',
                ipAddress: req.ip,
                userAgent: req.get('User-Agent')
              }
            });
          }
        }
      }
      
      // Determine status
      let status = 'due';
      if (paidAmount === 0) {
        status = 'due';
      } else if (paidAmount >= grandTotal) {
        status = 'paid';
      } else {
        status = 'partial';
      }

      // Create invoice with validated data
      const finalInvoiceData = {
        invoiceNo,
        customer: customer ? customer._id : null,
        customerName: finalCustomerName,
        customerPhone: finalCustomerPhone,
        customerAddress: finalCustomerAddress,
        customerType,
        items: invoiceItems,
        subtotal: Math.round(subtotal * 100) / 100,
        discount: discount || 0,
        discountType: discountType || 'amount',
        grandTotal,
        paidAmount,
        dueAmount,
        status,
        paymentMethod: paymentMethod || 'cash',
        notes,
        createdBy: req.user.id
      };

      const invoice = new Invoice(finalInvoiceData);
      await invoice.save({ session });

      // Update stock quantities with validation
      for (const update of stockUpdates) {
        const product = await Product.findById(update.productId).session(session);
        if (update.newStock < 0) {
          throw new Error(`Stock validation failed for ${product.name}: insufficient stock`);
        }
        
        await Product.findByIdAndUpdate(
          update.productId,
          { 
            stockQuantity: update.newStock,
            updatedBy: req.user.id
          },
          { session }
        );
      }

      // Update customer totals if customer is assigned
      if (customer) {
        await customer.recalculateTotals();
      }

      // Populate the created invoice
      await invoice.populate('items.product', 'name category materialType company thicknessMM quality measurementType unit');
      await invoice.populate('customer', 'customerId name phone');
      await invoice.populate('createdBy', 'name email');

      // Log audit trail
      await AuditService.logInvoiceCreate(invoice, req.user, req);

      res.status(201).json({
        success: true,
        message: 'Invoice created successfully',
        data: {
          ...invoice.toObject(),
          formattedSubtotal: CurrencyService.formatBDT(invoice.subtotal),
          formattedGrandTotal: CurrencyService.formatBDT(invoice.grandTotal),
          formattedPaidAmount: CurrencyService.formatBDT(invoice.paidAmount),
          formattedDueAmount: CurrencyService.formatBDT(invoice.dueAmount),
          formattedCreatedAt: DateService.format(invoice.createdAt, 'datetime')
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

// @desc    Update invoice payment (deprecated - use /payments endpoint)
// @route   PUT /api/invoices/:id/payment
// @access  Private (Manager and above)
export const updatePayment = asyncHandler(async (req, res) => {
  res.status(400).json({
    success: false,
    message: 'This endpoint is deprecated. Use POST /api/invoices/:invoiceId/payments to add payments'
  });
});

// @desc    Cancel invoice (restore stock)
// @route   PUT /api/invoices/:id/cancel
// @access  Private (Manager and above)
export const cancelInvoice = asyncHandler(async (req, res) => {
  const session = await mongoose.startSession();
  
  try {
    await session.withTransaction(async () => {
      const invoice = await Invoice.findById(req.params.id)
        .populate('customer')
        .session(session);

      if (!invoice) {
        throw new Error('Invoice not found');
      }

      if (!invoice.isActive) {
        throw new Error('Invoice is already cancelled');
      }

      // Restore stock using validation utility
      const restorationResult = await restoreInvoiceStock(invoice, req.user);
      
      if (!restorationResult.success) {
        throw new Error(restorationResult.message);
      }

      // Mark invoice as cancelled
      invoice.isActive = false;
      invoice.updatedBy = req.user.id;
      await invoice.save({ session });

      // Update customer totals if customer is assigned
      if (invoice.customer) {
        await invoice.customer.recalculateTotals();
      }

      // Log audit trail with confirmation details
      await logConfirmedAction(
        req,
        'invoice_cancel',
        'Invoice',
        invoice._id,
        invoice.invoiceNo,
        {
          previousStatus: 'active',
          newStatus: 'cancelled',
          stockRestorations: restorationResult.restorations,
          customerImpact: invoice.customer ? {
            customerId: invoice.customer._id,
            customerName: invoice.customer.name
          } : null
        }
      );

      res.status(200).json({
        success: true,
        message: 'Invoice cancelled successfully and stock restored',
        stockRestorations: restorationResult.restorations
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

// @desc    Get invoice statistics
// @route   GET /api/invoices/stats
// @access  Private (Manager and above)
export const getInvoiceStats = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;

  // Build date filter
  const dateFilter = { isActive: true };
  if (startDate || endDate) {
    dateFilter.createdAt = {};
    if (startDate) {
      dateFilter.createdAt.$gte = new Date(startDate);
    }
    if (endDate) {
      dateFilter.createdAt.$lte = new Date(endDate);
    }
  }

  const stats = await Invoice.aggregate([
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
  const overallStats = await Invoice.aggregate([
    { $match: dateFilter },
    {
      $group: {
        _id: null,
        totalInvoices: { $sum: 1 },
        totalRevenue: { $sum: '$grandTotal' },
        totalPaid: { $sum: '$paidAmount' },
        totalDue: { $sum: '$dueAmount' },
        avgInvoiceValue: { $avg: '$grandTotal' }
      }
    }
  ]);

  // Top products
  const topProducts = await Invoice.aggregate([
    { $match: dateFilter },
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
    { $limit: 10 }
  ]);

  res.status(200).json({
    success: true,
    data: {
      byStatus: stats,
      overall: overallStats[0] || {},
      topProducts
    }
  });
});

// @desc    Get pending payments
// @route   GET /api/invoices/pending
// @access  Private (Manager and above)
export const getPendingPayments = asyncHandler(async (req, res) => {
  const pendingInvoices = await Invoice.find({
    status: { $in: ['due', 'partial'] },
    isActive: true
  })
    .populate('createdBy', 'name email')
    .sort({ createdAt: -1 })
    .select('invoiceNo customerName grandTotal paidAmount dueAmount status createdAt');

  const totalDue = pendingInvoices.reduce((sum, invoice) => sum + invoice.dueAmount, 0);

  res.status(200).json({
    success: true,
    count: pendingInvoices.length,
    totalDue: parseFloat(totalDue.toFixed(2)),
    data: pendingInvoices
  });
});

// @desc    Soft delete invoice
// @route   DELETE /api/invoices/:id
// @access  Private (Manager and above)
export const deleteInvoice = asyncHandler(async (req, res) => {
  const invoice = await Invoice.findById(req.params.id);

  if (!invoice) {
    return res.status(404).json({
      success: false,
      message: 'Invoice not found'
    });
  }

  if (invoice.isDeleted) {
    return res.status(400).json({
      success: false,
      message: 'Invoice is already deleted'
    });
  }

  // Check if invoice is paid - paid invoices should not be deleted
  if (invoice.status === 'paid') {
    return res.status(400).json({
      success: false,
      message: 'Cannot delete paid invoices. Please contact administrator.'
    });
  }

  // Use soft delete service
  const result = await SoftDeleteService.softDelete(invoice, req.user.id, req, req.body.reason);

  if (!result.success) {
    return res.status(400).json({
      success: false,
      message: result.message
    });
  }

  res.status(200).json({
    success: true,
    message: 'Invoice deleted successfully',
    data: result.entity
  });
});

// @desc    Restore soft deleted invoice
// @route   PUT /api/invoices/:id/restore
// @access  Private (Manager and above)
export const restoreInvoice = asyncHandler(async (req, res) => {
  const invoice = await Invoice.findById(req.params.id);

  if (!invoice) {
    return res.status(404).json({
      success: false,
      message: 'Invoice not found'
    });
  }

  if (!invoice.isDeleted) {
    return res.status(400).json({
      success: false,
      message: 'Invoice is not deleted'
    });
  }

  // Use soft delete service
  const result = await SoftDeleteService.restore(invoice, req.user.id, req, req.body.reason);

  if (!result.success) {
    return res.status(400).json({
      success: false,
      message: result.message
    });
  }

  res.status(200).json({
    success: true,
    message: 'Invoice restored successfully',
    data: result.entity
  });
});

// @desc    Get soft deleted invoices
// @route   GET /api/invoices/deleted
// @access  Private (Manager and above)
export const getDeletedInvoices = asyncHandler(async (req, res) => {
  const {
    status,
    customerName,
    startDate,
    endDate,
    sortBy = 'deletedAt',
    sortOrder = 'desc',
    page = 1,
    limit = 10
  } = req.query;

  // Build filters
  const filters = {};
  if (status) filters.status = status;
  if (customerName) filters.customerName = { $regex: customerName, $options: 'i' };
  
  if (startDate || endDate) {
    filters.createdAt = {};
    if (startDate) filters.createdAt.$gte = new Date(startDate);
    if (endDate) filters.createdAt.$lte = new Date(endDate);
  }

  const options = {
    page,
    limit,
    sortBy,
    sortOrder,
    populate: ['createdBy', 'updatedBy', 'deletedBy', 'customer']
  };

  const result = await SoftDeleteService.getDeleted(Invoice, filters, options);

  if (!result.success) {
    return res.status(400).json({
      success: false,
      message: result.message
    });
  }

  res.status(200).json({
    success: true,
    count: result.data.length,
    pagination: result.pagination,
    data: result.data
  });
});

// @desc    Search invoices
// @route   GET /api/invoices/search
// @access  Private (All authenticated users)
export const searchInvoices = asyncHandler(async (req, res) => {
  const { q } = req.query;

  if (!q) {
    return res.status(400).json({
      success: false,
      message: 'Please provide a search query'
    });
  }

  const invoices = await Invoice.find({
    isActive: true,
    isDeleted: { $ne: true },
    $or: [
      { invoiceNo: { $regex: q, $options: 'i' } },
      { customerName: { $regex: q, $options: 'i' } },
      { customerPhone: { $regex: q, $options: 'i' } }
    ]
  })
    .populate('createdBy', 'name email')
    .sort({ createdAt: -1 })
    .limit(20)
    .select('invoiceNo customerName customerPhone grandTotal status createdAt');

  res.status(200).json({
    success: true,
    count: invoices.length,
    data: invoices
  });
});