import fs from 'fs/promises';
import path from 'path';
import { createWriteStream } from 'fs';
import { pipeline } from 'stream/promises';
import { Transform } from 'stream';
import mongoose from 'mongoose';
import Invoice from '../models/Invoice.js';
import Customer from '../models/Customer.js';
import Product from '../models/Product.js';
import Employee from '../models/Employee.js';
import SalaryPayment from '../models/SalaryPayment.js';
import Expense from '../models/Expense.js';
import Investment from '../models/Investment.js';
import User from '../models/User.js';
import AuditLog from '../models/AuditLog.js';
import AuditService from './auditService.js';

/**
 * Backup Service - Comprehensive data backup and export functionality
 */
class BackupService {
  
  constructor() {
    this.backupDir = path.join(process.cwd(), 'backups');
    this.ensureBackupDirectory();
  }

  /**
   * Ensure backup directory exists
   */
  async ensureBackupDirectory() {
    try {
      await fs.access(this.backupDir);
    } catch (error) {
      await fs.mkdir(this.backupDir, { recursive: true });
    }
  }

  /**
   * Generate backup filename with timestamp
   */
  generateBackupFilename(type, format = 'json') {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    return `${type}_backup_${timestamp}.${format}`;
  }

  /**
   * Export invoices data
   */
  async exportInvoices(format = 'json', filters = {}) {
    try {
      const query = { isActive: true, ...filters };
      
      if (filters.startDate || filters.endDate) {
        query.createdAt = {};
        if (filters.startDate) query.createdAt.$gte = new Date(filters.startDate);
        if (filters.endDate) query.createdAt.$lte = new Date(filters.endDate);
      }

      const invoices = await Invoice.find(query)
        .populate('customer', 'customerId name phone email')
        .populate('items.product', 'name category unit')
        .populate('createdBy', 'name email')
        .populate('updatedBy', 'name email')
        .sort({ createdAt: -1 })
        .lean();

      const filename = this.generateBackupFilename('invoices', format);
      const filepath = path.join(this.backupDir, filename);

      if (format === 'csv') {
        await this.exportToCSV(invoices, filepath, this.getInvoiceCSVHeaders(), this.formatInvoiceForCSV);
      } else {
        await this.exportToJSON(invoices, filepath, {
          exportType: 'invoices',
          totalRecords: invoices.length,
          filters,
          exportDate: new Date()
        });
      }

      return {
        filename,
        filepath,
        recordCount: invoices.length,
        fileSize: await this.getFileSize(filepath)
      };
    } catch (error) {
      throw new Error(`Failed to export invoices: ${error.message}`);
    }
  }

  /**
   * Export customers data
   */
  async exportCustomers(format = 'json', filters = {}) {
    try {
      const query = { ...filters };
      
      if (filters.isActive !== undefined) {
        query.isActive = filters.isActive === 'true';
      }

      const customers = await Customer.find(query)
        .populate('createdBy', 'name email')
        .populate('updatedBy', 'name email')
        .sort({ createdAt: -1 })
        .lean();

      const filename = this.generateBackupFilename('customers', format);
      const filepath = path.join(this.backupDir, filename);

      if (format === 'csv') {
        await this.exportToCSV(customers, filepath, this.getCustomerCSVHeaders(), this.formatCustomerForCSV);
      } else {
        await this.exportToJSON(customers, filepath, {
          exportType: 'customers',
          totalRecords: customers.length,
          filters,
          exportDate: new Date()
        });
      }

      return {
        filename,
        filepath,
        recordCount: customers.length,
        fileSize: await this.getFileSize(filepath)
      };
    } catch (error) {
      throw new Error(`Failed to export customers: ${error.message}`);
    }
  }

  /**
   * Export products data
   */
  async exportProducts(format = 'json', filters = {}) {
    try {
      const query = { ...filters };
      
      if (filters.isActive !== undefined) {
        query.isActive = filters.isActive === 'true';
      }
      
      if (filters.category) {
        query.category = filters.category;
      }

      const products = await Product.find(query)
        .populate('createdBy', 'name email')
        .populate('updatedBy', 'name email')
        .sort({ createdAt: -1 })
        .lean();

      const filename = this.generateBackupFilename('products', format);
      const filepath = path.join(this.backupDir, filename);

      if (format === 'csv') {
        await this.exportToCSV(products, filepath, this.getProductCSVHeaders(), this.formatProductForCSV);
      } else {
        await this.exportToJSON(products, filepath, {
          exportType: 'products',
          totalRecords: products.length,
          filters,
          exportDate: new Date()
        });
      }

      return {
        filename,
        filepath,
        recordCount: products.length,
        fileSize: await this.getFileSize(filepath)
      };
    } catch (error) {
      throw new Error(`Failed to export products: ${error.message}`);
    }
  }

  /**
   * Export expenses data
   */
  async exportExpenses(format = 'json', filters = {}) {
    try {
      const query = { ...filters };
      
      if (filters.startDate || filters.endDate) {
        query.expenseDate = {};
        if (filters.startDate) query.expenseDate.$gte = new Date(filters.startDate);
        if (filters.endDate) query.expenseDate.$lte = new Date(filters.endDate);
      }

      if (filters.category) {
        query.category = filters.category;
      }

      if (filters.status) {
        query.status = filters.status;
      }

      const expenses = await Expense.find(query)
        .populate('createdBy', 'name email')
        .populate('updatedBy', 'name email')
        .populate('approvedBy', 'name email')
        .sort({ expenseDate: -1 })
        .lean();

      const filename = this.generateBackupFilename('expenses', format);
      const filepath = path.join(this.backupDir, filename);

      if (format === 'csv') {
        await this.exportToCSV(expenses, filepath, this.getExpenseCSVHeaders(), this.formatExpenseForCSV);
      } else {
        await this.exportToJSON(expenses, filepath, {
          exportType: 'expenses',
          totalRecords: expenses.length,
          filters,
          exportDate: new Date()
        });
      }

      return {
        filename,
        filepath,
        recordCount: expenses.length,
        fileSize: await this.getFileSize(filepath)
      };
    } catch (error) {
      throw new Error(`Failed to export expenses: ${error.message}`);
    }
  }

  /**
   * Export employees data
   */
  async exportEmployees(format = 'json', filters = {}) {
    try {
      const query = { ...filters };
      
      if (filters.isActive !== undefined) {
        query.isActive = filters.isActive === 'true';
      }

      const employees = await Employee.find(query)
        .populate('createdBy', 'name email')
        .populate('updatedBy', 'name email')
        .sort({ createdAt: -1 })
        .lean();

      const filename = this.generateBackupFilename('employees', format);
      const filepath = path.join(this.backupDir, filename);

      if (format === 'csv') {
        await this.exportToCSV(employees, filepath, this.getEmployeeCSVHeaders(), this.formatEmployeeForCSV);
      } else {
        await this.exportToJSON(employees, filepath, {
          exportType: 'employees',
          totalRecords: employees.length,
          filters,
          exportDate: new Date()
        });
      }

      return {
        filename,
        filepath,
        recordCount: employees.length,
        fileSize: await this.getFileSize(filepath)
      };
    } catch (error) {
      throw new Error(`Failed to export employees: ${error.message}`);
    }
  }

  /**
   * Create complete database backup
   */
  async createFullBackup(user) {
    try {
      const backupId = new Date().toISOString().replace(/[:.]/g, '-');
      const backupFolder = path.join(this.backupDir, `full_backup_${backupId}`);
      
      await fs.mkdir(backupFolder, { recursive: true });

      const results = {
        backupId,
        backupFolder,
        timestamp: new Date(),
        modules: {},
        totalRecords: 0,
        totalSize: 0
      };

      // Export all modules
      const modules = [
        { name: 'invoices', method: 'exportInvoices' },
        { name: 'customers', method: 'exportCustomers' },
        { name: 'products', method: 'exportProducts' },
        { name: 'expenses', method: 'exportExpenses' },
        { name: 'employees', method: 'exportEmployees' }
      ];

      for (const module of modules) {
        try {
          const result = await this[module.method]('json');
          
          // Move file to backup folder
          const newPath = path.join(backupFolder, result.filename);
          await fs.rename(result.filepath, newPath);
          
          results.modules[module.name] = {
            filename: result.filename,
            recordCount: result.recordCount,
            fileSize: result.fileSize
          };
          
          results.totalRecords += result.recordCount;
          results.totalSize += result.fileSize;
        } catch (error) {
          results.modules[module.name] = {
            error: error.message
          };
        }
      }

      // Export system data
      await this.exportSystemData(backupFolder);

      // Create backup manifest
      const manifest = {
        ...results,
        version: '1.0',
        databaseName: mongoose.connection.name,
        nodeVersion: process.version,
        backupType: 'full',
        createdBy: user ? {
          id: user._id,
          name: user.name,
          email: user.email
        } : null
      };

      await fs.writeFile(
        path.join(backupFolder, 'backup_manifest.json'),
        JSON.stringify(manifest, null, 2)
      );

      // Log audit trail
      if (user) {
        await AuditService.log({
          action: 'system_backup',
          entityType: 'System',
          entityId: new mongoose.Types.ObjectId(),
          entityName: `Full Database Backup - ${backupId}`,
          performedBy: user._id,
          description: `Created full database backup with ${results.totalRecords} total records`,
          changes: {
            backup: {
              backupId,
              modules: Object.keys(results.modules),
              totalRecords: results.totalRecords,
              totalSize: results.totalSize
            }
          },
          severity: 'critical'
        });
      }

      return results;
    } catch (error) {
      throw new Error(`Failed to create full backup: ${error.message}`);
    }
  }

  /**
   * Export system data (users, audit logs, etc.)
   */
  async exportSystemData(backupFolder) {
    try {
      // Export users (excluding passwords)
      const users = await User.find({})
        .select('-password')
        .lean();
      
      await fs.writeFile(
        path.join(backupFolder, 'users_backup.json'),
        JSON.stringify({
          exportType: 'users',
          totalRecords: users.length,
          exportDate: new Date(),
          data: users
        }, null, 2)
      );

      // Export recent audit logs (last 30 days)
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const auditLogs = await AuditLog.find({
        timestamp: { $gte: thirtyDaysAgo }
      })
        .populate('performedBy', 'name email')
        .lean();

      await fs.writeFile(
        path.join(backupFolder, 'audit_logs_backup.json'),
        JSON.stringify({
          exportType: 'audit_logs',
          totalRecords: auditLogs.length,
          exportDate: new Date(),
          dateRange: { from: thirtyDaysAgo, to: new Date() },
          data: auditLogs
        }, null, 2)
      );

    } catch (error) {
      console.error('Failed to export system data:', error.message);
    }
  }

  /**
   * Get list of available backups
   */
  async getBackupList() {
    try {
      const files = await fs.readdir(this.backupDir);
      const backups = [];

      for (const file of files) {
        const filepath = path.join(this.backupDir, file);
        const stats = await fs.stat(filepath);
        
        if (stats.isDirectory() && file.startsWith('full_backup_')) {
          // Full backup directory
          const manifestPath = path.join(filepath, 'backup_manifest.json');
          try {
            const manifestContent = await fs.readFile(manifestPath, 'utf8');
            const manifest = JSON.parse(manifestContent);
            backups.push({
              type: 'full',
              id: manifest.backupId,
              timestamp: manifest.timestamp,
              totalRecords: manifest.totalRecords,
              totalSize: manifest.totalSize,
              modules: manifest.modules,
              path: filepath
            });
          } catch (error) {
            // Manifest not found or corrupted
            backups.push({
              type: 'full',
              id: file.replace('full_backup_', ''),
              timestamp: stats.birthtime,
              path: filepath,
              error: 'Manifest not found'
            });
          }
        } else if (stats.isFile() && file.endsWith('.json')) {
          // Individual module backup
          const fileSize = stats.size;
          const type = file.split('_')[0];
          
          backups.push({
            type: 'module',
            module: type,
            filename: file,
            timestamp: stats.birthtime,
            fileSize,
            path: filepath
          });
        }
      }

      return backups.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    } catch (error) {
      throw new Error(`Failed to get backup list: ${error.message}`);
    }
  }

  /**
   * Delete old backups (keep last N backups)
   */
  async cleanupOldBackups(keepCount = 10) {
    try {
      const backups = await this.getBackupList();
      const fullBackups = backups.filter(b => b.type === 'full');
      
      if (fullBackups.length > keepCount) {
        const toDelete = fullBackups.slice(keepCount);
        
        for (const backup of toDelete) {
          await fs.rm(backup.path, { recursive: true, force: true });
        }
        
        return toDelete.length;
      }
      
      return 0;
    } catch (error) {
      throw new Error(`Failed to cleanup old backups: ${error.message}`);
    }
  }

  // CSV Export Helper Methods
  getInvoiceCSVHeaders() {
    return [
      'Invoice No', 'Customer Name', 'Customer Phone', 'Customer Type',
      'Subtotal', 'Discount', 'Grand Total', 'Paid Amount', 'Due Amount',
      'Status', 'Payment Method', 'Created Date', 'Created By'
    ];
  }

  formatInvoiceForCSV(invoice) {
    return [
      invoice.invoiceNo,
      invoice.customerName,
      invoice.customerPhone || '',
      invoice.customerType,
      invoice.subtotal,
      invoice.discount,
      invoice.grandTotal,
      invoice.paidAmount,
      invoice.dueAmount,
      invoice.status,
      invoice.paymentMethod,
      new Date(invoice.createdAt).toISOString(),
      invoice.createdBy?.name || ''
    ];
  }

  getCustomerCSVHeaders() {
    return [
      'Customer ID', 'Name', 'Phone', 'Email', 'Customer Type',
      'Total Sales', 'Total Paid', 'Total Due', 'Invoice Count',
      'Credit Limit', 'Is Active', 'Created Date'
    ];
  }

  formatCustomerForCSV(customer) {
    return [
      customer.customerId,
      customer.name,
      customer.phone || '',
      customer.email || '',
      customer.customerType,
      customer.totalSales,
      customer.totalPaid,
      customer.totalDue,
      customer.invoiceCount,
      customer.creditLimit,
      customer.isActive,
      new Date(customer.createdAt).toISOString()
    ];
  }

  getProductCSVHeaders() {
    return [
      'Name', 'Category', 'Purchase Price', 'Selling Price',
      'Stock Quantity', 'Unit', 'Description', 'Is Active', 'Created Date'
    ];
  }

  formatProductForCSV(product) {
    return [
      product.name,
      product.category,
      product.purchasePrice,
      product.sellingPrice,
      product.stockQuantity,
      product.unit,
      product.description || '',
      product.isActive,
      new Date(product.createdAt).toISOString()
    ];
  }

  getExpenseCSVHeaders() {
    return [
      'Expense ID', 'Title', 'Description', 'Amount', 'Category',
      'Expense Date', 'Payment Method', 'Status', 'Reference Number',
      'Is Auto Generated', 'Created Date', 'Created By'
    ];
  }

  formatExpenseForCSV(expense) {
    return [
      expense.expenseId,
      expense.title,
      expense.description || '',
      expense.amount,
      expense.category,
      new Date(expense.expenseDate).toISOString(),
      expense.paymentMethod,
      expense.status,
      expense.referenceNumber || '',
      expense.isAutoGenerated,
      new Date(expense.createdAt).toISOString(),
      expense.createdBy?.name || ''
    ];
  }

  getEmployeeCSVHeaders() {
    return [
      'Employee ID', 'Name', 'Email', 'Phone', 'Department',
      'Position', 'Base Salary', 'Hire Date', 'Is Active', 'Created Date'
    ];
  }

  formatEmployeeForCSV(employee) {
    return [
      employee.employeeId,
      employee.name,
      employee.email || '',
      employee.phone || '',
      employee.department,
      employee.position,
      employee.baseSalary,
      employee.hireDate ? new Date(employee.hireDate).toISOString() : '',
      employee.isActive,
      new Date(employee.createdAt).toISOString()
    ];
  }

  // Utility Methods
  async exportToJSON(data, filepath, metadata = {}) {
    const exportData = {
      ...metadata,
      data
    };
    await fs.writeFile(filepath, JSON.stringify(exportData, null, 2));
  }

  async exportToCSV(data, filepath, headers, formatter) {
    const writeStream = createWriteStream(filepath);
    
    // Write headers
    writeStream.write(headers.join(',') + '\n');
    
    // Write data
    for (const item of data) {
      const row = formatter(item);
      const csvRow = row.map(field => {
        // Escape quotes and wrap in quotes if contains comma or quote
        const stringField = String(field || '');
        if (stringField.includes(',') || stringField.includes('"') || stringField.includes('\n')) {
          return `"${stringField.replace(/"/g, '""')}"`;
        }
        return stringField;
      }).join(',');
      writeStream.write(csvRow + '\n');
    }
    
    writeStream.end();
    
    return new Promise((resolve, reject) => {
      writeStream.on('finish', resolve);
      writeStream.on('error', reject);
    });
  }

  async getFileSize(filepath) {
    try {
      const stats = await fs.stat(filepath);
      return stats.size;
    } catch (error) {
      return 0;
    }
  }
}

export default new BackupService();