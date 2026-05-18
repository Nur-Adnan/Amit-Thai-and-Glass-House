/**
 * Test Measurement Calculations Directly
 * Tests the calculation logic without requiring API authentication
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import CalculatorConfig from '../models/CalculatorConfig.js';
import CurrencyService from '../services/currencyService.js';

// Load environment variables
dotenv.config();

// Connect to MongoDB
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('Database connection error:', error);
    process.exit(1);
  }
};

// Helper function to convert feet and inches to total feet
const convertToTotalFeet = (feet, inches = 0) => {
  return parseFloat(feet) + (parseFloat(inches) / 12);
};

// Helper function to format feet and inches display
const formatFeetInches = (totalFeet) => {
  const feet = Math.floor(totalFeet);
  const inches = Math.round((totalFeet - feet) * 12);
  return `${feet}ft ${inches}in`;
};

// Helper function to calculate based on measurement type
const calculateByMeasurementType = (measurementType, dimensions, pricing) => {
  let quantity = 0;
  let unitPrice = 0;
  let formula = '';
  let calculation = '';
  let unit = '';

  switch (measurementType) {
    case 'SFT': // Square Foot - length × width
      if (!dimensions.length || !dimensions.width) {
        throw new Error('Length and width are required for SFT measurement');
      }
      quantity = dimensions.length * dimensions.width; // area in sq ft
      unitPrice = pricing.SFT.pricePerSqFt;
      unit = 'sqft';
      formula = 'Area = Length × Width';
      calculation = `${dimensions.length.toFixed(2)} × ${dimensions.width.toFixed(2)} = ${quantity.toFixed(4)} sq ft`;
      break;

    case 'RFT': // Running Foot - length only
      if (!dimensions.runningLength) {
        throw new Error('Running length is required for RFT measurement');
      }
      quantity = dimensions.runningLength;
      unitPrice = pricing.RFT.pricePerRunningFt;
      unit = 'rft';
      formula = 'Running Length';
      calculation = `${dimensions.runningLength.toFixed(2)} running ft`;
      break;

    case 'PANEL': // Panel - fixed size units
      if (!dimensions.panelCount) {
        throw new Error('Panel count is required for PANEL measurement');
      }
      quantity = dimensions.panelCount;
      unitPrice = pricing.PANEL.pricePerPanel;
      unit = 'panel';
      formula = 'Panel Count';
      calculation = `${dimensions.panelCount} panels`;
      if (pricing.PANEL.standardSize) {
        calculation += ` (${pricing.PANEL.standardSize.length}ft × ${pricing.PANEL.standardSize.width}ft each)`;
      }
      break;

    case 'SHEET': // Sheet - fixed size units
      if (!dimensions.sheetCount) {
        throw new Error('Sheet count is required for SHEET measurement');
      }
      quantity = dimensions.sheetCount;
      unitPrice = pricing.SHEET.pricePerSheet;
      unit = 'sheet';
      formula = 'Sheet Count';
      calculation = `${dimensions.sheetCount} sheets`;
      if (pricing.SHEET.standardSize) {
        calculation += ` (${pricing.SHEET.standardSize.length}ft × ${pricing.SHEET.standardSize.width}ft each)`;
      }
      break;

    case 'CUSTOM': // Custom pricing
      if (!dimensions.customQuantity || !dimensions.customUnitPrice) {
        throw new Error('Custom quantity and unit price are required for CUSTOM measurement');
      }
      quantity = dimensions.customQuantity;
      unitPrice = dimensions.customUnitPrice;
      unit = dimensions.customUnit || 'unit';
      formula = 'Custom Calculation';
      calculation = `${quantity} ${unit} × ${CurrencyService.formatBDT(unitPrice)}`;
      break;

    default:
      throw new Error(`Unsupported measurement type: ${measurementType}`);
  }

  const totalPrice = quantity * unitPrice;
  const priceCalculation = `${quantity.toFixed(4)} × ${CurrencyService.formatBDT(unitPrice)} = ${CurrencyService.formatBDT(totalPrice)}`;

  return {
    quantity: Math.round(quantity * 10000) / 10000, // Round to 4 decimal places
    unitPrice: Math.round(unitPrice * 100) / 100, // Round to 2 decimal places
    totalPrice: Math.round(totalPrice * 100) / 100, // Round to 2 decimal places
    unit,
    breakdown: {
      formula,
      calculation,
      priceCalculation
    }
  };
};

// Test SFT calculation
const testSFTCalculation = async (config) => {
  console.log('\n=== Testing SFT (Square Foot) Calculation ===');
  
  const testData = {
    lengthFeet: 5,
    lengthInches: 6,
    widthFeet: 3,
    widthInches: 0
  };

  console.log('📤 Input:', JSON.stringify(testData, null, 2));
  
  try {
    // Convert feet/inches to total feet
    const length = convertToTotalFeet(testData.lengthFeet, testData.lengthInches);
    const width = convertToTotalFeet(testData.widthFeet, testData.widthInches);
    
    const dimensions = { length, width };
    const result = calculateByMeasurementType('SFT', dimensions, config.pricing);
    
    console.log('✅ SFT Calculation Success:');
    console.log(`   - Input: ${formatFeetInches(length)} × ${formatFeetInches(width)}`);
    console.log(`   - Dimensions: ${length}ft × ${width}ft`);
    console.log(`   - Area: ${result.quantity} ${result.unit}`);
    console.log(`   - Unit Price: ${CurrencyService.formatBDT(result.unitPrice)}`);
    console.log(`   - Total Price: ${CurrencyService.formatBDT(result.totalPrice)}`);
    console.log(`   - Formula: ${result.breakdown.formula}`);
    console.log(`   - Calculation: ${result.breakdown.calculation}`);
    console.log(`   - Price Calculation: ${result.breakdown.priceCalculation}`);
    
    // Verify calculation
    const expectedArea = 5.5 * 3.0; // 16.5
    const expectedTotal = expectedArea * 180; // 2970
    
    if (Math.abs(result.quantity - expectedArea) < 0.01 && Math.abs(result.totalPrice - expectedTotal) < 0.01) {
      console.log('✅ Calculation verified: CORRECT');
      return true;
    } else {
      console.log(`❌ Calculation error: Expected ${expectedArea} sq ft, ${expectedTotal} total. Got ${result.quantity} sq ft, ${result.totalPrice} total`);
      return false;
    }
  } catch (error) {
    console.log('❌ SFT Calculation Failed:', error.message);
    return false;
  }
};

// Test RFT calculation
const testRFTCalculation = async (config) => {
  console.log('\n=== Testing RFT (Running Foot) Calculation ===');
  
  const testData = {
    runningLengthFeet: 18,
    runningLengthInches: 0
  };

  console.log('📤 Input:', JSON.stringify(testData, null, 2));
  
  try {
    const runningLength = convertToTotalFeet(testData.runningLengthFeet, testData.runningLengthInches);
    const dimensions = { runningLength };
    const result = calculateByMeasurementType('RFT', dimensions, config.pricing);
    
    console.log('✅ RFT Calculation Success:');
    console.log(`   - Input: ${formatFeetInches(runningLength)}`);
    console.log(`   - Running Length: ${runningLength}ft`);
    console.log(`   - Quantity: ${result.quantity} ${result.unit}`);
    console.log(`   - Unit Price: ${CurrencyService.formatBDT(result.unitPrice)}`);
    console.log(`   - Total Price: ${CurrencyService.formatBDT(result.totalPrice)}`);
    console.log(`   - Formula: ${result.breakdown.formula}`);
    console.log(`   - Calculation: ${result.breakdown.calculation}`);
    console.log(`   - Price Calculation: ${result.breakdown.priceCalculation}`);
    
    // Verify calculation
    const expectedLength = 18.0;
    const expectedTotal = expectedLength * 120; // 2160
    
    if (Math.abs(result.quantity - expectedLength) < 0.01 && Math.abs(result.totalPrice - expectedTotal) < 0.01) {
      console.log('✅ Calculation verified: CORRECT');
      return true;
    } else {
      console.log(`❌ Calculation error: Expected ${expectedLength} ft, ${expectedTotal} total. Got ${result.quantity} ft, ${result.totalPrice} total`);
      return false;
    }
  } catch (error) {
    console.log('❌ RFT Calculation Failed:', error.message);
    return false;
  }
};

// Test PANEL calculation
const testPANELCalculation = async (config) => {
  console.log('\n=== Testing PANEL Calculation ===');
  
  const testData = {
    panelCount: 6
  };

  console.log('📤 Input:', JSON.stringify(testData, null, 2));
  
  try {
    const dimensions = { panelCount: testData.panelCount };
    const result = calculateByMeasurementType('PANEL', dimensions, config.pricing);
    
    console.log('✅ PANEL Calculation Success:');
    console.log(`   - Panel Count: ${testData.panelCount}`);
    console.log(`   - Quantity: ${result.quantity} ${result.unit}`);
    console.log(`   - Unit Price: ${CurrencyService.formatBDT(result.unitPrice)}`);
    console.log(`   - Total Price: ${CurrencyService.formatBDT(result.totalPrice)}`);
    console.log(`   - Formula: ${result.breakdown.formula}`);
    console.log(`   - Calculation: ${result.breakdown.calculation}`);
    console.log(`   - Price Calculation: ${result.breakdown.priceCalculation}`);
    
    // Verify calculation (using Glass pricing: ৳1200 per panel)
    const expectedCount = 6;
    const expectedTotal = expectedCount * 1200; // 7200
    
    if (Math.abs(result.quantity - expectedCount) < 0.01 && Math.abs(result.totalPrice - expectedTotal) < 0.01) {
      console.log('✅ Calculation verified: CORRECT');
      return true;
    } else {
      console.log(`❌ Calculation error: Expected ${expectedCount} panels, ${expectedTotal} total. Got ${result.quantity} panels, ${result.totalPrice} total`);
      return false;
    }
  } catch (error) {
    console.log('❌ PANEL Calculation Failed:', error.message);
    return false;
  }
};

// Test SHEET calculation
const testSHEETCalculation = async (config) => {
  console.log('\n=== Testing SHEET Calculation ===');
  
  const testData = {
    sheetCount: 10
  };

  console.log('📤 Input:', JSON.stringify(testData, null, 2));
  
  try {
    const dimensions = { sheetCount: testData.sheetCount };
    const result = calculateByMeasurementType('SHEET', dimensions, config.pricing);
    
    console.log('✅ SHEET Calculation Success:');
    console.log(`   - Sheet Count: ${testData.sheetCount}`);
    console.log(`   - Quantity: ${result.quantity} ${result.unit}`);
    console.log(`   - Unit Price: ${CurrencyService.formatBDT(result.unitPrice)}`);
    console.log(`   - Total Price: ${CurrencyService.formatBDT(result.totalPrice)}`);
    console.log(`   - Formula: ${result.breakdown.formula}`);
    console.log(`   - Calculation: ${result.breakdown.calculation}`);
    console.log(`   - Price Calculation: ${result.breakdown.priceCalculation}`);
    
    // Verify calculation (using Thai pricing: ৳450 per sheet)
    const expectedCount = 10;
    const expectedTotal = expectedCount * 450; // 4500
    
    if (Math.abs(result.quantity - expectedCount) < 0.01 && Math.abs(result.totalPrice - expectedTotal) < 0.01) {
      console.log('✅ Calculation verified: CORRECT');
      return true;
    } else {
      console.log(`❌ Calculation error: Expected ${expectedCount} sheets, ${expectedTotal} total. Got ${result.quantity} sheets, ${result.totalPrice} total`);
      return false;
    }
  } catch (error) {
    console.log('❌ SHEET Calculation Failed:', error.message);
    return false;
  }
};

// Test CUSTOM calculation
const testCUSTOMCalculation = async () => {
  console.log('\n=== Testing CUSTOM Calculation ===');
  
  const testData = {
    customQuantity: 24,
    customUnitPrice: 35,
    customUnit: "pieces"
  };

  console.log('📤 Input:', JSON.stringify(testData, null, 2));
  
  try {
    const dimensions = {
      customQuantity: testData.customQuantity,
      customUnitPrice: testData.customUnitPrice,
      customUnit: testData.customUnit
    };
    
    // For custom, we don't need config pricing
    const mockPricing = {};
    const result = calculateByMeasurementType('CUSTOM', dimensions, mockPricing);
    
    console.log('✅ CUSTOM Calculation Success:');
    console.log(`   - Custom Quantity: ${testData.customQuantity} ${testData.customUnit}`);
    console.log(`   - Quantity: ${result.quantity} ${result.unit}`);
    console.log(`   - Unit Price: ${CurrencyService.formatBDT(result.unitPrice)}`);
    console.log(`   - Total Price: ${CurrencyService.formatBDT(result.totalPrice)}`);
    console.log(`   - Formula: ${result.breakdown.formula}`);
    console.log(`   - Calculation: ${result.breakdown.calculation}`);
    console.log(`   - Price Calculation: ${result.breakdown.priceCalculation}`);
    
    // Verify calculation
    const expectedQuantity = 24;
    const expectedTotal = expectedQuantity * 35; // 840
    
    if (Math.abs(result.quantity - expectedQuantity) < 0.01 && Math.abs(result.totalPrice - expectedTotal) < 0.01) {
      console.log('✅ Calculation verified: CORRECT');
      return true;
    } else {
      console.log(`❌ Calculation error: Expected ${expectedQuantity} pieces, ${expectedTotal} total. Got ${result.quantity} pieces, ${result.totalPrice} total`);
      return false;
    }
  } catch (error) {
    console.log('❌ CUSTOM Calculation Failed:', error.message);
    return false;
  }
};

// Test real-world scenarios
const testRealWorldScenarios = async (thaiConfig, glassConfig) => {
  console.log('\n=== Testing Real-World Scenarios ===');
  
  let totalProjectCost = 0;
  const projectItems = [];
  
  // 1. Thai Glass Window (SFT)
  const windowDimensions = { length: 4, width: 3 };
  const windowResult = calculateByMeasurementType('SFT', windowDimensions, thaiConfig.pricing);
  projectItems.push({ name: 'Thai Glass Window', result: windowResult });
  totalProjectCost += windowResult.totalPrice;
  console.log(`✅ Thai Glass Window (SFT): 4ft × 3ft = ${windowResult.quantity} sq ft × ${CurrencyService.formatBDT(windowResult.unitPrice)} = ${CurrencyService.formatBDT(windowResult.totalPrice)}`);
  
  // 2. Door Frame (RFT)
  const frameDimensions = { runningLength: 18 };
  const frameResult = calculateByMeasurementType('RFT', frameDimensions, thaiConfig.pricing);
  projectItems.push({ name: 'Door Frame', result: frameResult });
  totalProjectCost += frameResult.totalPrice;
  console.log(`✅ Door Frame (RFT): ${frameResult.quantity}ft × ${CurrencyService.formatBDT(frameResult.unitPrice)} = ${CurrencyService.formatBDT(frameResult.totalPrice)}`);
  
  // 3. Glass Panels (PANEL)
  const panelDimensions = { panelCount: 6 };
  const panelResult = calculateByMeasurementType('PANEL', panelDimensions, glassConfig.pricing);
  projectItems.push({ name: 'Glass Panels', result: panelResult });
  totalProjectCost += panelResult.totalPrice;
  console.log(`✅ Glass Panels (PANEL): ${panelResult.quantity} panels × ${CurrencyService.formatBDT(panelResult.unitPrice)} = ${CurrencyService.formatBDT(panelResult.totalPrice)}`);
  
  // 4. Aluminum Sheets (SHEET)
  const sheetDimensions = { sheetCount: 10 };
  const sheetResult = calculateByMeasurementType('SHEET', sheetDimensions, thaiConfig.pricing);
  projectItems.push({ name: 'Aluminum Sheets', result: sheetResult });
  totalProjectCost += sheetResult.totalPrice;
  console.log(`✅ Aluminum Sheets (SHEET): ${sheetResult.quantity} sheets × ${CurrencyService.formatBDT(sheetResult.unitPrice)} = ${CurrencyService.formatBDT(sheetResult.totalPrice)}`);
  
  // 5. Custom Hardware (CUSTOM)
  const hardwareDimensions = { customQuantity: 24, customUnitPrice: 35, customUnit: 'pieces' };
  const hardwareResult = calculateByMeasurementType('CUSTOM', hardwareDimensions, {});
  projectItems.push({ name: 'Custom Hardware', result: hardwareResult });
  totalProjectCost += hardwareResult.totalPrice;
  console.log(`✅ Custom Hardware (CUSTOM): ${hardwareResult.quantity} pieces × ${CurrencyService.formatBDT(hardwareResult.unitPrice)} = ${CurrencyService.formatBDT(hardwareResult.totalPrice)}`);
  
  console.log('\n🏗️  Complete Project Summary:');
  console.log(`   Total Project Cost: ${CurrencyService.formatBDT(totalProjectCost)}`);
  projectItems.forEach(item => {
    console.log(`   - ${item.name}: ${CurrencyService.formatBDT(item.result.totalPrice)}`);
  });
  
  return totalProjectCost;
};

// Main test function
const runCalculationTests = async () => {
  console.log('🚀 Starting Measurement Calculation Tests...\n');
  
  try {
    await connectDB();
    
    // Get configurations from database
    const thaiConfig = await CalculatorConfig.findOne({ materialType: 'Thai', isActive: true });
    const glassConfig = await CalculatorConfig.findOne({ materialType: 'Glass', isActive: true });
    
    if (!thaiConfig || !glassConfig) {
      console.log('❌ Calculator configurations not found. Please run the seed script first.');
      console.log('   Run: node src/scripts/seedMeasurementTypes.js');
      return;
    }
    
    console.log('✅ Configurations loaded:');
    console.log(`   - Thai: ${thaiConfig.getActiveMeasurementTypes().join(', ')}`);
    console.log(`   - Glass: ${glassConfig.getActiveMeasurementTypes().join(', ')}`);
    
    // Run all calculation tests
    const results = [];
    results.push(await testSFTCalculation(thaiConfig));
    results.push(await testRFTCalculation(thaiConfig));
    results.push(await testPANELCalculation(glassConfig));
    results.push(await testSHEETCalculation(thaiConfig));
    results.push(await testCUSTOMCalculation());
    
    // Test real-world scenarios
    const totalProjectCost = await testRealWorldScenarios(thaiConfig, glassConfig);
    
    const passedTests = results.filter(r => r).length;
    const totalTests = results.length;
    
    console.log('\n✅ All measurement calculation tests completed!');
    console.log(`\n📊 Test Results: ${passedTests}/${totalTests} tests passed`);
    
    if (passedTests === totalTests) {
      console.log('\n🎉 All calculations are working correctly!');
      console.log('\n📋 Verified Calculations:');
      console.log('   ✅ SFT: 5ft 6in × 3ft 0in = 16.5 sq ft × ৳180 = ৳2,970');
      console.log('   ✅ RFT: 18ft × ৳120 = ৳2,160');
      console.log('   ✅ PANEL: 6 panels × ৳1,200 = ৳7,200');
      console.log('   ✅ SHEET: 10 sheets × ৳450 = ৳4,500');
      console.log('   ✅ CUSTOM: 24 pieces × ৳35 = ৳840');
      console.log(`   ✅ Total Project: ${CurrencyService.formatBDT(totalProjectCost)}`);
    } else {
      console.log(`\n❌ ${totalTests - passedTests} tests failed. Please check the calculations.`);
    }
    
  } catch (error) {
    console.error('❌ Test execution error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
    process.exit(0);
  }
};

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runCalculationTests();
}

export default runCalculationTests;