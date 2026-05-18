# Data Safety Manual Testing Checklist

## Objective
Ensure comprehensive data safety through manual export, backup integrity, restore functionality, and soft-deleted data handling.

## Test Environment Setup
- [ ] Backend server running on localhost:3001
- [ ] Database connected and populated with test data
- [ ] User authenticated with owner role
- [ ] Test data includes active and soft-deleted records

---

## Scenario 1: Manual Export (CSV / JSON)

### CSV Export Testing
- [ ] **Export Invoices to CSV**
  - Navigate to Export section
  - Select "Invoices" and "CSV" format
  - Click "Export" button
  - Verify file downloads with correct filename format
  - Open CSV file and verify:
    - [ ] Headers are present and correct
    - [ ] All invoice data is included
    - [ ] Bengali text renders properly
    - [ ] Currency symbols (৳) display correctly
    - [ ] Date format is DD-MM-YYYY
    - [ ] No data truncation or corruption

- [ ] **Export Customers to CSV**
  - Select "Customers" and "CSV" format
  - Verify customer data export:
    - [ ] Customer ID format (CUST-XXXX)
    - [ ] Phone numbers in correct format
    - [ ] Credit limit and due amounts
    - [ ] Customer type information

- [ ] **Export Products to CSV**
  - Select "Products" and "CSV" format
  - Verify product data export:
    - [ ] Stock quantities
    - [ ] Purchase and selling prices
    - [ ] Profit margins calculated correctly
    - [ ] Category information (Thai/Glass)

### JSON Export Testing
- [ ] **Export Customers to JSON**
  - Select "Customers" and "JSON" format
  - Verify JSON structure:
    - [ ] Export metadata present
    - [ ] Data array contains all customers
    - [ ] All fields properly formatted
    - [ ] Valid JSON syntax

- [ ] **Export Products to JSON**
  - Select "Products" and "JSON" format
  - Verify complete product information
  - Check JSON validity and structure

### Export Edge Cases
- [ ] **Empty Data Export**
  - Clear all invoices from database
  - Attempt to export invoices
  - Verify graceful error handling
  - Check appropriate error message

- [ ] **Large Data Export**
  - Create 1000+ test records
  - Export to CSV and JSON
  - Verify performance and completion
  - Check file size and integrity

- [ ] **Special Characters in Data**
  - Create records with Bengali text
  - Include special characters (quotes, commas)
  - Verify proper escaping in CSV
  - Check Unicode handling in JSON

---

## Scenario 2: Backup File Integrity

### Backup Creation
- [ ] **Complete Database Backup**
  - Navigate to Backup section
  - Select "Create Full Backup"
  - Include all collections:
    - [ ] Invoices
    - [ ] Customers
    - [ ] Products
    - [ ] Users
    - [ ] Suppliers
  - Verify backup file creation:
    - [ ] Correct filename format (backup_YYYY-MM-DD.json)
    - [ ] File size reasonable for data volume
    - [ ] Backup metadata present

- [ ] **Backup with Soft-Deleted Data**
  - Enable "Include Soft-Deleted Records"
  - Create backup
  - Verify soft-deleted records included
  - Check deletion metadata preserved

### Backup Verification
- [ ] **Checksum Validation**
  - Create backup and note checksum
  - Verify backup integrity using checksum
  - Modify backup file slightly
  - Verify corruption detection

- [ ] **Backup Structure Validation**
  - Open backup file in text editor
  - Verify JSON structure:
    - [ ] Metadata section present
    - [ ] Data section with all collections
    - [ ] Record counts match metadata
    - [ ] All required fields present

- [ ] **Backup Completeness Check**
  - Compare backup record counts with database
  - Verify all collections included
  - Check for missing or extra data
  - Validate data consistency

### Backup Corruption Detection
- [ ] **File Corruption Testing**
  - Create valid backup
  - Introduce various corruptions:
    - [ ] Remove closing brackets
    - [ ] Modify record data
    - [ ] Change metadata
    - [ ] Truncate file
  - Verify corruption detection for each case

---

## Scenario 3: Restore Test in Fresh DB

### Fresh Database Restore
- [ ] **Prepare Fresh Database**
  - Create new empty database
  - Verify no existing data
  - Connect to fresh database

- [ ] **Full Restore Process**
  - Load backup file
  - Execute restore operation
  - Verify restoration progress
  - Check completion status

- [ ] **Restored Data Validation**
  - Compare record counts:
    - [ ] Invoices match backup
    - [ ] Customers match backup
    - [ ] Products match backup
  - Verify data integrity:
    - [ ] Invoice calculations correct
    - [ ] Customer relationships intact
    - [ ] Product stock levels accurate

### Restore Conflict Handling
- [ ] **Existing Data Conflicts**
  - Add some data to target database
  - Attempt restore with conflicts
  - Test conflict resolution strategies:
    - [ ] Overwrite existing data
    - [ ] Merge with existing data
    - [ ] Skip conflicting records
  - Verify chosen strategy applied correctly

- [ ] **Referential Integrity**
  - After restore, verify:
    - [ ] Invoice-customer relationships
    - [ ] Product references in invoices
    - [ ] User-created relationships
  - Check for orphaned records
  - Validate foreign key constraints

### Database State Verification
- [ ] **Post-Restore Health Check**
  - Run database consistency checks
  - Verify all indexes created
  - Check collection statistics
  - Validate data types and formats

- [ ] **Application Functionality**
  - Start application with restored database
  - Test core functions:
    - [ ] Create new invoice
    - [ ] View customer list
    - [ ] Check product inventory
    - [ ] Generate reports
  - Verify all features work normally

---

## Scenario 4: Soft-Deleted Data Included in Backup

### Soft-Delete Setup
- [ ] **Create Test Data for Soft-Delete**
  - Create 5 customers
  - Create 5 products
  - Create 10 invoices
  - Soft-delete 2 customers
  - Soft-delete 1 product
  - Verify soft-delete metadata:
    - [ ] isDeleted flag set to true
    - [ ] deletedAt timestamp present
    - [ ] deletedBy user ID recorded
    - [ ] deleteReason if provided

### Backup with Soft-Deleted Data
- [ ] **Include Soft-Deleted Records**
  - Create backup with "Include Soft-Deleted" enabled
  - Verify backup contains:
    - [ ] Active records
    - [ ] Soft-deleted records
    - [ ] Proper record counts in metadata
  - Check soft-delete metadata preserved:
    - [ ] Deletion timestamps
    - [ ] Deletion reasons
    - [ ] User who deleted

- [ ] **Exclude Soft-Deleted Records**
  - Create backup with "Include Soft-Deleted" disabled
  - Verify backup contains only active records
  - Check record counts exclude soft-deleted
  - Ensure no soft-deleted data present

### Soft-Delete Restore Testing
- [ ] **Restore Soft-Deleted Data**
  - Use backup containing soft-deleted records
  - Restore to fresh database
  - Verify soft-deleted records restored:
    - [ ] isDeleted flags preserved
    - [ ] Deletion metadata intact
    - [ ] Records not visible in normal queries
  - Test soft-delete functionality still works

- [ ] **Selective Soft-Delete Restore**
  - Create backup with date range filter
  - Restore only recently soft-deleted records
  - Verify filtering works correctly
  - Check old soft-deleted records excluded

### Soft-Delete Data Consistency
- [ ] **Validate Soft-Delete Integrity**
  - Check all soft-deleted records have:
    - [ ] Valid deletedAt timestamps
    - [ ] Proper deletedBy user references
    - [ ] Consistent isDeleted flags
  - Verify no active records have deletion metadata
  - Check deletion timestamps are not in future

---

## Scenario 5: Data Export Validation

### Export Data Integrity
- [ ] **CSV Data Validation**
  - Export data to CSV
  - Import CSV into spreadsheet application
  - Verify:
    - [ ] All rows imported correctly
    - [ ] No data corruption
    - [ ] Proper column alignment
    - [ ] Special characters handled
    - [ ] Bengali text readable

- [ ] **JSON Data Validation**
  - Export data to JSON
  - Parse JSON programmatically
  - Verify:
    - [ ] Valid JSON syntax
    - [ ] All records present
    - [ ] Data types preserved
    - [ ] Unicode characters correct

### Export Performance Testing
- [ ] **Large Dataset Export**
  - Create 10,000+ records
  - Export to both CSV and JSON
  - Monitor:
    - [ ] Export completion time
    - [ ] Memory usage during export
    - [ ] File size generated
    - [ ] No timeout errors

- [ ] **Concurrent Export Testing**
  - Start multiple export operations
  - Verify:
    - [ ] All exports complete successfully
    - [ ] No data corruption
    - [ ] Proper file naming
    - [ ] System stability maintained

---

## Final Validation Checklist

### Overall Data Safety Verification
- [ ] **Export Functionality**
  - [ ] CSV exports work for all data types
  - [ ] JSON exports maintain data integrity
  - [ ] Empty data handled gracefully
  - [ ] Large datasets export successfully
  - [ ] Bengali text preserved in exports

- [ ] **Backup System**
  - [ ] Complete backups created successfully
  - [ ] Backup integrity verified with checksums
  - [ ] Corruption detection works
  - [ ] Backup metadata accurate
  - [ ] File naming conventions followed

- [ ] **Restore Capability**
  - [ ] Fresh database restore works
  - [ ] Data integrity maintained after restore
  - [ ] Conflict resolution strategies work
  - [ ] Application functions normally post-restore
  - [ ] Referential integrity preserved

- [ ] **Soft-Delete Handling**
  - [ ] Soft-deleted data included when requested
  - [ ] Soft-deleted data excluded when requested
  - [ ] Deletion metadata preserved
  - [ ] Selective restore by date range works
  - [ ] Data consistency maintained

### Business Impact Assessment
- [ ] **Data Recovery Scenarios**
  - [ ] Can recover from accidental data loss
  - [ ] Can restore specific time periods
  - [ ] Can export data for external analysis
  - [ ] Can migrate to new systems
  - [ ] Can comply with data requests

- [ ] **Operational Readiness**
  - [ ] Backup procedures documented
  - [ ] Export processes user-friendly
  - [ ] Restore procedures tested
  - [ ] Staff trained on data safety features
  - [ ] Regular backup schedule established

---

## Test Results Summary

**Date:** ___________  
**Tester:** ___________  
**Environment:** ___________

### Results Overview
- Total Test Cases: 50+
- Passed: _____ / _____
- Failed: _____ / _____
- Success Rate: _____%

### Critical Issues Found
1. ________________________________
2. ________________________________
3. ________________________________

### Recommendations
1. ________________________________
2. ________________________________
3. ________________________________

**Overall Assessment:** ☐ PASS ☐ FAIL ☐ NEEDS REVIEW

**Tester Signature:** _____________________ **Date:** ___________