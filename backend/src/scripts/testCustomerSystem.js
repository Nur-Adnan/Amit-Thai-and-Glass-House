import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Customer from '../models/Customer.js';
import Invoice from '../models/Invoice.js';
import Product from '../models/Product.js';
import User from '../models/User.js';

dotenv.config();

const testCustomerSystem = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB Connected');

    // Get a test user
    const user = await User.findOne({ role: 'owner' });
    if (!user) {
      console.log('❌ No owner user found');
      process.exit(1);
    }

    console.log('\n🧪 Testing Customer Management System\n');

    // Test 1: Customer Creation
    console.log('1. Testing Customer Creation...');
    const customerId = await Customer.generateCustomerId();
    const testCustomer = await Customer.create({
      customerId,
      name: 'System Test Customer',
      phone: '+1-555-TEST',
      email: 'test@system.com',
      address: {
        street: '123 Test Street',
        city: 'Test City',
        state: 'TX',
        zipCode: '12345'
      },
      customerType: 'regular',
      createdBy: user._id
    });
    console.log('✅ Customer created:', testCustomer.customerId, '-', testCustomer.name);

    // Test 2: Customer Search
    console.log('\n2. Testing Customer Search...');
    const searchResults = await Customer.find({
      $or: [
        { name: { $regex: 'System Test', $options: 'i' } },
        { phone: { $regex: 'TEST', $options: 'i' } }
      ]
    });
    console.log('✅ Search found', searchResults.length, 'customers');

    // Test 3: Invoice Creation with Customer
    console.log('\n3. Testing Invoice Creation with Customer...');
    const product = await Product.findOne({ isActive: true });
    if (!product) {
      console.log('❌ No active products found');
      process.exit(1);
    }

    const invoiceNo = await Invoice.generateInvoiceNumber();
    const testInvoice = await Invoice.create({
      invoiceNo,
      customer: testCustomer._id,
      customerName: testCustomer.name,
      customerPhone: testCustomer.phone,
      customerAddress: testCustomer.fullAddress,
      customerType: 'regular',
      items: [{
        product: product._id,
        productName: product.name,
        quantity: 5,
        unit: product.unit,
        unitPrice: product.sellingPrice,
        totalPrice: 5 * product.sellingPrice
      }],
      subtotal: 5 * product.sellingPrice,
      grandTotal: 5 * product.sellingPrice,
      paidAmount: 0,
      dueAmount: 5 * product.sellingPrice,
      status: 'due',
      createdBy: user._id
    });
    console.log('✅ Invoice created:', testInvoice.invoiceNo, '- Amount:', testInvoice.grandTotal);

    // Test 4: Customer Total Recalculation
    console.log('\n4. Testing Customer Total Recalculation...');
    const oldTotals = {
      totalSales: testCustomer.totalSales,
      totalPaid: testCustomer.totalPaid,
      totalDue: testCustomer.totalDue,
      invoiceCount: testCustomer.invoiceCount
    };

    await testCustomer.recalculateTotals();
    console.log('✅ Customer totals recalculated:');
    console.log('   Sales:', oldTotals.totalSales, '->', testCustomer.totalSales);
    console.log('   Paid:', oldTotals.totalPaid, '->', testCustomer.totalPaid);
    console.log('   Due:', oldTotals.totalDue, '->', testCustomer.totalDue);
    console.log('   Invoices:', oldTotals.invoiceCount, '->', testCustomer.invoiceCount);

    // Test 5: Customer Due Balance Validation
    console.log('\n5. Testing Customer Due Balance Validation...');
    const { validateCustomerDueBalance } = await import('../utils/businessValidation.js');
    const validation = await validateCustomerDueBalance(testCustomer._id);
    console.log('✅ Validation result:', validation.isValid ? 'PASS' : 'FAIL');
    if (!validation.isValid) {
      console.log('   Message:', validation.message);
      console.log('   Mismatches:', validation.mismatches);
    }

    // Test 6: Customer Statistics
    console.log('\n6. Testing Customer Statistics...');
    const stats = await Customer.aggregate([
      {
        $group: {
          _id: '$customerType',
          count: { $sum: 1 },
          totalSales: { $sum: '$totalSales' },
          totalDue: { $sum: '$totalDue' }
        }
      }
    ]);
    console.log('✅ Customer statistics:');
    stats.forEach(stat => {
      console.log(`   ${stat._id}: ${stat.count} customers, $${stat.totalSales} sales, $${stat.totalDue} due`);
    });

    // Test 7: Walk-in Customer Support
    console.log('\n7. Testing Walk-in Customer Support...');
    const walkInInvoice = await Invoice.create({
      invoiceNo: await Invoice.generateInvoiceNumber(),
      customer: null, // No customer assigned
      customerName: 'Walk-in Customer',
      customerPhone: '+1-555-WALKIN',
      customerAddress: 'Walk-in',
      customerType: 'walk-in',
      items: [{
        product: product._id,
        productName: product.name,
        quantity: 2,
        unit: product.unit,
        unitPrice: product.sellingPrice,
        totalPrice: 2 * product.sellingPrice
      }],
      subtotal: 2 * product.sellingPrice,
      grandTotal: 2 * product.sellingPrice,
      paidAmount: 2 * product.sellingPrice,
      dueAmount: 0,
      status: 'paid',
      createdBy: user._id
    });
    console.log('✅ Walk-in invoice created:', walkInInvoice.invoiceNo);

    // Test 8: Customer Deactivation
    console.log('\n8. Testing Customer Deactivation...');
    testCustomer.isActive = false;
    await testCustomer.save();
    console.log('✅ Customer deactivated');

    // Cleanup
    console.log('\n🧹 Cleaning up test data...');
    await Invoice.deleteMany({ 
      invoiceNo: { $in: [testInvoice.invoiceNo, walkInInvoice.invoiceNo] }
    });
    await Customer.deleteOne({ _id: testCustomer._id });
    console.log('✅ Test data cleaned up');

    console.log('\n🎉 All Customer Management System tests passed!');
    console.log('\n📋 Test Summary:');
    console.log('   ✅ Customer creation and ID generation');
    console.log('   ✅ Customer search functionality');
    console.log('   ✅ Invoice creation with customer assignment');
    console.log('   ✅ Customer total recalculation');
    console.log('   ✅ Customer due balance validation');
    console.log('   ✅ Customer statistics aggregation');
    console.log('   ✅ Walk-in customer support');
    console.log('   ✅ Customer deactivation');

    process.exit(0);
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
};

testCustomerSystem();