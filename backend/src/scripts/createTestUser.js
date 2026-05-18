import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import connectDB from '../config/database.js';

// Load environment variables
dotenv.config();

async function createTestUser() {
  try {
    // Connect to database
    await connectDB();
    console.log('📦 Connected to database');

    // Check if test user already exists
    const existingUser = await User.findOne({ email: 'test@example.com' });
    
    if (existingUser) {
      console.log('👤 Test user already exists');
      const token = existingUser.getSignedJwtToken();
      console.log('🔑 JWT Token:', token);
      console.log('📋 User Details:', {
        id: existingUser._id,
        name: existingUser.name,
        email: existingUser.email,
        role: existingUser.role
      });
      return;
    }

    // Create test user
    const testUser = await User.create({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
      role: 'owner'
    });

    console.log('✅ Test user created successfully');
    
    // Generate JWT token
    const token = testUser.getSignedJwtToken();
    
    console.log('📋 User Details:', {
      id: testUser._id,
      name: testUser.name,
      email: testUser.email,
      role: testUser.role
    });
    
    console.log('🔑 JWT Token:', token);
    console.log('\n💡 You can use this token for API testing');
    console.log('💡 Add it to localStorage as "token" in the frontend');

  } catch (error) {
    console.error('❌ Error creating test user:', error);
  } finally {
    mongoose.connection.close();
  }
}

createTestUser();