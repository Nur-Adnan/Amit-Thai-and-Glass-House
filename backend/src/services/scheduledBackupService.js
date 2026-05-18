import cron from 'node-cron';
import BackupService from './backupService.js';
import User from '../models/User.js';
import AuditService from './auditService.js';
import mongoose from 'mongoose';

/**
 * Scheduled Backup Service - Automated daily backups
 */
class ScheduledBackupService {
  
  constructor() {
    this.isRunning = false;
    this.lastBackupTime = null;
    this.backupHistory = [];
    this.maxHistorySize = 30; // Keep last 30 backup records
  }

  /**
   * Start the scheduled backup service
   */
  start() {
    if (this.isRunning) {
      console.log('⚠️  Scheduled backup service is already running');
      return;
    }

    // Schedule daily backup at 2:00 AM
    this.dailyBackupJob = cron.schedule('0 2 * * *', async () => {
      await this.performScheduledBackup();
    }, {
      scheduled: false,
      timezone: 'America/Chicago' // Adjust timezone as needed
    });

    // Schedule weekly cleanup at 3:00 AM on Sundays
    this.weeklyCleanupJob = cron.schedule('0 3 * * 0', async () => {
      await this.performScheduledCleanup();
    }, {
      scheduled: false,
      timezone: 'America/Chicago'
    });

    // Start the cron jobs
    this.dailyBackupJob.start();
    this.weeklyCleanupJob.start();
    
    this.isRunning = true;
    console.log('✅ Scheduled backup service started');
    console.log('   📅 Daily backups: 2:00 AM');
    console.log('   🧹 Weekly cleanup: 3:00 AM on Sundays');
  }

  /**
   * Stop the scheduled backup service
   */
  stop() {
    if (!this.isRunning) {
      console.log('⚠️  Scheduled backup service is not running');
      return;
    }

    if (this.dailyBackupJob) {
      this.dailyBackupJob.stop();
      this.dailyBackupJob.destroy();
    }

    if (this.weeklyCleanupJob) {
      this.weeklyCleanupJob.stop();
      this.weeklyCleanupJob.destroy();
    }

    this.isRunning = false;
    console.log('🛑 Scheduled backup service stopped');
  }

  /**
   * Perform scheduled backup
   */
  async performScheduledBackup() {
    const startTime = new Date();
    console.log(`🔄 Starting scheduled backup at ${startTime.toISOString()}`);

    try {
      // Get system user for audit logging
      const systemUser = await this.getSystemUser();
      
      // Create full backup
      const result = await BackupService.createFullBackup(systemUser);
      
      const endTime = new Date();
      const duration = endTime - startTime;
      
      // Record backup history
      const backupRecord = {
        timestamp: startTime,
        duration,
        success: true,
        backupId: result.backupId,
        totalRecords: result.totalRecords,
        totalSize: result.totalSize,
        modules: Object.keys(result.modules)
      };
      
      this.addToHistory(backupRecord);
      this.lastBackupTime = startTime;
      
      console.log(`✅ Scheduled backup completed successfully`);
      console.log(`   📊 Records: ${result.totalRecords}`);
      console.log(`   💾 Size: ${this.formatBytes(result.totalSize)}`);
      console.log(`   ⏱️  Duration: ${this.formatDuration(duration)}`);
      
      // Log audit trail
      if (systemUser) {
        await AuditService.log({
          action: 'system_backup',
          entityType: 'System',
          entityId: new mongoose.Types.ObjectId(),
          entityName: `Scheduled Backup - ${result.backupId}`,
          performedBy: systemUser._id,
          description: `Automated daily backup completed with ${result.totalRecords} records`,
          changes: {
            scheduledBackup: {
              backupId: result.backupId,
              totalRecords: result.totalRecords,
              totalSize: result.totalSize,
              duration,
              modules: Object.keys(result.modules)
            }
          },
          severity: 'critical'
        });
      }
      
    } catch (error) {
      const endTime = new Date();
      const duration = endTime - startTime;
      
      // Record failed backup
      const backupRecord = {
        timestamp: startTime,
        duration,
        success: false,
        error: error.message
      };
      
      this.addToHistory(backupRecord);
      
      console.error(`❌ Scheduled backup failed:`, error.message);
      
      // Log audit trail for failure
      try {
        const systemUser = await this.getSystemUser();
        if (systemUser) {
          await AuditService.log({
            action: 'system_backup',
            entityType: 'System',
            entityId: new mongoose.Types.ObjectId(),
            entityName: 'Scheduled Backup Failed',
            performedBy: systemUser._id,
            description: `Automated daily backup failed: ${error.message}`,
            changes: {
              scheduledBackupFailure: {
                error: error.message,
                duration
              }
            },
            severity: 'critical',
            status: 'failed',
            errorDetails: error.message
          });
        }
      } catch (auditError) {
        console.error('Failed to log backup failure audit:', auditError.message);
      }
    }
  }

  /**
   * Perform scheduled cleanup
   */
  async performScheduledCleanup() {
    console.log('🧹 Starting scheduled backup cleanup');
    
    try {
      const deletedCount = await BackupService.cleanupOldBackups(10); // Keep last 10 backups
      
      console.log(`✅ Cleanup completed. Deleted ${deletedCount} old backups`);
      
      // Log audit trail
      const systemUser = await this.getSystemUser();
      if (systemUser) {
        await AuditService.log({
          action: 'system_backup',
          entityType: 'System',
          entityId: new mongoose.Types.ObjectId(),
          entityName: 'Scheduled Backup Cleanup',
          performedBy: systemUser._id,
          description: `Automated backup cleanup deleted ${deletedCount} old backups`,
          changes: {
            cleanup: {
              deletedCount,
              keepCount: 10
            }
          },
          severity: 'medium'
        });
      }
      
    } catch (error) {
      console.error('❌ Scheduled cleanup failed:', error.message);
    }
  }

  /**
   * Get system user for audit logging
   */
  async getSystemUser() {
    try {
      // Try to find an owner user for system operations
      let systemUser = await User.findOne({ role: 'owner' });
      
      if (!systemUser) {
        // If no owner found, create a system user entry
        systemUser = {
          _id: new mongoose.Types.ObjectId(),
          name: 'System',
          email: 'system@backup.local',
          role: 'system'
        };
      }
      
      return systemUser;
    } catch (error) {
      console.error('Failed to get system user:', error.message);
      return null;
    }
  }

  /**
   * Add backup record to history
   */
  addToHistory(record) {
    this.backupHistory.unshift(record);
    
    // Keep only the last N records
    if (this.backupHistory.length > this.maxHistorySize) {
      this.backupHistory = this.backupHistory.slice(0, this.maxHistorySize);
    }
  }

  /**
   * Get backup service status
   */
  getStatus() {
    const successfulBackups = this.backupHistory.filter(b => b.success).length;
    const failedBackups = this.backupHistory.filter(b => !b.success).length;
    
    return {
      isRunning: this.isRunning,
      lastBackupTime: this.lastBackupTime,
      totalBackups: this.backupHistory.length,
      successfulBackups,
      failedBackups,
      successRate: this.backupHistory.length > 0 ? 
        (successfulBackups / this.backupHistory.length * 100).toFixed(2) : 0,
      recentHistory: this.backupHistory.slice(0, 10), // Last 10 backups
      nextScheduledBackup: this.getNextScheduledTime(),
      schedule: {
        dailyBackup: '2:00 AM',
        weeklyCleanup: '3:00 AM on Sundays',
        timezone: 'America/Chicago'
      }
    };
  }

  /**
   * Get next scheduled backup time
   */
  getNextScheduledTime() {
    if (!this.isRunning) return null;
    
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(2, 0, 0, 0); // 2:00 AM
    
    // If it's before 2 AM today, next backup is today at 2 AM
    const todayAt2AM = new Date(now);
    todayAt2AM.setHours(2, 0, 0, 0);
    
    if (now < todayAt2AM) {
      return todayAt2AM;
    }
    
    return tomorrow;
  }

  /**
   * Manually trigger backup (for testing)
   */
  async triggerManualBackup() {
    if (!this.isRunning) {
      throw new Error('Scheduled backup service is not running');
    }
    
    console.log('🔄 Manual backup triggered');
    await this.performScheduledBackup();
  }

  /**
   * Format bytes to human readable format
   */
  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Format duration to human readable format
   */
  formatDuration(milliseconds) {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  }
}

// Create singleton instance
const scheduledBackupService = new ScheduledBackupService();

export default scheduledBackupService;