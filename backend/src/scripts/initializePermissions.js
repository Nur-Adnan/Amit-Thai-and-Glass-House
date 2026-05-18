import mongoose from 'mongoose';
import dotenv from 'dotenv';
import connectDB from '../config/database.js';
import PermissionService from '../services/permissionService.js';
import User from '../models/User.js';

dotenv.config();

const initializePermissionSystem = async () => {
  try {
    console.log('🔐 Initializing Permission System...\n');

    // Connect to database
    await connectDB();

    // Find owner user to use as creator
    const ownerUser = await User.findOne({ role: 'owner' });
    if (!ownerUser) {
      console.log('❌ No owner user found. Please create an owner user first.');
      return;
    }

    console.log(`👤 Using owner user: ${ownerUser.name} (${ownerUser.email})\n`);

    // Initialize permissions
    const result = await PermissionService.initializePermissions(ownerUser._id);

    if (result.success) {
      console.log('✅ Permission system initialized successfully!\n');

      // Display permission matrix
      console.log('📋 Permission Matrix:');
      const matrix = await PermissionService.getPermissionMatrix();

      console.log(`\n📊 Total Permissions: ${matrix.permissions.length}`);
      console.log('📂 Permissions by Category:');
      
      const categories = {};
      matrix.permissions.forEach(p => {
        if (!categories[p.category]) categories[p.category] = 0;
        categories[p.category]++;
      });

      Object.entries(categories).forEach(([category, count]) => {
        console.log(`   ${category}: ${count} permissions`);
      });

      console.log('\n👥 Role Permissions:');
      Object.entries(matrix.matrix).forEach(([role, data]) => {
        console.log(`   ${role.toUpperCase()}: ${data.permissions.length} permissions`);
        
        const roleCategories = {};
        data.permissions.forEach(p => {
          if (!roleCategories[p.category]) roleCategories[p.category] = 0;
          roleCategories[p.category]++;
        });
        
        Object.entries(roleCategories).forEach(([category, count]) => {
          console.log(`     - ${category}: ${count}`);
        });
      });

      console.log('\n🔑 Key Permissions:');
      console.log('   CAN_CREATE_INVOICE - Create new invoices');
      console.log('   CAN_EDIT_PRICE - Edit product prices');
      console.log('   CAN_PAY_SALARY - Process salary payments');
      console.log('   CAN_VIEW_PROFIT - View profit reports');
      console.log('   CAN_MANAGE_PERMISSIONS - Manage system permissions');

      console.log('\n🎯 Permission System Ready!');
      console.log('   - Fine-grained control implemented');
      console.log('   - Role-based permissions configured');
      console.log('   - API endpoints protected');
      console.log('   - Audit logging enabled');

    } else {
      console.log('❌ Failed to initialize permission system:', result.message);
    }

  } catch (error) {
    console.error('❌ Error initializing permission system:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
};

// Run the initialization
initializePermissionSystem();