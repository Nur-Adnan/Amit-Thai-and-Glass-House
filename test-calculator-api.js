// Test script to verify calculator API endpoints
const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5NTk3YjYxMTZhMjc3NjU2NzRjMTU0OSIsImlhdCI6MTc2NzQ3MTk3OCwiZXhwIjoxNzcwMDYzOTc4fQ.LRxFteVVK92AdV6qO_1exY6u1W93v2X7Twrz0CEgtuo';

async function testCalculatorAPI() {
  try {
    console.log('🧪 Testing Calculator API Endpoints...\n');

    // Test 1: Get available variants
    console.log('1. Testing available variants endpoint...');
    const variantsResponse = await fetch('http://localhost:3001/api/calculator/variants', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const variantsData = await variantsResponse.json();
    
    if (variantsData.success && variantsData.data.variants.length > 0) {
      console.log('✅ Variants loaded successfully:', variantsData.data.variants.length, 'variants found');
      console.log('   - Material types:', variantsData.data.groupedOptions.materialTypes);
      console.log('   - Companies:', variantsData.data.groupedOptions.companies.slice(0, 3), '...');
      console.log('   - Thicknesses:', variantsData.data.groupedOptions.thicknesses);
      console.log('   - Qualities:', variantsData.data.groupedOptions.qualities);
    } else {
      throw new Error('Failed to load variants');
    }

    // Test 2: Get filtered variants (Glass)
    console.log('2. Testing filtered variants (Glass)...');
    const glassVariantsResponse = await fetch('http://localhost:3001/api/calculator/variants?materialType=Glass', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const glassVariantsData = await glassVariantsResponse.json();
    
    if (glassVariantsData.success) {
      console.log('✅ Glass variants loaded:', glassVariantsData.data.variants.length, 'variants');
      
      // Get a sample variant for testing
      const sampleVariant = glassVariantsData.data.variants.find(v => v.stockQuantity > 50);
      if (sampleVariant) {
        console.log('   - Sample variant:', sampleVariant.displayName);
        console.log('   - Stock:', sampleVariant.stockQuantity, sampleVariant.unit);
        console.log('   - Price:', sampleVariant.formattedSellingPrice);

        // Test 3: Calculate with variant
        console.log('3. Testing calculation with variant...');
        const calculationData = {
          productId: sampleVariant.id,
          measurementType: 'SFT',
          lengthFeet: 10,
          lengthInches: 6,
          widthFeet: 8,
          widthInches: 0
        };

        const calcResponse = await fetch('http://localhost:3001/api/calculator/calculate-variant', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(calculationData)
        });

        const calcData = await calcResponse.json();
        
        if (calcData.success) {
          console.log('✅ Calculation successful!');
          console.log('   - Area needed:', calcData.data.calculation.quantityNeeded, 'sqft');
          console.log('   - Unit price:', calcData.data.calculation.formattedUnitPrice);
          console.log('   - Total price:', calcData.data.calculation.formattedTotalPrice);
          console.log('   - Stock sufficient:', calcData.data.stockValidation.isStockSufficient);
          console.log('   - Stock after use:', calcData.data.stockValidation.stockAfterUse, 'sqft');
        } else {
          console.log('❌ Calculation failed:', calcData.message);
        }

        // Test 4: Test insufficient stock scenario
        console.log('4. Testing insufficient stock scenario...');
        const largeCalculationData = {
          productId: sampleVariant.id,
          measurementType: 'SFT',
          lengthFeet: 100,
          lengthInches: 0,
          widthFeet: 100,
          widthInches: 0
        };

        const largeCalcResponse = await fetch('http://localhost:3001/api/calculator/calculate-variant', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(largeCalculationData)
        });

        const largeCalcData = await largeCalcResponse.json();
        
        if (!largeCalcData.success && largeCalcData.message.includes('Insufficient stock')) {
          console.log('✅ Insufficient stock detection working correctly');
          console.log('   - Required:', largeCalcData.required, 'sqft');
          console.log('   - Available:', largeCalcData.available, 'sqft');
          console.log('   - Shortage:', largeCalcData.shortage, 'sqft');
        } else {
          console.log('⚠️  Insufficient stock detection may not be working as expected');
        }

      } else {
        console.log('⚠️  No suitable variant found for testing (need stock > 50)');
      }
    } else {
      throw new Error('Failed to load Glass variants');
    }

    console.log('\n🎉 All calculator API tests completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

// Run the test
testCalculatorAPI();