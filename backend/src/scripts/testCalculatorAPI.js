import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

async function testCalculatorAPI() {
  try {
    console.log('🧪 Testing Calculator Glass Pricing API...\n');
    
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('📊 Connected to database');
    
    // Simple test to check if glass pricing data exists
    const GlassPricing = mongoose.model('GlassPricing', new mongoose.Schema({
      thickness: String,
      quality: String,
      pricePerSqFt: Number,
      materialType: String,
      isActive: Boolean
    }));
    
    const glassPrices = await GlassPricing.find({ isActive: true }).limit(5);
    
    console.log('✅ Glass Pricing Data Found:');
    console.log(`📊 Total active glass pricing records: ${glassPrices.length}`);
    
    if (glassPrices.length > 0) {
      console.log('📋 Sample records:');
      glassPrices.forEach((price, index) => {
        console.log(`${index + 1}. ${price.thickness} - ${price.quality}: ৳${price.pricePerSqFt}/sqft`);
      });
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n📊 Disconnected from database');
    process.exit(0);
  }
}

testCalculatorAPI();