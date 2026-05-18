import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { getBusinessSummary } from '../controllers/businessSummaryController.js';

dotenv.config();

// Mock request and response objects
const mockReq = {
  user: { id: 'test-user-id' }
};

const mockRes = {
  json: (data) => {
    console.log('✅ Business Summary API Response:');
    console.log(JSON.stringify(data, null, 2));
  },
  status: (code) => ({
    json: (data) => {
      console.log(`❌ Error Response (${code}):`, data);
    }
  })
};

async function testBusinessSummary() {
  try {
    console.log('🧪 Testing Business Summary API...\n');
    
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('📊 Connected to database');
    
    // Test the business summary endpoint
    await getBusinessSummary(mockReq, mockRes);
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n📊 Disconnected from database');
    process.exit(0);
  }
}

testBusinessSummary();