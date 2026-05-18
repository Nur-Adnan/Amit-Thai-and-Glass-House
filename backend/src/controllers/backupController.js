import asyncHandler from '../utils/asyncHandler.js';
import BackupService from '../services/backupService.js';
import path from 'path';
import fs from 'fs/promises';

// @desc    Export invoices data
// @route   GET /api/backup/export/invoices
// @access  Private (Owner only)
const exportInvoices = asyncHandler(async (req, res) => {
  const { format = 'json', startDate, endDate, status, customerName } = req.query;

  const filters = {};
  if (status) filters.status = status;
  if (customerName) filters.customerName = { $regex: customerName, $options: 'i' };
  if (startDate) filters.startDate = startDate;
  if (endDate) filters.endDate = endDate;

  const result = await BackupService.exportInvoices(format, filters);

  if (req.query.download === 'true') {
    // Send file for download
    res.setHeader('Content-Type', format === 'csv' ? 'text/csv' : 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
    
    const fileContent = await fs.readFile(result.filepath);
    res.send(fileContent);
    
    // Clean up temporary file
    setTimeout(async () => {
      try {
        await fs.unlink(result.filepath);
      } catch (error) {
        console.error('Failed to cleanup export file:', error.message);
      }
    }, 5000);
  } else {
    res.status(200).json({
      success: true,
      message: 'Invoices exported successfully',
      data: {
        filename: result.filename,
        recordCount: result.recordCount,
        fileSize: result.fileSize,
        downloadUrl: `/api/backup/download/${result.filename}`
      }
    });
  }
});

// @desc    Export customers data
// @route   GET /api/backup/export/customers
// @access  Private (Owner only)
const exportCustomers = asyncHandler(async (req, res) => {
  const { format = 'json', isActive, customerType } = req.query;

  const filters = {};
  if (isActive !== undefined) filters.isActive = isActive;
  if (customerType) filters.customerType = customerType;

  const result = await BackupService.exportCustomers(format, filters);

  if (req.query.download === 'true') {
    res.setHeader('Content-Type', format === 'csv' ? 'text/csv' : 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
    
    const fileContent = await fs.readFile(result.filepath);
    res.send(fileContent);
    
    setTimeout(async () => {
      try {
        await fs.unlink(result.filepath);
      } catch (error) {
        console.error('Failed to cleanup export file:', error.message);
      }
    }, 5000);
  } else {
    res.status(200).json({
      success: true,
      message: 'Customers exported successfully',
      data: {
        filename: result.filename,
        recordCount: result.recordCount,
        fileSize: result.fileSize,
        downloadUrl: `/api/backup/download/${result.filename}`
      }
    });
  }
});

// @desc    Export products data
// @route   GET /api/backup/export/products
// @access  Private (Owner only)
const exportProducts = asyncHandler(async (req, res) => {
  const { format = 'json', isActive, category } = req.query;

  const filters = {};
  if (isActive !== undefined) filters.isActive = isActive;
  if (category) filters.category = category;

  const result = await BackupService.exportProducts(format, filters);

  if (req.query.download === 'true') {
    res.setHeader('Content-Type', format === 'csv' ? 'text/csv' : 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
    
    const fileContent = await fs.readFile(result.filepath);
    res.send(fileContent);
    
    setTimeout(async () => {
      try {
        await fs.unlink(result.filepath);
      } catch (error) {
        console.error('Failed to cleanup export file:', error.message);
      }
    }, 5000);
  } else {
    res.status(200).json({
      success: true,
      message: 'Products exported successfully',
      data: {
        filename: result.filename,
        recordCount: result.recordCount,
        fileSize: result.fileSize,
        downloadUrl: `/api/backup/download/${result.filename}`
      }
    });
  }
});

// @desc    Export expenses data
// @route   GET /api/backup/export/expenses
// @access  Private (Owner only)
const exportExpenses = asyncHandler(async (req, res) => {
  const { format = 'json', startDate, endDate, category, status } = req.query;

  const filters = {};
  if (category) filters.category = category;
  if (status) filters.status = status;
  if (startDate) filters.startDate = startDate;
  if (endDate) filters.endDate = endDate;

  const result = await BackupService.exportExpenses(format, filters);

  if (req.query.download === 'true') {
    res.setHeader('Content-Type', format === 'csv' ? 'text/csv' : 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
    
    const fileContent = await fs.readFile(result.filepath);
    res.send(fileContent);
    
    setTimeout(async () => {
      try {
        await fs.unlink(result.filepath);
      } catch (error) {
        console.error('Failed to cleanup export file:', error.message);
      }
    }, 5000);
  } else {
    res.status(200).json({
      success: true,
      message: 'Expenses exported successfully',
      data: {
        filename: result.filename,
        recordCount: result.recordCount,
        fileSize: result.fileSize,
        downloadUrl: `/api/backup/download/${result.filename}`
      }
    });
  }
});

// @desc    Export employees data
// @route   GET /api/backup/export/employees
// @access  Private (Owner only)
const exportEmployees = asyncHandler(async (req, res) => {
  const { format = 'json', isActive, department } = req.query;

  const filters = {};
  if (isActive !== undefined) filters.isActive = isActive;
  if (department) filters.department = department;

  const result = await BackupService.exportEmployees(format, filters);

  if (req.query.download === 'true') {
    res.setHeader('Content-Type', format === 'csv' ? 'text/csv' : 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
    
    const fileContent = await fs.readFile(result.filepath);
    res.send(fileContent);
    
    setTimeout(async () => {
      try {
        await fs.unlink(result.filepath);
      } catch (error) {
        console.error('Failed to cleanup export file:', error.message);
      }
    }, 5000);
  } else {
    res.status(200).json({
      success: true,
      message: 'Employees exported successfully',
      data: {
        filename: result.filename,
        recordCount: result.recordCount,
        fileSize: result.fileSize,
        downloadUrl: `/api/backup/download/${result.filename}`
      }
    });
  }
});

// @desc    Create full database backup
// @route   POST /api/backup/full
// @access  Private (Owner only)
const createFullBackup = asyncHandler(async (req, res) => {
  const result = await BackupService.createFullBackup(req.user);

  res.status(201).json({
    success: true,
    message: 'Full database backup created successfully',
    data: {
      backupId: result.backupId,
      timestamp: result.timestamp,
      totalRecords: result.totalRecords,
      totalSize: result.totalSize,
      modules: result.modules,
      downloadUrl: `/api/backup/download/full/${result.backupId}`
    }
  });
});

// @desc    Get list of available backups
// @route   GET /api/backup/list
// @access  Private (Owner only)
const getBackupList = asyncHandler(async (req, res) => {
  const backups = await BackupService.getBackupList();

  // Calculate summary statistics
  const summary = {
    totalBackups: backups.length,
    fullBackups: backups.filter(b => b.type === 'full').length,
    moduleBackups: backups.filter(b => b.type === 'module').length,
    totalSize: backups.reduce((sum, b) => sum + (b.totalSize || b.fileSize || 0), 0),
    oldestBackup: backups.length > 0 ? backups[backups.length - 1].timestamp : null,
    newestBackup: backups.length > 0 ? backups[0].timestamp : null
  };

  res.status(200).json({
    success: true,
    data: {
      backups,
      summary
    }
  });
});

// @desc    Download backup file
// @route   GET /api/backup/download/:filename
// @access  Private (Owner only)
const downloadBackup = asyncHandler(async (req, res) => {
  const { filename } = req.params;
  const filepath = path.join(BackupService.backupDir, filename);

  try {
    await fs.access(filepath);
    
    const stats = await fs.stat(filepath);
    const isDirectory = stats.isDirectory();
    
    if (isDirectory) {
      return res.status(400).json({
        success: false,
        message: 'Cannot download directory. Use full backup download endpoint.'
      });
    }

    const fileExtension = path.extname(filename);
    const contentType = fileExtension === '.csv' ? 'text/csv' : 'application/json';
    
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', stats.size);
    
    const fileContent = await fs.readFile(filepath);
    res.send(fileContent);
    
  } catch (error) {
    res.status(404).json({
      success: false,
      message: 'Backup file not found'
    });
  }
});

// @desc    Download full backup as ZIP
// @route   GET /api/backup/download/full/:backupId
// @access  Private (Owner only)
const downloadFullBackup = asyncHandler(async (req, res) => {
  const { backupId } = req.params;
  const backupFolder = path.join(BackupService.backupDir, `full_backup_${backupId}`);

  try {
    await fs.access(backupFolder);
    
    // For now, return the manifest and file list
    // In production, you might want to create a ZIP file
    const manifestPath = path.join(backupFolder, 'backup_manifest.json');
    const manifest = JSON.parse(await fs.readFile(manifestPath, 'utf8'));
    
    const files = await fs.readdir(backupFolder);
    
    res.status(200).json({
      success: true,
      message: 'Full backup available for download',
      data: {
        manifest,
        files,
        downloadInstructions: 'Individual files can be downloaded using their specific endpoints'
      }
    });
    
  } catch (error) {
    res.status(404).json({
      success: false,
      message: 'Full backup not found'
    });
  }
});

// @desc    Delete backup
// @route   DELETE /api/backup/:filename
// @access  Private (Owner only)
const deleteBackup = asyncHandler(async (req, res) => {
  const { filename } = req.params;
  const filepath = path.join(BackupService.backupDir, filename);

  try {
    const stats = await fs.stat(filepath);
    
    if (stats.isDirectory()) {
      await fs.rm(filepath, { recursive: true, force: true });
    } else {
      await fs.unlink(filepath);
    }

    res.status(200).json({
      success: true,
      message: 'Backup deleted successfully'
    });
    
  } catch (error) {
    res.status(404).json({
      success: false,
      message: 'Backup not found'
    });
  }
});

// @desc    Cleanup old backups
// @route   POST /api/backup/cleanup
// @access  Private (Owner only)
const cleanupOldBackups = asyncHandler(async (req, res) => {
  const { keepCount = 10 } = req.body;
  
  const deletedCount = await BackupService.cleanupOldBackups(parseInt(keepCount));

  res.status(200).json({
    success: true,
    message: `Cleanup completed. Deleted ${deletedCount} old backups.`,
    data: {
      deletedCount,
      keepCount: parseInt(keepCount)
    }
  });
});

// @desc    Get backup statistics
// @route   GET /api/backup/stats
// @access  Private (Owner only)
const getBackupStats = asyncHandler(async (req, res) => {
  const backups = await BackupService.getBackupList();
  
  const stats = {
    totalBackups: backups.length,
    backupTypes: {
      full: backups.filter(b => b.type === 'full').length,
      module: backups.filter(b => b.type === 'module').length
    },
    totalSize: backups.reduce((sum, b) => sum + (b.totalSize || b.fileSize || 0), 0),
    averageSize: backups.length > 0 ? 
      backups.reduce((sum, b) => sum + (b.totalSize || b.fileSize || 0), 0) / backups.length : 0,
    dateRange: {
      oldest: backups.length > 0 ? backups[backups.length - 1].timestamp : null,
      newest: backups.length > 0 ? backups[0].timestamp : null
    },
    moduleBreakdown: {}
  };

  // Calculate module breakdown
  const moduleBackups = backups.filter(b => b.type === 'module');
  for (const backup of moduleBackups) {
    if (!stats.moduleBreakdown[backup.module]) {
      stats.moduleBreakdown[backup.module] = 0;
    }
    stats.moduleBreakdown[backup.module]++;
  }

  res.status(200).json({
    success: true,
    data: stats
  });
});

export {
  exportInvoices,
  exportCustomers,
  exportProducts,
  exportExpenses,
  exportEmployees,
  createFullBackup,
  getBackupList,
  downloadBackup,
  downloadFullBackup,
  deleteBackup,
  cleanupOldBackups,
  getBackupStats
};