# Stock Disaster Prevention Manual Testing Checklist

## 🎯 Objective
Prevent stock-related business disasters through comprehensive inventory management validation.

## 📋 Pre-Testing Setup
- [ ] Backend server running on localhost:3001
- [ ] Frontend server running on localhost:3000
- [ ] Database seeded with test products (various stock levels)
- [ ] Test user accounts with different permission levels
- [ ] Calculator and invoice systems configured

## 🔄 Test Scenario 1: Stock Decreases After Invoice Creation

### Test Case 1.1: Basic Invoice Stock Reduction
**Setup:**
- [ ] Product: "Test Glass Panel" with 100 pieces in stock
- [ ] Customer: "Test Customer" with sufficient credit limit

**Test Steps:**
1. [ ] Navigate to Create Invoice page
2. [ ] Select customer: "Test Customer"
3. [ ] Add item: "Test Glass Panel", Quantity: 25 pieces
4. [ ] Complete invoice creation
5. [ ] Navigate to Inventory page
6. [ ] Check stock level for "Test Glass Panel"

**Expected Results:**
- [ ] Invoice created successfully
- [ ] Stock reduced from 100 to 75 pieces
- [ ] Stock change logged in system
- [ ] **Actual Stock After Invoice**: _____ pieces
- [ ] **Status**: ✅ Pass / ❌ Fail

### Test Case 1.2: Multiple Items Invoice
**Test Steps:**
1. [ ] Create invoice with multiple items:
   - Item 1: "Glass Panel A" - 10 pieces
   - Item 2: "Glass Panel B" - 15 pieces
   - Item 3: "Thai Panel C" - 8 pieces
2. [ ] Complete invoice creation
3. [ ] Check stock levels for all items

**Expected Results:**
- [ ] All item stocks decreased correctly
- [ ] Glass Panel A: _____ → _____ pieces
- [ ] Glass Panel B: _____ → _____ pieces  
- [ ] Thai Panel C: _____ → _____ pieces
- [ ] **Status**: ✅ Pass / ❌ Fail

### Test Case 1.3: Decimal Quantity Stock Reduction
**Setup:**
- [ ] Product with unit "sqft" and stock 50.75 sqft

**Test Steps:**
1. [ ] Create invoice with 12.25 sqft
2. [ ] Check stock after invoice creation

**Expected Results:**
- [ ] Stock reduced to 38.50 sqft (50.75 - 12.25)
- [ ] **Actual Stock**: _____ sqft
- [ ] **Status**: ✅ Pass / ❌ Fail

## 🔄 Test Scenario 2: Stock Restores After Return/Cancellation

### Test Case 2.1: Complete Invoice Cancellation
**Setup:**
- [ ] Create invoice with 20 pieces of "Test Product"
- [ ] Verify stock decreased to expected level

**Test Steps:**
1. [ ] Navigate to Invoice List
2. [ ] Find the created invoice
3. [ ] Click "Cancel Invoice" or similar action
4. [ ] Provide cancellation reason: "Customer requested cancellation"
5. [ ] Confirm cancellation
6. [ ] Check product stock level

**Expected Results:**
- [ ] Invoice status changed to "Cancelled"
- [ ] Stock restored to original level
- [ ] Cancellation reason recorded
- [ ] **Stock Before Cancellation**: _____ pieces
- [ ] **Stock After Cancellation**: _____ pieces
- [ ] **Status**: ✅ Pass / ❌ Fail

### Test Case 2.2: Partial Return Processing
**Setup:**
- [ ] Invoice with 30 pieces sold
- [ ] Customer wants to return 12 pieces

**Test Steps:**
1. [ ] Navigate to Returns/Refunds section
2. [ ] Select the invoice
3. [ ] Process partial return:
   - Return quantity: 12 pieces
   - Return reason: "Customer ordered excess quantity"
4. [ ] Complete return process
5. [ ] Check stock level

**Expected Results:**
- [ ] Stock increased by 12 pieces
- [ ] Return documented with reason
- [ ] Invoice status updated (if applicable)
- [ ] **Stock After Return**: _____ pieces
- [ ] **Status**: ✅ Pass / ❌ Fail

### Test Case 2.3: Prevent Over-Return
**Test Steps:**
1. [ ] Try to return more items than originally sold
2. [ ] Attempt to return 35 pieces from 30-piece invoice

**Expected Results:**
- [ ] System prevents over-return
- [ ] Error message displayed: "Cannot return more than originally sold"
- [ ] Stock remains unchanged
- [ ] **Error Message**: _________________________________
- [ ] **Status**: ✅ Pass / ❌ Fail

## 🚫 Test Scenario 3: Cannot Sell More Than Available Stock

### Test Case 3.1: Insufficient Stock Prevention
**Setup:**
- [ ] Product with 15 pieces in stock

**Test Steps:**
1. [ ] Try to create invoice with 20 pieces
2. [ ] Attempt to save invoice

**Expected Results:**
- [ ] Invoice creation blocked
- [ ] Clear error message displayed
- [ ] Available stock quantity shown
- [ ] **Error Message**: _________________________________
- [ ] **Available Stock Shown**: _____ pieces
- [ ] **Status**: ✅ Pass / ❌ Fail

### Test Case 3.2: Exact Stock Sale
**Setup:**
- [ ] Product with exactly 25 pieces in stock

**Test Steps:**
1. [ ] Create invoice for exactly 25 pieces
2. [ ] Complete invoice creation
3. [ ] Check final stock level

**Expected Results:**
- [ ] Invoice created successfully
- [ ] Stock reduced to exactly 0
- [ ] Product shows "Out of Stock" status
- [ ] **Final Stock**: _____ pieces
- [ ] **Stock Status**: _________________
- [ ] **Status**: ✅ Pass / ❌ Fail

### Test Case 3.3: Multiple Items Stock Validation
**Setup:**
- [ ] Product A: 10 pieces available
- [ ] Product B: 5 pieces available
- [ ] Product C: 20 pieces available

**Test Steps:**
1. [ ] Try to create invoice with:
   - Product A: 8 pieces ✓
   - Product B: 7 pieces ✗ (exceeds available)
   - Product C: 15 pieces ✓
2. [ ] Attempt to save invoice

**Expected Results:**
- [ ] Invoice creation blocked
- [ ] Specific error for Product B shown
- [ ] Other items validation status clear
- [ ] **Error Details**: _________________________________
- [ ] **Status**: ✅ Pass / ❌ Fail

### Test Case 3.4: Concurrent Stock Check
**Setup:**
- [ ] Product with 30 pieces in stock
- [ ] Two users attempting simultaneous orders

**Test Steps:**
1. [ ] User 1: Start creating invoice for 20 pieces
2. [ ] User 2: Start creating invoice for 15 pieces
3. [ ] User 1: Complete invoice first
4. [ ] User 2: Try to complete invoice

**Expected Results:**
- [ ] User 1 invoice succeeds (stock: 30 → 10)
- [ ] User 2 invoice fails (insufficient stock: 15 > 10)
- [ ] Proper error message for User 2
- [ ] **Final Stock**: _____ pieces
- [ ] **Status**: ✅ Pass / ❌ Fail

### Test Case 3.5: Detailed Stock Error Information
**Test Steps:**
1. [ ] Try to sell 50 pieces when only 35 available
2. [ ] Review error message details

**Expected Results:**
- [ ] Product name clearly shown
- [ ] Available quantity displayed
- [ ] Requested quantity displayed
- [ ] Shortage amount calculated
- [ ] Stock status indicated (Low Stock/In Stock)
- [ ] **Error Message Contains**:
  - [ ] Product name
  - [ ] Available: 35 pieces
  - [ ] Requested: 50 pieces
  - [ ] Shortage: 15 pieces
- [ ] **Status**: ✅ Pass / ❌ Fail

## 📝 Test Scenario 4: Manual Stock Adjustment Requires Reason

### Test Case 4.1: Reason Requirement Validation
**Test Steps:**
1. [ ] Navigate to Inventory Management
2. [ ] Select a product for stock adjustment
3. [ ] Try to update stock without providing reason
4. [ ] Try to update stock with very short reason ("Fix")
5. [ ] Update stock with proper reason

**Expected Results:**
- [ ] Empty reason rejected with error
- [ ] Short reason rejected (< 10 characters)
- [ ] Proper reason accepted
- [ ] **Error for Empty Reason**: _________________________________
- [ ] **Error for Short Reason**: _________________________________
- [ ] **Status**: ✅ Pass / ❌ Fail

### Test Case 4.2: Stock Adjustment Logging
**Test Steps:**
1. [ ] Perform manual stock adjustment:
   - Product: "Test Glass Panel"
   - From: 50 pieces
   - To: 75 pieces
   - Reason: "Physical inventory count revealed additional stock in warehouse"
2. [ ] Check adjustment history/logs

**Expected Results:**
- [ ] Adjustment logged with all details
- [ ] Previous quantity recorded
- [ ] New quantity recorded
- [ ] Reason stored
- [ ] User who made adjustment recorded
- [ ] Timestamp recorded
- [ ] **Log Entry Contains**:
  - [ ] Previous: 50 pieces
  - [ ] New: 75 pieces
  - [ ] Change: +25 pieces
  - [ ] Reason: Full reason text
  - [ ] User: Current user name
  - [ ] Date/Time: Current timestamp
- [ ] **Status**: ✅ Pass / ❌ Fail

### Test Case 4.3: Large Adjustment Validation
**Test Steps:**
1. [ ] Try to adjust stock from 50 to 200 pieces (300% increase)
2. [ ] Use reason: "Added more stock"
3. [ ] Try again with reason: "Annual physical count revealed additional inventory"

**Expected Results:**
- [ ] First attempt rejected (insufficient reason for large change)
- [ ] Second attempt accepted (proper reason for large change)
- [ ] **First Attempt Error**: _________________________________
- [ ] **Second Attempt Result**: ✅ Success / ❌ Fail
- [ ] **Status**: ✅ Pass / ❌ Fail

### Test Case 4.4: Negative Stock Prevention
**Test Steps:**
1. [ ] Try to set stock to negative value (-5)
2. [ ] Try to set stock to unreasonably large value (999,999)

**Expected Results:**
- [ ] Negative stock rejected
- [ ] Unreasonably large stock rejected
- [ ] **Negative Stock Error**: _________________________________
- [ ] **Large Stock Error**: _________________________________
- [ ] **Status**: ✅ Pass / ❌ Fail

### Test Case 4.5: Permission-Based Stock Adjustments
**Setup:**
- [ ] Login as user with limited permissions (Accountant role)

**Test Steps:**
1. [ ] Try to access stock adjustment feature
2. [ ] Try to modify stock quantities

**Expected Results:**
- [ ] Access denied or feature unavailable
- [ ] Clear permission error message
- [ ] **Permission Error**: _________________________________
- [ ] **Status**: ✅ Pass / ❌ Fail

## 🗑️ Test Scenario 5: Soft-Deleted Products Not Sellable

### Test Case 5.1: Soft Delete Product Protection
**Test Steps:**
1. [ ] Navigate to Product Management
2. [ ] Soft delete a product with stock
3. [ ] Try to create invoice with deleted product
4. [ ] Check product availability in product selection

**Expected Results:**
- [ ] Deleted product not available in product selection
- [ ] Cannot add deleted product to invoice
- [ ] Clear indication product is deleted
- [ ] **Product Selection Shows**: Deleted product absent ✅ / Present ❌
- [ ] **Status**: ✅ Pass / ❌ Fail

### Test Case 5.2: Inactive Product Protection
**Test Steps:**
1. [ ] Set a product as inactive (not deleted)
2. [ ] Try to create invoice with inactive product

**Expected Results:**
- [ ] Inactive product not available for sale
- [ ] Error message if somehow selected
- [ ] **Error Message**: _________________________________
- [ ] **Status**: ✅ Pass / ❌ Fail

### Test Case 5.3: Product Restoration
**Test Steps:**
1. [ ] Soft delete a product
2. [ ] Restore the product
3. [ ] Try to create invoice with restored product

**Expected Results:**
- [ ] Restored product available for sale
- [ ] Normal invoice creation works
- [ ] Stock management functions normally
- [ ] **Invoice Creation**: ✅ Success / ❌ Fail
- [ ] **Status**: ✅ Pass / ❌ Fail

### Test Case 5.4: Deleted Product in Existing Invoices
**Setup:**
- [ ] Create invoice with product
- [ ] Soft delete the product after invoice creation

**Test Steps:**
1. [ ] View existing invoice with deleted product
2. [ ] Check invoice details and history

**Expected Results:**
- [ ] Existing invoice still shows product details
- [ ] Historical data preserved
- [ ] Product marked as deleted in current context
- [ ] **Invoice Shows**: Product details preserved ✅ / Missing ❌
- [ ] **Status**: ✅ Pass / ❌ Fail

## 📊 Test Scenario 6: Stock Alerts and Monitoring

### Test Case 6.1: Low Stock Alerts
**Setup:**
- [ ] Set products with various stock levels:
  - Product A: 0 pieces (Out of stock)
  - Product B: 5 pieces (Low stock)
  - Product C: 50 pieces (Normal stock)

**Test Steps:**
1. [ ] Navigate to Dashboard or Inventory Alerts
2. [ ] Check stock alert notifications

**Expected Results:**
- [ ] Critical alert for Product A (out of stock)
- [ ] Warning alert for Product B (low stock)
- [ ] No alert for Product C (normal stock)
- [ ] **Critical Alerts Count**: _____
- [ ] **Warning Alerts Count**: _____
- [ ] **Status**: ✅ Pass / ❌ Fail

### Test Case 6.2: Stock Movement History
**Test Steps:**
1. [ ] Select a product with recent stock changes
2. [ ] View stock movement history
3. [ ] Check history details

**Expected Results:**
- [ ] All stock movements logged
- [ ] Invoice-related decreases shown
- [ ] Manual adjustments shown
- [ ] Returns/cancellations shown
- [ ] **History Entries**: _____ movements
- [ ] **Status**: ✅ Pass / ❌ Fail

## 🔍 Edge Cases and Error Scenarios

### Test Case EC.1: Zero Stock Scenarios
**Test Steps:**
1. [ ] Try to sell from product with 0 stock
2. [ ] Check error handling

**Expected Results:**
- [ ] Clear "Out of Stock" error message
- [ ] Cannot proceed with invoice creation
- [ ] **Error Message**: _________________________________
- [ ] **Status**: ✅ Pass / ❌ Fail

### Test Case EC.2: Fractional Stock Handling
**Setup:**
- [ ] Product with unit "sqft" and stock 15.75 sqft

**Test Steps:**
1. [ ] Sell 8.25 sqft
2. [ ] Check remaining stock precision

**Expected Results:**
- [ ] Remaining stock: 7.50 sqft (exact calculation)
- [ ] No rounding errors
- [ ] **Remaining Stock**: _____ sqft
- [ ] **Status**: ✅ Pass / ❌ Fail

### Test Case EC.3: Bulk Operations Stock Safety
**Test Steps:**
1. [ ] Try bulk stock adjustment on multiple products
2. [ ] Include some invalid adjustments

**Expected Results:**
- [ ] Valid adjustments processed
- [ ] Invalid adjustments rejected
- [ ] Clear error reporting for failures
- [ ] **Bulk Operation Result**: _________________________________
- [ ] **Status**: ✅ Pass / ❌ Fail

## 📈 Performance and Reliability Tests

### Test Case PR.1: High Volume Stock Operations
**Test Steps:**
1. [ ] Create invoice with 20+ different products
2. [ ] Process invoice creation
3. [ ] Monitor system performance

**Expected Results:**
- [ ] All stock updates processed correctly
- [ ] Reasonable response time (< 5 seconds)
- [ ] No stock inconsistencies
- [ ] **Processing Time**: _____ seconds
- [ ] **Status**: ✅ Pass / ❌ Fail

### Test Case PR.2: Database Consistency
**Test Steps:**
1. [ ] Perform multiple stock operations
2. [ ] Check database consistency
3. [ ] Verify no orphaned records

**Expected Results:**
- [ ] All stock levels consistent
- [ ] No data corruption
- [ ] Audit trails complete
- [ ] **Consistency Check**: ✅ Pass / ❌ Fail
- [ ] **Status**: ✅ Pass / ❌ Fail

## 📋 Test Summary

### Overall Results
- **Total Test Cases**: _____ / 30+
- **Passed**: _____
- **Failed**: _____
- **Success Rate**: _____%

### Critical Issues Found
1. ________________________________
2. ________________________________
3. ________________________________

### Stock Disaster Prevention Verification
- [ ] ✅ Stock decreases correctly after invoice creation
- [ ] ✅ Stock restores properly after returns/cancellations
- [ ] ✅ Cannot sell more than available stock
- [ ] ✅ Manual stock adjustments require proper reasons
- [ ] ✅ Soft-deleted products cannot be sold
- [ ] ✅ Stock alerts function properly
- [ ] ✅ Edge cases handled correctly
- [ ] ✅ Performance meets requirements

### Business Impact Assessment
- **Risk Level**: 🟢 Low / 🟡 Medium / 🔴 High
- **Business Continuity**: ✅ Assured / ❌ At Risk
- **Data Integrity**: ✅ Maintained / ❌ Compromised

## ✅ Sign-off

**Tester Name**: ________________________
**Date**: ________________________
**Overall Status**: ✅ Stock disasters prevented / ❌ Issues found

**Notes**: 
_________________________________________________
_________________________________________________
_________________________________________________

---

## 🎯 Success Criteria
- [ ] All stock operations are properly validated
- [ ] Stock levels are accurately maintained
- [ ] Business rules are enforced consistently
- [ ] Error messages are clear and actionable
- [ ] Audit trails are complete and accurate
- [ ] System prevents all identified disaster scenarios
- [ ] Performance is acceptable under normal load
- [ ] Data integrity is maintained throughout

**STOCK DISASTER PREVENTION CONFIRMED**: ✅ Yes / ❌ No