# Expense and Profit Accuracy Manual Testing Checklist

## Objective: Ensure expenses and profit are real and accurate

**Testing Date:** ___________  
**Tester Name:** ___________  
**Environment:** ___________

---

## 1. Salary Payment Added as Expense ✅

### Test Steps:
1. **Navigate to Expense Management**
   - [ ] Go to Finance → Expenses
   - [ ] Click "Add New Expense"

2. **Add Salary Payment**
   - [ ] Select expense type: "Salary"
   - [ ] Enter employee name: "John Doe"
   - [ ] Enter employee ID: "EMP-001"
   - [ ] Enter amount: ৳35,000
   - [ ] Select month: "January"
   - [ ] Select year: "2026"
   - [ ] Select payment method: "Bank Transfer"
   - [ ] Add notes: "Monthly salary payment"
   - [ ] Click "Save Expense"

3. **Verify Salary Expense**
   - [ ] Expense appears in expense list
   - [ ] Amount shows ৳35,000
   - [ ] Type shows "Salary"
   - [ ] Status shows "Paid"
   - [ ] Employee details are correct
   - [ ] Date is recorded correctly

4. **Check Financial Reports**
   - [ ] Go to Reports → Monthly Expenses
   - [ ] Verify salary expense appears in operational category
   - [ ] Total operational expenses include salary amount
   - [ ] Profit calculation deducts salary expense

**Expected Results:**
- ✅ Salary expense recorded correctly
- ✅ Amount and details accurate
- ✅ Appears in financial reports
- ✅ Reduces profit calculations

**Actual Results:** ___________

---

## 2. Salary Cannot Be Double-Paid ✅

### Test Steps:
1. **Attempt First Salary Payment**
   - [ ] Add salary for "Jane Smith" - January 2026 - ৳28,000
   - [ ] Payment should succeed
   - [ ] Record expense ID: ___________

2. **Attempt Duplicate Salary Payment**
   - [ ] Try to add same salary again (Jane Smith - January 2026)
   - [ ] System should prevent duplicate payment
   - [ ] Error message should appear
   - [ ] Previous payment details should be shown

3. **Test Different Month Payment**
   - [ ] Add salary for Jane Smith - February 2026 - ৳28,000
   - [ ] Payment should succeed (different month)
   - [ ] Both January and February payments should exist

4. **Verify Duplicate Prevention**
   - [ ] Check expense list shows only one January payment
   - [ ] February payment exists separately
   - [ ] Total expenses are correct

**Expected Results:**
- ✅ First payment succeeds
- ✅ Duplicate payment blocked with error message
- ✅ Different month payment allowed
- ✅ Financial integrity maintained

**Actual Results:** ___________

---

## 3. Expense Date Filtering ✅

### Test Steps:
1. **Create Test Expenses with Different Dates**
   - [ ] Add expense: Salary - January 15, 2026 - ৳35,000
   - [ ] Add expense: Electricity - January 20, 2026 - ৳5,000
   - [ ] Add expense: Salary - February 15, 2026 - ৳35,000
   - [ ] Add expense: Maintenance - March 10, 2026 - ৳8,000

2. **Filter January 2026 Expenses**
   - [ ] Go to Reports → Expense Report
   - [ ] Set date range: January 1-31, 2026
   - [ ] Apply filter
   - [ ] Verify results show 2 expenses (Salary + Electricity)
   - [ ] Total amount should be ৳40,000

3. **Filter February 2026 Expenses**
   - [ ] Set date range: February 1-28, 2026
   - [ ] Apply filter
   - [ ] Verify results show 1 expense (Salary only)
   - [ ] Total amount should be ৳35,000

4. **Filter Quarter 1 2026 Expenses**
   - [ ] Set date range: January 1 - March 31, 2026
   - [ ] Apply filter
   - [ ] Verify results show all 4 expenses
   - [ ] Total amount should be ৳83,000

5. **Test Category Filtering**
   - [ ] Filter by category: "Operational"
   - [ ] Verify salary and utility expenses appear
   - [ ] Filter by category: "Maintenance"
   - [ ] Verify only maintenance expense appears

**Expected Results:**
- ✅ Date filtering works accurately
- ✅ Correct expenses shown for each period
- ✅ Totals calculated correctly
- ✅ Category filtering works properly

**Actual Results:** ___________

---

## 4. Delivery & Installation Cost Deduction ✅

### Test Steps:
1. **Create Invoice with Service Charges**
   - [ ] Create new invoice for customer
   - [ ] Add product: Glass Panel - 20 sqft @ ৳150/sqft = ৳3,000
   - [ ] Add delivery charge: ৳2,000
   - [ ] Add installation charge: ৳3,000
   - [ ] Total invoice: ৳8,000 (3,000 + 2,000 + 3,000)

2. **Verify Service Cost Tracking**
   - [ ] Check that delivery charge creates expense entry
   - [ ] Check that installation charge creates expense entry
   - [ ] Verify expense category is "Service"
   - [ ] Confirm installer details are recorded

3. **Check Profit Calculation**
   - [ ] Go to Reports → Profit Analysis
   - [ ] Find the invoice in profit report
   - [ ] Verify calculations:
     - Product cost: ৳2,000 (20 × ৳100 purchase price)
     - Product revenue: ৳3,000 (20 × ৳150 selling price)
     - Gross profit: ৳1,000 (3,000 - 2,000)
     - Service revenue: ৳5,000 (2,000 + 3,000)
     - Service costs: ৳5,000 (same as service revenue - they are expenses)
     - Net profit: ৳1,000 (gross profit only, service revenue cancels service costs)

4. **Verify Expense Entries**
   - [ ] Go to Expenses list
   - [ ] Find delivery expense entry (৳2,000)
   - [ ] Find installation expense entry (৳3,000)
   - [ ] Verify both linked to original invoice
   - [ ] Check installer name is recorded

**Expected Results:**
- ✅ Service charges create separate expense entries
- ✅ Profit calculation deducts service costs
- ✅ Net profit reflects only product margin
- ✅ Service revenue and costs cancel out

**Actual Results:** ___________

---

## 5. Supplier Due Update After Purchase ✅

### Test Steps:
1. **Check Initial Supplier Due**
   - [ ] Go to Suppliers → Supplier List
   - [ ] Find "Glass Supplier Ltd"
   - [ ] Note current due amount: ৳___________

2. **Create Purchase with Partial Payment**
   - [ ] Go to Purchases → Add New Purchase
   - [ ] Select supplier: "Glass Supplier Ltd"
   - [ ] Add item: Glass Panel - 50 sqft @ ৳80/sqft = ৳4,000
   - [ ] Enter paid amount: ৳2,000 (partial payment)
   - [ ] Due amount should show: ৳2,000
   - [ ] Save purchase

3. **Verify Supplier Due Update**
   - [ ] Go back to Suppliers → Supplier List
   - [ ] Check "Glass Supplier Ltd" due amount
   - [ ] Due should have increased by ৳2,000
   - [ ] Last purchase date should be updated

4. **Create Purchase with Full Payment**
   - [ ] Create another purchase for same supplier
   - [ ] Add item: Glass Panel - 30 sqft @ ৳90/sqft = ৳2,700
   - [ ] Enter paid amount: ৳2,700 (full payment)
   - [ ] Due amount should show: ৳0
   - [ ] Save purchase

5. **Verify No Due Increase for Full Payment**
   - [ ] Check supplier due amount
   - [ ] Due should remain same (no increase)
   - [ ] Purchase status should show "Paid"

6. **Test Supplier Payment**
   - [ ] Go to Supplier Payments
   - [ ] Make payment against first purchase: ৳1,500
   - [ ] Verify purchase due reduces to ৳500
   - [ ] Verify supplier total due reduces by ৳1,500
   - [ ] Payment history is recorded

**Expected Results:**
- ✅ Partial payment increases supplier due correctly
- ✅ Full payment doesn't increase supplier due
- ✅ Supplier payments reduce due amounts
- ✅ Payment history is maintained

**Actual Results:** ___________

---

## 6. Comprehensive Profit Accuracy Verification ✅

### Test Steps:
1. **Create Complete Business Transaction**
   - [ ] Purchase: 100 sqft glass @ ৳80/sqft = ৳8,000 (paid ৳5,000, due ৳3,000)
   - [ ] Sale: 80 sqft glass @ ৳150/sqft = ৳12,000 + delivery ৳1,500 + installation ৳2,500 = ৳16,000
   - [ ] Pay salary: ৳35,000
   - [ ] Pay utility: ৳5,000

2. **Verify All Expense Tracking**
   - [ ] Purchase cost: ৳6,400 (80 sqft × ৳80) - only sold quantity
   - [ ] Delivery expense: ৳1,500
   - [ ] Installation expense: ৳2,500
   - [ ] Salary expense: ৳35,000
   - [ ] Utility expense: ৳5,000
   - [ ] Total expenses: ৳50,400

3. **Verify Revenue Tracking**
   - [ ] Product revenue: ৳12,000
   - [ ] Service revenue: ৳4,000 (1,500 + 2,500)
   - [ ] Total revenue: ৳16,000

4. **Verify Profit Calculation**
   - [ ] Gross profit: ৳5,600 (12,000 - 6,400)
   - [ ] Service profit: ৳0 (4,000 revenue - 4,000 costs)
   - [ ] Operating expenses: ৳40,000 (35,000 + 5,000)
   - [ ] Net profit: -৳34,400 (5,600 + 0 - 40,000)

5. **Check Financial Reports**
   - [ ] Monthly profit report shows correct calculations
   - [ ] Expense breakdown is accurate
   - [ ] Revenue breakdown is accurate
   - [ ] All transactions are properly categorized

**Expected Results:**
- ✅ All expenses properly tracked and categorized
- ✅ Revenue calculations are accurate
- ✅ Profit calculations reflect real business performance
- ✅ Financial reports show complete picture

**Actual Results:** ___________

---

## Summary Checklist ✅

### Overall System Verification:
- [ ] **Salary Expenses**: Properly recorded and prevent double payments
- [ ] **Date Filtering**: Accurate filtering by date ranges and categories
- [ ] **Service Costs**: Delivery and installation costs properly deducted from profit
- [ ] **Supplier Dues**: Correctly updated after purchases and payments
- [ ] **Profit Accuracy**: All calculations reflect real business performance
- [ ] **Financial Reports**: Complete and accurate reporting

### Business Impact Verification:
- [ ] **Expense Tracking**: All business expenses are captured
- [ ] **Profit Reality**: Profit calculations reflect actual business performance
- [ ] **Financial Control**: Prevents duplicate payments and errors
- [ ] **Supplier Management**: Accurate tracking of supplier obligations
- [ ] **Service Cost Management**: Proper handling of delivery and installation costs

### Data Integrity Checks:
- [ ] **No Duplicate Expenses**: System prevents double entries
- [ ] **Accurate Calculations**: All mathematical operations are correct
- [ ] **Proper Categorization**: Expenses are correctly categorized
- [ ] **Audit Trail**: All transactions are properly logged
- [ ] **Date Accuracy**: All dates are recorded and filtered correctly

---

## Test Results Summary

**Total Test Cases:** 6  
**Passed:** _____ / 6  
**Failed:** _____ / 6  
**Success Rate:** _____%

### Critical Issues Found:
1. ________________________________
2. ________________________________
3. ________________________________

### Recommendations:
1. ________________________________
2. ________________________________
3. ________________________________

**Overall Assessment:** 
- [ ] ✅ PASS - All expense and profit calculations are accurate
- [ ] ❌ FAIL - Issues found that need resolution

**Tester Signature:** ___________________  
**Date Completed:** ___________________