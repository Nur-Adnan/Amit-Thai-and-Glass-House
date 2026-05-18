import mongoose from 'mongoose';
import dotenv from 'dotenv';
import ShopConfig from '../models/ShopConfig.js';
import Invoice from '../models/Invoice.js';
import User from '../models/User.js';

dotenv.config();

const testShopConfig = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    console.log('\n=== SHOP CONFIGURATION SYSTEM TEST ===\n');

    // Test 1: Get active shop configuration
    console.log('1. Testing shop configuration retrieval...');
    const config = await ShopConfig.getActiveConfig();
    console.log('✅ Shop Config Retrieved:');
    console.log('   Shop Name:', config.shopName);
    console.log('   Invoice Prefix:', config.invoicePrefix);
    console.log('   Currency:', config.currency.symbol, config.currency.code);
    console.log('   Full Address:', config.fullAddress);
    console.log('   Contact Summary:', config.contactSummary);

    // Test 2: Test currency formatting
    console.log('\n2. Testing currency formatting...');
    const testAmounts = [100, 1500.50, 25000, 0.75];
    testAmounts.forEach(amount => {
      const formatted = config.formatCurrency(amount);
      console.log(`   ${amount} -> ${formatted}`);
    });

    // Test 3: Test invoice number generation with shop config
    console.log('\n3. Testing invoice number generation...');
    const invoiceNumbers = [];
    for (let i = 0; i < 5; i++) {
      const invoiceNo = await Invoice.generateInvoiceNumber();
      invoiceNumbers.push(invoiceNo);
      console.log(`   Generated: ${invoiceNo}`);
    }

    // Test 4: Test shop config methods
    console.log('\n4. Testing shop config methods...');
    if (config.generateInvoiceNumber) {
      const testInvoiceNo = config.generateInvoiceNumber(123);
      console.log(`   Method generated: ${testInvoiceNo}`);
    }

    // Test 5: Test default configuration
    console.log('\n5. Testing default configuration...');
    const defaultConfig = ShopConfig.getDefaultConfig();
    console.log('   Default Shop Name:', defaultConfig.shopName);
    console.log('   Default Currency:', defaultConfig.currency.symbol, defaultConfig.currency.code);
    console.log('   Default Invoice Prefix:', defaultConfig.invoicePrefix);

    // Test 6: Test configuration validation
    console.log('\n6. Testing configuration validation...');
    const validationTests = [
      { field: 'shopName', value: '', shouldFail: true },
      { field: 'currency.code', value: 'INVALID', shouldFail: true },
      { field: 'currency.position', value: 'middle', shouldFail: true },
      { field: 'theme.primaryColor', value: 'not-a-color', shouldFail: true },
      { field: 'invoicePrefix', value: 'VALID', shouldFail: false }
    ];

    for (const test of validationTests) {
      try {
        const testConfig = new ShopConfig({
          ...ShopConfig.getDefaultConfig(),
          createdBy: new mongoose.Types.ObjectId()
        });
        
        // Set nested field
        const keys = test.field.split('.');
        let obj = testConfig;
        for (let i = 0; i < keys.length - 1; i++) {
          obj = obj[keys[i]];
        }
        obj[keys[keys.length - 1]] = test.value;

        await testConfig.validate();
        console.log(`   ${test.field}: ${test.shouldFail ? '❌ Should have failed' : '✅ Valid'}`);
      } catch (error) {
        console.log(`   ${test.field}: ${test.shouldFail ? '✅ Correctly failed' : '❌ Unexpected failure'}`);
      }
    }

    // Test 7: Test invoice settings
    console.log('\n7. Testing invoice display settings...');
    console.log('   Show Logo:', config.invoiceSettings.showLogo);
    console.log('   Show Address:', config.invoiceSettings.showAddress);
    console.log('   Show Phone:', config.invoiceSettings.showPhone);
    console.log('   Show Email:', config.invoiceSettings.showEmail);
    console.log('   Logo Size:', config.invoiceSettings.logoSize);

    // Test 8: Test tax configuration
    console.log('\n8. Testing tax configuration...');
    console.log('   Tax Enabled:', config.tax.enabled);
    console.log('   Tax Rate:', config.tax.rate + '%');
    console.log('   Tax Label:', config.tax.label);

    console.log('\n✅ All shop configuration tests completed successfully!');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error testing shop configuration:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
};

testShopConfig();