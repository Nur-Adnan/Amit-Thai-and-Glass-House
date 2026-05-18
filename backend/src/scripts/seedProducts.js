import dotenv from 'dotenv';
import connectDB from '../config/database.js';
import Product from '../models/Product.js';
import User from '../models/User.js';

dotenv.config();

const seedProducts = async () => {
  try {
    await connectDB();

    // Find an owner or manager to assign as creator
    const user = await User.findOne({ role: { $in: ['owner', 'manager'] } });
    if (!user) {
      console.log('No owner or manager found. Please create a user first.');
      process.exit(1);
    }

    // Clear existing products
    await Product.deleteMany();

    const sampleProducts = [
      {
        name: 'Premium Thai Marble - White',
        category: 'Thai',
        purchasePrice: 150,
        sellingPrice: 200,
        stockQuantity: 50,
        unit: 'sqft',
        description: 'High-quality white Thai marble for flooring and walls',
        createdBy: user._id
      },
      {
        name: 'Thai Granite - Black',
        category: 'Thai',
        purchasePrice: 120,
        sellingPrice: 160,
        stockQuantity: 75,
        unit: 'sqft',
        description: 'Durable black Thai granite for kitchen countertops',
        createdBy: user._id
      },
      {
        name: 'Tempered Glass Panel - 8mm',
        category: 'Glass',
        purchasePrice: 80,
        sellingPrice: 120,
        stockQuantity: 30,
        unit: 'sqft',
        description: '8mm tempered glass panels for windows and doors',
        createdBy: user._id
      },
      {
        name: 'Laminated Glass - 10mm',
        category: 'Glass',
        purchasePrice: 100,
        sellingPrice: 150,
        stockQuantity: 25,
        unit: 'sqft',
        description: '10mm laminated safety glass for commercial use',
        createdBy: user._id
      },
      {
        name: 'Thai Limestone - Beige',
        category: 'Thai',
        purchasePrice: 90,
        sellingPrice: 130,
        stockQuantity: 60,
        unit: 'sqft',
        description: 'Natural beige limestone from Thailand',
        createdBy: user._id
      },
      {
        name: 'Frosted Glass - 6mm',
        category: 'Glass',
        purchasePrice: 60,
        sellingPrice: 90,
        stockQuantity: 40,
        unit: 'sqft',
        description: '6mm frosted glass for privacy applications',
        createdBy: user._id
      }
    ];

    const products = await Product.create(sampleProducts);

    console.log(`${products.length} sample products created successfully:`);
    products.forEach(product => {
      console.log(`- ${product.name} (${product.category})`);
    });

    process.exit(0);
  } catch (error) {
    console.error('Error seeding products:', error);
    process.exit(1);
  }
};

seedProducts();