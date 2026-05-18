import mongoose from 'mongoose';
import dotenv from 'dotenv';
import ShopConfig from '../models/ShopConfig.js';
import User from '../models/User.js';

dotenv.config();

const seedShopConfig = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find owner user
    const owner = await User.findOne({ role: 'owner' });
    if (!owner) {
      console.log('No owner user found. Please create an owner user first.');
      process.exit(1);
    }

    // Check if shop config already exists
    const existingConfig = await ShopConfig.findOne({ isActive: true });
    if (existingConfig) {
      console.log('Shop configuration already exists');
      console.log('Shop Name:', existingConfig.shopName);
      console.log('Invoice Prefix:', existingConfig.invoicePrefix);
      console.log('Currency:', existingConfig.currency.symbol, existingConfig.currency.code);
      process.exit(0);
    }

    // Create default shop configuration
    const shopConfig = new ShopConfig({
      shopName: 'Amit Thai & Aluminum',
      address: {
        street: 'Shop Address Street',
        city: 'Dhaka',
        state: 'Dhaka Division',
        zipCode: '1000',
        country: 'Bangladesh'
      },
      phone: {
        primary: '+880-XXX-XXXXXX',
        secondary: '+880-XXX-XXXXXX'
      },
      email: {
        primary: 'info@amitthaialuminum.com',
        support: 'support@amitthaialuminum.com'
      },
      invoicePrefix: 'INV',
      footerNote: 'Thank you for choosing Amit Thai & Aluminum. Quality materials, professional service.',
      termsAndConditions: 'All sales are final. Returns accepted within 7 days with receipt. Installation warranty: 1 year.',
      currency: {
        code: 'BDT',
        symbol: '৳',
        position: 'before'
      },
      tax: {
        enabled: false,
        rate: 0,
        label: 'VAT',
        registrationNumber: ''
      },
      businessRegistration: {
        registrationNumber: 'REG-XXXX-XXXX',
        licenseNumber: 'LIC-XXXX-XXXX',
        establishedYear: 2020
      },
      invoiceSettings: {
        showLogo: true,
        showAddress: true,
        showPhone: true,
        showEmail: true,
        showWebsite: false,
        showFooterNote: true,
        showTerms: true,
        showTax: false,
        logoSize: 'medium'
      },
      theme: {
        primaryColor: '#2563eb',
        secondaryColor: '#64748b',
        fontFamily: 'Arial'
      },
      isActive: true,
      createdBy: owner._id
    });

    await shopConfig.save();

    console.log('✅ Shop configuration created successfully!');
    console.log('Shop Name:', shopConfig.shopName);
    console.log('Invoice Prefix:', shopConfig.invoicePrefix);
    console.log('Currency:', shopConfig.currency.symbol, shopConfig.currency.code);
    console.log('Address:', shopConfig.fullAddress);
    console.log('Phone:', shopConfig.phone.primary);
    console.log('Email:', shopConfig.email.primary);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding shop configuration:', error.message);
    process.exit(1);
  }
};

seedShopConfig();