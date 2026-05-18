# Invoice Accuracy and Trust Manual Testing Checklist

## Overview
This checklist ensures comprehensive manual testing of invoice accuracy and business trust scenarios. Each test case should be performed in the actual application to verify real-world functionality.

---

## 🧾 Cash Invoice Testing

### Test Case 1.1: Basic Cash Invoice Creation
**Objective**: Verify cash invoices require full payment and calculate correctly

**Steps**:
1. Navigate to Create Invoice page
2. Select customer: "Test Customer"
3. Add items:
   - Glass Panel: 10 sqft @ ৳150/sqft
   - Thai Panel: 5 pieces @ ৳200/piece
4. Apply discount: ৳100
5. Select payment method: "Cash"
6. Enter paid amount: ৳2400 (full amount)
7. Click "Create Invoice"

**Expected Results**:
- ✅ Subtotal: ৳2500 (10×150 + 5×200)
- ✅ Discount: ৳100
- ✅ Grand Total: ৳2400
- ✅ Paid Amount: ৳2400
- ✅ Due Amount: ৳0
- ✅ Status: "Paid"
- ✅ Invoice created successfully

**Verification Points**:
- [ ] Calculations are mathematically correct
- [ ] Status shows "Paid"
- [ ] No due amount remaining
- [ ] Invoice number follows format PREFIX-YYYYMM-XXXX

### Test Case 1.2: Cash Invoice Partial Payment Prevention
**Objective**: Verify cash invoices cannot be created with partial payment

**Steps**:
1. Navigate to Create Invoice page
2. Add item: Glass Panel: 10 sqft @ ৳150/sqft
3. Select payment method: "Cash"
4. Enter paid amount: ৳1000 (less than ৳1500 total)
5. Attempt to create invoice

**Expected Results**:
- ❌ Error message: "Cash invoice must be fully paid"
- ❌ Invoice creation blocked
- ✅ User prompted to pay full amount or change payment method

**Verification Points**:
- [ ] Error message displayed clearly
- [ ] Invoice not created in system
- [ ] User can correct payment amount

### Test Case 1.3: Cash Invoice with Multiple Items
**Objective**: Verify complex cash invoices with multiple items

**Steps**:
1. Create invoice with 5+ different items
2. Apply various discounts
3. Use cash payment method
4. Pay exact total amount

**Expected Results**:
- ✅ All item calculations correct
- ✅ Discount applied properly
- ✅ Total matches calculator
- ✅ Status: "Paid"

**Verification Points**:
- [ ] Each item total calculated correctly
- [ ] Subtotal matches sum of item totals
- [ ] Discount applied to subtotal
- [ ] Grand total = subtotal - discount

---

## 💰 Partial Payment Invoice Testing

### Test Case 2.1: Basic Partial Payment Invoice
**Objective**: Verify partial payment invoices calculate status correctly

**Steps**:
1. Create invoice: Glass Panel 20 sqft @ ৳150/sqft
2. Apply discount: ৳200
3. Select payment method: "Credit"
4. Enter paid amount: ৳1500
5. Create invoice

**Expected Results**:
- ✅ Subtotal: ৳3000
- ✅ Grand Total: ৳2800
- ✅ Paid Amount: ৳1500
- ✅ Due Amount: ৳1300
- ✅ Status: "Partial"

**Verification Points**:
- [ ] Status correctly shows "Partial"
- [ ] Due amount = Grand total - Paid amount
- [ ] Customer due balance updated

### Test Case 2.2: Payment Amount Validation
**Objective**: Verify payment amount limits are enforced

**Steps**:
1. Create invoice with ৳1500 total
2. Test negative payment amount: -৳100
3. Test overpayment: ৳2000
4. Test valid partial payment: ৳1000

**Expected Results**:
- ❌ Negative payment rejected
- ❌ Overpayment rejected
- ✅ Valid partial payment accepted

**Verification Points**:
- [ ] Negative amounts blocked with error message
- [ ] Overpayments blocked with error message
- [ ] Valid amounts processed correctly

### Test Case 2.3: Zero Payment (Due Invoice)
**Objective**: Verify invoices with zero payment

**Steps**:
1. Create invoice with ৳2000 total
2. Enter paid amount: ৳0
3. Create invoice

**Expected Results**:
- ✅ Paid Amount: ৳0
- ✅ Due Amount: ৳2000
- ✅ Status: "Due"

**Verification Points**:
- [ ] Status correctly shows "Due"
- [ ] Full amount shows as due
- [ ] Customer balance updated

---

## 📊 Due Invoice Credit Limit Testing

### Test Case 3.1: Credit Limit Enforcement
**Objective**: Verify due invoices respect customer credit limits

**Steps**:
1. Set customer credit limit: ৳50,000
2. Create existing due invoices totaling ৳30,000
3. Attempt to create new due invoice for ৳25,000
4. Verify credit limit exceeded error

**Expected Results**:
- ❌ Error: "Credit limit exceeded"
- ❌ Invoice creation blocked
- ✅ Clear message showing limits and amounts

**Verification Points**:
- [ ] Credit limit calculation correct
- [ ] Error message shows all relevant amounts
- [ ] Invoice not created when limit exceeded

### Test Case 3.2: Credit Limit Within Bounds
**Objective**: Verify invoices within credit limit are allowed

**Steps**:
1. Customer credit limit: ৳50,000
2. Existing due: ৳20,000
3. Create new due invoice: ৳15,000
4. Verify invoice created successfully

**Expected Results**:
- ✅ Invoice created successfully
- ✅ Customer due updated to ৳35,000
- ✅ Still within ৳50,000 limit

**Verification Points**:
- [ ] Invoice created without errors
- [ ] Customer balance updated correctly
- [ ] Credit utilization calculated properly

### Test Case 3.3: Owner Override (if implemented)
**Objective**: Test owner override for credit limit

**Steps**:
1. Login as owner
2. Attempt to create invoice exceeding credit limit
3. Use override option (if available)
4. Verify invoice created with warning

**Expected Results**:
- ⚠️ Warning about credit limit exceeded
- ✅ Owner can override with justification
- ✅ Override logged in audit trail

**Verification Points**:
- [ ] Override option available to owner only
- [ ] Override requires justification
- [ ] Audit trail records override

---

## 🔄 Booking to Final Invoice Conversion Testing

### Test Case 4.1: Basic Booking Conversion
**Objective**: Verify booking invoices convert to final invoices accurately

**Steps**:
1. Create booking invoice:
   - Items: Glass Panel 8 sqft @ ৳150/sqft
   - Total: ৳1200
   - Advance payment: ৳400
   - Status: "Partial"
2. Convert to final invoice:
   - Items: Glass Panel 10 sqft @ ৳150/sqft (different quantity)
   - Discount: ৳50
   - Additional payment: ৳800
3. Verify final invoice calculations

**Expected Results**:
- ✅ Final subtotal: ৳1500 (10×150)
- ✅ Final grand total: ৳1450 (1500-50)
- ✅ Advance amount: ৳400
- ✅ Total paid: ৳1200 (400+800)
- ✅ Due amount: ৳250 (1450-1200)
- ✅ Status: "Partial"
- ✅ Booking status: "Converted"

**Verification Points**:
- [ ] Advance amount carried forward correctly
- [ ] Final calculations include advance
- [ ] Booking invoice marked as converted
- [ ] Final invoice references booking

### Test Case 4.2: Full Payment on Conversion
**Objective**: Test conversion with full payment

**Steps**:
1. Create booking with ৳500 advance
2. Convert to final invoice with ৳1000 total
3. Pay remaining ৳500 on conversion

**Expected Results**:
- ✅ Final status: "Paid"
- ✅ Due amount: ৳0
- ✅ Total paid equals grand total

**Verification Points**:
- [ ] Status correctly shows "Paid"
- [ ] No remaining due amount
- [ ] Payment history shows both transactions

### Test Case 4.3: Prevent Double Conversion
**Objective**: Verify booking invoices cannot be converted twice

**Steps**:
1. Create and convert a booking invoice
2. Attempt to convert the same booking again
3. Verify error message

**Expected Results**:
- ❌ Error: "Booking invoice already converted"
- ❌ Conversion blocked
- ✅ Reference to existing final invoice

**Verification Points**:
- [ ] Double conversion prevented
- [ ] Clear error message
- [ ] Link to existing final invoice shown

---

## 🔒 Invoice Edit Lock Testing

### Test Case 5.1: Paid Invoice Edit Prevention
**Objective**: Verify paid invoices cannot be edited

**Steps**:
1. Create and fully pay an invoice
2. Attempt to edit invoice items
3. Attempt to edit customer details
4. Attempt to edit amounts

**Expected Results**:
- ❌ All edit attempts blocked
- ❌ Error: "Cannot edit paid invoice"
- ✅ Data integrity maintained

**Verification Points**:
- [ ] Edit buttons disabled/hidden for paid invoices
- [ ] Error message clear and informative
- [ ] No fields editable on paid invoices

### Test Case 5.2: Partial Payment Edit Restrictions
**Objective**: Verify partial payment invoices have limited editing

**Steps**:
1. Create invoice with partial payment
2. Attempt to edit items (should be blocked)
3. Attempt to edit customer details (may be allowed)
4. Attempt to add additional payment (should be allowed)

**Expected Results**:
- ❌ Item editing blocked
- ❌ Error: "Cannot edit items after payment received"
- ✅ Customer details may be editable
- ✅ Additional payments allowed

**Verification Points**:
- [ ] Item editing specifically blocked
- [ ] Payment addition still possible
- [ ] Clear distinction between editable/non-editable fields

### Test Case 5.3: Due Invoice Full Editing
**Objective**: Verify due invoices can be fully edited

**Steps**:
1. Create due invoice (no payment)
2. Edit items, quantities, prices
3. Edit customer details
4. Edit discount amounts
5. Save changes

**Expected Results**:
- ✅ All edits allowed
- ✅ Calculations updated correctly
- ✅ Changes saved successfully

**Verification Points**:
- [ ] All fields editable
- [ ] Calculations recalculated on changes
- [ ] Edit history tracked (if implemented)

---

## 🔄 Invoice Return Testing

### Test Case 6.1: Full Invoice Return
**Objective**: Verify complete invoice returns restore stock and adjust profit

**Steps**:
1. Create and pay invoice: Glass Panel 10 sqft @ ৳150/sqft
2. Note original stock levels
3. Process full return of invoice
4. Verify stock restoration
5. Verify refund calculation

**Expected Results**:
- ✅ Stock restored: +10 sqft
- ✅ Return amount: ৳1500
- ✅ Refund amount: ৳1500
- ✅ Invoice status: "Returned"
- ✅ Profit adjustment: -৳1500

**Verification Points**:
- [ ] Stock quantities increased correctly
- [ ] Refund amount calculated properly
- [ ] Invoice marked as returned
- [ ] Profit reports reflect adjustment

### Test Case 6.2: Partial Invoice Return
**Objective**: Verify partial returns work correctly

**Steps**:
1. Create paid invoice: Glass Panel 12 sqft @ ৳150/sqft
2. Return 7 sqft (partial return)
3. Verify calculations and stock

**Expected Results**:
- ✅ Stock restored: +7 sqft
- ✅ Return amount: ৳1050 (7×150)
- ✅ Refund amount: ৳1050
- ✅ Remaining sold: 5 sqft

**Verification Points**:
- [ ] Partial stock restoration correct
- [ ] Return amount calculated for returned quantity only
- [ ] Original invoice shows partial return

### Test Case 6.3: Over-Return Prevention
**Objective**: Verify cannot return more than originally sold

**Steps**:
1. Create invoice with 8 sqft sold
2. Attempt to return 12 sqft
3. Verify error and prevention

**Expected Results**:
- ❌ Error: "Cannot return more than originally sold: 8"
- ❌ Return blocked
- ✅ Original quantities preserved

**Verification Points**:
- [ ] Over-return prevented
- [ ] Clear error message with quantities
- [ ] No stock or financial changes made

---

## 🔢 Invoice Number Format Testing

### Test Case 7.1: Invoice Number Generation
**Objective**: Verify invoice numbers follow correct format

**Steps**:
1. Create multiple invoices of different types
2. Check invoice number formats
3. Verify uniqueness

**Expected Results**:
- ✅ Format: PREFIX-YYYYMM-XXXX
- ✅ Examples: INV-202401-0001, BOOK-202401-0002
- ✅ All numbers unique
- ✅ Sequential numbering

**Verification Points**:
- [ ] Prefix matches invoice type
- [ ] Year and month current
- [ ] Sequence numbers increment
- [ ] No duplicate numbers

### Test Case 7.2: Invoice Number Validation
**Objective**: Test invoice number format validation

**Steps**:
1. Attempt to manually enter invalid formats
2. Test system validation
3. Verify error messages

**Expected Results**:
- ❌ Invalid formats rejected
- ✅ Clear validation messages
- ✅ Correct format examples shown

**Verification Points**:
- [ ] Format validation working
- [ ] Helpful error messages
- [ ] Format examples provided

---

## 🧮 Calculator Totals Verification Testing

### Test Case 8.1: Complex Calculation Verification
**Objective**: Verify invoice totals match calculator exactly

**Steps**:
1. Create invoice with decimal quantities:
   - Item 1: 10.5 sqft @ ৳150.75/sqft
   - Item 2: 5 pieces @ ৳200.00/piece
   - Item 3: 2.25 sqft @ ৳100.50/sqft
2. Apply discount: ৳100
3. Verify all calculations manually

**Expected Results**:
- ✅ Item 1 total: ৳1582.88 (10.5×150.75)
- ✅ Item 2 total: ৳1000.00 (5×200)
- ✅ Item 3 total: ৳226.13 (2.25×100.50)
- ✅ Subtotal: ৳2809.01
- ✅ Grand total: ৳2709.01 (2809.01-100)

**Verification Points**:
- [ ] Each item calculation correct
- [ ] Decimal handling accurate
- [ ] Rounding consistent
- [ ] Final totals match manual calculation

### Test Case 8.2: Edge Case Calculations
**Objective**: Test calculation edge cases

**Steps**:
1. Test very small quantities (0.01)
2. Test very large amounts (৳999,999.99)
3. Test zero quantities (should be prevented)
4. Test negative prices (should be prevented)

**Expected Results**:
- ✅ Small quantities handled correctly
- ✅ Large amounts calculated properly
- ❌ Zero quantities prevented
- ❌ Negative prices prevented

**Verification Points**:
- [ ] Precision maintained for small numbers
- [ ] Large numbers don't overflow
- [ ] Invalid inputs rejected
- [ ] Error messages clear

### Test Case 8.3: Discount Calculation Verification
**Objective**: Verify discount calculations are accurate

**Steps**:
1. Test percentage discounts
2. Test fixed amount discounts
3. Test discount limits (cannot exceed subtotal)
4. Test zero discounts

**Expected Results**:
- ✅ Percentage discounts calculated correctly
- ✅ Fixed discounts applied properly
- ❌ Excessive discounts prevented
- ✅ Zero discounts handled

**Verification Points**:
- [ ] Discount types work correctly
- [ ] Discount limits enforced
- [ ] Grand total = subtotal - discount

---

## 🖨️ Print View Data Accuracy Testing

### Test Case 9.1: Print Data Integrity
**Objective**: Verify print view matches invoice data exactly

**Steps**:
1. Create complex invoice with multiple items
2. Generate print preview
3. Compare all data points
4. Verify formatting

**Expected Results**:
- ✅ All data matches exactly
- ✅ Currency formatting correct (৳X.XX)
- ✅ Date formatting proper
- ✅ Status formatting consistent

**Verification Points**:
- [ ] Invoice number matches
- [ ] Customer details correct
- [ ] All item details accurate
- [ ] Totals match exactly
- [ ] Status and payment info correct

### Test Case 9.2: Print Formatting Verification
**Objective**: Verify print formatting is consistent and readable

**Steps**:
1. Print invoices with different statuses
2. Print invoices with/without discounts
3. Print invoices with long customer names
4. Print invoices with many items

**Expected Results**:
- ✅ Consistent formatting across all types
- ✅ Proper alignment and spacing
- ✅ No data truncation
- ✅ Professional appearance

**Verification Points**:
- [ ] Layout consistent
- [ ] Text not cut off
- [ ] Numbers aligned properly
- [ ] Professional presentation

### Test Case 9.3: Print Data Validation
**Objective**: Verify print data validation catches errors

**Steps**:
1. Test printing with corrupted data
2. Test printing with missing fields
3. Test printing with invalid amounts

**Expected Results**:
- ❌ Corrupted data rejected
- ❌ Missing fields flagged
- ❌ Invalid amounts prevented

**Verification Points**:
- [ ] Data validation working
- [ ] Error messages helpful
- [ ] Print blocked for invalid data

---

## 📋 Summary Checklist

### Overall System Verification
- [ ] All cash invoices require full payment
- [ ] Partial payment calculations are accurate
- [ ] Due invoices respect credit limits
- [ ] Booking conversions handle advances correctly
- [ ] Paid invoices are locked from editing
- [ ] Returns restore stock and adjust profit
- [ ] Invoice numbers follow correct format
- [ ] Calculator totals are mathematically accurate
- [ ] Print view data matches invoice data exactly

### Business Trust Verification
- [ ] No calculation errors detected
- [ ] No data integrity issues found
- [ ] All business rules enforced
- [ ] Audit trails maintained
- [ ] Error handling comprehensive
- [ ] User experience intuitive

### Performance and Reliability
- [ ] System responds quickly to all operations
- [ ] No crashes or errors during testing
- [ ] Data persists correctly
- [ ] Concurrent operations handled properly

---

## 🎯 Testing Notes

**Test Environment**: Production/Staging
**Tester**: ________________
**Date**: ________________
**Browser/Device**: ________________

**Overall Assessment**:
- [ ] All critical tests passed
- [ ] Invoice accuracy guaranteed
- [ ] Business trust maintained
- [ ] System ready for production use

**Issues Found**: ________________
**Recommendations**: ________________

---

**Completion Status**: ___/100 test cases passed

✅ **INVOICE ACCURACY AND TRUST VERIFIED** when all test cases pass.