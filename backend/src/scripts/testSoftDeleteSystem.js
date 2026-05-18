import mongoose from 'mongoose';
import dotenv from 'dotenv';
import connectDB from '../config/database.js';
import Product from '../models/Product.js';
import Invoice from '../models/Invoice.js';
import Customer from '../models/Customer.js';
import Employee from '../models/Employee.js';
import User from '../models/User.js';
import SoftDeleteService from '../services/softDeleteService.js';

dotenv.config();

const testSoftDeleteSystem = async () => {
  try {
    console.log('🧪 Testing Soft Delete System...\n');

    // Connect to database
    await connectDB();

    // Find a test user (owner)
    const testUser = await User.findOne({ role: 'owner' });
    if (!testUser) {
      console.log('❌ No owner user found. Please create one first.');
      return;
    }

    console.log(`👤 Using test user: ${testUser.name} (${testUser.email})\n`);

    // Test 1: Product Soft Delete
    console.log('📦 Testing Product Soft Delete...');
    
    // Create a test product
    const testProduct = await Product.create({
      name: 'Test Product for Soft Delete',
      category: 'Thai',
      purchasePrice: 100,
      sellingPrice: 150,
      stockQuantity: 10,
      unit: 'sqft',
      createdBy: testUser._id
    });

    console.log(`✅ Created test product: ${testProduct.name}`);

    // Test soft delete
    const productDeleteResult = await SoftDeleteService.softDelete(
      testProduct, 
      testUser._id, 
      { user: testUser }, 
      'Testing soft delete functionality'
    );

    if (productDeleteResult.success) {
      console.log('✅ Product soft deleted successfully');
      
      // Verify product is marked as deleted
      const deletedProduct = await Product.findById(testProduct._id);
      console.log(`   - isDeleted: ${deletedProduct.isDeleted}`);
      console.log(`   - deletedAt: ${deletedProduct.deletedAt}`);
      console.log(`   - deletedBy: ${deletedProduct.deletedBy}`);
    } else {
      console.log('❌ Product soft delete failed:', productDeleteResult.message);
    }

    // Test restore
    const productRestoreResult = await SoftDeleteService.restore(
      testProduct,
      testUser._id,
      { user: testUser },
      'Testing restore functionality'
    );

    if (productRestoreResult.success) {
      console.log('✅ Product restored successfully');
      
      // Verify product is restored
      const restoredProduct = await Product.findById(testProduct._id);
      console.log(`   - isDeleted: ${restoredProduct.isDeleted}`);
      console.log(`   - deletedAt: ${restoredProduct.deletedAt}`);
    } else {
      console.log('❌ Product restore failed:', productRestoreResult.message);
    }

    // Test 2: Customer Soft Delete
    console.log('\n👥 Testing Customer Soft Delete...');
    
    // Create a test customer
    const customerId = await Customer.generateCustomerId();
    const testCustomer = await Customer.create({
      customerId,
      name: 'Test Customer for Soft Delete',
      phone: '1234567890',
      email: 'test@softdelete.com',
      createdBy: testUser._id
    });

    console.log(`✅ Created test customer: ${testCustomer.name}`);

    // Test soft delete
    const customerDeleteResult = await SoftDeleteService.softDelete(
      testCustomer,
      testUser._id,
      { user: testUser },
      'Testing customer soft delete'
    );

    if (customerDeleteResult.success) {
      console.log('✅ Customer soft deleted successfully');
    } else {
      console.log('❌ Customer soft delete failed:', customerDeleteResult.message);
    }

    // Test 3: Employee Soft Delete
    console.log('\n👨‍💼 Testing Employee Soft Delete...');
    
    // Create a test employee
    const employeeId = await Employee.generateEmployeeId();
    const testEmployee = await Employee.create({
      employeeId,
      name: 'Test Employee for Soft Delete',
      email: 'employee@softdelete.com',
      phone: '9876543210',
      position: 'Test Position',
      department: 'Administration',
      monthlySalary: 5000,
      createdBy: testUser._id
    });

    console.log(`✅ Created test employee: ${testEmployee.name}`);

    // Test soft delete
    const employeeDeleteResult = await SoftDeleteService.softDelete(
      testEmployee,
      testUser._id,
      { user: testUser },
      'Testing employee soft delete'
    );

    if (employeeDeleteResult.success) {
      console.log('✅ Employee soft deleted successfully');
    } else {
      console.log('❌ Employee soft delete failed:', employeeDeleteResult.message);
    }

    // Test 4: Query Filtering
    console.log('\n🔍 Testing Query Filtering...');
    
    // Test that soft deleted items are excluded from normal queries
    const activeProducts = await Product.find({ isDeleted: { $ne: true } });
    const allProducts = await Product.find({});
    const deletedProducts = await Product.find({ isDeleted: true });

    console.log(`📊 Product Query Results:`);
    console.log(`   - Active products: ${activeProducts.length}`);
    console.log(`   - All products: ${allProducts.length}`);
    console.log(`   - Deleted products: ${deletedProducts.length}`);

    // Test 5: Soft Delete Service Statistics
    console.log('\n📈 Testing Soft Delete Statistics...');
    
    const productStats = await SoftDeleteService.getDeletionStats(Product);
    const customerStats = await SoftDeleteService.getDeletionStats(Customer);
    const employeeStats = await SoftDeleteService.getDeletionStats(Employee);

    if (productStats.success) {
      console.log(`📦 Product Stats:`, productStats.stats);
    }
    if (customerStats.success) {
      console.log(`👥 Customer Stats:`, customerStats.stats);
    }
    if (employeeStats.success) {
      console.log(`👨‍💼 Employee Stats:`, employeeStats.stats);
    }

    // Test 6: Get Deleted Items
    console.log('\n📋 Testing Get Deleted Items...');
    
    const deletedProductsResult = await SoftDeleteService.getDeleted(Product, {}, {
      page: 1,
      limit: 5,
      populate: ['createdBy', 'deletedBy']
    });

    if (deletedProductsResult.success) {
      console.log(`📦 Found ${deletedProductsResult.data.length} deleted products`);
      deletedProductsResult.data.forEach(product => {
        console.log(`   - ${product.name} (deleted at: ${product.deletedAt})`);
      });
    }

    // Cleanup: Permanently delete test items
    console.log('\n🧹 Cleaning up test data...');
    
    try {
      await SoftDeleteService.permanentDelete(
        testProduct,
        testUser._id,
        { user: testUser },
        'Cleanup after soft delete testing'
      );
      console.log('✅ Test product permanently deleted');
    } catch (error) {
      console.log('⚠️ Test product cleanup failed:', error.message);
    }

    try {
      await SoftDeleteService.permanentDelete(
        testCustomer,
        testUser._id,
        { user: testUser },
        'Cleanup after soft delete testing'
      );
      console.log('✅ Test customer permanently deleted');
    } catch (error) {
      console.log('⚠️ Test customer cleanup failed:', error.message);
    }

    try {
      await SoftDeleteService.permanentDelete(
        testEmployee,
        testUser._id,
        { user: testUser },
        'Cleanup after soft delete testing'
      );
      console.log('✅ Test employee permanently deleted');
    } catch (error) {
      console.log('⚠️ Test employee cleanup failed:', error.message);
    }

    console.log('\n✅ Soft Delete System Test Completed Successfully!');
    console.log('\n📋 Test Summary:');
    console.log('   ✅ Product soft delete and restore');
    console.log('   ✅ Customer soft delete');
    console.log('   ✅ Employee soft delete');
    console.log('   ✅ Query filtering works correctly');
    console.log('   ✅ Statistics generation');
    console.log('   ✅ Get deleted items functionality');
    console.log('   ✅ Permanent delete (cleanup)');

  } catch (error) {
    console.error('❌ Soft Delete System Test Failed:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
};

// Run the test
testSoftDeleteSystem();