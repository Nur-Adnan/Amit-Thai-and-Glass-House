# Profit Trustworthiness Manual Testing Checklist

## Objective: Confirm profit numbers are trustworthy

**Testing Date:** ___________  
**Tester Name:** ___________  
**Environment:** ___________

---

## 1. Daily Profit Calculation ✅

### Test Steps:
1. **Create Multiple Sales for Today**
   - [ ] Create Sale 1: 25 sqft Glass @ ৳150/sqft + Delivery ৳1,200 + Installation ৳1,800
   - [ ] Create Sale 2: 15 sqft Glass @ ৳120/sqft + Delivery ৳800 + Installation ৳0
   - [ ] Create Sale 3: 30 sqft Thai Frame @ ৳200/sqft + Delivery ৳1,500 + Installation ৳2,000
   - [ ] Record purchase prices: Glass ৳100/sqft, Thai Frame ৳150/sqft

2. **Check Daily Profit Report**
   - [ ] Go to Reports → Daily Profit
   - [ ] Select today's date
   - [ ] Verify calculations:
     - Sale 1: Revenue ৳6,750 (3,750 + 3,000), Cost ৳2,500, Profit ৳1,250
     - Sale 2: Revenue ৳2,600 (1,800 + 800), Cost ৳1,500, Profit ৳300
     - Sale 3: Revenue ৳9,500 (6,000 + 3,500), Cost ৳4,500, Profit ৳1,500
   - [ ] Total Revenue: ৳18,850
   - [ ] Total Cost: ৳8,500
   - [ ] Net Profit: ৳3,050
   - [ ] Profit Margin: 16.18%

3. **Verify Service Cost Deduction**
   - [ ] Check that delivery costs are recorded as expenses
   - [ ] Check that installation costs are recorded as expenses
   - [ ] Verify service revenue cancels out service costs in profit calculation
   - [ ] Confirm only product profit contributes to net profit

4. **Check Cash vs Due Tracking**
   - [ ] Verify cash received amounts are accurate
   - [ ] Verify due amounts are accurate
   - [ ] Check cash ratio calculation
   - [ ] Confirm ratios add up to 100%

**Expected Results:**
- ✅ Daily profit calculated accurately
- ✅ Service costs properly deducted
- ✅ Cash/due ratios correct
- ✅ All calculations match manual verification

**Actual Results:** ___________

---

## 2. Monthly Profit Aggregation ✅

### Test Steps:
1. **Review Monthly Summary**
   - [ ] Go to Reports → Monthly Profit
   - [ ] Select current month
   - [ ] Note daily profit totals for verification

2. **Verify Aggregation Logic**
   - [ ] Check that all daily profits are summed correctly
   - [ ] Verify operating expenses are included:
     - Salary expenses: ৳_______
     - Rent expenses: ৳_______
     - Utility expenses: ৳_______
     - Other expenses: ৳_______
   - [ ] Confirm net profit = gross profit - operating expenses

3. **Test Different Time Periods**
   - [ ] Check last month's aggregation
   - [ ] Compare month-over-month changes
   - [ ] Verify quarterly aggregation
   - [ ] Check year-to-date totals

4. **Validate Active Days Calculation**
   - [ ] Count days with actual sales
   - [ ] Verify average daily profit calculation
   - [ ] Check transaction count accuracy
   - [ ] Confirm weekend/holiday handling

5. **Cross-Reference with Individual Records**
   - [ ] Pick 3 random days from the month
   - [ ] Manually calculate daily profits
   - [ ] Compare with system calculations
   - [ ] Verify all match exactly

**Expected Results:**
- ✅ Monthly totals match sum of daily profits
- ✅ Operating expenses properly deducted
- ✅ Average calculations accurate
- ✅ Cross-references validate correctly

**Actual Results:** ___________

---

## 3. Product-wise Profit ✅

### Test Steps:
1. **Generate Product Profit Report**
   - [ ] Go to Reports → Product-wise Profit
   - [ ] Select date range (e.g., last 30 days)
   - [ ] Review all products listed

2. **Verify Individual Product Calculations**
   - [ ] Select Product A (e.g., Clear Glass 4mm):
     - Total quantity sold: _____ sqft
     - Purchase price: ৳_____ /sqft
     - Selling price: ৳_____ /sqft
     - Total revenue: ৳_____
     - Total cost: ৳_____
     - Gross profit: ৳_____
     - Profit margin: _____%
   - [ ] Manually verify: (Selling price - Purchase price) × Quantity = Profit
   - [ ] Check profit margin: (Profit ÷ Revenue) × 100

3. **Test Product Comparison**
   - [ ] Identify highest revenue product
   - [ ] Identify highest profit product
   - [ ] Identify best profit margin product
   - [ ] Verify rankings are correct

4. **Check Product Performance Metrics**
   - [ ] Revenue share percentages add up to 100%
   - [ ] Profit share percentages add up to 100%
   - [ ] Transaction counts are accurate
   - [ ] Average order sizes calculated correctly

5. **Identify Underperforming Products**
   - [ ] Set profit margin threshold (e.g., 20%)
   - [ ] List products below threshold
   - [ ] Verify recommendations are appropriate
   - [ ] Check potential improvement calculations

**Expected Results:**
- ✅ All product calculations accurate
- ✅ Rankings and comparisons correct
- ✅ Performance metrics validated
- ✅ Underperforming products identified

**Actual Results:** ___________

---

## 4. Profit After Wastage & Delivery Cost ✅

### Test Steps:
1. **Create Sale with Wastage**
   - [ ] Create invoice: 40 sqft Glass @ ৳150/sqft
   - [ ] Add 5% wastage (2 sqft)
   - [ ] Add delivery charge: ৳1,500
   - [ ] Add installation charge: ৳2,000
   - [ ] Purchase price: ৳100/sqft

2. **Verify Wastage Calculations**
   - [ ] Base material needed: 40 sqft
   - [ ] Wastage amount: 2 sqft (5%)
   - [ ] Total material used: 42 sqft
   - [ ] Material cost: ৳4,200 (42 × ৳100)
   - [ ] Product revenue: ৳6,000 (40 × ৳150)
   - [ ] Product profit before services: ৳1,800 (6,000 - 4,200)

3. **Verify Service Cost Impact**
   - [ ] Service revenue: ৳3,500 (1,500 + 2,000)
   - [ ] Service costs: ৳3,500 (same as revenue - they are expenses)
   - [ ] Service profit: ৳0 (3,500 - 3,500)
   - [ ] Total revenue: ৳9,500 (6,000 + 3,500)
   - [ ] Total costs: ৳7,700 (4,200 + 3,500)
   - [ ] Net profit: ৳1,800 (9,500 - 7,700)

4. **Test Manual Wastage Input**
   - [ ] Create another sale with manual wastage
   - [ ] Enter specific wastage amount (e.g., 3.5 sqft)
   - [ ] Verify calculations with manual input
   - [ ] Check wastage percentage calculation

5. **Compare Profit With and Without Wastage**
   - [ ] Calculate profit without wastage: ৳2,000 (6,000 - 4,000)
   - [ ] Calculate profit with wastage: ৳1,800 (6,000 - 4,200)
   - [ ] Wastage impact: ৳200 reduction in profit
   - [ ] Verify impact is correctly shown in reports

**Expected Results:**
- ✅ Wastage calculations accurate
- ✅ Service costs properly deducted
- ✅ Net profit reflects real costs
- ✅ Wastage impact clearly shown

**Actual Results:** ___________

---

## 5. Cash vs Due Ratio Correctness ✅

### Test Steps:
1. **Create Mixed Payment Invoices**
   - [ ] Invoice 1: ৳8,000 - Fully paid (Cash)
   - [ ] Invoice 2: ৳6,500 - Partial payment ৳3,000 (Due ৳3,500)
   - [ ] Invoice 3: ৳4,200 - No payment (Fully due)
   - [ ] Invoice 4: ৳9,800 - Fully paid (Bank transfer)
   - [ ] Invoice 5: ৳5,500 - Partial payment ৳2,200 (Due ৳3,300)

2. **Verify Cash vs Due Calculations**
   - [ ] Total invoice amount: ৳34,000
   - [ ] Total cash received: ৳22,000 (8,000 + 3,000 + 0 + 9,800 + 2,200)
   - [ ] Total due amount: ৳12,000 (0 + 3,500 + 4,200 + 0 + 3,300)
   - [ ] Cash ratio: 64.71% (22,000 ÷ 34,000 × 100)
   - [ ] Due ratio: 35.29% (12,000 ÷ 34,000 × 100)
   - [ ] Verify ratios add up to 100%

3. **Check Status Breakdown**
   - [ ] Paid invoices: 2 (৳17,800 total)
   - [ ] Partial invoices: 2 (৳12,000 total)
   - [ ] Due invoices: 1 (৳4,200 total)
   - [ ] Verify status percentages:
     - Paid: 52.35% (17,800 ÷ 34,000)
     - Partial: 35.29% (12,000 ÷ 34,000)
     - Due: 12.35% (4,200 ÷ 34,000)

4. **Test Collection Efficiency Tracking**
   - [ ] Check monthly collection trends
   - [ ] Compare with previous months
   - [ ] Identify improvement or decline
   - [ ] Verify collection efficiency = cash ratio

5. **Validate Customer Payment Patterns**
   - [ ] Identify customers with poor payment history
   - [ ] Check payment delay calculations
   - [ ] Verify risk level assignments
   - [ ] Review recommended actions

**Expected Results:**
- ✅ Cash/due ratios calculated correctly
- ✅ Status breakdowns accurate
- ✅ Collection efficiency tracked properly
- ✅ Payment patterns analyzed correctly

**Actual Results:** ___________

---

## 6. Comprehensive Profit Trustworthiness Verification ✅

### Test Steps:
1. **End-to-End Profit Verification**
   - [ ] Select a complete business day
   - [ ] List all transactions:
     - Sales: ৳_____ (revenue)
     - Purchases: ৳_____ (costs)
     - Expenses: ৳_____ (operating)
     - Services: ৳_____ (delivery/installation)

2. **Manual Profit Calculation**
   - [ ] Calculate product profit: Sales revenue - Product costs
   - [ ] Calculate service profit: Service revenue - Service costs (should be 0)
   - [ ] Calculate gross profit: Product profit + Service profit
   - [ ] Calculate net profit: Gross profit - Operating expenses
   - [ ] Calculate profit margin: (Net profit ÷ Total revenue) × 100

3. **Compare with System Calculations**
   - [ ] System gross profit: ৳_____
   - [ ] Manual gross profit: ৳_____
   - [ ] Difference: ৳_____ (should be 0)
   - [ ] System net profit: ৳_____
   - [ ] Manual net profit: ৳_____
   - [ ] Difference: ৳_____ (should be 0)

4. **Verify All Components**
   - [ ] Revenue recognition: All sales included
   - [ ] Cost recognition: All costs included
   - [ ] Expense recognition: All expenses included
   - [ ] Wastage impact: Properly calculated
   - [ ] Service costs: Properly deducted
   - [ ] Cash flow: Accurately tracked

5. **Test Edge Cases**
   - [ ] Day with no sales (profit = -expenses)
   - [ ] Day with returns/refunds
   - [ ] Day with only service charges
   - [ ] Day with high wastage
   - [ ] Day with mixed payment methods

**Expected Results:**
- ✅ System calculations match manual calculations exactly
- ✅ All profit components properly included
- ✅ Edge cases handled correctly
- ✅ Complete trustworthiness confirmed

**Actual Results:** ___________

---

## Summary Checklist ✅

### Overall Profit Trustworthiness Verification:
- [ ] **Daily Calculations**: Accurate daily profit calculations with proper service cost deduction
- [ ] **Monthly Aggregation**: Correct monthly totals with operating expense inclusion
- [ ] **Product Analysis**: Accurate product-wise profit calculations and rankings
- [ ] **Wastage Impact**: Proper wastage cost inclusion in profit calculations
- [ ] **Service Costs**: Correct handling of delivery and installation costs
- [ ] **Cash Flow**: Accurate cash vs due ratio calculations

### Business Impact Verification:
- [ ] **Profit Accuracy**: All profit numbers reflect real business performance
- [ ] **Cost Inclusion**: All costs (material, wastage, service, operating) properly included
- [ ] **Revenue Recognition**: All revenue sources properly recognized
- [ ] **Margin Calculations**: Profit margins accurately calculated
- [ ] **Trend Analysis**: Month-over-month comparisons are meaningful
- [ ] **Decision Support**: Profit data supports business decision-making

### Data Integrity Checks:
- [ ] **Mathematical Accuracy**: All calculations are mathematically correct
- [ ] **Consistency**: Profit numbers consistent across different reports
- [ ] **Completeness**: All transactions included in profit calculations
- [ ] **Timeliness**: Profit calculations reflect current data
- [ ] **Transparency**: Profit breakdown is clear and understandable

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

### Profit Trustworthiness Verification:
- [ ] ✅ Daily profit calculations are accurate and trustworthy
- [ ] ✅ Monthly aggregations properly include all costs and expenses
- [ ] ✅ Product-wise profit analysis provides reliable insights
- [ ] ✅ Wastage and service costs are properly factored into profit
- [ ] ✅ Cash vs due ratios are calculated correctly
- [ ] ✅ All profit numbers can be trusted for business decisions

### Recommendations:
1. ________________________________
2. ________________________________
3. ________________________________

**Overall Assessment:** 
- [ ] ✅ PASS - All profit numbers are completely trustworthy
- [ ] ❌ FAIL - Issues found that compromise profit trustworthiness

**Business Impact:**
- Profit margins: _____%
- Collection efficiency: _____%
- Top performing product: ___________
- Biggest profit impact: ___________

**Tester Signature:** ___________________  
**Date Completed:** ___________________