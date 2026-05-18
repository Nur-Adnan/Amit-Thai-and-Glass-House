# Calculation Accuracy Manual Testing Checklist

## 🎯 Objective
Ensure 100% accuracy in all mathematical calculations throughout the system.

## 📋 Pre-Testing Setup
- [ ] Backend server running on localhost:3001
- [ ] Frontend server running on localhost:3000
- [ ] Database seeded with glass pricing data
- [ ] Calculator configuration set up for Glass material
- [ ] Test user account with owner permissions

## 🧮 Core Calculation Tests

### 1. Foot-Inch Conversion Tests
**Test Case 1.1: Basic Conversion**
- [ ] Navigate to Calculator page
- [ ] Select measurement type: SFT
- [ ] Enter Length: 5 feet, 6 inches
- [ ] Enter Width: 3 feet, 0 inches
- [ ] **Expected Result**: Length displays as 5.5ft, Width as 3.0ft
- [ ] **Actual Result**: ________________
- [ ] **Status**: ✅ Pass / ❌ Fail

**Test Case 1.2: Complex Conversion**
- [ ] Enter Length: 12 feet, 9 inches
- [ ] Enter Width: 8 feet, 3 inches
- [ ] **Expected Result**: Length = 12.75ft, Width = 8.25ft
- [ ] **Actual Result**: ________________
- [ ] **Status**: ✅ Pass / ❌ Fail

**Test Case 1.3: Edge Cases**
- [ ] Test 0 feet, 12 inches → Should equal 1.0 feet
- [ ] Test 10 feet, 0 inches → Should equal 10.0 feet
- [ ] Test 7 feet, 6 inches → Should equal 7.5 feet
- [ ] **Status**: ✅ Pass / ❌ Fail

### 2. SFT (Square Foot) Calculation Tests
**Test Case 2.1: Primary Example**
- [ ] Length: 5.5 feet (5ft 6in)
- [ ] Width: 3.0 feet (3ft 0in)
- [ ] Glass: Any type at ৳120/sqft
- [ ] **Expected Area**: 16.5 sqft
- [ ] **Expected Price**: ৳1,980.00
- [ ] **Actual Area**: ________________
- [ ] **Actual Price**: ________________
- [ ] **Status**: ✅ Pass / ❌ Fail

**Test Case 2.2: Decimal Precision**
- [ ] Length: 7.123 feet
- [ ] Width: 4.567 feet
- [ ] Glass: ৳100/sqft
- [ ] **Expected Area**: 32.5327 sqft (4 decimal places)
- [ ] **Expected Price**: ৳3,253.27
- [ ] **Actual Area**: ________________
- [ ] **Actual Price**: ________________
- [ ] **Status**: ✅ Pass / ❌ Fail

**Test Case 2.3: Large Dimensions**
- [ ] Length: 50.0 feet
- [ ] Width: 25.0 feet
- [ ] Glass: ৳150/sqft
- [ ] **Expected Area**: 1,250.0 sqft
- [ ] **Expected Price**: ৳187,500.00
- [ ] **Actual Area**: ________________
- [ ] **Actual Price**: ________________
- [ ] **Status**: ✅ Pass / ❌ Fail

### 3. Glass Thickness Price Selection Tests
**Test Case 3.1: All Thickness Options**
- [ ] 3mm Local: Expected ৳85/sqft
  - Actual: ________________ ✅ Pass / ❌ Fail
- [ ] 3mm Imported: Expected ৳120/sqft
  - Actual: ________________ ✅ Pass / ❌ Fail
- [ ] 4mm Local: Expected ৳95/sqft
  - Actual: ________________ ✅ Pass / ❌ Fail
- [ ] 4mm Imported: Expected ৳135/sqft
  - Actual: ________________ ✅ Pass / ❌ Fail
- [ ] 5mm Local: Expected ৳110/sqft
  - Actual: ________________ ✅ Pass / ❌ Fail
- [ ] 5mm Imported: Expected ৳155/sqft
  - Actual: ________________ ✅ Pass / ❌ Fail
- [ ] 6mm Local: Expected ৳125/sqft
  - Actual: ________________ ✅ Pass / ❌ Fail
- [ ] 6mm Imported: Expected ৳175/sqft
  - Actual: ________________ ✅ Pass / ❌ Fail

**Test Case 3.2: Price Application**
- [ ] Select 4mm Imported glass (৳135/sqft)
- [ ] Calculate 16.5 sqft area
- [ ] **Expected Total**: ৳2,227.50
- [ ] **Actual Total**: ________________
- [ ] **Status**: ✅ Pass / ❌ Fail

### 4. Wastage Calculation Tests
**Test Case 4.1: 5% Wastage**
- [ ] Base amount: ৳1,980
- [ ] Wastage: 5%
- [ ] **Expected Wastage Amount**: ৳99.00
- [ ] **Expected Total**: ৳2,079.00
- [ ] **Actual Wastage**: ________________
- [ ] **Actual Total**: ________________
- [ ] **Status**: ✅ Pass / ❌ Fail

**Test Case 4.2: Decimal Wastage**
- [ ] Base amount: ৳2,500
- [ ] Wastage: 7.5%
- [ ] **Expected Wastage Amount**: ৳187.50
- [ ] **Expected Total**: ৳2,687.50
- [ ] **Actual Wastage**: ________________
- [ ] **Actual Total**: ________________
- [ ] **Status**: ✅ Pass / ❌ Fail

**Test Case 4.3: Complex Wastage**
- [ ] Base amount: ৳1,234.56
- [ ] Wastage: 3.75%
- [ ] **Expected Wastage Amount**: ৳46.30 (rounded)
- [ ] **Expected Total**: ৳1,280.86
- [ ] **Actual Wastage**: ________________
- [ ] **Actual Total**: ________________
- [ ] **Status**: ✅ Pass / ❌ Fail

### 5. Discount & Rounding Logic Tests
**Test Case 5.1: Percentage Discount**
- [ ] Subtotal: ৳2,000
- [ ] Discount: 10%
- [ ] **Expected Discount Amount**: ৳200.00
- [ ] **Expected Grand Total**: ৳1,800.00
- [ ] **Actual Discount**: ________________
- [ ] **Actual Grand Total**: ________________
- [ ] **Status**: ✅ Pass / ❌ Fail

**Test Case 5.2: Amount Discount**
- [ ] Subtotal: ৳2,500
- [ ] Discount: ৳150
- [ ] **Expected Grand Total**: ৳2,350.00
- [ ] **Actual Grand Total**: ________________
- [ ] **Status**: ✅ Pass / ❌ Fail

**Test Case 5.3: Rounding Precision**
- [ ] Test amount: 123.456
- [ ] **Expected Rounded**: 123.46
- [ ] **Actual Rounded**: ________________
- [ ] Test amount: 123.454
- [ ] **Expected Rounded**: 123.45
- [ ] **Actual Rounded**: ________________
- [ ] Test amount: 999.999
- [ ] **Expected Rounded**: 1000.00
- [ ] **Actual Rounded**: ________________
- [ ] **Status**: ✅ Pass / ❌ Fail

### 6. RFT (Running Foot) Calculation Tests
**Test Case 6.1: Basic RFT**
- [ ] Running length: 15.75 feet
- [ ] Price: ৳85/rft
- [ ] **Expected Total**: ৳1,338.75
- [ ] **Actual Total**: ________________
- [ ] **Status**: ✅ Pass / ❌ Fail

**Test Case 6.2: Feet-Inch Input**
- [ ] Running length: 12 feet, 6 inches
- [ ] Price: ৳95/rft
- [ ] **Expected Length**: 12.5 feet
- [ ] **Expected Total**: ৳1,187.50
- [ ] **Actual Length**: ________________
- [ ] **Actual Total**: ________________
- [ ] **Status**: ✅ Pass / ❌ Fail

### 7. PANEL Calculation Tests
**Test Case 7.1: Basic Panel**
- [ ] Panel count: 8
- [ ] Price: ৳450/panel
- [ ] **Expected Total**: ৳3,600.00
- [ ] **Actual Total**: ________________
- [ ] **Status**: ✅ Pass / ❌ Fail

**Test Case 7.2: Decimal Panel Price**
- [ ] Panel count: 12
- [ ] Price: ৳375.50/panel
- [ ] **Expected Total**: ৳4,506.00
- [ ] **Actual Total**: ________________
- [ ] **Status**: ✅ Pass / ❌ Fail

## 🔗 End-to-End Calculation Chain Tests

### Test Case E2E.1: Complete Invoice Calculation
**Input Parameters:**
- [ ] Dimensions: 5ft 6in × 3ft 0in
- [ ] Glass: 4mm Imported (৳135/sqft)
- [ ] Wastage: 5%
- [ ] Discount: ৳100

**Step-by-Step Verification:**
1. [ ] **Dimension Conversion**
   - Length: 5.5 feet ✅ Pass / ❌ Fail
   - Width: 3.0 feet ✅ Pass / ❌ Fail

2. [ ] **Area Calculation**
   - Area: 16.5 sqft ✅ Pass / ❌ Fail

3. [ ] **Price Application**
   - Subtotal: ৳2,227.50 ✅ Pass / ❌ Fail

4. [ ] **Wastage Application**
   - Wastage: ৳111.38 ✅ Pass / ❌ Fail
   - Subtotal with wastage: ৳2,338.88 ✅ Pass / ❌ Fail

5. [ ] **Discount Application**
   - Final total: ৳2,238.88 ✅ Pass / ❌ Fail

**Overall Status**: ✅ Pass / ❌ Fail

### Test Case E2E.2: Complex Real-World Scenario
**Input Parameters:**
- [ ] Dimensions: 15ft 9in × 12ft 3in
- [ ] Glass: 5mm Local (৳110/sqft)
- [ ] Wastage: 7.5%
- [ ] Discount: 15%

**Expected Results:**
- [ ] Length: 15.75 feet
- [ ] Width: 12.25 feet
- [ ] Area: 192.9375 sqft
- [ ] Subtotal: ৳21,223.13
- [ ] Wastage: ৳1,591.73
- [ ] Subtotal with wastage: ৳22,814.86
- [ ] Discount (15%): ৳3,422.23
- [ ] Final total: ৳19,392.63

**Actual Results:**
- [ ] Length: ________________
- [ ] Width: ________________
- [ ] Area: ________________
- [ ] Subtotal: ________________
- [ ] Wastage: ________________
- [ ] Subtotal with wastage: ________________
- [ ] Discount: ________________
- [ ] Final total: ________________

**Status**: ✅ Pass / ❌ Fail

## 🔍 Edge Cases and Error Handling

### Test Case EC.1: Minimum Values
- [ ] Test 0.1 × 0.1 feet = 0.01 sqft
- [ ] Test ৳1/sqft pricing
- [ ] Test 0% wastage
- [ ] Test ৳0 discount
- [ ] **Status**: ✅ Pass / ❌ Fail

### Test Case EC.2: Maximum Values
- [ ] Test 999.99 × 999.99 feet
- [ ] Test ৳10,000/sqft pricing
- [ ] Test 100% wastage
- [ ] Test 100% discount
- [ ] **Status**: ✅ Pass / ❌ Fail

### Test Case EC.3: Negative Prevention
- [ ] Verify discount cannot exceed subtotal
- [ ] Verify grand total cannot go below ৳0
- [ ] Verify negative dimensions are rejected
- [ ] **Status**: ✅ Pass / ❌ Fail

## 💱 Currency Formatting Tests

### Test Case CF.1: BDT Formatting
- [ ] ৳1,980.00 displays correctly
- [ ] ৳12,345.67 displays correctly
- [ ] ৳999,999.99 displays correctly
- [ ] ৳0.01 displays correctly
- [ ] ৳1,000,000.00 displays correctly
- [ ] **Status**: ✅ Pass / ❌ Fail

### Test Case CF.2: Number Precision
- [ ] All amounts rounded to 2 decimal places
- [ ] Area calculations maintain 4 decimal places
- [ ] No floating-point precision errors
- [ ] **Status**: ✅ Pass / ❌ Fail

## 📊 Test Summary

### Overall Results
- **Total Test Cases**: _____ / 50+
- **Passed**: _____
- **Failed**: _____
- **Success Rate**: _____%

### Critical Issues Found
1. ________________________________
2. ________________________________
3. ________________________________

### Recommendations
1. ________________________________
2. ________________________________
3. ________________________________

## ✅ Sign-off

**Tester Name**: ________________________
**Date**: ________________________
**Overall Status**: ✅ All calculations accurate / ❌ Issues found

**Notes**: 
_________________________________________________
_________________________________________________
_________________________________________________

---

## 🎯 Success Criteria
- [ ] All foot-inch conversions are mathematically correct
- [ ] All SFT/RFT/PANEL calculations are precise
- [ ] Glass pricing selection works for all combinations
- [ ] Wastage calculations are accurate to 2 decimal places
- [ ] Discount logic handles both percentage and amount correctly
- [ ] Currency rounding follows BDT standards (2 decimal places)
- [ ] End-to-end calculation chains maintain accuracy
- [ ] Edge cases are handled properly
- [ ] No floating-point precision errors
- [ ] All amounts display in proper BDT format

**CALCULATION ACCURACY CONFIRMED**: ✅ Yes / ❌ No