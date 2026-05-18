// Debug script to test StockPurchase creation directly
import mongoose from 'mongoose';
import StockPurchase from './src/models/StockPurchase.js';
import dotenv from 'dotenv';

dotenv.config();

async function debugStockPurchase() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Test the static method first
    console.log('Testing generatePurchaseNumber...');
    const purchaseNo = await StockPurchase.generatePurchaseNumber();
    console.log('Generated purchase number:', purchaseNo);

    // Test creating a StockPurchase directly
    const stockPurchase = new StockPurchase({
      supplier: new mongoose.Types.ObjectId(),
      supplierName: 'Test Supplier',
      items: [{
        product: new mongoose.Types.ObjectId(),
        productName: 'Test Product',
        quantity: 100,
        unit: 'SFT',
        purchasePrice: 120,
        totalCost: 12000,
        previousStock: 0,
        newStock: 100,
        measurementType: 'SFT'
      }],
      subtotal: 12000,
      grandTotal: 12000,
      paidAmount: 12000,
      dueAmount: 0,
      paymentMethod: 'cash',
      notes: 'Debug test',
      createdBy: new mongoose.Types.ObjectId()
    });

    console.log('Before save - purchaseNo:', stockPurchase.purchaseNo);
    
    await stockPurchase.save();
    
    console.log('✅ StockPurchase created successfully!');
    console.log('Purchase No:', stockPurchase.purchaseNo);
    console.log('Status:', stockPurchase.status);

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.errors) {
      Object.keys(error.errors).forEach(key => {
        console.error(`  - ${key}: ${error.errors[key].message}`);
      });
    }
  } finally {
    await mongoose.disconnect();
  }
}

debugStockPurchase();