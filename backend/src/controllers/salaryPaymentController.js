import asyncHandler from '../utils/asyncHandler.js';
import SalaryPayment from '../models/SalaryPayment.js';
import Employee from '../models/Employee.js';
import { autoGenerateExpenseFromSalary } from '../utils/autoGeneration.js';
import { validateCalculations, ensureSalaryExpenseCreation } from '../utils/businessValidation.js';
import mongoose from 'mongoose';
import AuditService from '../services/auditService.js';

// @desc    Get all salary payments
// @route   GET /api/salary-payments
// @access  Private (Manager and above)
export const getSalaryPayments = asyncHandler(async (req, res) => {
  const {
    month,
    year,
    status,
    department,
    employeeId,
    sortBy = 'createdAt',
    sortOrder = 'desc',
    page = 1,
    limit = 10
  } = req.query;

  // Build query
  const query = {};

  if (month) {
    query.paymentMonth = parseInt(month);
  }

  if (year) {
    query.paymentYear = parseInt(year);
  }

  if (status) {
    query.status = status;
  }

  // Calculate pagination
  const skip = (page - 1) * limit;

  // Build sort object
  const sort = {};
  sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

  let salaryPayments = await SalaryPayment.find(query)
    .populate('employee', 'employeeId name email department position monthlySalary')
    .populate('createdBy', 'name email')
    .populate('updatedBy', 'name email')
    .sort(sort)
    .skip(skip)
    .limit(parseInt(limit));

  // Filter by department or employeeId if specified
  if (department || employeeId) {
    salaryPayments = salaryPayments.filter(payment => {
      const employee = payment.employee;
      if (department && employee.department !== department) {
        return false;
      }
      if (employeeId && employee.employeeId !== employeeId.toUpperCase()) {
        return false;
      }
      return true;
    });
  }

  const total = await SalaryPayment.countDocuments(query);

  res.status(200).json({
    success: true,
    count: salaryPayments.length,
    total,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(total / limit)
    },
    data: salaryPayments
  });
});

// @desc    Get single salary payment
// @route   GET /api/salary-payments/:id
// @access  Private (Manager and above)
export const getSalaryPayment = asyncHandler(async (req, res) => {
  const salaryPayment = await SalaryPayment.findById(req.params.id)
    .populate('employee', 'employeeId name email department position monthlySalary bankDetails')
    .populate('createdBy', 'name email')
    .populate('updatedBy', 'name email');

  if (!salaryPayment) {
    return res.status(404).json({
      success: false,
      message: 'Salary payment not found'
    });
  }

  res.status(200).json({
    success: true,
    data: salaryPayment
  });
});

// @desc    Create salary payment for employee
// @route   POST /api/salary-payments
// @access  Private (Manager and above)
export const createSalaryPayment = asyncHandler(async (req, res) => {
  const session = await mongoose.startSession();
  
  try {
    await session.withTransaction(async () => {
      const { 
        employeeId, 
        paymentMonth, 
        paymentYear, 
        allowances = {}, 
        deductions = {}, 
        overtime = {},
        actualWorkingDays,
        notes 
      } = req.body;

      // Validate required fields
      if (!employeeId || !paymentMonth || !paymentYear) {
        throw new Error('Employee ID, payment month, and payment year are required');
      }

      // Find employee
      const employee = await Employee.findOne({ 
        employeeId: employeeId.toUpperCase(),
        isActive: true 
      }).session(session);

      if (!employee) {
        throw new Error('Active employee not found with this ID');
      }

      // Check if salary payment already exists for this month/year
      const existingPayment = await SalaryPayment.findOne({
        employee: employee._id,
        paymentMonth: parseInt(paymentMonth),
        paymentYear: parseInt(paymentYear)
      }).session(session);

      if (existingPayment) {
        throw new Error(`Salary payment already exists for ${employee.name} for ${paymentMonth}/${paymentYear}`);
      }

      // Calculate totals with validation
      const salaryData = {
        baseSalary: employee.monthlySalary,
        allowances: {
          hra: allowances.hra || 0,
          transport: allowances.transport || 0,
          medical: allowances.medical || 0,
          other: allowances.other || 0
        },
        deductions: {
          pf: deductions.pf || 0,
          esi: deductions.esi || 0,
          tax: deductions.tax || 0,
          advance: deductions.advance || 0,
          other: deductions.other || 0
        },
        overtime: {
          hours: overtime.hours || 0,
          rate: overtime.rate || 0
        }
      };

      // Validate salary calculations
      const calculationValidation = validateCalculations(salaryData, 'salary');
      if (!calculationValidation.isValid) {
        console.warn('Salary calculation corrections applied:', calculationValidation.corrections);
      }

      // Use corrected calculations
      const correctedData = calculationValidation.correctedData;
      let netSalary = correctedData.netSalary;
      
      // Adjust salary based on actual working days if provided
      if (actualWorkingDays && actualWorkingDays !== 30) {
        const dailySalary = employee.monthlySalary / 30;
        const adjustedBaseSalary = dailySalary * actualWorkingDays;
        const adjustment = adjustedBaseSalary - employee.monthlySalary;
        
        netSalary += adjustment;
        
        // Ensure net salary is not negative after adjustment
        if (netSalary < 0) {
          netSalary = 0;
        }
      }

      // Create salary payment with validated calculations
      const salaryPaymentData = {
        employee: employee._id,
        paymentMonth: parseInt(paymentMonth),
        paymentYear: parseInt(paymentYear),
        baseSalary: employee.monthlySalary,
        allowances: correctedData.allowances,
        deductions: correctedData.deductions,
        overtime: {
          hours: correctedData.overtime.hours,
          rate: correctedData.overtime.rate,
          amount: correctedData.overtime.amount
        },
        grossSalary: correctedData.grossSalary,
        totalDeductions: correctedData.totalDeductions,
        netSalary,
        actualWorkingDays,
        notes,
        createdBy: req.user.id
      };

      const salaryPayment = new SalaryPayment(salaryPaymentData);
      await salaryPayment.save({ session });

      // Populate for response
      await salaryPayment.populate('employee', 'employeeId name email department position');
      await salaryPayment.populate('createdBy', 'name email');

      // Log audit trail
      await AuditService.logSalaryPayment(salaryPayment, employee, req.user, req);

      res.status(201).json({
        success: true,
        message: 'Salary payment created successfully',
        data: salaryPayment
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

// @desc    Mark salary as paid
// @route   PUT /api/salary-payments/:id/pay
// @access  Private (Manager and above)
export const markSalaryAsPaid = asyncHandler(async (req, res) => {
  const { paymentDate, paymentMethod, referenceNumber } = req.body;

  const salaryPayment = await SalaryPayment.findById(req.params.id)
    .populate('employee', 'employeeId name email department position');

  if (!salaryPayment) {
    return res.status(404).json({
      success: false,
      message: 'Salary payment not found'
    });
  }

  if (salaryPayment.status === 'paid') {
    return res.status(400).json({
      success: false,
      message: 'Salary is already marked as paid'
    });
  }

  // Mark as paid
  await salaryPayment.markAsPaid(
    paymentDate ? new Date(paymentDate) : new Date(),
    paymentMethod || 'bank_transfer',
    referenceNumber
  );

  salaryPayment.updatedBy = req.user.id;
  await salaryPayment.save();

  // CRITICAL: Always ensure expense is created when salary is marked as paid
  try {
    const expenseResult = await ensureSalaryExpenseCreation(salaryPayment, req.user);
    console.log(`✅ Salary expense ensured for ${salaryPayment._id}:`, expenseResult.message);
  } catch (error) {
    console.error('❌ CRITICAL: Failed to create salary expense:', error.message);
    
    // This is critical - if expense creation fails, we should not mark salary as paid
    return res.status(500).json({
      success: false,
      message: 'Failed to create corresponding expense. Salary payment not completed.',
      error: error.message
    });
  }

  await salaryPayment.populate('updatedBy', 'name email');

  res.status(200).json({
    success: true,
    message: 'Salary marked as paid successfully and expense created',
    data: salaryPayment
  });
});

// @desc    Update salary payment
// @route   PUT /api/salary-payments/:id
// @access  Private (Manager and above)
export const updateSalaryPayment = asyncHandler(async (req, res) => {
  let salaryPayment = await SalaryPayment.findById(req.params.id);

  if (!salaryPayment) {
    return res.status(404).json({
      success: false,
      message: 'Salary payment not found'
    });
  }

  if (salaryPayment.status === 'paid') {
    return res.status(400).json({
      success: false,
      message: 'Cannot update paid salary. Please create a new adjustment entry.'
    });
  }

  // Add updatedBy field
  req.body.updatedBy = req.user.id;

  salaryPayment = await SalaryPayment.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  }).populate('employee', 'employeeId name email department position')
    .populate('updatedBy', 'name email');

  res.status(200).json({
    success: true,
    message: 'Salary payment updated successfully',
    data: salaryPayment
  });
});

// @desc    Delete salary payment
// @route   DELETE /api/salary-payments/:id
// @access  Private (Manager and above)
export const deleteSalaryPayment = asyncHandler(async (req, res) => {
  const salaryPayment = await SalaryPayment.findById(req.params.id);

  if (!salaryPayment) {
    return res.status(404).json({
      success: false,
      message: 'Salary payment not found'
    });
  }

  if (salaryPayment.status === 'paid') {
    return res.status(400).json({
      success: false,
      message: 'Cannot delete paid salary payment'
    });
  }

  await salaryPayment.deleteOne();

  res.status(200).json({
    success: true,
    message: 'Salary payment deleted successfully'
  });
});

// @desc    Generate salary payments for all active employees for a month
// @route   POST /api/salary-payments/generate
// @access  Private (Manager and above)
export const generateMonthlySalaries = asyncHandler(async (req, res) => {
  const session = await mongoose.startSession();
  
  try {
    await session.withTransaction(async () => {
      const { paymentMonth, paymentYear } = req.body;

      if (!paymentMonth || !paymentYear) {
        throw new Error('Payment month and year are required');
      }

      // Get all active employees
      const employees = await Employee.find({ isActive: true }).session(session);

      if (employees.length === 0) {
        throw new Error('No active employees found');
      }

      // Check for existing payments
      const existingPayments = await SalaryPayment.find({
        paymentMonth: parseInt(paymentMonth),
        paymentYear: parseInt(paymentYear)
      }).session(session);

      if (existingPayments.length > 0) {
        throw new Error(`Salary payments already exist for ${paymentMonth}/${paymentYear}`);
      }

      // Create salary payments for all employees
      const salaryPayments = [];
      for (const employee of employees) {
        const grossSalary = employee.monthlySalary;
        const totalDeductions = 0;
        const netSalary = grossSalary - totalDeductions;
        
        const salaryPaymentData = {
          employee: employee._id,
          paymentMonth: parseInt(paymentMonth),
          paymentYear: parseInt(paymentYear),
          baseSalary: employee.monthlySalary,
          allowances: {
            hra: 0,
            transport: 0,
            medical: 0,
            other: 0
          },
          deductions: {
            pf: 0,
            esi: 0,
            tax: 0,
            advance: 0,
            other: 0
          },
          overtime: {
            hours: 0,
            rate: 0,
            amount: 0
          },
          grossSalary,
          totalDeductions,
          netSalary,
          createdBy: req.user.id
        };

        salaryPayments.push(salaryPaymentData);
      }

      const createdPayments = await SalaryPayment.create(salaryPayments, { session, ordered: true });

      res.status(201).json({
        success: true,
        message: `Generated salary payments for ${createdPayments.length} employees`,
        data: {
          month: paymentMonth,
          year: paymentYear,
          employeesCount: createdPayments.length,
          totalAmount: createdPayments.reduce((sum, payment) => sum + payment.netSalary, 0)
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

// @desc    Get salary payment statistics
// @route   GET /api/salary-payments/stats
// @access  Private (Manager and above)
export const getSalaryStats = asyncHandler(async (req, res) => {
  const { month, year, startMonth, startYear, endMonth, endYear } = req.query;

  let matchCondition = {};

  if (month && year) {
    matchCondition = {
      paymentMonth: parseInt(month),
      paymentYear: parseInt(year)
    };
  } else if (startMonth && startYear && endMonth && endYear) {
    const startYearInt = parseInt(startYear);
    const endYearInt = parseInt(endYear);
    const startMonthInt = parseInt(startMonth);
    const endMonthInt = parseInt(endMonth);

    if (startYearInt === endYearInt) {
      matchCondition = {
        paymentYear: startYearInt,
        paymentMonth: { $gte: startMonthInt, $lte: endMonthInt }
      };
    } else {
      matchCondition = {
        $or: [
          { paymentYear: startYearInt, paymentMonth: { $gte: startMonthInt } },
          { paymentYear: { $gt: startYearInt, $lt: endYearInt } },
          { paymentYear: endYearInt, paymentMonth: { $lte: endMonthInt } }
        ]
      };
    }
  }

  // Overall statistics
  const overallStats = await SalaryPayment.aggregate([
    { $match: matchCondition },
    {
      $group: {
        _id: null,
        totalPayments: { $sum: 1 },
        totalGrossSalary: { $sum: '$grossSalary' },
        totalDeductions: { $sum: '$totalDeductions' },
        totalNetSalary: { $sum: '$netSalary' },
        paidCount: { $sum: { $cond: [{ $eq: ['$status', 'paid'] }, 1, 0] } },
        dueCount: { $sum: { $cond: [{ $eq: ['$status', 'due'] }, 1, 0] } },
        totalPaidAmount: { $sum: { $cond: [{ $eq: ['$status', 'paid'] }, '$netSalary', 0] } },
        totalDueAmount: { $sum: { $cond: [{ $eq: ['$status', 'due'] }, '$netSalary', 0] } },
        avgSalary: { $avg: '$netSalary' }
      }
    }
  ]);

  // Department-wise statistics
  const departmentStats = await SalaryPayment.aggregate([
    { $match: matchCondition },
    {
      $lookup: {
        from: 'employees',
        localField: 'employee',
        foreignField: '_id',
        as: 'employeeData'
      }
    },
    { $unwind: '$employeeData' },
    {
      $group: {
        _id: '$employeeData.department',
        count: { $sum: 1 },
        totalSalary: { $sum: '$netSalary' },
        avgSalary: { $avg: '$netSalary' },
        paidCount: { $sum: { $cond: [{ $eq: ['$status', 'paid'] }, 1, 0] } },
        dueCount: { $sum: { $cond: [{ $eq: ['$status', 'due'] }, 1, 0] } }
      }
    },
    { $sort: { totalSalary: -1 } }
  ]);

  // Monthly trends (if range is provided)
  let monthlyTrends = [];
  if (startMonth && startYear && endMonth && endYear) {
    monthlyTrends = await SalaryPayment.aggregate([
      { $match: matchCondition },
      {
        $group: {
          _id: {
            year: '$paymentYear',
            month: '$paymentMonth'
          },
          totalSalary: { $sum: '$netSalary' },
          count: { $sum: 1 },
          paidAmount: { $sum: { $cond: [{ $eq: ['$status', 'paid'] }, '$netSalary', 0] } }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);
  }

  res.status(200).json({
    success: true,
    data: {
      overall: overallStats[0] || {},
      byDepartment: departmentStats,
      monthlyTrends
    }
  });
});

// @desc    Get due salary payments
// @route   GET /api/salary-payments/due
// @access  Private (Manager and above)
export const getDueSalaries = asyncHandler(async (req, res) => {
  const dueSalaries = await SalaryPayment.find({ status: 'due' })
    .populate('employee', 'employeeId name email department position')
    .sort({ paymentYear: -1, paymentMonth: -1 });

  const totalDueAmount = dueSalaries.reduce((sum, salary) => sum + salary.netSalary, 0);

  res.status(200).json({
    success: true,
    count: dueSalaries.length,
    totalDueAmount: parseFloat(totalDueAmount.toFixed(2)),
    data: dueSalaries
  });
});