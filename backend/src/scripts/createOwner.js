import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import User from '../models/User.js';

dotenv.config();

const createOwner = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB Connected');

    // Check if owner already exists
    const existingOwner = await User.findOne({ role: 'owner' });
    if (existingOwner) {
      console.log('Owner already exists:', existingOwner.email);
      process.exit(0);
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('password123', salt);

    // Create owner user
    const owner = await User.create({
      name: 'System Owner',
      email: 'owner@test.com',
      password: hashedPassword,
      role: 'owner'
    });

    console.log('✅ Owner created successfully:');
    console.log('   Email:', owner.email);
    console.log('   Password: password123');
    console.log('   Role:', owner.role);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating owner:', error.message);
    process.exit(1);
  }
};

createOwner();