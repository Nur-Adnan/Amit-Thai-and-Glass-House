# Testing Quick Start Guide

## 🚀 What's Working Right Now

### 1. Basic Backend Testing ✅
```bash
cd backend
NODE_ENV=test npm test -- tests/unit/backend/basic.test.js
```
**Result**: ✅ 3 tests passing with database connection

### 2. Manual Testing Checklists ✅
- Complete business workflow validation
- Located in `tests/manual-checklists.md`
- Ready for immediate use

### 3. Test Infrastructure ✅
- MongoDB Memory Server configured
- Test utilities available
- Environment separation working

## 🔧 Immediate Actions Needed

### Fix 1: Backend Model Testing
**Problem**: Can't import ES modules in Jest
**Quick Solution**: Test via API endpoints instead

```bash
# Instead of testing models directly, test the APIs
cd backend
npm run dev &  # Start server
# Test with curl or Postman
curl -X GET http://localhost:3001/api/customers
```

### Fix 2: Frontend Testing
**Problem**: Path configuration issues
**Quick Solution**: Move tests to frontend directory

```bash
# Move frontend tests to correct location
mkdir -p frontend/src/__tests__
cp tests/unit/frontend/components/* frontend/src/__tests__/
```

### Fix 3: E2E Testing
**Problem**: Module resolution
**Quick Solution**: Use manual testing for now

## 📋 Recommended Testing Approach

### Phase 1: Manual Testing (Start Here)
1. **Use Manual Checklists** (`tests/manual-checklists.md`)
   - Invoice creation workflow
   - Customer credit management
   - Glass pricing calculations
   - Financial reporting

2. **Document Issues Found**
   - Create issue list
   - Prioritize by business impact
   - Track resolution

### Phase 2: API Testing
1. **Test Critical Endpoints**
   ```bash
   # Authentication
   POST /api/auth/login
   POST /api/auth/register
   
   # Invoices
   GET /api/invoices
   POST /api/invoices
   PUT /api/invoices/:id
   
   # Customers
   GET /api/customers
   POST /api/customers
   ```

2. **Use Postman or Insomnia**
   - Create test collections
   - Automate critical workflows
   - Export for team use

### Phase 3: Automated Testing
1. **Fix Configuration Issues**
   - Resolve ES module compatibility
   - Update path configurations
   - Test basic functionality

2. **Implement Critical Tests**
   - Focus on business logic
   - Test error scenarios
   - Validate data integrity

## 🎯 Business-Critical Test Scenarios

### 1. Invoice Creation (Priority: High)
**Manual Test Steps**:
1. Login as owner
2. Navigate to Create Invoice
3. Select customer with credit limit
4. Add glass items with pricing
5. Apply discount
6. Process payment
7. Verify profit calculation

**Expected Results**:
- Invoice number generated (INV-YYYYMM-XXXX)
- Credit limit enforced
- Glass pricing applied correctly
- Profit calculated accurately

### 2. Customer Credit Control (Priority: High)
**Manual Test Steps**:
1. Create customer with credit limit ৳10,000
2. Create invoice for ৳8,000
3. Try to create another invoice for ৳5,000
4. Verify blocking behavior
5. Test owner override

**Expected Results**:
- Invoice blocked when exceeding limit
- Owner can override with confirmation
- Due aging calculated correctly

### 3. Glass Pricing System (Priority: High)
**Manual Test Steps**:
1. Navigate to Calculator
2. Select thickness (3mm, 4mm, 5mm, 6mm)
3. Select quality (Local, Imported)
4. Enter measurements
5. Verify price calculation

**Expected Results**:
- Correct price per sqft applied
- Historical pricing preserved
- Calculations accurate

## 📊 Testing Checklist

### Daily Testing (Manual)
- [ ] Login/logout functionality
- [ ] Invoice creation basic flow
- [ ] Customer search and selection
- [ ] Glass pricing calculations
- [ ] Payment processing
- [ ] Report generation

### Weekly Testing (Manual + API)
- [ ] All user roles (owner, manager, accountant)
- [ ] Credit limit enforcement
- [ ] Due aging calculations
- [ ] Financial warnings
- [ ] Inventory alerts
- [ ] Language toggle (Bengali/English)

### Release Testing (Full Suite)
- [ ] All manual checklists completed
- [ ] API endpoints tested
- [ ] Performance benchmarks met
- [ ] Security validations passed
- [ ] Cross-browser compatibility
- [ ] Mobile responsiveness

## 🚨 Known Issues & Workarounds

### Issue 1: ES Module Import Errors
**Workaround**: Use API testing instead of direct model testing
**Status**: Configuration fix in progress

### Issue 2: Playwright Path Resolution
**Workaround**: Manual E2E testing using browser
**Status**: Path configuration needs update

### Issue 3: Frontend Test Discovery
**Workaround**: Move tests to standard Next.js locations
**Status**: Path mapping needs correction

## 📈 Success Metrics

### Current Status
- ✅ Test infrastructure: 90% complete
- ✅ Manual testing: 100% ready
- ⚠️ Automated testing: 30% functional
- ⚠️ CI/CD integration: 0% complete

### Target Goals
- 🎯 Manual testing: 100% coverage of critical flows
- 🎯 API testing: 80% endpoint coverage
- 🎯 Unit testing: 70% code coverage
- 🎯 E2E testing: 100% critical workflows

## 🔄 Next Steps

### This Week
1. **Complete Manual Testing**
   - Run all checklists in `tests/manual-checklists.md`
   - Document any issues found
   - Validate all business workflows

2. **Set Up API Testing**
   - Create Postman collection
   - Test all critical endpoints
   - Automate basic workflows

### Next Week
1. **Fix Configuration Issues**
   - Resolve ES module compatibility
   - Update test paths
   - Get basic automated tests running

2. **Implement Critical Tests**
   - Invoice creation flow
   - Customer credit validation
   - Glass pricing accuracy

### Following Week
1. **Complete Test Coverage**
   - All backend APIs
   - Critical frontend components
   - End-to-end workflows

2. **Set Up CI/CD**
   - Automated test execution
   - Coverage reporting
   - Quality gates

## 📞 Getting Help

### If Tests Fail
1. Check manual testing first
2. Verify API endpoints with curl/Postman
3. Review configuration files
4. Check environment variables

### If Configuration Issues
1. Review `TESTING_IMPLEMENTATION_STATUS.md`
2. Check Jest and Playwright configs
3. Verify module paths
4. Test with basic examples

### If Business Logic Issues
1. Use manual testing checklists
2. Validate with real data
3. Check calculation accuracy
4. Verify business rules