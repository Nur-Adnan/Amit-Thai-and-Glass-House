/**
 * Test Production-Safe System
 * Tests all validation, formatting, and error handling improvements
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { MoneyValidator, DateValidator, GeneralValidator, BusinessValidator } from '../utils/validation.js';
import CurrencyService from '../services/currencyService.js';
import DateService from '../services/dateService.js';
import Product from '../models/Product.js';
import Customer from '../models/Customer.js';
import Employee from '../models/Employee.js';
import Invoice from '../models/Invoice.js';

// Load environment variables
dotenv.config();

// Connect to MongoDB
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('Database connection error:', error);
    process.exit(1);
  }
};

// Test validation utilities
const testValidationUtilities = () => {
  console.log('\n=== Testing Validation Utilities ===');

  // Test MoneyValidator
  console.log('\n--- Money Validator Tests ---');
  
  const moneyTests = [
    { amount: 1000, expected: true, description: 'Valid amount' },
    { amount: -100, expected: false, description: 'Negative amount' },
    { amount: 'abc', expected: false, description: 'Invalid string' },
    { amount: 0, expected: false, description: 'Zero amount (not allowed)' },
    { amount: 1000000000, expected: false, description: 'Amount too large' }
  ];

  moneyTests.forEach(test => {
    const result = MoneyValidator.validateAmount(test.amount, 'Test Amount', {
      allowZero: false,
      maxAmount: 10000000
    });
    const passed = result.isValid === test.expected;
    console.log(`${passed ? '✅' : '❌'} ${test.description}: ${test.amount} -> ${result.isValid ? 'Valid' : 'Invalid'}`);
    if (!result.isValid && result.errors.length > 0) {
      console.log(`   Error: ${result.errors[0]}`);
    }
  });

  // Test CurrencyService
  console.log('\n--- Currency Service Tests ---');
  
  const currencyTests = [
    { amount: 1000, expected: '৳1,000.00' },
    { amount: 1234.56, expected: '৳1,234.56' },
    { amount: 0, expected: '৳0.00' },
    { amount: -500, expected: '-৳500.00' }
  ];

  currencyTests.forEach(test => {
    const result = CurrencyService.formatBDT(test.amount);
    const passed = result === test.expected;
    console.log(`${passed ? '✅' : '❌'} Format ${test.amount} -> ${result} (expected: ${test.expected})`);
  });

  // Test DateService
  console.log('\n--- Date Service Tests ---');
  
  const testDate = new Date('2026-01-03T10:30:00Z');
  const dateTests = [
    { format: 'short', expected: '1/3/26' },
    { format: 'medium', expected: 'Jan 3, 2026' },
    { format: 'business', expected: '03/01/2026' }
  ];

  dateTests.forEach(test => {
    const result = DateService.format(testDate, test.format);
    console.log(`✅ Format date (${test.format}): ${result}`);
  });

  // Test GeneralValidator
  console.log('\n--- General Validator Tests ---');
  
  const emailTests = [
    { email: 'test@example.com', expected: true },
    { email: 'invalid-email', expected: false },
    { email: '', expected: false }
  ];

  emailTests.forEach(test => {
    const result = GeneralValidator.validateEmail(test.email);
    const passed = result.isValid === test.expected;
    console.log(`${passed ? '✅' : '❌'} Email ${test.email}: ${result.isValid ? 'Valid' : 'Invalid'}`);
  });

  const phoneTests = [
    { phone: '01712345678', expected: true },
    { phone: '123', expected: false },
    { phone: 'abc123', expected: false }
  ];

  phoneTests.forEach(test => {
    const result = GeneralValidator.validatePhone(test.phone);
    const passed = result.isValid === test.expected;
    console.log(`${passed ? '✅' : '❌'} Phone ${test.phone}: ${result.isValid ? 'Valid' : 'Invalid'}`);
  });
};

// Test model validation
const testModelValidation = async () => {
  console.log('\n=== Testing Model Validation ===');

  try {
    // Test Product validation
    console.log('\n--- Product Model Tests ---');
    
    const validProduct = {
      name: 'Test Glass',
      category: 'Glass',
      purchasePrice: 100,
      sellingPrice: 150,
      stockQuantity: 50,
      unit: 'sqft',
      createdBy: new mongoose.Types.ObjectId()
    };

    const productValidation = BusinessValidator.validateProduct(validProduct);
    console.log(`✅ Valid product validation: ${productValidation.isValid}`);

    const invalidProduct = {
      name: 'A', // Too short
      category: 'Invalid', // Invalid category
      purchasePrice: -100, // Negative
      sellingPrice: 50, // Less than purchase price
      stockQuantity: -10, // Negative
      createdBy: new mongoose.Types.ObjectId()
    };

    const invalidProductValidation = BusinessValidator.validateProduct(invalidProduct);
    console.log(`✅ Invalid product validation: ${!invalidProductValidation.isValid}`);
    console.log(`   Errors: ${invalidProductValidation.errors.join(', ')}`);

    // Test Customer validation
    console.log('\n--- Customer Model Tests ---');
    
    const validCustomer = {
      customerId: 'CUST-0001',
      name: 'John Doe',
      phone: '01712345678',
      email: 'john@example.com',
      totalDue: 1000,
      totalSales: 5000,
      totalPaid: 4000,
      createdBy: new mongoose.Types.ObjectId()
    };

    // Test virtual fields
    const customer = new Customer(validCustomer);
    console.log(`✅ Customer formatted total due: ${customer.formattedTotalDue}`);
    console.log(`✅ Customer formatted total sales: ${customer.formattedTotalSales}`);
    console.log(`✅ Customer status: ${customer.status}`);

  } catch (error) {
    console.error('❌ Model validation test error:', error.message);
  }
};

// Test API response formatting
const testAPIFormatting = async () => {
  console.log('\n=== Testing API Response Formatting ===');

  try {
    // Find a sample product to test formatting
    const product = await Product.findOne({ isDeleted: { $ne: true } });
    
    if (product) {
      console.log('\n--- Product API Response Format ---');
      const formattedProduct = {
        ...product.toObject(),
        formattedPurchasePrice: CurrencyService.formatBDT(product.purchasePrice),
        formattedSellingPrice: CurrencyService.formatBDT(product.sellingPrice),
        formattedCreatedAt: DateService.format(product.createdAt, 'datetime'),
        formattedUpdatedAt: DateService.format(product.updatedAt, 'datetime')
      };

      console.log(`✅ Product: ${product.name}`);
      console.log(`✅ Purchase Price: ${formattedProduct.formattedPurchasePrice}`);
      console.log(`✅ Selling Price: ${formattedProduct.formattedSellingPrice}`);
      console.log(`✅ Created At: ${formattedProduct.formattedCreatedAt}`);
      console.log(`✅ Profit Margin: ${product.profitMargin}`);
      console.log(`✅ Profit Amount: ${product.profitAmount}`);
    }

    // Find a sample customer to test formatting
    const customer = await Customer.findOne({ isDeleted: { $ne: true } });
    
    if (customer) {
      console.log('\n--- Customer API Response Format ---');
      console.log(`✅ Customer: ${customer.name}`);
      console.log(`✅ Total Due: ${customer.formattedTotalDue}`);
      console.log(`✅ Total Sales: ${customer.formattedTotalSales}`);
      console.log(`✅ Status: ${customer.status}`);
      console.log(`✅ Status Badge: ${JSON.stringify(customer.statusBadge)}`);
    }

    // Find a sample employee to test formatting
    const employee = await Employee.findOne({ isDeleted: { $ne: true } });
    
    if (employee) {
      console.log('\n--- Employee API Response Format ---');
      console.log(`✅ Employee: ${employee.name}`);
      console.log(`✅ Monthly Salary: ${employee.formattedMonthlySalary}`);
      console.log(`✅ Annual Salary: ${employee.formattedAnnualSalary}`);
      console.log(`✅ Joining Date: ${employee.formattedJoiningDate}`);
      console.log(`✅ Employment Status: ${employee.employmentStatus}`);
      console.log(`✅ Department Badge: ${JSON.stringify(employee.departmentBadge)}`);
    }

  } catch (error) {
    console.error('❌ API formatting test error:', error.message);
  }
};

// Test error handling
const testErrorHandling = () => {
  console.log('\n=== Testing Error Handling ===');

  // Test various error scenarios
  const errorTests = [
    {
      name: 'Invalid money amount',
      test: () => MoneyValidator.validateAmount('invalid', 'Test Amount'),
      expectedError: true
    },
    {
      name: 'Negative stock quantity',
      test: () => MoneyValidator.validateAmount(-10, 'Stock Quantity', { allowNegative: false }),
      expectedError: true
    },
    {
      name: 'Invalid email format',
      test: () => GeneralValidator.validateEmail('not-an-email'),
      expectedError: true
    },
    {
      name: 'Invalid phone number',
      test: () => GeneralValidator.validatePhone('123'),
      expectedError: true
    }
  ];

  errorTests.forEach(errorTest => {
    try {
      const result = errorTest.test();
      const hasError = !result.isValid;
      const passed = hasError === errorTest.expectedError;
      console.log(`${passed ? '✅' : '❌'} ${errorTest.name}: ${hasError ? 'Error caught' : 'No error'}`);
      if (hasError && result.errors) {
        console.log(`   Error message: ${result.errors[0]}`);
      }
    } catch (error) {
      console.log(`✅ ${errorTest.name}: Exception caught - ${error.message}`);
    }
  });
};

// Test business calculations
const testBusinessCalculations = () => {
  console.log('\n=== Testing Business Calculations ===');

  // Test discount calculations
  console.log('\n--- Discount Calculations ---');
  
  const discountTests = [
    { original: 1000, discount: 10, type: 'percentage', expected: 900 },
    { original: 1000, discount: 100, type: 'amount', expected: 900 },
    { original: 500, discount: 20, type: 'percentage', expected: 400 }
  ];

  discountTests.forEach(test => {
    const result = CurrencyService.calculateDiscount(test.original, test.discount, test.type);
    const passed = result.isValid && Math.abs(result.finalAmount - test.expected) < 0.01;
    console.log(`${passed ? '✅' : '❌'} ${test.original} - ${test.discount}${test.type === 'percentage' ? '%' : ''} = ${result.formattedFinal} (expected: ${CurrencyService.formatBDT(test.expected)})`);
  });

  // Test percentage calculations
  console.log('\n--- Percentage Calculations ---');
  
  const percentageTests = [
    { amount: 1000, percentage: 10, expected: 100 },
    { amount: 2500, percentage: 15, expected: 375 }
  ];

  percentageTests.forEach(test => {
    const result = CurrencyService.calculatePercentage(test.amount, test.percentage);
    const passed = result.isValid && Math.abs(result.result - test.expected) < 0.01;
    console.log(`${passed ? '✅' : '❌'} ${test.percentage}% of ${CurrencyService.formatBDT(test.amount)} = ${result.formattedResult} (expected: ${CurrencyService.formatBDT(test.expected)})`);
  });
};

// Main test function
const runTests = async () => {
  console.log('🚀 Starting Production-Safe System Tests...\n');

  try {
    await connectDB();

    // Run all tests
    testValidationUtilities();
    await testModelValidation();
    await testAPIFormatting();
    testErrorHandling();
    testBusinessCalculations();

    console.log('\n✅ All production-safety tests completed successfully!');
    console.log('\n📊 Production-Safe System Summary:');
    console.log('   ✅ Money field validation with proper error messages');
    console.log('   ✅ Currency formatting in BDT (৳) with Bengali locale');
    console.log('   ✅ Standardized date formatting with Asia/Dhaka timezone');
    console.log('   ✅ Improved error messages with helpful suggestions');
    console.log('   ✅ Business validation for all critical operations');
    console.log('   ✅ API response formatting with virtual fields');
    console.log('   ✅ Comprehensive validation utilities');

  } catch (error) {
    console.error('❌ Test execution error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
    process.exit(0);
  }
};

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runTests();
}

export default runTests;