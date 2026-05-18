import asyncHandler from '../utils/asyncHandler.js';
import Employee from '../models/Employee.js';
import SoftDeleteService from '../services/softDeleteService.js';

// @desc    Get all employees
// @route   GET /api/employees
// @access  Private (All authenticated users)
export const getEmployees = asyncHandler(async (req, res) => {
  const {
    department,
    employmentType,
    isActive,
    search,
    sortBy = 'createdAt',
    sortOrder = 'desc',
    page = 1,
    limit = 10
  } = req.query;

  // Build query - exclude soft deleted items by default
  const query = { isDeleted: { $ne: true } };

  if (department) {
    query.department = department;
  }

  if (employmentType) {
    query.employmentType = employmentType;
  }

  if (isActive !== undefined) {
    query.isActive = isActive === 'true';
  }

  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { employeeId: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { position: { $regex: search, $options: 'i' } }
    ];
  }

  // Calculate pagination
  const skip = (page - 1) * limit;

  // Build sort object
  const sort = {};
  sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

  const employees = await Employee.find(query)
    .populate('createdBy', 'name email')
    .populate('updatedBy', 'name email')
    .sort(sort)
    .skip(skip)
    .limit(parseInt(limit));

  const total = await Employee.countDocuments(query);

  res.status(200).json({
    success: true,
    count: employees.length,
    total,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(total / limit)
    },
    data: employees
  });
});

// @desc    Get single employee
// @route   GET /api/employees/:id
// @access  Private (All authenticated users)
export const getEmployee = asyncHandler(async (req, res) => {
  const employee = await Employee.findById(req.params.id)
    .populate('createdBy', 'name email')
    .populate('updatedBy', 'name email');

  if (!employee) {
    return res.status(404).json({
      success: false,
      message: 'Employee not found'
    });
  }

  res.status(200).json({
    success: true,
    data: employee
  });
});

// @desc    Create new employee
// @route   POST /api/employees
// @access  Private (Manager and above)
export const createEmployee = asyncHandler(async (req, res) => {
  // Generate employee ID
  const employeeId = await Employee.generateEmployeeId();
  
  // Add generated ID and creator to request body
  req.body.employeeId = employeeId;
  req.body.createdBy = req.user.id;

  const employee = await Employee.create(req.body);

  // Populate the created employee
  await employee.populate('createdBy', 'name email');

  res.status(201).json({
    success: true,
    message: 'Employee created successfully',
    data: employee
  });
});

// @desc    Update employee
// @route   PUT /api/employees/:id
// @access  Private (Manager and above)
export const updateEmployee = asyncHandler(async (req, res) => {
  let employee = await Employee.findById(req.params.id);

  if (!employee) {
    return res.status(404).json({
      success: false,
      message: 'Employee not found'
    });
  }

  // Add updatedBy field
  req.body.updatedBy = req.user.id;

  employee = await Employee.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  }).populate('createdBy', 'name email').populate('updatedBy', 'name email');

  res.status(200).json({
    success: true,
    message: 'Employee updated successfully',
    data: employee
  });
});

// @desc    Deactivate employee
// @route   PUT /api/employees/:id/deactivate
// @access  Private (Manager and above)
export const deactivateEmployee = asyncHandler(async (req, res) => {
  const { terminationDate, terminationReason } = req.body;

  const employee = await Employee.findById(req.params.id);

  if (!employee) {
    return res.status(404).json({
      success: false,
      message: 'Employee not found'
    });
  }

  if (!employee.isActive) {
    return res.status(400).json({
      success: false,
      message: 'Employee is already deactivated'
    });
  }

  employee.isActive = false;
  employee.terminationDate = terminationDate ? new Date(terminationDate) : new Date();
  employee.terminationReason = terminationReason;
  employee.updatedBy = req.user.id;

  await employee.save();

  await employee.populate('createdBy', 'name email');
  await employee.populate('updatedBy', 'name email');

  res.status(200).json({
    success: true,
    message: 'Employee deactivated successfully',
    data: employee
  });
});

// @desc    Activate employee
// @route   PUT /api/employees/:id/activate
// @access  Private (Manager and above)
export const activateEmployee = asyncHandler(async (req, res) => {
  const employee = await Employee.findById(req.params.id);

  if (!employee) {
    return res.status(404).json({
      success: false,
      message: 'Employee not found'
    });
  }

  if (employee.isActive) {
    return res.status(400).json({
      success: false,
      message: 'Employee is already active'
    });
  }

  employee.isActive = true;
  employee.terminationDate = undefined;
  employee.terminationReason = undefined;
  employee.updatedBy = req.user.id;

  await employee.save();

  await employee.populate('createdBy', 'name email');
  await employee.populate('updatedBy', 'name email');

  res.status(200).json({
    success: true,
    message: 'Employee activated successfully',
    data: employee
  });
});

// @desc    Soft delete employee
// @route   DELETE /api/employees/:id
// @access  Private (Owner only)
export const deleteEmployee = asyncHandler(async (req, res) => {
  const employee = await Employee.findById(req.params.id);

  if (!employee) {
    return res.status(404).json({
      success: false,
      message: 'Employee not found'
    });
  }

  if (employee.isDeleted) {
    return res.status(400).json({
      success: false,
      message: 'Employee is already deleted'
    });
  }

  // Use soft delete service
  const result = await SoftDeleteService.softDelete(employee, req.user.id, req, req.body.reason);

  if (!result.success) {
    return res.status(400).json({
      success: false,
      message: result.message
    });
  }

  res.status(200).json({
    success: true,
    message: 'Employee deleted successfully',
    data: result.entity
  });
});

// @desc    Restore soft deleted employee
// @route   PUT /api/employees/:id/restore
// @access  Private (Owner only)
export const restoreEmployee = asyncHandler(async (req, res) => {
  const employee = await Employee.findById(req.params.id);

  if (!employee) {
    return res.status(404).json({
      success: false,
      message: 'Employee not found'
    });
  }

  if (!employee.isDeleted) {
    return res.status(400).json({
      success: false,
      message: 'Employee is not deleted'
    });
  }

  // Use soft delete service
  const result = await SoftDeleteService.restore(employee, req.user.id, req, req.body.reason);

  if (!result.success) {
    return res.status(400).json({
      success: false,
      message: result.message
    });
  }

  res.status(200).json({
    success: true,
    message: 'Employee restored successfully',
    data: result.entity
  });
});

// @desc    Get soft deleted employees
// @route   GET /api/employees/deleted
// @access  Private (Owner only)
export const getDeletedEmployees = asyncHandler(async (req, res) => {
  const {
    department,
    employmentType,
    search,
    sortBy = 'deletedAt',
    sortOrder = 'desc',
    page = 1,
    limit = 10
  } = req.query;

  // Build filters
  const filters = {};
  if (department) filters.department = department;
  if (employmentType) filters.employmentType = employmentType;
  if (search) {
    filters.$or = [
      { name: { $regex: search, $options: 'i' } },
      { employeeId: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { position: { $regex: search, $options: 'i' } }
    ];
  }

  const options = {
    page,
    limit,
    sortBy,
    sortOrder,
    populate: ['createdBy', 'updatedBy', 'deletedBy']
  };

  const result = await SoftDeleteService.getDeleted(Employee, filters, options);

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

// @desc    Get employee statistics
// @route   GET /api/employees/stats
// @access  Private (Manager and above)
export const getEmployeeStats = asyncHandler(async (req, res) => {
  // Department-wise statistics (exclude soft deleted)
  const departmentStats = await Employee.aggregate([
    { $match: { isActive: true, isDeleted: { $ne: true } } },
    {
      $group: {
        _id: '$department',
        count: { $sum: 1 },
        avgSalary: { $avg: '$monthlySalary' },
        totalSalary: { $sum: '$monthlySalary' },
        minSalary: { $min: '$monthlySalary' },
        maxSalary: { $max: '$monthlySalary' }
      }
    },
    { $sort: { count: -1 } }
  ]);

  // Employment type statistics (exclude soft deleted)
  const employmentTypeStats = await Employee.aggregate([
    { $match: { isActive: true, isDeleted: { $ne: true } } },
    {
      $group: {
        _id: '$employmentType',
        count: { $sum: 1 },
        avgSalary: { $avg: '$monthlySalary' }
      }
    }
  ]);

  // Overall statistics (exclude soft deleted)
  const overallStats = await Employee.aggregate([
    { $match: { isDeleted: { $ne: true } } },
    {
      $group: {
        _id: null,
        totalEmployees: { $sum: 1 },
        activeEmployees: { $sum: { $cond: ['$isActive', 1, 0] } },
        inactiveEmployees: { $sum: { $cond: ['$isActive', 0, 1] } },
        totalMonthlySalary: { $sum: { $cond: ['$isActive', '$monthlySalary', 0] } },
        avgSalary: { $avg: { $cond: ['$isActive', '$monthlySalary', null] } },
        minSalary: { $min: { $cond: ['$isActive', '$monthlySalary', null] } },
        maxSalary: { $max: { $cond: ['$isActive', '$monthlySalary', null] } }
      }
    }
  ]);

  // Recent joinings (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const recentJoinings = await Employee.countDocuments({
    joiningDate: { $gte: thirtyDaysAgo },
    isActive: true,
    isDeleted: { $ne: true }
  });

  res.status(200).json({
    success: true,
    data: {
      overall: overallStats[0] || {},
      byDepartment: departmentStats,
      byEmploymentType: employmentTypeStats,
      recentJoinings
    }
  });
});