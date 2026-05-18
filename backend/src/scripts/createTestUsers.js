import mongoose from 'mongoose';
import dotenv from 'dotenv';
import connectDB from '../config/database.js';
import User from '../models/User.js';

dotenv.config();

const createTestUsers = async () => {
  try {
    console.log('👥 Creating Test Users...\n');

    // Connect to database
    await connectDB();

    // Check if users already exist
    const existingOwner = await User.findOne({ role: 'owner' });
    const existingManager = await User.findOne({ role: 'manager' });
    const existingAccountant = await User.findOne({ role: 'accountant' });

    // Create owner if doesn't exist
    if (!existingOwner) {
      const owner = await User.create({
        name: 'System Owner',
        email: 'owner@company.com',
        password: 'password123',
        role: 'owner'
      });
      console.log(`✅ Created Owner: ${owner.name} (${owner.email})`);
    } else {
      console.log(`ℹ️ Owner already exists: ${existingOwner.name} (${existingOwner.email})`);
    }

    // Create manager if doesn't exist
    if (!existingManager) {
      const manager = await User.create({
        name: 'Test Manager',
        email: 'manager@company.com',
        password: 'password123',
        role: 'manager'
      });
      console.log(`✅ Created Manager: ${manager.name} (${manager.email})`);
    } else {
      console.log(`ℹ️ Manager already exists: ${existingManager.name} (${existingManager.email})`);
    }

    // Create accountant if doesn't exist
    if (!existingAccountant) {
      const accountant = await User.create({
        name: 'Test Accountant',
        email: 'accountant@company.com',
        password: 'password123',
        role: 'accountant'
      });
      console.log(`✅ Created Accountant: ${accountant.name} (${accountant.email})`);
    } else {
      console.log(`ℹ️ Accountant already exists: ${existingAccountant.name} (${existingAccountant.email})`);
    }

    console.log('\n✅ Test users setup complete!');

  } catch (error) {
    console.error('❌ Error creating test users:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
};

// Run the script
createTestUsers();