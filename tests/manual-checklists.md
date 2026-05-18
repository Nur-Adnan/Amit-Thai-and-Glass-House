# Manual Testing Checklists for Real Shop Environment

## 🏪 Daily Shop Operations Testing

### Invoice Creation & Management
- [ ] **Create New Invoice**
  - [ ] Add customer information (name, phone, address)
  - [ ] Add multiple products with different quantities
  - [ ] Apply discount (percentage and fixed amount)
  - [ ] Calculate totals correctly (subtotal, discount, grand total)
  - [ ] Save invoice successfully
  - [ ] Generate unique invoice number (INV-YYYYMM-XXXX format)

- [ ] **Payment Processing**
  - [ ] Record full payment (status changes to "Paid")
  - [ ] Record partial payment (status shows "Partial")
  - [ ] Handle overpayment scenarios
  - [ ] Update customer due amounts correctly
  - [ ] Generate payment receipts

- [ ] **Invoice Search & Filtering**
  - [ ] Search by invoice number
  - [ ] Search by customer name
  - [ ] Filter by payment status (Paid/Partial/Due)
  - [ ] Filter by date range
  - [ ] Sort by amount, date, customer

### Customer Management
- [ ] **Customer Registration**
  - [ ] Add new customer with complete information
  - [ ] Validate Bangladesh phone number format (01XXXXXXXXX)
  - [ ] Set credit limit and payment terms
  - [ ] Generate unique customer ID (CUST-XXXX)

- [ ] **Credit Control**
  - [ ] Block invoice creation when credit limit exceeded
  - [ ] Allow owner override for blocked customers
  - [ ] Display due aging (0-30, 31-60, 60+ days)
  - [ ] Show credit utilization percentage
  - [ ] Generate credit risk alerts

- [ ] **Customer Search & Management**
  - [ ] Search by name, phone, customer ID
  - [ ] Filter by risk level (Low/Medium/High/Critical)
  - [ ] Update customer information
  - [ ] View customer transaction history

### Inventory Management
- [ ] **Product Management**
  - [ ] Add new products (Thai/Glass categories)
  - [ ] Set purchase and selling prices
  - [ ] Define stock quantities and units
  - [ ] Set low stock thresholds

- [ ] **Stock Monitoring**
  - [ ] Display current stock levels
  - [ ] Show low stock alerts (orange badges)
  - [ ] Show out-of-stock alerts (red badges with animation)
  - [ ] Calculate total stock value
  - [ ] Track stock movements

- [ ] **Stock Updates**
  - [ ] Update stock quantities manually
  - [ ] Automatic stock reduction on invoice creation
  - [ ] Stock adjustment with reasons
  - [ ] Stock transfer between locations

### Financial Management
- [ ] **Expense Tracking**
  - [ ] Record daily expenses with categories
  - [ ] Upload expense receipts
  - [ ] Approve/reject expense requests
  - [ ] Generate expense reports

- [ ] **Payroll Management**
  - [ ] Record employee salaries
  - [ ] Track payment status (Paid/Due)
  - [ ] Generate payroll reports
  - [ ] Calculate total labor costs

- [ ] **Profit Analysis**
  - [ ] Calculate daily/monthly profit
  - [ ] Include all costs (materials, labor, expenses)
  - [ ] Exclude booking invoices from profit
  - [ ] Generate profit trend reports

## 🌐 Multi-language Testing (Bengali/English)

### Language Toggle
- [ ] **Interface Translation**
  - [ ] Switch between Bengali and English
  - [ ] All UI elements translate correctly
  - [ ] Form labels and placeholders in correct language
  - [ ] Error messages in selected language
  - [ ] Success messages in selected language

- [ ] **Number & Date Formatting**
  - [ ] Bengali numerals (০-৯) display correctly
  - [ ] Currency formatting: ৳১৯,৮০০ (Bengali) vs ৳19,800 (English)
  - [ ] Date formatting: ০৫-০২-২০২৬ (Bengali) vs 05-02-2026 (English)
  - [ ] Large numbers with proper comma separation

- [ ] **Typography & Spacing**
  - [ ] Bengali fonts render properly (Noto Sans Bengali)
  - [ ] Proper line height (1.7) for Bengali text
  - [ ] Letter spacing (0.02em) for readability
  - [ ] Form inputs accommodate Bengali text properly

## 🔐 Security & Access Control Testing

### User Authentication
- [ ] **Login Process**
  - [ ] Valid credentials allow access
  - [ ] Invalid credentials show error message
  - [ ] Account lockout after multiple failed attempts
  - [ ] Password reset functionality
  - [ ] Session timeout handling

- [ ] **Role-Based Access**
  - [ ] Owner: Full access to all features
  - [ ] Manager: Limited access (no user management)
  - [ ] Accountant: Read-only access to financial data
  - [ ] Employee: Basic invoice and customer access

### Data Security
- [ ] **Input Validation**
  - [ ] SQL injection prevention
  - [ ] XSS attack prevention
  - [ ] File upload security
  - [ ] Phone number format validation
  - [ ] Email format validation

- [ ] **Data Protection**
  - [ ] Sensitive data encryption
  - [ ] Secure password storage
  - [ ] JWT token expiration
  - [ ] HTTPS enforcement

## 📱 Device & Browser Compatibility

### Responsive Design
- [ ] **Mobile Devices (320px - 768px)**
  - [ ] Navigation menu works properly
  - [ ] Forms are usable on small screens
  - [ ] Tables scroll horizontally
  - [ ] Touch interactions work correctly
  - [ ] Bengali text displays properly

- [ ] **Tablet Devices (768px - 1024px)**
  - [ ] Layout adapts correctly
  - [ ] Sidebar navigation functions
  - [ ] Touch and mouse interactions
  - [ ] Print functionality works

- [ ] **Desktop (1024px+)**
  - [ ] Full sidebar navigation
  - [ ] Keyboard shortcuts work
  - [ ] Multi-window support
  - [ ] Print layouts are correct

### Browser Testing
- [ ] **Chrome** (Primary browser)
- [ ] **Firefox** (Secondary browser)
- [ ] **Safari** (Mac users)
- [ ] **Edge** (Windows users)

## 🏗️ Business Workflow Testing

### Daily Shop Opening
- [ ] **Morning Checklist**
  - [ ] System login successful
  - [ ] Dashboard loads with current data
  - [ ] Check pending invoices
  - [ ] Review low stock alerts
  - [ ] Check overdue customers

### Customer Transaction Flow
- [ ] **Walk-in Customer**
  - [ ] Quick customer registration
  - [ ] Product selection and pricing
  - [ ] Invoice creation and printing
  - [ ] Payment processing
  - [ ] Receipt generation

- [ ] **Regular Customer**
  - [ ] Customer lookup by phone/name
  - [ ] Credit limit verification
  - [ ] Invoice creation with credit terms
  - [ ] Due amount tracking
  - [ ] Payment history review

### End-of-Day Operations
- [ ] **Daily Summary**
  - [ ] Total sales calculation
  - [ ] Cash vs credit sales breakdown
  - [ ] Profit calculation
  - [ ] Expense recording
  - [ ] Stock level review

## 🚨 Error Handling & Edge Cases

### System Errors
- [ ] **Network Issues**
  - [ ] Offline mode handling
  - [ ] Connection timeout messages
  - [ ] Data sync when reconnected
  - [ ] User-friendly error messages

- [ ] **Data Validation Errors**
  - [ ] Required field validation
  - [ ] Format validation (phone, email)
  - [ ] Range validation (quantities, prices)
  - [ ] Duplicate prevention

### Business Logic Edge Cases
- [ ] **Inventory Edge Cases**
  - [ ] Selling more than available stock
  - [ ] Negative stock scenarios
  - [ ] Zero price products
  - [ ] Bulk quantity discounts

- [ ] **Payment Edge Cases**
  - [ ] Overpayment handling
  - [ ] Partial payment calculations
  - [ ] Currency rounding issues
  - [ ] Refund processing

## 📊 Performance Testing

### Load Testing
- [ ] **Concurrent Users**
  - [ ] 5 users creating invoices simultaneously
  - [ ] 10 users searching customers
  - [ ] Database performance under load
  - [ ] Response time under 2 seconds

- [ ] **Data Volume**
  - [ ] 1000+ invoices in system
  - [ ] 500+ customers with transaction history
  - [ ] 100+ products in inventory
  - [ ] Large report generation (1 year data)

### Memory & Storage
- [ ] **Resource Usage**
  - [ ] Memory usage stays reasonable
  - [ ] Database size growth monitoring
  - [ ] File upload size limits
  - [ ] Cache performance

## ✅ Acceptance Criteria

### Critical Features (Must Pass)
- [ ] Invoice creation and payment processing
- [ ] Customer credit control and due management
- [ ] Inventory stock tracking and alerts
- [ ] User authentication and role-based access
- [ ] Multi-language support (Bengali/English)
- [ ] Financial reporting and profit calculation

### Important Features (Should Pass)
- [ ] Advanced search and filtering
- [ ] Print and PDF generation
- [ ] Data export functionality
- [ ] Mobile responsiveness
- [ ] Performance under normal load

### Nice-to-Have Features (Could Pass)
- [ ] Advanced analytics and insights
- [ ] Bulk operations
- [ ] Advanced reporting features
- [ ] Integration capabilities

## 📝 Test Execution Notes

### Before Testing
- [ ] Ensure test database is properly seeded
- [ ] Clear browser cache and cookies
- [ ] Test with fresh user accounts
- [ ] Verify system date and time settings

### During Testing
- [ ] Document all bugs with screenshots
- [ ] Note performance issues and slow responses
- [ ] Test with realistic data volumes
- [ ] Verify calculations manually

### After Testing
- [ ] Clean up test data
- [ ] Document test results
- [ ] Report critical issues immediately
- [ ] Schedule regression testing for fixes

---

## 📞 Emergency Contacts
- **Technical Support**: [Developer Contact]
- **Business Owner**: [Shop Owner Contact]
- **System Administrator**: [Admin Contact]

## 📅 Testing Schedule
- **Daily**: Smoke tests on critical features
- **Weekly**: Full regression testing
- **Monthly**: Performance and security testing
- **Before Release**: Complete manual testing checklist