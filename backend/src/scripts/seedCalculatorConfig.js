import dotenv from 'dotenv';
import connectDB from '../config/database.js';
import CalculatorConfig from '../models/CalculatorConfig.js';
import User from '../models/User.js';

dotenv.config();

const seedCalculatorConfig = async () => {
  try {
    await connectDB();

    // Find an owner or manager to assign as creator
    const user = await User.findOne({ role: { $in: ['owner', 'manager'] } });
    if (!user) {
      console.log('No owner or manager found. Please create a user first.');
      process.exit(1);
    }

    // Clear existing configurations
    await CalculatorConfig.deleteMany();

    const configs = [
      {
        materialType: 'Thai',
        pricePerSqFt: 125.50,
        createdBy: user._id
      },
      {
        materialType: 'Glass',
        pricePerSqFt: 95.75,
        createdBy: user._id
      }
    ];

    const createdConfigs = await CalculatorConfig.create(configs);

    console.log('Calculator configurations created successfully:');
    createdConfigs.forEach(config => {
      console.log(`- ${config.materialType}: $${config.pricePerSqFt} per sq ft`);
    });

    process.exit(0);
  } catch (error) {
    console.error('Error seeding calculator configurations:', error);
    process.exit(1);
  }
};

seedCalculatorConfig();