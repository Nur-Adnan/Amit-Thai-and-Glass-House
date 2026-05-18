// Simple test for regular stock purchase API
const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5NTk3YjYxMTZhMjc3NjU2NzRjMTU0OSIsImlhdCI6MTc2NzQ3MTk3OCwiZXhwIjoxNzcwMDYzOTc4fQ.LRxFteVVK92AdV6qO_1exY6u1W93v2X7Twrz0CEgtuo';

async function testSimpleStockPurchase() {
  try {
    console.log('🧪 Testing Simple Stock Purchase...\n');

    // First, get existing products
    console.log('1. Getting existing products...');
    const productsResponse = await fetch('http://localhost:3001/api/products', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const productsData = await productsResponse.json();
    
    if (productsData.success && productsData.data.length > 0) {
      console.log('✅ Products loaded:', productsData.data.length, 'products found');
      
      const product = productsData.data[0];
      console.log('   Using product:', product.name);
      
      // Get suppliers
      const suppliersResponse = await fetch('http://localhost:3001/api/suppliers', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const suppliersData = await suppliersResponse.json();
      const supplier = suppliersData.data[0];
      
      // Test stock purchase with existing product
      console.log('2. Creating stock purchase with existing product...');
      const stockPurchaseData = {
        supplierId: supplier._id,
        items: [{
          product: product._id,
          quantity: 50,
          purchasePrice: 120,
          unit: 'SFT'
        }],
        paidAmount: 6000, // Full payment
        paymentMethod: 'cash',
        notes: 'Test stock purchase with existing product'
      };

      const response = await fetch('http://localhost:3001/api/stock-purchases', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(stockPurchaseData)
      });

      const data = await response.json();
      
      if (data.success) {
        console.log('✅ Stock purchase created successfully!');
        console.log('   - Purchase No:', data.data.stockPurchase.purchaseNo);
        console.log('   - Grand Total:', data.data.stockPurchase.grandTotal);
        console.log('   - Stock Updates:', data.data.stockUpdates);
      } else {
        console.log('❌ Stock purchase failed:', data.message);
      }
      
    } else {
      console.log('⚠️  No existing products found. Creating a simple product first...');
      
      // Create a simple product first
      const productData = {
        name: 'Test Glass 5mm Local',
        materialType: 'Glass',
        company: 'Nasir Glass',
        thicknessMM: 5,
        quality: 'Local',
        measurementType: 'SFT',
        unit: 'sqft',
        purchasePrice: 120,
        sellingPrice: 150,
        stockQuantity: 0
      };

      const createProductResponse = await fetch('http://localhost:3001/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(productData)
      });

      const createProductData = await createProductResponse.json();
      
      if (createProductData.success) {
        console.log('✅ Product created:', createProductData.data.name);
        
        // Now test stock purchase
        const suppliersResponse = await fetch('http://localhost:3001/api/suppliers', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const suppliersData = await suppliersResponse.json();
        const supplier = suppliersData.data[0];
        
        const stockPurchaseData = {
          supplierId: supplier._id,
          items: [{
            product: createProductData.data._id,
            quantity: 100,
            purchasePrice: 120,
            unit: 'SFT'
          }],
          paidAmount: 12000,
          paymentMethod: 'cash',
          notes: 'Test stock purchase with new product'
        };

        const response = await fetch('http://localhost:3001/api/stock-purchases', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(stockPurchaseData)
        });

        const data = await response.json();
        
        if (data.success) {
          console.log('✅ Stock purchase created successfully!');
          console.log('   - Purchase No:', data.data.stockPurchase.purchaseNo);
          console.log('   - Grand Total:', data.data.stockPurchase.grandTotal);
        } else {
          console.log('❌ Stock purchase failed:', data.message);
        }
      } else {
        console.log('❌ Failed to create product:', createProductData.message);
      }
    }

    console.log('\n🎉 Test completed!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testSimpleStockPurchase();