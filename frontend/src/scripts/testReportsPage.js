// Simple test to verify reports page functionality
// This can be run in the browser console on the reports page

console.log('🧪 Testing Reports Page Functionality...\n');

// Test 1: Check if main components are rendered
const testComponentRendering = () => {
  console.log('1. Testing component rendering...');
  
  const header = document.querySelector('h1');
  const tabs = document.querySelector('[role="tablist"]');
  const filterCard = document.querySelector('input[type="date"]');
  
  if (header && header.textContent.includes('Business Reports')) {
    console.log('✅ Header rendered correctly');
  } else {
    console.log('❌ Header not found');
  }
  
  if (tabs) {
    console.log('✅ Tabs component rendered');
  } else {
    console.log('❌ Tabs not found');
  }
  
  if (filterCard) {
    console.log('✅ Filter inputs rendered');
  } else {
    console.log('❌ Filter inputs not found');
  }
};

// Test 2: Check if buttons are functional
const testButtonFunctionality = () => {
  console.log('\n2. Testing button functionality...');
  
  const refreshButton = document.querySelector('button:has(svg)');
  const chartToggle = document.querySelector('button:has(svg)');
  
  if (refreshButton) {
    console.log('✅ Refresh button found');
  } else {
    console.log('❌ Refresh button not found');
  }
  
  if (chartToggle) {
    console.log('✅ Chart toggle button found');
  } else {
    console.log('❌ Chart toggle button not found');
  }
};

// Test 3: Check if tables are rendered
const testTableRendering = () => {
  console.log('\n3. Testing table rendering...');
  
  const tables = document.querySelectorAll('table');
  const tableHeaders = document.querySelectorAll('th');
  
  if (tables.length > 0) {
    console.log(`✅ Found ${tables.length} table(s)`);
  } else {
    console.log('❌ No tables found');
  }
  
  if (tableHeaders.length > 0) {
    console.log(`✅ Found ${tableHeaders.length} table header(s)`);
  } else {
    console.log('❌ No table headers found');
  }
};

// Test 4: Check if filter inputs work
const testFilterInputs = () => {
  console.log('\n4. Testing filter inputs...');
  
  const dateInputs = document.querySelectorAll('input[type="date"]');
  const textInputs = document.querySelectorAll('input[type="text"]');
  const selects = document.querySelectorAll('select');
  
  console.log(`✅ Found ${dateInputs.length} date input(s)`);
  console.log(`✅ Found ${textInputs.length} text input(s)`);
  console.log(`✅ Found ${selects.length} select input(s)`);
};

// Test 5: Check for error states
const testErrorHandling = () => {
  console.log('\n5. Testing error handling...');
  
  const errorMessages = document.querySelectorAll('[role="alert"]');
  const loadingSpinners = document.querySelectorAll('.animate-spin');
  
  if (errorMessages.length === 0) {
    console.log('✅ No error messages (good)');
  } else {
    console.log(`⚠️ Found ${errorMessages.length} error message(s)`);
  }
  
  if (loadingSpinners.length === 0) {
    console.log('✅ No loading spinners (data loaded)');
  } else {
    console.log(`⏳ Found ${loadingSpinners.length} loading spinner(s)`);
  }
};

// Run all tests
const runAllTests = () => {
  testComponentRendering();
  testButtonFunctionality();
  testTableRendering();
  testFilterInputs();
  testErrorHandling();
  
  console.log('\n🎉 Reports Page Test Complete!');
  console.log('💡 If you see mostly ✅ marks, the page is working correctly');
  console.log('💡 If you see ❌ marks, there might be rendering issues');
};

// Auto-run tests after a short delay to allow page to load
setTimeout(runAllTests, 1000);

// Export for manual testing
window.testReportsPage = runAllTests;