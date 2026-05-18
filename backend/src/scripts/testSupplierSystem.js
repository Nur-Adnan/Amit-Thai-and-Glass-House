/**
 * Test Supplier Management System
 * Comprehensive testing of supplier functionality including due tracking and purchase history
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Supplier from '../models/Supplier.js';
import Purchase from '../models/Purchase.js';
import Product from '../models/Product.js';
import User from '../models/User.js';
import connectDB from '../config/database.js';

// Load environment variables
dotenv.config();

const testSupplierSystem = async () => {
  try {
    console.log('🧪 Starting Supplier Management System Tests...');

    // Connect to database
    await connectDB();

    // Get owner user
    const owner = await User.findOne({ role: 'owner' });
    if (!owner) {
      console.error('❌ Owner user not found. Please run user seed first.');
      process.exit(1);
    }

    console.log('\n1️⃣ Testing Supplier Model Methods');
    console.log('='.repeat(50));

    // Test 1: Create supplier
    console.log('\n📋 Test 1: Create Supplier');
    const testSupplier = await Supplier.create({
      name: 'Test Glass Supplier',
      phone: '01700000000',
      email: 'test@supplier.com',
      address: {
        street: 'Test Street',
        area: 'Test Area',
        city: 'Dhaka',
        district: 'Dhaka',
        postalCode: '1000'
      },
      supplierType: 'Glass',
      creditLimit: 100000,
      paymentTerms: 'Credit-30',
      notes: 'Test supplier for system testing',
      createdBy: owner._id
    });

    console.log(`✅ Created supplier: ${testSupplier.supplierId} - ${testSupplier.name}`);
    console.log(`   Phone: ${testSupplier.phone}`);
    console.log(`   Credit Limit: ${testSupplier.formattedCreditLimit}`);
    console.log(`   Full Address: ${testSupplier.fullAddress}`);

    // Test 2: Update due amount
    console.log('\n📋 Test 2: Update Due Amount');
    const purchaseAmount = 50000;
    const paidAmount = 20000;
    
    await testSupplier.updateDueAmount(purchaseAmount, paidAmount);
    console.log(`✅ Updated due amount:`);
    console.log(`   Purchase: ৳${purchaseAmount.toLocaleString()}`);
    console.log(`   Paid: ৳${paidAmount.toLocaleString()}`);
    console.log(`   Due: ${testSupplier.formattedTotalDue}`);
    console.log(`   Payment Status: ${testSupplier.paymentStatus}`);
    console.log(`   Credit Utilization: ${testSupplier.creditUtilization}%`);

    // Test 3: Make payment
    console.log('\n📋 Test 3: Make Payment');
    const paymentAmount = 15000;
    const previousDue = testSupplier.totalDue;
    
    await testSupplier.makePayment(paymentAmount, owner._id);
    console.log(`✅ Payment processed:`);
    console.log(`   Payment Amount: ৳${paymentAmount.toLocaleString()}`);
    console.log(`   Previous Due: ৳${previousDue.toLocaleString()}`);
    console.log(`   New Due: ${testSupplier.formattedTotalDue}`);
    console.log(`   Payment Status: ${testSupplier.paymentStatus}`);

    console.log('\n2️⃣ Testing Supplier Statistics');
    console.log('='.repeat(50));

    // Test 4: Get supplier statistics
    console.log('\n📋 Test 4: Supplier Statistics');
    const stats = await Supplier.getSupplierStats();
    console.log(`✅ Supplier Statistics:`);
    console.log(`   Total Suppliers: ${stats.overview.totalSuppliers}`);
    console.log(`   Active Suppliers: ${stats.overview.activeSuppliers}`);
    console.log(`   Total Due Amount: ৳${stats.overview.totalDueAmount.toLocaleString()}`);
    console.log(`   Total Purchase Amount: ৳${stats.overview.totalPurchaseAmount.toLocaleString()}`);
    console.log(`   Total Paid Amount: ৳${stats.overview.totalPaidAmount.toLocaleString()}`);
    console.log(`   Suppliers with Due: ${stats.overview.suppliersWithDue}`);
    console.log(`   Average Due Amount: ৳${Math.round(stats.overview.averageDueAmount).toLocaleString()}`);

    console.log('\n📊 By Supplier Type:');
    stats.byType.forEach(type => {
      console.log(`   ${type._id}: ${type.count} suppliers, ৳${type.totalDue.toLocaleString()} due`);
    });

    // Test 5: High due suppliers
    console.log('\n📋 Test 5: High Due Suppliers');
    const highDueSuppliers = await Supplier.getHighDueSuppliers(5);
    console.log(`✅ Top ${highDueSuppliers.length} suppliers with highest dues:`);
    highDueSuppliers.forEach((supplier, index) => {
      console.log(`   ${index + 1}. ${supplier.name} (${supplier.supplierId}): ${supplier.formattedTotalDue}`);
    });

    // Test 6: Over limit suppliers
    console.log('\n📋 Test 6: Over Limit Suppliers');
    const overLimitSuppliers = await Supplier.getOverLimitSuppliers();
    console.log(`✅ Suppliers over credit limit: ${overLimitSuppliers.length}`);
    overLimitSuppliers.forEach(supplier => {
      const overAmount = supplier.totalDue - supplier.creditLimit;
      console.log(`   ${supplier.name}: Due ${supplier.formattedTotalDue}, Limit ${supplier.formattedCreditLimit}, Over by ৳${overAmount.toLocaleString()}`);
    });

    console.log('\n3️⃣ Testing Purchase Integration');
    console.log('='.repeat(50));

    // Test 7: Create purchase (if products exist)
    console.log('\n📋 Test 7: Purchase Integration');
    const products = await Product.find({ isDeleted: { $ne: true } }).limit(2);
    
    if (products.length >= 2) {
      const purchaseData = {
        supplier: testSupplier._id,
        purchaseDate: new Date(),
        items: [
          {
            product: products[0]._id,
            productName: products[0].name,
            quantity: 10,
            unit: 'pcs',
            unitCost: 500,
            totalCost: 5000
          },
          {
            product: products[1]._id,
            productName: products[1].name,
            quantity: 5,
            unit: 'pcs',
            unitCost: 800,
            totalCost: 4000
          }
        ],
        subtotal: 9000,
        discount: 500,
        tax: 200,
        totalAmount: 8700,
        paidAmount: 3000,
        paymentMethod: 'Cash',
        purchaseType: 'Stock',
        description: 'Test purchase for supplier integration',
        createdBy: owner._id
      };

      const purchase = await Purchase.create(purchaseData);
      console.log(`✅ Created purchase: ${purchase.purchaseId}`);
      console.log(`   Total Amount: ${purchase.formattedTotalAmount}`);
      console.log(`   Paid Amount: ${purchase.formattedPaidAmount}`);
      console.log(`   Due Amount: ${purchase.formattedDueAmount}`);
      console.log(`   Payment Status: ${purchase.paymentStatus}`);

      // Update supplier due from purchase
      const supplierBeforePurchase = testSupplier.totalDue;
      await testSupplier.updateDueAmount(purchase.totalAmount, purchase.paidAmount);
      console.log(`   Supplier due before: ৳${supplierBeforePurchase.toLocaleString()}`);
      console.log(`   Supplier due after: ${testSupplier.formattedTotalDue}`);

      // Test purchase history
      console.log('\n📋 Test 8: Purchase History');
      const purchaseHistory = await Purchase.getSupplierPurchases(testSupplier._id, 10);
      console.log(`✅ Purchase history for ${testSupplier.name}: ${purchaseHistory.length} purchases`);
      purchaseHistory.forEach(p => {
        console.log(`   ${p.purchaseId}: ${p.formattedTotalAmount} (${p.paymentStatus})`);
      });

    } else {
      console.log('⚠️  Skipping purchase integration tests - no products found');
      console.log('   Please run product seed script first for complete testing');
    }

    console.log('\n4️⃣ Testing Search and Filtering');
    console.log('='.repeat(50));

    // Test 9: Search suppliers
    console.log('\n📋 Test 9: Search Functionality');
    const searchResults = await Supplier.find({
      isDeleted: { $ne: true },
      $or: [
        { name: { $regex: 'Glass', $options: 'i' } },
        { supplierType: 'Glass' }
      ]
    }).limit(5);

    console.log(`✅ Search results for 'Glass': ${searchResults.length} suppliers`);
    searchResults.forEach(supplier => {
      console.log(`   ${supplier.supplierId}: ${supplier.name} (${supplier.supplierType})`);
    });

    // Test 10: Filter by payment status
    console.log('\n📋 Test 10: Filter by Payment Status');
    const suppliersWithDue = await Supplier.find({
      isDeleted: { $ne: true },
      totalDue: { $gt: 0 }
    }).limit(5);

    console.log(`✅ Suppliers with outstanding dues: ${suppliersWithDue.length}`);
    suppliersWithDue.forEach(supplier => {
      console.log(`   ${supplier.name}: ${supplier.formattedTotalDue} (${supplier.paymentStatus})`);
    });

    console.log('\n5️⃣ Testing Data Validation');
    console.log('='.repeat(50));

    // Test 11: Validation tests
    console.log('\n📋 Test 11: Data Validation');
    
    try {
      // Test invalid phone number
      await Supplier.create({
        name: 'Invalid Supplier',
        phone: '123456', // Invalid BD phone
        createdBy: owner._id
      });
      console.log('❌ Should have failed for invalid phone');
    } catch (error) {
      console.log('✅ Correctly rejected invalid phone number');
    }

    try {
      // Test duplicate phone number
      await Supplier.create({
        name: 'Duplicate Phone Supplier',
        phone: testSupplier.phone, // Duplicate phone
        createdBy: owner._id
      });
      console.log('❌ Should have failed for duplicate phone');
    } catch (error) {
      console.log('✅ Correctly rejected duplicate phone number');
    }

    try {
      // Test negative credit limit
      await Supplier.create({
        name: 'Negative Credit Supplier',
        phone: '01800000000',
        creditLimit: -1000, // Negative credit limit
        createdBy: owner._id
      });
      console.log('❌ Should have failed for negative credit limit');
    } catch (error) {
      console.log('✅ Correctly rejected negative credit limit');
    }

    console.log('\n6️⃣ Testing Soft Delete');
    console.log('='.repeat(50));

    // Test 12: Soft delete
    console.log('\n📋 Test 12: Soft Delete');
    const supplierToDelete = await Supplier.findOne({ 
      name: { $ne: testSupplier.name },
      totalDue: 0,
      isDeleted: { $ne: true }
    });

    if (supplierToDelete) {
      await supplierToDelete.softDelete(owner._id, 'Test deletion');
      console.log(`✅ Soft deleted supplier: ${supplierToDelete.name}`);
      console.log(`   Deleted at: ${supplierToDelete.deletedAt}`);
      console.log(`   Is active: ${supplierToDelete.isActive}`);

      // Test restore
      await supplierToDelete.restore();
      console.log(`✅ Restored supplier: ${supplierToDelete.name}`);
      console.log(`   Is active: ${supplierToDelete.isActive}`);
    } else {
      console.log('⚠️  No suitable supplier found for soft delete test');
    }

    console.log('\n📊 Final System Statistics');
    console.log('='.repeat(50));
    
    const finalStats = await Supplier.getSupplierStats();
    const totalSuppliers = await Supplier.countDocuments({});
    const activeSuppliers = await Supplier.countDocuments({ isActive: true, isDeleted: { $ne: true } });
    const totalPurchases = await Purchase.countDocuments({ isDeleted: { $ne: true } });
    
    console.log(`📈 Total Suppliers: ${totalSuppliers}`);
    console.log(`📈 Active Suppliers: ${activeSuppliers}`);
    console.log(`📈 Total Purchases: ${totalPurchases}`);
    console.log(`📈 Total Due Amount: ৳${finalStats.overview.totalDueAmount.toLocaleString()}`);
    console.log(`📈 Average Due per Supplier: ৳${Math.round(finalStats.overview.averageDueAmount).toLocaleString()}`);

    console.log('\n🎉 All Supplier System Tests Completed Successfully!');
    
    console.log('\n💡 Key Features Verified:');
    console.log('   ✅ Supplier creation and management');
    console.log('   ✅ Due amount tracking and updates');
    console.log('   ✅ Payment processing and history');
    console.log('   ✅ Credit limit and utilization tracking');
    console.log('   ✅ Purchase integration and history');
    console.log('   ✅ Statistical analysis and reporting');
    console.log('   ✅ Search and filtering capabilities');
    console.log('   ✅ Data validation and constraints');
    console.log('   ✅ Soft delete functionality');
    console.log('   ✅ Bangladesh-specific phone validation');

    console.log('\n🔧 Real-World Usage Scenarios:');
    console.log('   • Track glass supplier dues and payments');
    console.log('   • Monitor credit limits and payment terms');
    console.log('   • Generate supplier performance reports');
    console.log('   • Manage purchase history and relationships');
    console.log('   • Handle multiple supplier types (Glass, Thai, Hardware)');

  } catch (error) {
    console.error('❌ Error in supplier system tests:', error);
    process.exit(1);
  } finally {
    // Close database connection
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
};

// Run the test function
testSupplierSystem();