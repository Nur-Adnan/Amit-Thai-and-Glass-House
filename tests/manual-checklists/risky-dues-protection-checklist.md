# Risky Dues Protection - Manual Testing Checklist

## Overview
This checklist ensures the business is protected from risky customer dues through proper tracking, warnings, and controls.

## Test Environment Setup
- [ ] Test database with sample customers
- [ ] Customers with different credit limits (₹10,000, ₹50,000, ₹100,000)
- [ ] Some customers with existing due amounts
- [ ] Owner and non-owner user accounts

---

## 1. Due Amount Increases Correctly

### Test Case 1.1: Single Due Invoice Creation
- [ ] Create a new due invoice for a customer with zero existing dues
- [ ] **Expected**: Customer's total due amount increases by invoice amount
- [ ] **Verify**: Customer record shows updated total due
- [ ] **Verify**: Invoice status is 'due'
- [ ] **Verify**: Invoice due amount matches grand total

### Test Case 1.2: Multiple Due Invoice Accumulation
- [ ] Create first due invoice: ₹5,000
- [ ] Create second due invoice: ₹3,500
- [ ] Create third due invoice: ₹2,000
- [ ] **Expected**: Customer total due = ₹10,500
- [ ] **Verify**: Each invoice maintains individual due amounts
- [ ] **Verify**: Customer total due accumulates correctly

### Test Case 1.3: Mixed Invoice Types
- [ ] Create due invoice: ₹4,000
- [ ] Create partial payment invoice: ₹6,000 (pay ₹2,000)
- [ ] **Expected**: Customer total due = ₹8,000 (₹4,000 + ₹4,000)
- [ ] **Verify**: Only unpaid portions contribute to customer due

---

## 2. Partial Due Payment Updates Balance

### Test Case 2.1: Partial Payment Processing
- [ ] Create due invoice: ₹8,000
- [ ] Process partial payment: ₹3,000
- [ ] **Expected**: Invoice paid amount = ₹3,000
- [ ] **Expected**: Invoice due amount = ₹5,000
- [ ] **Expected**: Invoice status = 'partial'
- [ ] **Expected**: Customer total due reduces by ₹3,000

### Test Case 2.2: Multiple Partial Payments
- [ ] Start with due invoice: ₹10,000
- [ ] First payment: ₹4,000
- [ ] Second payment: ₹3,000
- [ ] **Expected**: Total paid = ₹7,000
- [ ] **Expected**: Remaining due = ₹3,000
- [ ] **Expected**: Status remains 'partial'

### Test Case 2.3: Full Payment Completion
- [ ] Continue from partial payment scenario
- [ ] Final payment: ₹3,000
- [ ] **Expected**: Invoice status = 'paid'
- [ ] **Expected**: Invoice due amount = ₹0
- [ ] **Expected**: Customer total due reduces to reflect full payment

---

## 3. Credit Limit Warning System

### Test Case 3.1: Warning Thresholds
**Setup**: Customer with ₹20,000 credit limit, ₹8,000 current due

- [ ] Create invoice for ₹2,000 (50% utilization)
- [ ] **Expected**: Medium warning (yellow)
- [ ] **Expected**: Warning message mentions 50% utilization

- [ ] Create invoice for ₹5,000 (65% utilization)  
- [ ] **Expected**: High warning (orange)
- [ ] **Expected**: Warning message mentions high risk

- [ ] Create invoice for ₹10,000 (90% utilization)
- [ ] **Expected**: Critical warning (red)
- [ ] **Expected**: Warning mentions exceeding 90% limit

### Test Case 3.2: Credit Limit Enforcement
**Setup**: Customer with ₹15,000 limit, ₹12,000 current due

- [ ] Try to create ₹5,000 invoice as accountant
- [ ] **Expected**: Error message about credit limit exceeded
- [ ] **Expected**: Invoice creation blocked
- [ ] **Expected**: Message mentions owner override required

### Test Case 3.3: Warning Display
- [ ] **Verify**: Warnings appear prominently in UI
- [ ] **Verify**: Warning colors match severity (yellow/orange/red)
- [ ] **Verify**: Warning messages are clear and actionable
- [ ] **Verify**: Credit utilization percentage is accurate

---

## 4. Owner Override System

### Test Case 4.1: Owner Override Success
**Setup**: Customer exceeding credit limit, logged in as owner

- [ ] Create invoice that exceeds customer credit limit
- [ ] **Expected**: Override dialog appears
- [ ] Enter override reason: "Long-term trusted customer"
- [ ] **Expected**: Invoice created successfully
- [ ] **Expected**: Override details recorded in invoice
- [ ] **Verify**: Override reason, date, and user recorded

### Test Case 4.2: Non-Owner Override Rejection
**Setup**: Same scenario, logged in as accountant/manager

- [ ] Try to create invoice exceeding credit limit
- [ ] **Expected**: Access denied error
- [ ] **Expected**: Clear message about owner-only override
- [ ] **Expected**: Invoice not created

### Test Case 4.3: Override Audit Trail
- [ ] Review override audit logs
- [ ] **Verify**: Override action logged with timestamp
- [ ] **Verify**: User ID and role recorded
- [ ] **Verify**: Customer details and amounts logged
- [ ] **Verify**: Override reason captured
- [ ] **Verify**: Risk level assessment included

---

## 5. Due Aging Buckets Analysis

### Test Case 5.1: Aging Bucket Categorization
**Setup**: Create invoices with different ages

- [ ] Create invoice 15 days old: ₹3,000
- [ ] Create invoice 45 days old: ₹4,500  
- [ ] Create invoice 75 days old: ₹6,000
- [ ] Run aging analysis
- [ ] **Expected**: Current (0-30 days): ₹3,000
- [ ] **Expected**: 31-60 days: ₹4,500
- [ ] **Expected**: 60+ days: ₹6,000

### Test Case 5.2: Risk Assessment
- [ ] **Verify**: Risk score calculation: (₹6,000 × 3) + (₹4,500 × 2) + (₹3,000 × 1) = 30,000
- [ ] **Verify**: Risk level assigned based on aging amounts
- [ ] **Verify**: High risk identified for customers with >₹10,000 in 60+ days
- [ ] **Verify**: Medium risk for >₹5,000 in 31-60 days

### Test Case 5.3: Aging Report Generation
- [ ] Generate comprehensive aging report
- [ ] **Verify**: All customers with dues included
- [ ] **Verify**: Aging buckets calculated correctly for each customer
- [ ] **Verify**: Summary totals match individual customer totals
- [ ] **Verify**: Customers sorted by risk score (highest first)

### Test Case 5.4: High-Risk Customer Identification
- [ ] **Verify**: Customers with >₹10,000 in 60+ days flagged as high risk
- [ ] **Verify**: Recommended actions provided (e.g., "IMMEDIATE_COLLECTION")
- [ ] **Verify**: Credit utilization calculated and displayed
- [ ] **Verify**: Risk trends identified over time

---

## 6. Integration Testing

### Test Case 6.1: End-to-End Due Management
- [ ] Create customer with ₹25,000 credit limit
- [ ] Create multiple invoices approaching limit
- [ ] Process partial payments
- [ ] Verify aging analysis updates
- [ ] Test owner override when needed
- [ ] **Verify**: All systems work together seamlessly

### Test Case 6.2: Real-World Scenarios
- [ ] **Scenario**: Customer with good payment history needs emergency override
- [ ] **Scenario**: Customer with poor aging profile gets flagged
- [ ] **Scenario**: Multiple customers need collection action
- [ ] **Verify**: System provides appropriate guidance and controls

---

## 7. Performance and Usability

### Test Case 7.1: Performance
- [ ] Test with 100+ customers with dues
- [ ] **Verify**: Aging analysis completes in <5 seconds
- [ ] **Verify**: Credit limit checks are instant
- [ ] **Verify**: Reports load quickly

### Test Case 7.2: User Experience
- [ ] **Verify**: Warnings are clear and not intrusive
- [ ] **Verify**: Override process is straightforward for owners
- [ ] **Verify**: Aging reports are easy to understand
- [ ] **Verify**: Risk levels are visually distinct

---

## 8. Edge Cases and Error Handling

### Test Case 8.1: Edge Cases
- [ ] Customer with ₹0 credit limit
- [ ] Customer with negative due amount (overpayment)
- [ ] Invoice older than 365 days
- [ ] Very large due amounts (>₹10,00,000)

### Test Case 8.2: Error Handling
- [ ] Invalid payment amounts
- [ ] Network errors during override
- [ ] Database connection issues
- [ ] **Verify**: Graceful error handling and user feedback

---

## Sign-off

### Functional Testing
- [ ] All due tracking scenarios pass
- [ ] Credit limit warnings work correctly
- [ ] Owner override system functions properly
- [ ] Aging analysis categorizes correctly
- [ ] Risk assessment identifies high-risk customers

### Business Requirements
- [ ] Business is protected from risky dues exposure
- [ ] Credit limits are enforced with appropriate overrides
- [ ] Due aging provides actionable insights
- [ ] Audit trail maintains compliance
- [ ] System supports collection activities

**Tester Name**: ________________  
**Date**: ________________  
**Status**: ☐ PASS ☐ FAIL  
**Notes**: ________________