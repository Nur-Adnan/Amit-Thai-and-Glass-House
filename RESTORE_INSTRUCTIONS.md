# 🔄 Database Restore Instructions

## ⚠️ CRITICAL - ADMIN ONLY

**These instructions are for system administrators only. Improper use can result in complete data loss.**

## 📋 Prerequisites

Before attempting any restore operation:

1. **Stop the application server**
2. **Create a current backup** (if possible)
3. **Verify backup file integrity**
4. **Ensure MongoDB is running**
5. **Have admin access to MongoDB**

## 🔧 Restore Methods

### Method 1: Full Database Restore (Recommended)

#### Step 1: Locate Backup Files
```bash
# Navigate to backup directory
cd backend/backups

# List available full backups
ls -la full_backup_*

# Choose the backup to restore (example: full_backup_2026-01-02T21-00-00-000Z)
cd full_backup_2026-01-02T21-00-00-000Z
```

#### Step 2: Verify Backup Integrity
```bash
# Check backup manifest
cat backup_manifest.json

# Verify all required files exist
ls -la *.json
```

#### Step 3: Stop Application
```bash
# Stop the Node.js application
pm2 stop thai-aluminum-backend
# OR
pkill -f "node src/index.js"
```

#### Step 4: Backup Current Database (Safety)
```bash
# Create safety backup of current database
mongodump --uri="mongodb+srv://amit_thai_and_aluminium:ScqNXZelIPaDaBQE@amit-thai-and-aluminum.qc9czvg.mongodb.net/" --out ./current_db_backup_$(date +%Y%m%d_%H%M%S)
```

#### Step 5: Clear Current Database
```bash
# Connect to MongoDB and drop collections
mongosh "mongodb+srv://amit_thai_and_aluminium:ScqNXZelIPaDaBQE@amit-thai-and-aluminum.qc9czvg.mongodb.net/"

# In MongoDB shell:
use your_database_name
db.invoices.drop()
db.customers.drop()
db.products.drop()
db.employees.drop()
db.salaryPayments.drop()
db.expenses.drop()
db.investments.drop()
db.users.drop()
db.auditlogs.drop()
exit
```

#### Step 6: Restore Data from Backup

**Option A: Using Node.js Restore Script (Recommended)**
```bash
# Create restore script
node -e "
const fs = require('fs');
const mongoose = require('mongoose');

async function restore() {
  await mongoose.connect('mongodb+srv://amit_thai_and_aluminium:ScqNXZelIPaDaBQE@amit-thai-and-aluminum.qc9czvg.mongodb.net/');
  
  const collections = ['invoices', 'customers', 'products', 'employees', 'expenses', 'users'];
  
  for (const collection of collections) {
    const filename = \`\${collection}_backup.json\`;
    if (fs.existsSync(filename)) {
      const data = JSON.parse(fs.readFileSync(filename, 'utf8'));
      const db = mongoose.connection.db;
      
      if (data.data && data.data.length > 0) {
        await db.collection(collection).insertMany(data.data);
        console.log(\`Restored \${data.data.length} records to \${collection}\`);
      }
    }
  }
  
  console.log('Restore completed');
  process.exit(0);
}

restore().catch(console.error);
"
```

**Option B: Using mongoimport (Alternative)**
```bash
# For each collection, convert JSON and import
for file in *_backup.json; do
  collection=$(echo $file | sed 's/_backup.json//')
  
  # Extract data array from backup file
  jq '.data[]' $file > temp_${collection}.json
  
  # Import to MongoDB
  mongoimport --uri="mongodb+srv://amit_thai_and_aluminium:ScqNXZelIPaDaBQE@amit-thai-and-aluminum.qc9czvg.mongodb.net/" --collection=$collection --file=temp_${collection}.json
  
  # Cleanup
  rm temp_${collection}.json
done
```

#### Step 7: Verify Restore
```bash
# Connect to MongoDB and verify data
mongosh "mongodb+srv://amit_thai_and_aluminium:ScqNXZelIPaDaBQE@amit-thai-and-aluminum.qc9czvg.mongodb.net/"

# In MongoDB shell:
use your_database_name
db.invoices.countDocuments()
db.customers.countDocuments()
db.products.countDocuments()
db.employees.countDocuments()
db.expenses.countDocuments()
db.users.countDocuments()
exit
```

#### Step 8: Restart Application
```bash
# Start the application
cd backend
npm start
# OR
pm2 start thai-aluminum-backend
```

#### Step 9: Verify Application
```bash
# Test API endpoints
curl http://localhost:3001/api/health
curl -H "Authorization: Bearer [token]" http://localhost:3001/api/products
```

### Method 2: Selective Module Restore

#### For Individual Collections:
```bash
# Example: Restore only products
cd backend/backups

# Find the specific backup file
ls -la products_backup_*.json

# Use the restore script for specific collection
node -e "
const fs = require('fs');
const mongoose = require('mongoose');

async function restoreProducts() {
  await mongoose.connect('mongodb+srv://amit_thai_and_aluminium:ScqNXZelIPaDaBQE@amit-thai-and-aluminum.qc9czvg.mongodb.net/');
  
  const data = JSON.parse(fs.readFileSync('products_backup_2026-01-02T21-00-00-000Z.json', 'utf8'));
  const db = mongoose.connection.db;
  
  // Clear existing products
  await db.collection('products').deleteMany({});
  
  // Insert backup data
  if (data.data && data.data.length > 0) {
    await db.collection('products').insertMany(data.data);
    console.log(\`Restored \${data.data.length} products\`);
  }
  
  process.exit(0);
}

restoreProducts().catch(console.error);
"
```

## 🚨 Emergency Recovery Procedures

### Scenario 1: Complete Data Loss
1. **Stop all services immediately**
2. **Locate the most recent full backup**
3. **Follow Method 1 (Full Database Restore)**
4. **Verify all data integrity**
5. **Test all application functions**

### Scenario 2: Corrupted Collection
1. **Identify the corrupted collection**
2. **Find the most recent backup containing that collection**
3. **Use Method 2 (Selective Module Restore)**
4. **Verify data relationships are intact**

### Scenario 3: Partial Data Loss
1. **Assess the scope of data loss**
2. **Determine the last known good state**
3. **Restore from the appropriate backup**
4. **Manually reconcile any missing recent data**

## 🔍 Backup File Structure

### Full Backup Directory Structure:
```
full_backup_2026-01-02T21-00-00-000Z/
├── backup_manifest.json          # Backup metadata
├── invoices_backup.json          # Invoice data
├── customers_backup.json         # Customer data
├── products_backup.json          # Product data
├── employees_backup.json         # Employee data
├── expenses_backup.json          # Expense data
├── users_backup.json             # User data (passwords excluded)
└── audit_logs_backup.json        # Recent audit logs
```

### Backup File Format:
```json
{
  "exportType": "invoices",
  "totalRecords": 150,
  "exportDate": "2026-01-02T21:00:00.000Z",
  "filters": {},
  "data": [
    {
      "_id": "...",
      "invoiceNo": "INV-202601-0001",
      // ... invoice data
    }
  ]
}
```

## ⚡ Quick Recovery Commands

### Emergency Full Restore (One Command):
```bash
#!/bin/bash
# emergency_restore.sh

BACKUP_DIR="$1"
DB_URI="mongodb+srv://amit_thai_and_aluminium:ScqNXZelIPaDaBQE@amit-thai-and-aluminum.qc9czvg.mongodb.net/"

if [ -z "$BACKUP_DIR" ]; then
  echo "Usage: ./emergency_restore.sh <backup_directory>"
  exit 1
fi

echo "🚨 EMERGENCY RESTORE STARTING..."
echo "Backup Directory: $BACKUP_DIR"

# Stop application
pkill -f "node src/index.js"

# Create safety backup
echo "Creating safety backup..."
mongodump --uri="$DB_URI" --out "./emergency_backup_$(date +%Y%m%d_%H%M%S)"

# Restore from backup
cd "$BACKUP_DIR"

node -e "
const fs = require('fs');
const mongoose = require('mongoose');

async function emergencyRestore() {
  await mongoose.connect('$DB_URI');
  const db = mongoose.connection.db;
  
  const collections = ['invoices', 'customers', 'products', 'employees', 'expenses', 'users'];
  
  for (const collection of collections) {
    const filename = \`\${collection}_backup.json\`;
    if (fs.existsSync(filename)) {
      console.log(\`Restoring \${collection}...\`);
      
      // Drop existing collection
      await db.collection(collection).drop().catch(() => {});
      
      // Restore data
      const data = JSON.parse(fs.readFileSync(filename, 'utf8'));
      if (data.data && data.data.length > 0) {
        await db.collection(collection).insertMany(data.data);
        console.log(\`✅ Restored \${data.data.length} records to \${collection}\`);
      }
    }
  }
  
  console.log('🎉 Emergency restore completed');
  process.exit(0);
}

emergencyRestore().catch(console.error);
"

echo "🔄 Restarting application..."
cd ../../
npm start &

echo "✅ Emergency restore completed"
```

## 📊 Verification Checklist

After any restore operation, verify:

- [ ] **Database Connection**: Application connects successfully
- [ ] **User Authentication**: Login system works
- [ ] **Data Integrity**: Record counts match backup manifest
- [ ] **Relationships**: Foreign key relationships are intact
- [ ] **Calculations**: Totals and calculations are correct
- [ ] **File Uploads**: Any uploaded files are accessible
- [ ] **Audit Trail**: Recent audit logs are present
- [ ] **Business Logic**: All business rules function correctly

## 🔐 Security Considerations

1. **Access Control**: Only authorized administrators should perform restores
2. **Backup Verification**: Always verify backup integrity before restore
3. **Safety Backups**: Create current backup before restore
4. **Audit Logging**: Document all restore operations
5. **Testing**: Test restored system thoroughly before production use

## 📞 Emergency Contacts

In case of critical issues during restore:

- **System Administrator**: [Contact Information]
- **Database Administrator**: [Contact Information]
- **Development Team Lead**: [Contact Information]
- **Business Owner**: [Contact Information]

## 📝 Restore Log Template

Document all restore operations:

```
RESTORE OPERATION LOG
====================
Date: _______________
Time: _______________
Administrator: _______________
Reason: _______________
Backup Used: _______________
Collections Restored: _______________
Records Restored: _______________
Issues Encountered: _______________
Resolution: _______________
Verification Status: _______________
Sign-off: _______________
```

## ⚠️ Important Notes

1. **Always test restore procedures** in a development environment first
2. **Never restore directly to production** without proper testing
3. **Maintain multiple backup copies** in different locations
4. **Regular backup verification** is essential
5. **Document all procedures** and keep instructions updated
6. **Train multiple administrators** on restore procedures
7. **Test restore procedures regularly** (quarterly recommended)

---

**Remember: Data restoration is a critical operation. When in doubt, consult with the development team before proceeding.**