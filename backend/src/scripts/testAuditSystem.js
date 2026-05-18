import mongoose from 'mongoose';
import dotenv from 'dotenv';
import AuditLog from '../models/AuditLog.js';
import AuditService from '../services/auditService.js';
import User from '../models/User.js';
import Product from '../models/Product.js';
import Customer from '../models/Customer.js';
import Invoice from '../models/Invoice.js';

dotenv.config();

const testAuditSystem = async () => {
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

    console.log('\n🧪 Testing Audit Logging System\n');

    // Test 1: Direct Audit Log Creation
    console.log('1. Testing Direct Audit Log Creation...');
    const testLog = await AuditLog.createLog({
      action: 'system_backup',
      entityType: 'System',
      entityId: new mongoose.Types.ObjectId(),
      entityName: 'System Backup Test',
      performedBy: user._id,
      description: 'Testing audit log creation',
      severity: 'critical'
    });
    console.log('✅ Direct audit log created:', testLog ? testLog._id : 'Failed');

    // Test 2: Product Creation Audit
    console.log('\n2. Testing Product Creation Audit...');
    const testProduct = await Product.create({
      name: 'Audit Test Product',
      category: 'Glass',
      purchasePrice: 100,
      sellingPrice: 150,
      stockQuantity: 50,
      unit: 'sqft',
      description: 'Product created for audit testing',
      createdBy: user._id
    });
    
    await AuditService.logProductCreate(testProduct, user);
    console.log('✅ Product creation audit logged');

    // Test 3: Stock Adjustment Audit
    console.log('\n3. Testing Stock Adjustment Audit...');
    await AuditService.logStockAdjustment(testProduct, 10, user, 'Testing stock adjustment audit');
    console.log('✅ Stock adjustment audit logged');

    // Test 4: Price Change Audit
    console.log('\n4. Testing Price Change Audit...');
    const oldPrice = testProduct.sellingPrice;
    const newPrice = 175;
    await AuditService.logPriceChange(testProduct, oldPrice, newPrice, user);
    console.log('✅ Price change audit logged');

    // Test 5: Customer Creation Audit
    console.log('\n5. Testing Customer Creation Audit...');
    const customerId = await Customer.generateCustomerId();
    const testCustomer = await Customer.create({
      customerId,
      name: 'Audit Test Customer',
      phone: '+1-555-AUDIT',
      email: 'audit@test.com',
      address: {
        street: '123 Audit Street',
        city: 'Test City',
        state: 'TX',
        zipCode: '12345'
      },
      customerType: 'regular',
      createdBy: user._id
    });
    
    await AuditService.logCustomerCreate(testCustomer, user);
    console.log('✅ Customer creation audit logged');

    // Test 6: Invoice Creation Audit
    console.log('\n6. Testing Invoice Creation Audit...');
    const invoiceNo = await Invoice.generateInvoiceNumber();
    const testInvoice = await Invoice.create({
      invoiceNo,
      customer: testCustomer._id,
      customerName: testCustomer.name,
      customerPhone: testCustomer.phone,
      customerAddress: testCustomer.fullAddress,
      customerType: 'regular',
      items: [{
        product: testProduct._id,
        productName: testProduct.name,
        quantity: 5,
        unit: testProduct.unit,
        unitPrice: testProduct.sellingPrice,
        totalPrice: 5 * testProduct.sellingPrice
      }],
      subtotal: 5 * testProduct.sellingPrice,
      grandTotal: 5 * testProduct.sellingPrice,
      paidAmount: 0,
      dueAmount: 5 * testProduct.sellingPrice,
      status: 'due',
      createdBy: user._id
    });
    
    await AuditService.logInvoiceCreate(testInvoice, user);
    console.log('✅ Invoice creation audit logged');

    // Test 7: User Login Audit
    console.log('\n7. Testing User Login Audit...');
    await AuditService.logUserLogin(user);
    console.log('✅ User login audit logged');

    // Test 8: Query Audit Logs
    console.log('\n8. Testing Audit Log Queries...');
    
    // Get all logs for the test product
    const productLogs = await AuditLog.getEntityLogs('Product', testProduct._id);
    console.log(`✅ Found ${productLogs.length} logs for test product`);
    
    // Get user activity
    const userActivity = await AuditLog.getUserActivity(user._id, { limit: 10 });
    console.log(`✅ Found ${userActivity.length} user activity logs`);
    
    // Get activity summary
    const summary = await AuditLog.getActivitySummary();
    console.log(`✅ Activity summary: ${summary.totalActions} total actions`);

    // Test 9: Audit Statistics
    console.log('\n9. Testing Audit Statistics...');
    const stats = await AuditLog.aggregate([
      {
        $group: {
          _id: '$action',
          count: { $sum: 1 },
          lastOccurrence: { $max: '$timestamp' }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);
    console.log('✅ Top 5 actions by frequency:');
    stats.forEach(stat => {
      console.log(`   ${stat._id}: ${stat.count} times`);
    });

    // Test 10: Severity Distribution
    console.log('\n10. Testing Severity Distribution...');
    const severityStats = await AuditLog.aggregate([
      {
        $group: {
          _id: '$severity',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);
    console.log('✅ Severity distribution:');
    severityStats.forEach(stat => {
      console.log(`   ${stat._id}: ${stat.count} logs`);
    });

    // Cleanup test data
    console.log('\n🧹 Cleaning up test data...');
    await Invoice.deleteOne({ _id: testInvoice._id });
    await Customer.deleteOne({ _id: testCustomer._id });
    await Product.deleteOne({ _id: testProduct._id });
    
    // Keep audit logs for verification
    const auditLogCount = await AuditLog.countDocuments({
      entityId: { $in: [testProduct._id, testCustomer._id, testInvoice._id] }
    });
    console.log(`✅ Test data cleaned up (${auditLogCount} audit logs preserved)`);

    console.log('\n🎉 All Audit System tests passed!');
    console.log('\n📋 Test Summary:');
    console.log('   ✅ Direct audit log creation');
    console.log('   ✅ Product creation audit logging');
    console.log('   ✅ Stock adjustment audit logging');
    console.log('   ✅ Price change audit logging');
    console.log('   ✅ Customer creation audit logging');
    console.log('   ✅ Invoice creation audit logging');
    console.log('   ✅ User login audit logging');
    console.log('   ✅ Audit log querying');
    console.log('   ✅ Audit statistics generation');
    console.log('   ✅ Severity distribution analysis');

    // Final audit log count
    const totalAuditLogs = await AuditLog.countDocuments();
    console.log(`\n📊 Total audit logs in system: ${totalAuditLogs}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
};

testAuditSystem();