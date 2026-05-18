# 🔒 Data Protection Manual Testing Checklist

## Overview
This checklist ensures comprehensive data protection through role-based access control and audit logging.

## Test Environment Setup
- [ ] Create users with different roles: Owner, Manager, Accountant, Worker
- [ ] Create test products with pricing and inventory data
- [ ] Create test invoices with profit information
- [ ] Ensure audit logging is enabled

---

## 🚫 Worker Cannot See Profit

### Test Scenario 1: Invoice Profit Data Access
**Objective**: Verify workers cannot see profit-related information in invoices

**Steps**:
1. [ ] Login as Worker user
2. [ ] Navigate to Invoice List page
3. [ ] Open any invoice details
4. [ ] Check invoice display

**Expected Results**:
- [ ] Invoice number, customer name, and grand total are visible
- [ ] Profit amount is NOT displayed
- [ ] Profit margin is NOT displayed
- [ ] Purchase price is NOT shown in item details
- [ ] Item profit is NOT displayed
- [ ] Selling price IS visible (for customer reference)

**Pass/Fail**: _____ | **Notes**: _________________________________

### Test Scenario 2: Product Profit Information
**Objective**: Verify workers cannot access product cost/profit data

**Steps**:
1. [ ] Login as Worker user
2. [ ] Navigate to Products page
3. [ ] View product details
4. [ ] Try to access product reports

**Expected Results**:
- [ ] Product name, selling price, and stock quantity are visible
- [ ] Purchase price is NOT displayed
- [ ] Profit margin is NOT shown
- [ ] Cost analysis reports are blocked with access denied message

**Pass/Fail**: _____ | **Notes**: _________________________________

### Test Scenario 3: Reports Access
**Objective**: Verify workers cannot access profit reports

**Steps**:
1. [ ] Login as Worker user
2. [ ] Try to access Daily Profit Report
3. [ ] Try to access Monthly Profit Report
4. [ ] Try to access Product Profitability Report

**Expected Results**:
- [ ] All profit reports show "Access Denied" error
- [ ] Error message explains insufficient permissions
- [ ] Worker is redirected or shown appropriate error page

**Pass/Fail**: _____ | **Notes**: _________________________________

---

## 💰 Manager Cannot Edit Prices

### Test Scenario 4: Product Price Editing
**Objective**: Verify managers cannot modify product prices

**Steps**:
1. [ ] Login as Manager user
2. [ ] Navigate to Products page
3. [ ] Try to edit a product
4. [ ] Attempt to change selling price
5. [ ] Attempt to change purchase price
6. [ ] Try to save changes

**Expected Results**:
- [ ] Price fields are disabled or read-only for managers
- [ ] Attempting to save price changes shows error message
- [ ] Error message explains managers cannot edit prices
- [ ] Non-price fields (name, description, category) can be edited

**Pass/Fail**: _____ | **Notes**: _________________________________

### Test Scenario 5: Product Creation with Prices
**Objective**: Verify managers cannot create products with price information

**Steps**:
1. [ ] Login as Manager user
2. [ ] Navigate to Add New Product page
3. [ ] Fill in product details including prices
4. [ ] Try to save the new product

**Expected Results**:
- [ ] Product creation fails if prices are included
- [ ] Error message explains price setting restrictions
- [ ] Manager can create product without prices (for owner to set later)

**Pass/Fail**: _____ | **Notes**: _________________________________

### Test Scenario 6: Owner Price Editing Verification
**Objective**: Verify owners can still edit prices

**Steps**:
1. [ ] Login as Owner user
2. [ ] Navigate to Products page
3. [ ] Edit a product's selling and purchase prices
4. [ ] Save changes

**Expected Results**:
- [ ] Owner can successfully edit all price fields
- [ ] Changes are saved without errors
- [ ] Updated prices are reflected in the system

**Pass/Fail**: _____ | **Notes**: _________________________________

---

## 📦 Accountant Cannot Edit Inventory

### Test Scenario 7: Stock Quantity Editing
**Objective**: Verify accountants cannot modify inventory quantities

**Steps**:
1. [ ] Login as Accountant user
2. [ ] Navigate to Products page
3. [ ] Try to edit a product
4. [ ] Attempt to change stock quantity
5. [ ] Try to save changes

**Expected Results**:
- [ ] Stock quantity field is disabled or read-only for accountants
- [ ] Attempting to save stock changes shows error message
- [ ] Error message explains inventory editing restrictions
- [ ] Financial fields (prices, names) can be edited

**Pass/Fail**: _____ | **Notes**: _________________________________

### Test Scenario 8: Stock Adjustments
**Objective**: Verify accountants cannot perform stock adjustments

**Steps**:
1. [ ] Login as Accountant user
2. [ ] Try to access Stock Adjustment page
3. [ ] Attempt to perform stock in/out operations
4. [ ] Try to adjust inventory levels

**Expected Results**:
- [ ] Stock adjustment features are not accessible
- [ ] Attempting stock operations shows access denied error
- [ ] Error message explains accountants cannot adjust inventory

**Pass/Fail**: _____ | **Notes**: _________________________________

### Test Scenario 9: Manager Inventory Access Verification
**Objective**: Verify managers can edit inventory

**Steps**:
1. [ ] Login as Manager user
2. [ ] Navigate to Products page
3. [ ] Edit stock quantities
4. [ ] Perform stock adjustments
5. [ ] Save changes

**Expected Results**:
- [ ] Manager can successfully edit stock quantities
- [ ] Stock adjustment operations work properly
- [ ] Changes are saved and reflected in inventory

**Pass/Fail**: _____ | **Notes**: _________________________________

---

## 🚫 Unauthorized Access Blocked

### Test Scenario 10: No Authentication Token
**Objective**: Verify system blocks requests without authentication

**Steps**:
1. [ ] Open browser in incognito/private mode
2. [ ] Try to access system URLs directly
3. [ ] Attempt to access API endpoints without login

**Expected Results**:
- [ ] All protected pages redirect to login
- [ ] API requests return 401 Unauthorized error
- [ ] Error message explains authentication is required

**Pass/Fail**: _____ | **Notes**: _________________________________

### Test Scenario 11: Invalid Authentication Token
**Objective**: Verify system blocks requests with invalid tokens

**Steps**:
1. [ ] Login to system
2. [ ] Manually modify authentication token in browser
3. [ ] Try to access protected resources
4. [ ] Attempt API calls with modified token

**Expected Results**:
- [ ] System detects invalid token
- [ ] User is logged out or redirected to login
- [ ] API requests return 401 Unauthorized error

**Pass/Fail**: _____ | **Notes**: _________________________________

### Test Scenario 12: Role Hierarchy Enforcement
**Objective**: Verify lower roles cannot access higher role resources

**Steps**:
1. [ ] Login as Worker user
2. [ ] Try to access Manager-only features
3. [ ] Login as Accountant user
4. [ ] Try to access Owner-only features

**Expected Results**:
- [ ] Worker cannot access Manager/Accountant/Owner features
- [ ] Accountant cannot access Owner features
- [ ] Appropriate error messages explain insufficient permissions
- [ ] Higher roles can access lower role features

**Pass/Fail**: _____ | **Notes**: _________________________________

### Test Scenario 13: Cross-Tenant Data Access
**Objective**: Verify users cannot access other tenants' data

**Steps**:
1. [ ] Create users in different tenant organizations
2. [ ] Try to access data from other tenants
3. [ ] Attempt to modify cross-tenant resources

**Expected Results**:
- [ ] Users can only see their own tenant's data
- [ ] Cross-tenant access attempts are blocked
- [ ] Error messages explain tenant isolation

**Pass/Fail**: _____ | **Notes**: _________________________________

---

## 📋 Audit Logs Created Correctly

### Test Scenario 14: Price Change Audit Logging
**Objective**: Verify price changes are properly logged

**Steps**:
1. [ ] Login as Owner user
2. [ ] Change product selling and purchase prices
3. [ ] Navigate to Audit Logs page
4. [ ] Search for price change entries

**Expected Results**:
- [ ] Price change operations are logged
- [ ] Audit entry includes before/after values
- [ ] User information is recorded (name, role, ID)
- [ ] Timestamp and IP address are captured
- [ ] Change reason is logged if provided

**Pass/Fail**: _____ | **Notes**: _________________________________

### Test Scenario 15: Failed Access Attempt Logging
**Objective**: Verify unauthorized access attempts are logged

**Steps**:
1. [ ] Login as Worker user
2. [ ] Try to access profit reports (should fail)
3. [ ] Login as Manager user
4. [ ] Try to edit prices (should fail)
5. [ ] Check audit logs for failed attempts

**Expected Results**:
- [ ] Failed access attempts are logged
- [ ] Log entries include attempted action
- [ ] User information and role are recorded
- [ ] Reason for denial is documented
- [ ] Severity level is assigned

**Pass/Fail**: _____ | **Notes**: _________________________________

### Test Scenario 16: Sensitive Operations Logging
**Objective**: Verify all sensitive operations are audited

**Steps**:
1. [ ] Perform various operations: create invoice, delete product, stock adjustment
2. [ ] Check audit logs for each operation
3. [ ] Verify log completeness

**Expected Results**:
- [ ] All CRUD operations on sensitive data are logged
- [ ] Stock adjustments are recorded
- [ ] Invoice creation/modification is tracked
- [ ] User context is included in all logs

**Pass/Fail**: _____ | **Notes**: _________________________________

### Test Scenario 17: Audit Trail Integrity
**Objective**: Verify audit logs maintain integrity

**Steps**:
1. [ ] Perform multiple operations over time
2. [ ] Check audit log chronological order
3. [ ] Verify no duplicate entries
4. [ ] Check for missing log entries

**Expected Results**:
- [ ] Audit logs are in chronological order
- [ ] No duplicate audit entries exist
- [ ] All expected operations are logged
- [ ] Log entries cannot be modified or deleted by users

**Pass/Fail**: _____ | **Notes**: _________________________________

---

## 🔍 Additional Security Checks

### Test Scenario 18: Session Management
**Objective**: Verify proper session handling

**Steps**:
1. [ ] Login to system
2. [ ] Leave system idle for extended period
3. [ ] Try to perform operations after timeout
4. [ ] Test concurrent sessions

**Expected Results**:
- [ ] Sessions timeout after inactivity
- [ ] Expired sessions require re-authentication
- [ ] Concurrent session limits are enforced
- [ ] Session data is properly cleaned up

**Pass/Fail**: _____ | **Notes**: _________________________________

### Test Scenario 19: Data Encryption
**Objective**: Verify sensitive data is properly encrypted

**Steps**:
1. [ ] Check database for sensitive data storage
2. [ ] Verify API responses don't expose sensitive data
3. [ ] Check browser storage for unencrypted data

**Expected Results**:
- [ ] Passwords are hashed/encrypted in database
- [ ] Sensitive data is not stored in plain text
- [ ] API responses filter sensitive information by role
- [ ] Browser storage doesn't contain sensitive data

**Pass/Fail**: _____ | **Notes**: _________________________________

### Test Scenario 20: Input Validation
**Objective**: Verify proper input validation and sanitization

**Steps**:
1. [ ] Try to input malicious scripts in forms
2. [ ] Test SQL injection attempts
3. [ ] Verify file upload restrictions

**Expected Results**:
- [ ] Malicious scripts are sanitized or blocked
- [ ] SQL injection attempts are prevented
- [ ] File uploads are restricted and validated
- [ ] Error messages don't reveal system information

**Pass/Fail**: _____ | **Notes**: _________________________________

---

## 📊 Test Summary

### Overall Results
- **Total Test Scenarios**: 20
- **Passed**: _____ / 20
- **Failed**: _____ / 20
- **Success Rate**: _____%

### Critical Issues Found
1. _________________________________
2. _________________________________
3. _________________________________

### Recommendations
1. _________________________________
2. _________________________________
3. _________________________________

### Sign-off
**Tester Name**: _________________  
**Date**: _________________  
**Overall Assessment**: ⭐⭐⭐⭐⭐ (1-5 stars)

---

## 🔒 Security Compliance Checklist

- [ ] Role-based access control implemented
- [ ] Data filtering by user role working
- [ ] Audit logging comprehensive and tamper-proof
- [ ] Authentication and authorization enforced
- [ ] Session management secure
- [ ] Input validation and sanitization active
- [ ] Sensitive data properly encrypted
- [ ] Cross-tenant data isolation maintained
- [ ] Failed access attempts monitored
- [ ] Security error messages appropriate (not revealing system details)

**Data Protection Status**: ✅ SECURE / ⚠️ NEEDS ATTENTION / ❌ CRITICAL ISSUES