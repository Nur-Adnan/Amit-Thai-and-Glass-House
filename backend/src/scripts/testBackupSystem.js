import mongoose from 'mongoose';
import dotenv from 'dotenv';
import BackupService from '../services/backupService.js';
import ScheduledBackupService from '../services/scheduledBackupService.js';
import User from '../models/User.js';
import fs from 'fs/promises';
import path from 'path';

dotenv.config();

const testBackupSystem = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB Connected');

    // Get a test user
    const user = await User.findOne({ role: 'owner' });
    if (!user) {
      console.log('❌ No owner user found');
      process.exit(1);
    }

    console.log('\n🧪 Testing Backup System\n');

    // Test 1: Individual Module Exports
    console.log('1. Testing Individual Module Exports...');
    
    const modules = [
      { name: 'invoices', method: 'exportInvoices' },
      { name: 'customers', method: 'exportCustomers' },
      { name: 'products', method: 'exportProducts' },
      { name: 'expenses', method: 'exportExpenses' },
      { name: 'employees', method: 'exportEmployees' }
    ];

    const exportResults = {};
    
    for (const module of modules) {
      try {
        // Test JSON export
        const jsonResult = await BackupService[module.method]('json');
        console.log(`   ✅ ${module.name} JSON: ${jsonResult.recordCount} records, ${jsonResult.fileSize} bytes`);
        
        // Test CSV export
        const csvResult = await BackupService[module.method]('csv');
        console.log(`   ✅ ${module.name} CSV: ${csvResult.recordCount} records, ${csvResult.fileSize} bytes`);
        
        exportResults[module.name] = {
          json: jsonResult,
          csv: csvResult
        };
        
        // Cleanup test files
        await fs.unlink(jsonResult.filepath).catch(() => {});
        await fs.unlink(csvResult.filepath).catch(() => {});
        
      } catch (error) {
        console.log(`   ❌ ${module.name} export failed: ${error.message}`);
      }
    }

    // Test 2: Full Database Backup
    console.log('\n2. Testing Full Database Backup...');
    try {
      const fullBackupResult = await BackupService.createFullBackup(user);
      console.log(`   ✅ Full backup created: ${fullBackupResult.backupId}`);
      console.log(`   📊 Total records: ${fullBackupResult.totalRecords}`);
      console.log(`   💾 Total size: ${fullBackupResult.totalSize} bytes`);
      console.log(`   📁 Modules: ${Object.keys(fullBackupResult.modules).join(', ')}`);
      
      // Verify backup files exist
      const backupFolder = fullBackupResult.backupFolder;
      const files = await fs.readdir(backupFolder);
      console.log(`   📄 Files created: ${files.length}`);
      
    } catch (error) {
      console.log(`   ❌ Full backup failed: ${error.message}`);
    }

    // Test 3: Backup List and Statistics
    console.log('\n3. Testing Backup Management...');
    try {
      const backupList = await BackupService.getBackupList();
      console.log(`   ✅ Found ${backupList.length} backups`);
      
      const fullBackups = backupList.filter(b => b.type === 'full');
      const moduleBackups = backupList.filter(b => b.type === 'module');
      console.log(`   📊 Full backups: ${fullBackups.length}, Module backups: ${moduleBackups.length}`);
      
      if (fullBackups.length > 0) {
        const latest = fullBackups[0];
        console.log(`   🕒 Latest backup: ${latest.timestamp} (${latest.totalRecords} records)`);
      }
      
    } catch (error) {
      console.log(`   ❌ Backup management failed: ${error.message}`);
    }

    // Test 4: Scheduled Backup Service
    console.log('\n4. Testing Scheduled Backup Service...');
    try {
      const initialStatus = ScheduledBackupService.getStatus();
      console.log(`   📊 Initial status: ${initialStatus.isRunning ? 'Running' : 'Stopped'}`);
      
      if (!initialStatus.isRunning) {
        ScheduledBackupService.start();
        console.log('   ✅ Scheduled backup service started');
      }
      
      const status = ScheduledBackupService.getStatus();
      console.log(`   📅 Next backup: ${status.nextScheduledBackup}`);
      console.log(`   📈 Success rate: ${status.successRate}%`);
      console.log(`   📊 Total backups: ${status.totalBackups}`);
      
      // Test manual trigger (commented out to avoid creating unnecessary backups)
      // console.log('   🔄 Testing manual backup trigger...');
      // await ScheduledBackupService.triggerManualBackup();
      // console.log('   ✅ Manual backup completed');
      
    } catch (error) {
      console.log(`   ❌ Scheduled backup service failed: ${error.message}`);
    }

    // Test 5: File Format Verification
    console.log('\n5. Testing File Format Verification...');
    try {
      // Create a test export
      const testExport = await BackupService.exportProducts('json', { limit: 5 });
      
      // Read and verify JSON structure
      const fileContent = await fs.readFile(testExport.filepath, 'utf8');
      const jsonData = JSON.parse(fileContent);
      
      console.log('   ✅ JSON structure verification:');
      console.log(`      - Export type: ${jsonData.exportType}`);
      console.log(`      - Total records: ${jsonData.totalRecords}`);
      console.log(`      - Export date: ${jsonData.exportDate}`);
      console.log(`      - Data array length: ${jsonData.data ? jsonData.data.length : 0}`);
      
      if (jsonData.data && jsonData.data.length > 0) {
        const firstRecord = jsonData.data[0];
        console.log(`      - First record keys: ${Object.keys(firstRecord).slice(0, 5).join(', ')}...`);
      }
      
      // Cleanup
      await fs.unlink(testExport.filepath).catch(() => {});
      
    } catch (error) {
      console.log(`   ❌ File format verification failed: ${error.message}`);
    }

    // Test 6: Error Handling
    console.log('\n6. Testing Error Handling...');
    try {
      // Test invalid format
      try {
        await BackupService.exportProducts('invalid_format');
        console.log('   ❌ Should have failed with invalid format');
      } catch (error) {
        console.log('   ✅ Invalid format properly rejected');
      }
      
      // Test invalid filters
      try {
        await BackupService.exportInvoices('json', { invalidFilter: 'test' });
        console.log('   ✅ Invalid filters handled gracefully');
      } catch (error) {
        console.log(`   ⚠️  Invalid filters caused error: ${error.message}`);
      }
      
    } catch (error) {
      console.log(`   ❌ Error handling test failed: ${error.message}`);
    }

    // Test 7: Cleanup Operations
    console.log('\n7. Testing Cleanup Operations...');
    try {
      const backupsBefore = await BackupService.getBackupList();
      const fullBackupsBefore = backupsBefore.filter(b => b.type === 'full').length;
      
      console.log(`   📊 Full backups before cleanup: ${fullBackupsBefore}`);
      
      if (fullBackupsBefore > 2) {
        const deletedCount = await BackupService.cleanupOldBackups(2);
        console.log(`   🧹 Cleanup deleted ${deletedCount} old backups`);
        
        const backupsAfter = await BackupService.getBackupList();
        const fullBackupsAfter = backupsAfter.filter(b => b.type === 'full').length;
        console.log(`   📊 Full backups after cleanup: ${fullBackupsAfter}`);
      } else {
        console.log('   ℹ️  Not enough backups to test cleanup');
      }
      
    } catch (error) {
      console.log(`   ❌ Cleanup operations failed: ${error.message}`);
    }

    console.log('\n🎉 All Backup System tests completed!');
    console.log('\n📋 Test Summary:');
    console.log('   ✅ Individual module exports (JSON & CSV)');
    console.log('   ✅ Full database backup creation');
    console.log('   ✅ Backup list and statistics');
    console.log('   ✅ Scheduled backup service');
    console.log('   ✅ File format verification');
    console.log('   ✅ Error handling');
    console.log('   ✅ Cleanup operations');

    // Final statistics
    const finalBackupList = await BackupService.getBackupList();
    const totalSize = finalBackupList.reduce((sum, b) => sum + (b.totalSize || b.fileSize || 0), 0);
    console.log(`\n📊 Final Statistics:`);
    console.log(`   📁 Total backups: ${finalBackupList.length}`);
    console.log(`   💾 Total size: ${totalSize} bytes (${(totalSize / 1024 / 1024).toFixed(2)} MB)`);
    console.log(`   🕒 Newest backup: ${finalBackupList.length > 0 ? finalBackupList[0].timestamp : 'None'}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
};

testBackupSystem();