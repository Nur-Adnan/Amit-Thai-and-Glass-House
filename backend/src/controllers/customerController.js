import asyncHandler from '../utils/asyncHandler.js';
import Customer from '../models/Customer.js';
import Invoice from '../models/Invoice.js';
import mongoose from 'mongoose';
import AuditService from '../services/auditService.js';
import SoftDeleteService from '../services/softDeleteService.js';

// @desc    Get all customers
// @route   GET /api/customers
// @access  Private (All authenticated users)
const getCustomers = asyncHandler(async (req, res) => {
  const {
    customerType,
    isActive,
    search,
    hasDue,
    sortBy = 'createdAt',
    sortOrder = 'desc',
    page = 1,
    limit = 10
  } = req.query;

  // Build query - exclude soft deleted items by default
  const query = { isDeleted: { $ne: true } };

  if (customerType) {
    query.customerType = customerType;
  }

  if (isActive !== undefined) {
    query.isActive = isActive === 'true';
  }

  if (hasDue === 'true') {
    query.totalDue = { $gt: 0 };
  } else if (hasDue === 'false') {
    query.totalDue = 0;
  }

  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { phone: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { customerId: { $regex: search, $options: 'i' } }
    ];
  }

  // Calculate pagination
  const skip = (page - 1) * limit;

  // Build sort object
  const sort = {};
  sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

  const customers = await Customer.find(query)
    .populate('createdBy', 'name email')
    .populate('updatedBy', 'name email')
    .sort(sort)
    .skip(skip)
    .limit(parseInt(limit));

  const total = await Customer.countDocuments(query);

  res.status(200).json({
    success: true,
    count: customers.length,
    total,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(total / limit)
    },
    data: customers
  });
});

// @desc    Get single customer
// @route   GET /api/customers/:id
// @access  Private (All authenticated users)
const getCustomer = asyncHandler(async (req, res) => {
  const customer = await Customer.findById(req.params.id)
    .populate('createdBy', 'name email')
    .populate('updatedBy', 'name email');

  if (!customer) {
    return res.status(404).json({
      success: false,
      message: 'Customer not found'
    });
  }

  // Get recent invoices for this customer
  const recentInvoices = await Invoice.find({
    customer: customer._id,
    isActive: true
  })
    .select('invoiceNo grandTotal paidAmount dueAmount status createdAt')
    .sort({ createdAt: -1 })
    .limit(10);

  res.status(200).json({
    success: true,
    data: {
      customer,
      recentInvoices
    }
  });
});

// @desc    Create new customer
// @route   POST /api/customers
// @access  Private (Manager and above)
const createCustomer = asyncHandler(async (req, res) => {
  try {
    // Generate customer ID
    const customerId = await Customer.generateCustomerId();
    
    // Add generated ID and user to request body
    req.body.customerId = customerId;
    req.body.createdBy = req.user.id;

    const customer = await Customer.create(req.body);

    // Populate the created customer
    await customer.populate('createdBy', 'name email');

    // Log audit trail
    await AuditService.logCustomerCreate(customer, req.user, req);

    res.status(201).json({
      success: true,
      message: 'Customer created successfully',
      data: customer
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// @desc    Update customer
// @route   PUT /api/customers/:id
// @access  Private (Manager and above)
const updateCustomer = asyncHandler(async (req, res) => {
  let customer = await Customer.findById(req.params.id);

  if (!customer) {
    return res.status(404).json({
      success: false,
      message: 'Customer not found'
    });
  }

  // Store old customer data for audit
  const oldCustomer = { ...customer.toObject() };

  // Add updatedBy field
  req.body.updatedBy = req.user.id;

  // Don't allow updating calculated fields
  delete req.body.totalDue;
  delete req.body.totalSales;
  delete req.body.totalPaid;
  delete req.body.invoiceCount;
  delete req.body.lastInvoiceDate;
  delete req.body.customerId;

  customer = await Customer.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  }).populate('createdBy', 'name email')
    .populate('updatedBy', 'name email');

  // Log audit trail
  await AuditService.logCustomerUpdate(oldCustomer, customer, req.user, req);

  res.status(200).json({
    success: true,
    message: 'Customer updated successfully',
    data: customer
  });
});

// @desc    Soft delete customer
// @route   DELETE /api/customers/:id
// @access  Private (Manager and above)
const deleteCustomer = asyncHandler(async (req, res) => {
  const customer = await Customer.findById(req.params.id);

  if (!customer) {
    return res.status(404).json({
      success: false,
      message: 'Customer not found'
    });
  }

  if (customer.isDeleted) {
    return res.status(400).json({
      success: false,
      message: 'Customer is already deleted'
    });
  }

  // Check if customer has any active invoices
  const invoiceCount = await Invoice.countDocuments({
    customer: customer._id,
    isActive: true,
    isDeleted: { $ne: true }
  });

  if (invoiceCount > 0) {
    return res.status(400).json({
      success: false,
      message: `Cannot delete customer with ${invoiceCount} active invoices. Please deactivate instead.`
    });
  }

  // Use soft delete service
  const result = await SoftDeleteService.softDelete(customer, req.user.id, req, req.body.reason);

  if (!result.success) {
    return res.status(400).json({
      success: false,
      message: result.message
    });
  }

  res.status(200).json({
    success: true,
    message: 'Customer deleted successfully',
    data: result.entity
  });
});

// @desc    Restore soft deleted customer
// @route   PUT /api/customers/:id/restore
// @access  Private (Manager and above)
const restoreCustomer = asyncHandler(async (req, res) => {
  const customer = await Customer.findById(req.params.id);

  if (!customer) {
    return res.status(404).json({
      success: false,
      message: 'Customer not found'
    });
  }

  if (!customer.isDeleted) {
    return res.status(400).json({
      success: false,
      message: 'Customer is not deleted'
    });
  }

  // Use soft delete service
  const result = await SoftDeleteService.restore(customer, req.user.id, req, req.body.reason);

  if (!result.success) {
    return res.status(400).json({
      success: false,
      message: result.message
    });
  }

  res.status(200).json({
    success: true,
    message: 'Customer restored successfully',
    data: result.entity
  });
});

// @desc    Get soft deleted customers
// @route   GET /api/customers/deleted
// @access  Private (Manager and above)
const getDeletedCustomers = asyncHandler(async (req, res) => {
  const {
    customerType,
    search,
    sortBy = 'deletedAt',
    sortOrder = 'desc',
    page = 1,
    limit = 10
  } = req.query;

  // Build filters
  const filters = {};
  if (customerType) filters.customerType = customerType;
  if (search) {
    filters.$or = [
      { name: { $regex: search, $options: 'i' } },
      { phone: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { customerId: { $regex: search, $options: 'i' } }
    ];
  }

  const options = {
    page,
    limit,
    sortBy,
    sortOrder,
    populate: ['createdBy', 'updatedBy', 'deletedBy']
  };

  const result = await SoftDeleteService.getDeleted(Customer, filters, options);

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

// @desc    Deactivate customer
// @route   PUT /api/customers/:id/deactivate
// @access  Private (Manager and above)
const deactivateCustomer = asyncHandler(async (req, res) => {
  const customer = await Customer.findById(req.params.id);

  if (!customer) {
    return res.status(404).json({
      success: false,
      message: 'Customer not found'
    });
  }

  if (!customer.isActive) {
    return res.status(400).json({
      success: false,
      message: 'Customer is already deactivated'
    });
  }

  customer.isActive = false;
  customer.updatedBy = req.user.id;
  await customer.save();

  await customer.populate('updatedBy', 'name email');

  res.status(200).json({
    success: true,
    message: 'Customer deactivated successfully',
    data: customer
  });
});

// @desc    Activate customer
// @route   PUT /api/customers/:id/activate
// @access  Private (Manager and above)
const activateCustomer = asyncHandler(async (req, res) => {
  const customer = await Customer.findById(req.params.id);

  if (!customer) {
    return res.status(404).json({
      success: false,
      message: 'Customer not found'
    });
  }

  if (customer.isActive) {
    return res.status(400).json({
      success: false,
      message: 'Customer is already active'
    });
  }

  customer.isActive = true;
  customer.updatedBy = req.user.id;
  await customer.save();

  await customer.populate('updatedBy', 'name email');

  res.status(200).json({
    success: true,
    message: 'Customer activated successfully',
    data: customer
  });
});

// @desc    Recalculate customer totals
// @route   PUT /api/customers/:id/recalculate
// @access  Private (Manager and above)
const recalculateCustomerTotals = asyncHandler(async (req, res) => {
  const customer = await Customer.findById(req.params.id);

  if (!customer) {
    return res.status(404).json({
      success: false,
      message: 'Customer not found'
    });
  }

  const oldTotals = {
    totalSales: customer.totalSales,
    totalPaid: customer.totalPaid,
    totalDue: customer.totalDue,
    invoiceCount: customer.invoiceCount
  };

  await customer.recalculateTotals();

  res.status(200).json({
    success: true,
    message: 'Customer totals recalculated successfully',
    data: {
      customer,
      changes: {
        oldTotals,
        newTotals: {
          totalSales: customer.totalSales,
          totalPaid: customer.totalPaid,
          totalDue: customer.totalDue,
          invoiceCount: customer.invoiceCount
        }
      }
    }
  });
});

// @desc    Get customer statistics
// @route   GET /api/customers/stats
// @access  Private (Manager and above)
const getCustomerStats = asyncHandler(async (req, res) => {
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

  // Overall statistics
  const overallStats = await Customer.aggregate([
    { $match: dateFilter },
    {
      $group: {
        _id: null,
        totalCustomers: { $sum: 1 },
        activeCustomers: { $sum: { $cond: ['$isActive', 1, 0] } },
        customersWithDue: { $sum: { $cond: [{ $gt: ['$totalDue', 0] }, 1, 0] } },
        totalDueAmount: { $sum: '$totalDue' },
        totalSalesAmount: { $sum: '$totalSales' },
        avgSalesPerCustomer: { $avg: '$totalSales' },
        avgDuePerCustomer: { $avg: '$totalDue' }
      }
    }
  ]);

  // Customer type breakdown
  const typeBreakdown = await Customer.aggregate([
    { $match: dateFilter },
    {
      $group: {
        _id: '$customerType',
        count: { $sum: 1 },
        totalSales: { $sum: '$totalSales' },
        totalDue: { $sum: '$totalDue' },
        avgSales: { $avg: '$totalSales' }
      }
    },
    { $sort: { count: -1 } }
  ]);

  // Top customers by sales
  const topCustomersBySales = await Customer.find(dateFilter)
    .select('customerId name totalSales totalDue invoiceCount')
    .sort({ totalSales: -1 })
    .limit(10);

  // Top customers by due amount
  const topCustomersByDue = await Customer.find({
    ...dateFilter,
    totalDue: { $gt: 0 }
  })
    .select('customerId name totalSales totalDue invoiceCount')
    .sort({ totalDue: -1 })
    .limit(10);

  // Monthly customer acquisition
  const monthlyAcquisition = await Customer.aggregate([
    { $match: dateFilter },
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' }
        },
        newCustomers: { $sum: 1 },
        totalSales: { $sum: '$totalSales' }
      }
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } }
  ]);

  res.status(200).json({
    success: true,
    data: {
      overall: overallStats[0] || {},
      byType: typeBreakdown,
      topCustomersBySales,
      topCustomersByDue,
      monthlyAcquisition
    }
  });
});

// @desc    Search customers
// @route   GET /api/customers/search
// @access  Private (All authenticated users)
const searchCustomers = asyncHandler(async (req, res) => {
  const { q } = req.query;

  if (!q) {
    return res.status(400).json({
      success: false,
      message: 'Please provide a search query'
    });
  }

  const customers = await Customer.find({
    isActive: true,
    isDeleted: { $ne: true },
    $or: [
      { name: { $regex: q, $options: 'i' } },
      { phone: { $regex: q, $options: 'i' } },
      { email: { $regex: q, $options: 'i' } },
      { customerId: { $regex: q, $options: 'i' } }
    ]
  })
    .select('customerId name phone email totalDue totalSales')
    .sort({ name: 1 })
    .limit(20);

  res.status(200).json({
    success: true,
    count: customers.length,
    data: customers
  });
});

// @desc    Get customers with due balances
// @route   GET /api/customers/due-balances
// @access  Private (Manager and above)
const getCustomersWithDue = asyncHandler(async (req, res) => {
  const { minAmount = 0 } = req.query;

  const customers = await Customer.find({
    isActive: true,
    isDeleted: { $ne: true },
    totalDue: { $gt: parseFloat(minAmount) }
  })
    .select('customerId name phone totalDue totalSales lastInvoiceDate')
    .sort({ totalDue: -1 });

  const totalDueAmount = customers.reduce((sum, customer) => sum + customer.totalDue, 0);

  res.status(200).json({
    success: true,
    count: customers.length,
    totalDueAmount: parseFloat(totalDueAmount.toFixed(2)),
    data: customers
  });
});

export {
  getCustomers,
  getCustomer,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  restoreCustomer,
  getDeletedCustomers,
  deactivateCustomer,
  activateCustomer,
  recalculateCustomerTotals,
  getCustomerStats,
  searchCustomers,
  getCustomersWithDue
};