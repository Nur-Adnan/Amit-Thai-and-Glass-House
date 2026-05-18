// Test script to verify stock purchase form functionality
const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5NTk3YjYxMTZhMjc3NjU2NzRjMTU0OSIsImlhdCI6MTc2NzQ3MTk3OCwiZXhwIjoxNzcwMDYzOTc4fQ.LRxFteVVK92AdV6qO_1exY6u1W93v2X7Twrz0CEgtuo';

async function testStockPurchase() {
  try {
    console.log('🧪 Testing Stock Purchase Form...\n');

    // Test 1: Get suppliers
    console.log('1. Testing suppliers endpoint...');
    const suppliersResponse = await fetch('http://localhost:3001/api/suppliers', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const suppliersData = await suppliersResponse.json();
    
    if (suppliersData.success && suppliersData.data.length > 0) {
      console.log('✅ Suppliers loaded successfully:', suppliersData.data.length, 'suppliers found');
    } else {
      throw new Error('Failed to load suppliers');
    }

    // Test 2: Get form data
    console.log('2. Testing form data endpoint...');
    const formDataResponse = await fetch('http://localhost:3001/api/bd-shop-inventory/form-data', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const formData = await formDataResponse.json();
    
    if (formData.success) {
      console.log('✅ Form data loaded successfully');
      console.log('   - Material types:', formData.data.materialTypes.length);
      console.log('   - Thai brands:', formData.data.brands.Thai.length);
      console.log('   - Glass brands:', formData.data.brands.Glass.length);
      console.log('   - Glass thicknesses:', formData.data.thicknesses.Glass.length);
      console.log('   - Qualities:', formData.data.qualities.length);
    } else {
      throw new Error('Failed to load form data');
    }

    // Test 3: Create a test stock purchase
    console.log('3. Testing stock purchase creation...');
    const supplier = suppliersData.data[0]; // Use first supplier
    
    const stockPurchaseData = {
      materialType: 'Glass',
      company: 'Nasir Glass',
      thicknessMM: 5,
      quality: 'Local',
      measurementType: 'SFT',
      purchasePrice: 150,
      sellingPrice: 180, // 20% markup
      stockQuantity: 100,
      notes: 'Test stock purchase from automated test',
      supplierInfo: {
        supplierId: supplier._id,
        supplierName: supplier.name,
        paidAmount: 15000, // Full payment
        paymentMethod: 'cash'
      }
    };

    const createResponse = await fetch('http://localhost:3001/api/bd-shop-inventory/add-stock', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(stockPurchaseData)
    });

    const createData = await createResponse.json();
    
    if (createData.success) {
      console.log('✅ Stock purchase created successfully!');
      console.log('   - Product:', createData.data.product.name);
      console.log('   - Stock quantity:', createData.data.product.stockQuantity, 'SFT');
      console.log('   - Purchase price:', createData.data.product.formattedPurchasePrice);
      console.log('   - Selling price:', createData.data.product.formattedSellingPrice);
      console.log('   - Is new product:', createData.data.product.isNewProduct);
      
      if (createData.data.stockPurchase) {
        console.log('   - Purchase No:', createData.data.stockPurchase.purchaseNo);
        console.log('   - Total cost:', createData.data.stockPurchase.formattedGrandTotal);
      }
      
      if (createData.data.investment) {
        console.log('   - Investment No:', createData.data.investment.investmentNo);
        console.log('   - Investment amount:', createData.data.investment.formattedAmount);
      }
    } else {
      throw new Error(`Failed to create stock purchase: ${createData.message}`);
    }

    console.log('\n🎉 All tests passed! Stock purchase form is working correctly.');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

// Run the test
testStockPurchase();