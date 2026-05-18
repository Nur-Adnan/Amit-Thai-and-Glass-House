import asyncHandler from '../utils/asyncHandler.js';
import { runBusinessValidationChecks, validateCalculations } from '../utils/businessValidation.js';
import Invoice from '../models/Invoice.js';
import SalaryPayment from '../models/SalaryPayment.js';
import Product from '../models/Product.js';
// import Customer from '../models/Customer.js';

// @desc    Run comprehensive business validation checks
// @route   GET /api/validation/business-rules
// @access  Private (Manager and above)
export const runBusinessValidation = asyncHandler(async (req, res) => {
  try {
    const report = await runBusinessValidationChecks();
    
    res.status(200).json({
      success: true,
      message: 'Business validation completed',
      data: report
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to run business validation: ' + error.message
    });
  }
});

// @desc    Validate specific invoice calculations
// @route   POST /api/validation/invoice-calculations
// @access  Private (Manager and above)
export const validateInvoiceCalculations = asyncHandler(async (req, res) => {
  try {
    const { invoiceId, invoiceData } = req.body;
    
    let dataToValidate;
    
    if (invoiceId) {
      const invoice = await Invoice.findById(invoiceId);
      if (!invoice) {
        return res.status(404).json({
          success: false,
          message: 'Invoice not found'
        });
      }
      dataToValidate = invoice.toObject();
    } else if (invoiceData) {
      dataToValidate = invoiceData;
    } else {
      return res.status(400).json({
        success: false,
        message: 'Please provide either invoiceId or invoiceData'
      });
    }
    
    const validation = validateCalculations(dataToValidate, 'invoice');
    
    res.status(200).json({
      success: true,
      message: validation.isValid ? 'Calculations are correct' : 'Calculation errors found',
      data: validation
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to validate invoice calculations: ' + error.message
    });
  }
});

// @desc    Validate specific salary calculations
// @route   POST /api/validation/salary-calculations
// @access  Private (Manager and above)
export const validateSalaryCalculations = asyncHandler(async (req, res) => {
  try {
    const { salaryId, salaryData } = req.body;
    
    let dataToValidate;
    
    if (salaryId) {
      const salary = await SalaryPayment.findById(salaryId);
      if (!salary) {
        return res.status(404).json({
          success: false,
          message: 'Salary payment not found'
        });
      }
      dataToValidate = salary.toObject();
    } else if (salaryData) {
      dataToValidate = salaryData;
    } else {
      return res.status(400).json({
        success: false,
        message: 'Please provide either salaryId or salaryData'
      });
    }
    
    const validation = validateCalculations(dataToValidate, 'salary');
    
    res.status(200).json({
      success: true,
      message: validation.isValid ? 'Calculations are correct' : 'Calculation errors found',
      data: validation
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to validate salary calculations: ' + error.message
    });
  }
});

// @desc    Fix negative stock quantities
// @route   POST /api/validation/fix-negative-stock
// @access  Private (Owner only)
export const fixNegativeStock = asyncHandler(async (req, res) => {
  try {
    const negativeStockProducts = await Product.find({ stockQuantity: { $lt: 0 } });
    
    if (negativeStockProducts.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No products with negative stock found',
        data: { fixed: 0 }
      });
    }
    
    const fixes = [];
    for (const product of negativeStockProducts) {
      const oldStock = product.stockQuantity;
      product.stockQuantity = 0; // Reset to 0
      product.updatedBy = req.user.id;
      await product.save();
      
      fixes.push({
        productId: product._id,
        productName: product.name,
        oldStock,
        newStock: 0
      });
    }
    
    res.status(200).json({
      success: true,
      message: `Fixed ${fixes.length} products with negative stock`,
      data: { fixed: fixes.length, details: fixes }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fix negative stock: ' + error.message
    });
  }
});

// @desc    Fix negative due amounts
// @route   POST /api/validation/fix-negative-due
// @access  Private (Owner only)
export const fixNegativeDue = asyncHandler(async (req, res) => {
  try {
    const negativeDueInvoices = await Invoice.find({ dueAmount: { $lt: 0 } });
    
    if (negativeDueInvoices.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No invoices with negative due amounts found',
        data: { fixed: 0 }
      });
    }
    
    const fixes = [];
    for (const invoice of negativeDueInvoices) {
      const oldDue = invoice.dueAmount;
      const oldPaid = invoice.paidAmount;
      
      // Recalculate based on grand total
      if (invoice.paidAmount > invoice.grandTotal) {
        invoice.paidAmount = invoice.grandTotal;
        invoice.dueAmount = 0;
        invoice.status = 'paid';
      } else {
        invoice.dueAmount = Math.max(0, invoice.grandTotal - invoice.paidAmount);
        invoice.calculateStatus();
      }
      
      invoice.updatedBy = req.user.id;
      await invoice.save();
      
      fixes.push({
        invoiceId: invoice._id,
        invoiceNo: invoice.invoiceNo,
        oldDue,
        newDue: invoice.dueAmount,
        oldPaid,
        newPaid: invoice.paidAmount,
        newStatus: invoice.status
      });
    }
    
    res.status(200).json({
      success: true,
      message: `Fixed ${fixes.length} invoices with negative due amounts`,
      data: { fixed: fixes.length, details: fixes }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fix negative due amounts: ' + error.message
    });
  }
});

// @desc    Create missing salary expenses
// @route   POST /api/validation/create-missing-salary-expenses
// @access  Private (Owner only)
export const createMissingSalaryExpenses = asyncHandler(async (req, res) => {
  try {
    const { ensureSalaryExpenseCreation } = await import('../utils/businessValidation.js');
    
    const paidSalariesWithoutExpenses = await SalaryPayment.find({
      status: 'paid',
      isExpenseRecorded: { $ne: true }
    }).populate('employee', 'name employeeId');
    
    if (paidSalariesWithoutExpenses.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'All paid salaries have corresponding expenses',
        data: { created: 0 }
      });
    }
    
    const created = [];
    const errors = [];
    
    for (const salary of paidSalariesWithoutExpenses) {
      try {
        const result = await ensureSalaryExpenseCreation(salary, req.user);
        if (result.created) {
          created.push({
            salaryId: salary._id,
            employeeName: salary.employee.name,
            employeeId: salary.employee.employeeId,
            amount: salary.netSalary,
            expenseId: result.expense.expenseId
          });
        }
      } catch (error) {
        errors.push({
          salaryId: salary._id,
          employeeName: salary.employee.name,
          error: error.message
        });
      }
    }
    
    res.status(200).json({
      success: true,
      message: `Created ${created.length} missing salary expenses`,
      data: { 
        created: created.length, 
        errors: errors.length,
        details: { created, errors }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create missing salary expenses: ' + error.message
    });
  }
});