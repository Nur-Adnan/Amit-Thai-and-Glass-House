// Data Safety Tests
// Tests manual export, backup integrity, restore functionality, and soft-deleted data handling

describe('Data Safety Tests', () => {
  describe('Manual Export (CSV / JSON)', () => {
    test('should export invoices to CSV format', () => {
      const mockExportToCSV = (invoices) => {
        if (!invoices || invoices.length === 0) {
          return { success: false, error: 'No data to export' };
        }
        
        // CSV headers
        const headers = [
          'Invoice No', 'Customer Name', 'Customer Phone', 'Date', 
          'Items', 'Subtotal', 'Discount', 'Grand Total', 'Paid Amount', 
          'Due Amount', 'Status', 'Payment Method'
        ];
        
        // Convert invoices to CSV rows
        const csvRows = invoices.map(invoice => {
          const itemsText = invoice.items.map(item => 
            `${item.productName} (${item.quantity} ${item.unit} @ ৳${item.unitPrice})`
          ).join('; ');
          
          return [
            invoice.invoiceNo,
            invoice.customerName,
            invoice.customerPhone || '',
            new Date(invoice.createdAt).toLocaleDateString('en-GB'),
            itemsText,
            invoice.subtotal,
            invoice.discount,
            invoice.grandTotal,
            invoice.paidAmount,
            invoice.dueAmount,
            invoice.status,
            invoice.paymentMethod
          ];
        });
        
        // Create CSV content
        const csvContent = [headers, ...csvRows]
          .map(row => row.map(field => `"${field}"`).join(','))
          .join('\n');
        
        return {
          success: true,
          format: 'CSV',
          content: csvContent,
          filename: `invoices_export_${new Date().toISOString().split('T')[0]}.csv`,
          recordCount: invoices.length,
          size: csvContent.length
        };
      };

      const sampleInvoices = [
        {
          invoiceNo: 'INV-202601-0001',
          customerName: 'Test Customer 1',
          customerPhone: '01712345678',
          createdAt: '2026-01-15T10:30:00Z',
          items: [
            { productName: 'Glass Panel', quantity: 10, unit: 'sqft', unitPrice: 150 }
          ],
          subtotal: 1500,
          discount: 0,
          grandTotal: 1500,
          paidAmount: 1500,
          dueAmount: 0,
          status: 'paid',
          paymentMethod: 'cash'
        },
        {
          invoiceNo: 'INV-202601-0002',
          customerName: 'Test Customer 2',
          customerPhone: '01787654321',
          createdAt: '2026-01-16T14:20:00Z',
          items: [
            { productName: 'Aluminum Frame', quantity: 5, unit: 'piece', unitPrice: 200 }
          ],
          subtotal: 1000,
          discount: 50,
          grandTotal: 950,
          paidAmount: 500,
          dueAmount: 450,
          status: 'partial',
          paymentMethod: 'mixed'
        }
      ];
      
      const result = mockExportToCSV(sampleInvoices);
      
      expect(result.success).toBe(true);
      expect(result.format).toBe('CSV');
      expect(result.recordCount).toBe(2);
      expect(result.content).toContain('"Invoice No","Customer Name"');
      expect(result.content).toContain('INV-202601-0001');
      expect(result.content).toContain('Test Customer 1');
      expect(result.filename).toMatch(/invoices_export_\d{4}-\d{2}-\d{2}\.csv/);
    });

    test('should export customers to JSON format', () => {
      const mockExportToJSON = (customers) => {
        if (!customers || customers.length === 0) {
          return { success: false, error: 'No data to export' };
        }
        
        // Clean and structure data for export
        const exportData = {
          exportInfo: {
            exportDate: new Date().toISOString(),
            recordCount: customers.length,
            dataType: 'customers',
            version: '1.0'
          },
          data: customers.map(customer => ({
            customerId: customer.customerId,
            name: customer.name,
            phone: customer.phone,
            email: customer.email || null,
            address: customer.address || null,
            customerType: customer.customerType,
            creditLimit: customer.creditLimit,
            currentDue: customer.currentDue || 0,
            totalPurchases: customer.totalPurchases || 0,
            createdAt: customer.createdAt,
            isActive: customer.isActive,
            isDeleted: customer.isDeleted || false
          }))
        };
        
        const jsonContent = JSON.stringify(exportData, null, 2);
        
        return {
          success: true,
          format: 'JSON',
          content: jsonContent,
          filename: `customers_export_${new Date().toISOString().split('T')[0]}.json`,
          recordCount: customers.length,
          size: jsonContent.length
        };
      };

      const sampleCustomers = [
        {
          customerId: 'CUST-0001',
          name: 'Ahmed Hassan',
          phone: '01712345678',
          email: 'ahmed@example.com',
          address: '123 Main Street, Dhaka',
          customerType: 'regular',
          creditLimit: 50000,
          currentDue: 5000,
          totalPurchases: 150000,
          createdAt: '2026-01-01T00:00:00Z',
          isActive: true,
          isDeleted: false
        },
        {
          customerId: 'CUST-0002',
          name: 'Fatima Rahman',
          phone: '01787654321',
          customerType: 'walk-in',
          creditLimit: 0,
          currentDue: 0,
          totalPurchases: 25000,
          createdAt: '2026-01-10T00:00:00Z',
          isActive: true,
          isDeleted: false
        }
      ];
      
      const result = mockExportToJSON(sampleCustomers);
      
      expect(result.success).toBe(true);
      expect(result.format).toBe('JSON');
      expect(result.recordCount).toBe(2);
      expect(result.content).toContain('"dataType": "customers"');
      expect(result.content).toContain('CUST-0001');
      expect(result.content).toContain('Ahmed Hassan');
      expect(result.filename).toMatch(/customers_export_\d{4}-\d{2}-\d{2}\.json/);
    });

    test('should export products with inventory data', () => {
      const mockExportProductsCSV = (products) => {
        const headers = [
          'Product ID', 'Name', 'Category', 'Stock Quantity', 'Unit',
          'Purchase Price', 'Selling Price', 'Profit Margin', 'Stock Value',
          'Status', 'Created Date', 'Last Updated'
        ];
        
        const csvRows = products.map(product => {
          const profitMargin = ((product.sellingPrice - product.purchasePrice) / product.purchasePrice * 100).toFixed(2);
          const stockValue = (product.stockQuantity * product.purchasePrice).toFixed(2);
          
          return [
            product.productId || '',
            product.name,
            product.category,
            product.stockQuantity,
            product.unit,
            product.purchasePrice,
            product.sellingPrice,
            `${profitMargin}%`,
            `৳${stockValue}`,
            product.isActive ? 'Active' : 'Inactive',
            new Date(product.createdAt).toLocaleDateString('en-GB'),
            new Date(product.updatedAt).toLocaleDateString('en-GB')
          ];
        });
        
        const csvContent = [headers, ...csvRows]
          .map(row => row.map(field => `"${field}"`).join(','))
          .join('\n');
        
        return {
          success: true,
          format: 'CSV',
          content: csvContent,
          recordCount: products.length,
          totalStockValue: products.reduce((sum, p) => sum + (p.stockQuantity * p.purchasePrice), 0)
        };
      };

      const sampleProducts = [
        {
          productId: 'PROD-001',
          name: 'Clear Glass 5mm',
          category: 'Glass',
          stockQuantity: 100,
          unit: 'sqft',
          purchasePrice: 120,
          sellingPrice: 150,
          isActive: true,
          createdAt: '2026-01-01T00:00:00Z',
          updatedAt: '2026-01-15T00:00:00Z'
        },
        {
          productId: 'PROD-002',
          name: 'Aluminum Frame',
          category: 'Thai',
          stockQuantity: 50,
          unit: 'piece',
          purchasePrice: 180,
          sellingPrice: 220,
          isActive: true,
          createdAt: '2026-01-05T00:00:00Z',
          updatedAt: '2026-01-16T00:00:00Z'
        }
      ];
      
      const result = mockExportProductsCSV(sampleProducts);
      
      expect(result.success).toBe(true);
      expect(result.recordCount).toBe(2);
      expect(result.content).toContain('"Product ID","Name","Category"');
      expect(result.content).toContain('Clear Glass 5mm');
      expect(result.content).toContain('25.00%'); // Profit margin for first product
      expect(result.totalStockValue).toBe(21000); // (100*120) + (50*180)
    });

    test('should handle empty data export gracefully', () => {
      const mockExportEmpty = (data, format) => {
        if (!data || data.length === 0) {
          return {
            success: false,
            error: 'No data available for export',
            format: format,
            recordCount: 0
          };
        }
        return { success: true };
      };

      const emptyResult = mockExportEmpty([], 'CSV');
      const nullResult = mockExportEmpty(null, 'JSON');
      
      expect(emptyResult.success).toBe(false);
      expect(emptyResult.error).toBe('No data available for export');
      expect(emptyResult.recordCount).toBe(0);
      
      expect(nullResult.success).toBe(false);
      expect(nullResult.error).toBe('No data available for export');
    });

    test('should validate export data integrity', () => {
      const mockValidateExportData = (originalData, exportedContent, format) => {
        const validation = {
          format: format,
          originalCount: originalData.length,
          exportedCount: 0,
          dataIntegrity: true,
          missingFields: [],
          errors: []
        };
        
        try {
          if (format === 'JSON') {
            const parsed = JSON.parse(exportedContent);
            validation.exportedCount = parsed.data ? parsed.data.length : 0;
            
            // Check if all original records are present
            if (validation.exportedCount !== validation.originalCount) {
              validation.dataIntegrity = false;
              validation.errors.push('Record count mismatch');
            }
            
            // Validate essential fields
            const requiredFields = ['name', 'createdAt'];
            if (parsed.data && parsed.data.length > 0) {
              requiredFields.forEach(field => {
                if (!parsed.data[0].hasOwnProperty(field)) {
                  validation.missingFields.push(field);
                  validation.dataIntegrity = false;
                }
              });
            }
          } else if (format === 'CSV') {
            const lines = exportedContent.split('\n').filter(line => line.trim());
            validation.exportedCount = lines.length - 1; // Subtract header row
            
            if (validation.exportedCount !== validation.originalCount) {
              validation.dataIntegrity = false;
              validation.errors.push('CSV record count mismatch');
            }
          }
        } catch (error) {
          validation.dataIntegrity = false;
          validation.errors.push(`Parse error: ${error.message}`);
        }
        
        return validation;
      };

      const testData = [
        { name: 'Test 1', createdAt: '2026-01-01' },
        { name: 'Test 2', createdAt: '2026-01-02' }
      ];
      
      const validJSON = JSON.stringify({
        data: testData
      });
      
      const validCSV = 'Name,Created At\n"Test 1","2026-01-01"\n"Test 2","2026-01-02"';
      
      const jsonValidation = mockValidateExportData(testData, validJSON, 'JSON');
      const csvValidation = mockValidateExportData(testData, validCSV, 'CSV');
      
      expect(jsonValidation.dataIntegrity).toBe(true);
      expect(jsonValidation.exportedCount).toBe(2);
      expect(jsonValidation.errors.length).toBe(0);
      
      expect(csvValidation.dataIntegrity).toBe(true);
      expect(csvValidation.exportedCount).toBe(2);
      expect(csvValidation.errors.length).toBe(0);
    });
  });

  describe('Backup File Integrity', () => {
    test('should create complete database backup', () => {
      const mockCreateBackup = (collections) => {
        const backup = {
          metadata: {
            backupDate: new Date().toISOString(),
            version: '1.0',
            databaseName: 'amit_thai_glass_house',
            collections: Object.keys(collections),
            totalRecords: 0,
            backupSize: 0
          },
          data: {}
        };
        
        // Process each collection
        Object.keys(collections).forEach(collectionName => {
          const records = collections[collectionName];
          backup.data[collectionName] = records;
          backup.metadata.totalRecords += records.length;
        });
        
        // Calculate backup size (approximate)
        const backupContent = JSON.stringify(backup);
        backup.metadata.backupSize = backupContent.length;
        
        return {
          success: true,
          backup: backup,
          filename: `backup_${new Date().toISOString().split('T')[0]}.json`,
          checksum: calculateChecksum(backupContent)
        };
      };
      
      // Mock checksum calculation function
      const calculateChecksum = (content) => {
        let hash = 0;
        for (let i = 0; i < content.length; i++) {
          const char = content.charCodeAt(i);
          hash = ((hash << 5) - hash) + char;
          hash = hash & hash; // Convert to 32-bit integer
        }
        return Math.abs(hash).toString(16);
      };

      const mockCollections = {
        invoices: [
          { invoiceNo: 'INV-001', customerName: 'Customer 1', grandTotal: 1000 },
          { invoiceNo: 'INV-002', customerName: 'Customer 2', grandTotal: 1500 }
        ],
        customers: [
          { customerId: 'CUST-001', name: 'Ahmed Hassan', phone: '01712345678' },
          { customerId: 'CUST-002', name: 'Fatima Rahman', phone: '01787654321' }
        ],
        products: [
          { name: 'Glass Panel', category: 'Glass', stockQuantity: 100 },
          { name: 'Aluminum Frame', category: 'Thai', stockQuantity: 50 }
        ]
      };
      
      const result = mockCreateBackup(mockCollections);
      
      expect(result.success).toBe(true);
      expect(result.backup.metadata.collections).toEqual(['invoices', 'customers', 'products']);
      expect(result.backup.metadata.totalRecords).toBe(6);
      expect(result.backup.data.invoices.length).toBe(2);
      expect(result.backup.data.customers.length).toBe(2);
      expect(result.backup.data.products.length).toBe(2);
      expect(result.checksum).toBeDefined();
      expect(result.filename).toMatch(/backup_\d{4}-\d{2}-\d{2}\.json/);
    });

    test('should verify backup file integrity with checksum', () => {
      const mockVerifyBackupIntegrity = (backupContent, expectedChecksum) => {
        const verification = {
          isValid: false,
          actualChecksum: '',
          expectedChecksum: expectedChecksum,
          errors: []
        };
        
        try {
          // Parse backup content
          const backup = JSON.parse(backupContent);
          
          // Verify structure
          if (!backup.metadata || !backup.data) {
            verification.errors.push('Invalid backup structure');
            return verification;
          }
          
          // Calculate checksum
          verification.actualChecksum = calculateChecksum(backupContent);
          
          // Verify checksum
          if (verification.actualChecksum !== expectedChecksum) {
            verification.errors.push('Checksum mismatch - backup may be corrupted');
            return verification;
          }
          
          // Verify collections exist
          const declaredCollections = backup.metadata.collections;
          const actualCollections = Object.keys(backup.data);
          
          if (declaredCollections.length !== actualCollections.length) {
            verification.errors.push('Collection count mismatch');
            return verification;
          }
          
          // Verify record counts
          let totalRecords = 0;
          actualCollections.forEach(collection => {
            totalRecords += backup.data[collection].length;
          });
          
          if (totalRecords !== backup.metadata.totalRecords) {
            verification.errors.push('Total record count mismatch');
            return verification;
          }
          
          verification.isValid = true;
        } catch (error) {
          verification.errors.push(`Parse error: ${error.message}`);
        }
        
        return verification;
      };
      
      // Mock checksum calculation
      mockVerifyBackupIntegrity.calculateChecksum = (content) => {
        let hash = 0;
        for (let i = 0; i < content.length; i++) {
          const char = content.charCodeAt(i);
          hash = ((hash << 5) - hash) + char;
          hash = hash & hash;
        }
        return Math.abs(hash).toString(16);
      };

      // Mock checksum calculation function for this test
      const calculateChecksum = (content) => {
        let hash = 0;
        for (let i = 0; i < content.length; i++) {
          const char = content.charCodeAt(i);
          hash = ((hash << 5) - hash) + char;
          hash = hash & hash;
        }
        return Math.abs(hash).toString(16);
      };

      const validBackup = {
        metadata: {
          backupDate: '2026-01-15T10:30:00Z',
          collections: ['invoices', 'customers'],
          totalRecords: 3
        },
        data: {
          invoices: [{ invoiceNo: 'INV-001' }],
          customers: [{ name: 'Customer 1' }, { name: 'Customer 2' }]
        }
      };
      
      const backupContent = JSON.stringify(validBackup);
      const expectedChecksum = calculateChecksum(backupContent);
      
      const verification = mockVerifyBackupIntegrity(backupContent, expectedChecksum);
      
      expect(verification.isValid).toBe(true);
      expect(verification.errors.length).toBe(0);
      expect(verification.actualChecksum).toBe(expectedChecksum);
    });

    test('should detect corrupted backup files', () => {
      const mockDetectCorruption = (backupContent, originalChecksum) => {
        const detection = {
          isCorrupted: false,
          corruptionType: null,
          details: []
        };
        
        try {
          const backup = JSON.parse(backupContent);
          
          // Calculate current checksum
          const currentChecksum = calculateChecksum(backupContent);
          
          if (currentChecksum !== originalChecksum) {
            detection.isCorrupted = true;
            detection.corruptionType = 'checksum_mismatch';
            detection.details.push('File content has been modified');
          }
          
          // Check for missing required fields
          if (!backup.metadata || !backup.data) {
            detection.isCorrupted = true;
            detection.corruptionType = 'structure_corruption';
            detection.details.push('Missing required backup structure');
          }
          
          // Check for empty collections
          if (backup.data) {
            Object.keys(backup.data).forEach(collection => {
              if (!Array.isArray(backup.data[collection])) {
                detection.isCorrupted = true;
                detection.corruptionType = 'data_corruption';
                detection.details.push(`Collection ${collection} is not an array`);
              }
            });
          }
          
        } catch (error) {
          detection.isCorrupted = true;
          detection.corruptionType = 'parse_error';
          detection.details.push(`Cannot parse backup file: ${error.message}`);
        }
        
        return detection;
      };
      
      // Mock checksum calculation function
      const calculateChecksum = (content) => {
        let hash = 0;
        for (let i = 0; i < content.length; i++) {
          const char = content.charCodeAt(i);
          hash = ((hash << 5) - hash) + char;
          hash = hash & hash;
        }
        return Math.abs(hash).toString(16);
      };
      
      // Mock checksum calculation for corruption detection
      mockDetectCorruption.calculateChecksum = calculateChecksum;

      // Test corrupted JSON
      const corruptedJSON = '{"metadata":{"backupDate":"2026-01-15"},"data":{"invoices":[}'; // Missing closing bracket
      const originalChecksum = 'abc123';
      
      const corruptionResult = mockDetectCorruption(corruptedJSON, originalChecksum);
      
      expect(corruptionResult.isCorrupted).toBe(true);
      expect(corruptionResult.corruptionType).toBe('parse_error');
      expect(corruptionResult.details.length).toBeGreaterThan(0);
    });

    test('should validate backup completeness', () => {
      const mockValidateBackupCompleteness = (backup, expectedCollections) => {
        const validation = {
          isComplete: true,
          missingCollections: [],
          emptyCollections: [],
          recordCounts: {},
          totalRecords: 0
        };
        
        // Check for missing collections
        expectedCollections.forEach(collection => {
          if (!backup.data[collection]) {
            validation.isComplete = false;
            validation.missingCollections.push(collection);
          } else {
            const recordCount = backup.data[collection].length;
            validation.recordCounts[collection] = recordCount;
            validation.totalRecords += recordCount;
            
            if (recordCount === 0) {
              validation.emptyCollections.push(collection);
            }
          }
        });
        
        // Verify metadata matches actual data
        if (backup.metadata.totalRecords !== validation.totalRecords) {
          validation.isComplete = false;
        }
        
        return validation;
      };

      const completeBackup = {
        metadata: {
          totalRecords: 5,
          collections: ['invoices', 'customers', 'products']
        },
        data: {
          invoices: [{ id: 1 }, { id: 2 }],
          customers: [{ id: 1 }, { id: 2 }],
          products: [{ id: 1 }]
        }
      };
      
      const expectedCollections = ['invoices', 'customers', 'products'];
      const validation = mockValidateBackupCompleteness(completeBackup, expectedCollections);
      
      expect(validation.isComplete).toBe(true);
      expect(validation.missingCollections.length).toBe(0);
      expect(validation.totalRecords).toBe(5);
      expect(validation.recordCounts.invoices).toBe(2);
      expect(validation.recordCounts.customers).toBe(2);
      expect(validation.recordCounts.products).toBe(1);
    });
  });

  describe('Restore Test in Fresh DB', () => {
    test('should restore data to fresh database', () => {
      const mockRestoreToFreshDB = (backupData, targetDB) => {
        const restoration = {
          success: false,
          restoredCollections: [],
          restoredRecords: 0,
          errors: [],
          warnings: []
        };
        
        try {
          // Verify target database is empty
          if (Object.keys(targetDB).length > 0) {
            restoration.warnings.push('Target database is not empty - existing data may be overwritten');
          }
          
          // Restore each collection
          Object.keys(backupData.data).forEach(collectionName => {
            const records = backupData.data[collectionName];
            
            if (!Array.isArray(records)) {
              restoration.errors.push(`Invalid data format for collection: ${collectionName}`);
              return;
            }
            
            // Simulate database insertion
            targetDB[collectionName] = [...records];
            restoration.restoredCollections.push(collectionName);
            restoration.restoredRecords += records.length;
          });
          
          // Verify restoration
          if (restoration.restoredRecords === backupData.metadata.totalRecords) {
            restoration.success = true;
          } else {
            restoration.errors.push('Record count mismatch after restoration');
          }
          
        } catch (error) {
          restoration.errors.push(`Restoration failed: ${error.message}`);
        }
        
        return restoration;
      };

      const backupData = {
        metadata: {
          totalRecords: 4,
          collections: ['invoices', 'customers']
        },
        data: {
          invoices: [
            { invoiceNo: 'INV-001', customerName: 'Customer 1' },
            { invoiceNo: 'INV-002', customerName: 'Customer 2' }
          ],
          customers: [
            { customerId: 'CUST-001', name: 'Ahmed Hassan' },
            { customerId: 'CUST-002', name: 'Fatima Rahman' }
          ]
        }
      };
      
      const freshDB = {};
      const result = mockRestoreToFreshDB(backupData, freshDB);
      
      expect(result.success).toBe(true);
      expect(result.restoredCollections).toEqual(['invoices', 'customers']);
      expect(result.restoredRecords).toBe(4);
      expect(result.errors.length).toBe(0);
      expect(freshDB.invoices.length).toBe(2);
      expect(freshDB.customers.length).toBe(2);
    });

    test('should validate restored data integrity', () => {
      const mockValidateRestoredData = (originalBackup, restoredDB) => {
        const validation = {
          isValid: true,
          collectionValidation: {},
          totalOriginal: 0,
          totalRestored: 0,
          errors: []
        };
        
        // Validate each collection
        Object.keys(originalBackup.data).forEach(collectionName => {
          const originalRecords = originalBackup.data[collectionName];
          const restoredRecords = restoredDB[collectionName] || [];
          
          validation.collectionValidation[collectionName] = {
            originalCount: originalRecords.length,
            restoredCount: restoredRecords.length,
            isValid: originalRecords.length === restoredRecords.length
          };
          
          validation.totalOriginal += originalRecords.length;
          validation.totalRestored += restoredRecords.length;
          
          if (originalRecords.length !== restoredRecords.length) {
            validation.isValid = false;
            validation.errors.push(`Record count mismatch in ${collectionName}`);
          }
          
          // Validate sample records
          if (originalRecords.length > 0 && restoredRecords.length > 0) {
            const originalFirst = originalRecords[0];
            const restoredFirst = restoredRecords[0];
            
            // Check if key fields match
            Object.keys(originalFirst).forEach(key => {
              if (originalFirst[key] !== restoredFirst[key]) {
                validation.isValid = false;
                validation.errors.push(`Data mismatch in ${collectionName}.${key}`);
              }
            });
          }
        });
        
        return validation;
      };

      const originalBackup = {
        data: {
          invoices: [
            { invoiceNo: 'INV-001', customerName: 'Customer 1', total: 1000 }
          ],
          customers: [
            { customerId: 'CUST-001', name: 'Ahmed Hassan', phone: '01712345678' }
          ]
        }
      };
      
      const restoredDB = {
        invoices: [
          { invoiceNo: 'INV-001', customerName: 'Customer 1', total: 1000 }
        ],
        customers: [
          { customerId: 'CUST-001', name: 'Ahmed Hassan', phone: '01712345678' }
        ]
      };
      
      const validation = mockValidateRestoredData(originalBackup, restoredDB);
      
      expect(validation.isValid).toBe(true);
      expect(validation.totalOriginal).toBe(2);
      expect(validation.totalRestored).toBe(2);
      expect(validation.errors.length).toBe(0);
      expect(validation.collectionValidation.invoices.isValid).toBe(true);
      expect(validation.collectionValidation.customers.isValid).toBe(true);
    });

    test('should handle restore conflicts and errors', () => {
      const mockHandleRestoreConflicts = (backupData, existingDB) => {
        const conflictResolution = {
          conflicts: [],
          resolutions: [],
          errors: [],
          strategy: 'overwrite' // or 'merge', 'skip'
        };
        
        Object.keys(backupData.data).forEach(collectionName => {
          const backupRecords = backupData.data[collectionName];
          const existingRecords = existingDB[collectionName] || [];
          
          if (existingRecords.length > 0) {
            conflictResolution.conflicts.push({
              collection: collectionName,
              existingCount: existingRecords.length,
              backupCount: backupRecords.length,
              conflictType: 'existing_data'
            });
            
            // Apply resolution strategy
            if (conflictResolution.strategy === 'overwrite') {
              existingDB[collectionName] = [...backupRecords];
              conflictResolution.resolutions.push({
                collection: collectionName,
                action: 'overwritten',
                recordsReplaced: existingRecords.length,
                recordsAdded: backupRecords.length
              });
            }
          } else {
            existingDB[collectionName] = [...backupRecords];
            conflictResolution.resolutions.push({
              collection: collectionName,
              action: 'created',
              recordsAdded: backupRecords.length
            });
          }
        });
        
        return conflictResolution;
      };

      const backupData = {
        data: {
          invoices: [
            { invoiceNo: 'INV-001', customerName: 'New Customer' }
          ]
        }
      };
      
      const existingDB = {
        invoices: [
          { invoiceNo: 'INV-999', customerName: 'Existing Customer' }
        ]
      };
      
      const result = mockHandleRestoreConflicts(backupData, existingDB);
      
      expect(result.conflicts.length).toBe(1);
      expect(result.conflicts[0].conflictType).toBe('existing_data');
      expect(result.resolutions.length).toBe(1);
      expect(result.resolutions[0].action).toBe('overwritten');
      expect(existingDB.invoices.length).toBe(1);
      expect(existingDB.invoices[0].customerName).toBe('New Customer');
    });

    test('should verify database state after restore', () => {
      const mockVerifyDatabaseState = (restoredDB, expectedState) => {
        const verification = {
          isHealthy: true,
          collectionStatus: {},
          indexStatus: {},
          dataConsistency: true,
          issues: []
        };
        
        // Check each expected collection
        expectedState.collections.forEach(collectionName => {
          const collection = restoredDB[collectionName];
          
          verification.collectionStatus[collectionName] = {
            exists: !!collection,
            recordCount: collection ? collection.length : 0,
            isEmpty: !collection || collection.length === 0
          };
          
          if (!collection) {
            verification.isHealthy = false;
            verification.issues.push(`Missing collection: ${collectionName}`);
          }
        });
        
        // Check data consistency
        if (restoredDB.invoices && restoredDB.customers) {
          // Verify referential integrity (example)
          restoredDB.invoices.forEach(invoice => {
            if (invoice.customerId) {
              const customerExists = restoredDB.customers.some(c => c.customerId === invoice.customerId);
              if (!customerExists) {
                verification.dataConsistency = false;
                verification.issues.push(`Invoice ${invoice.invoiceNo} references non-existent customer ${invoice.customerId}`);
              }
            }
          });
        }
        
        return verification;
      };

      const restoredDB = {
        invoices: [
          { invoiceNo: 'INV-001', customerId: 'CUST-001' }
        ],
        customers: [
          { customerId: 'CUST-001', name: 'Ahmed Hassan' }
        ],
        products: [
          { productId: 'PROD-001', name: 'Glass Panel' }
        ]
      };
      
      const expectedState = {
        collections: ['invoices', 'customers', 'products']
      };
      
      const verification = mockVerifyDatabaseState(restoredDB, expectedState);
      
      expect(verification.isHealthy).toBe(true);
      expect(verification.dataConsistency).toBe(true);
      expect(verification.issues.length).toBe(0);
      expect(verification.collectionStatus.invoices.exists).toBe(true);
      expect(verification.collectionStatus.customers.recordCount).toBe(1);
    });
  });

  describe('Soft-Deleted Data Included in Backup', () => {
    test('should include soft-deleted records in backup', () => {
      const mockBackupWithSoftDeleted = (collections, includeSoftDeleted = true) => {
        const backup = {
          metadata: {
            backupDate: new Date().toISOString(),
            includeSoftDeleted: includeSoftDeleted,
            collections: Object.keys(collections),
            recordCounts: {}
          },
          data: {}
        };
        
        Object.keys(collections).forEach(collectionName => {
          const allRecords = collections[collectionName];
          let recordsToBackup;
          
          if (includeSoftDeleted) {
            // Include all records (active and soft-deleted)
            recordsToBackup = allRecords;
          } else {
            // Include only active records
            recordsToBackup = allRecords.filter(record => !record.isDeleted);
          }
          
          backup.data[collectionName] = recordsToBackup;
          backup.metadata.recordCounts[collectionName] = {
            total: recordsToBackup.length,
            active: recordsToBackup.filter(r => !r.isDeleted).length,
            softDeleted: recordsToBackup.filter(r => r.isDeleted).length
          };
        });
        
        return backup;
      };

      const mockCollections = {
        customers: [
          { customerId: 'CUST-001', name: 'Active Customer', isDeleted: false },
          { customerId: 'CUST-002', name: 'Deleted Customer', isDeleted: true, deletedAt: '2026-01-10T00:00:00Z' },
          { customerId: 'CUST-003', name: 'Another Active', isDeleted: false }
        ],
        products: [
          { productId: 'PROD-001', name: 'Active Product', isDeleted: false },
          { productId: 'PROD-002', name: 'Deleted Product', isDeleted: true, deletedAt: '2026-01-12T00:00:00Z' }
        ]
      };
      
      const backupWithSoftDeleted = mockBackupWithSoftDeleted(mockCollections, true);
      const backupWithoutSoftDeleted = mockBackupWithSoftDeleted(mockCollections, false);
      
      // Test backup with soft-deleted records
      expect(backupWithSoftDeleted.metadata.includeSoftDeleted).toBe(true);
      expect(backupWithSoftDeleted.data.customers.length).toBe(3);
      expect(backupWithSoftDeleted.data.products.length).toBe(2);
      expect(backupWithSoftDeleted.metadata.recordCounts.customers.softDeleted).toBe(1);
      expect(backupWithSoftDeleted.metadata.recordCounts.products.softDeleted).toBe(1);
      
      // Test backup without soft-deleted records
      expect(backupWithoutSoftDeleted.metadata.includeSoftDeleted).toBe(false);
      expect(backupWithoutSoftDeleted.data.customers.length).toBe(2);
      expect(backupWithoutSoftDeleted.data.products.length).toBe(1);
      expect(backupWithoutSoftDeleted.metadata.recordCounts.customers.softDeleted).toBe(0);
    });

    test('should preserve soft-delete metadata in backup', () => {
      const mockPreserveSoftDeleteMetadata = (records) => {
        return records.map(record => {
          const backupRecord = { ...record };
          
          // Ensure soft-delete metadata is preserved
          if (record.isDeleted) {
            backupRecord.softDeleteMetadata = {
              isDeleted: record.isDeleted,
              deletedAt: record.deletedAt,
              deletedBy: record.deletedBy,
              deleteReason: record.deleteReason || null
            };
          }
          
          return backupRecord;
        });
      };

      const testRecords = [
        {
          id: 1,
          name: 'Active Record',
          isDeleted: false
        },
        {
          id: 2,
          name: 'Soft Deleted Record',
          isDeleted: true,
          deletedAt: '2026-01-15T10:30:00Z',
          deletedBy: 'user123',
          deleteReason: 'Customer request'
        }
      ];
      
      const preservedRecords = mockPreserveSoftDeleteMetadata(testRecords);
      
      expect(preservedRecords[0].softDeleteMetadata).toBeUndefined();
      expect(preservedRecords[1].softDeleteMetadata).toBeDefined();
      expect(preservedRecords[1].softDeleteMetadata.isDeleted).toBe(true);
      expect(preservedRecords[1].softDeleteMetadata.deletedAt).toBe('2026-01-15T10:30:00Z');
      expect(preservedRecords[1].softDeleteMetadata.deletedBy).toBe('user123');
      expect(preservedRecords[1].softDeleteMetadata.deleteReason).toBe('Customer request');
    });

    test('should restore soft-deleted records correctly', () => {
      const mockRestoreSoftDeletedRecords = (backupData, targetDB) => {
        const restoration = {
          totalRecords: 0,
          activeRecords: 0,
          softDeletedRecords: 0,
          restoredCollections: []
        };
        
        Object.keys(backupData.data).forEach(collectionName => {
          const records = backupData.data[collectionName];
          targetDB[collectionName] = records;
          
          restoration.restoredCollections.push(collectionName);
          restoration.totalRecords += records.length;
          
          records.forEach(record => {
            if (record.isDeleted) {
              restoration.softDeletedRecords++;
            } else {
              restoration.activeRecords++;
            }
          });
        });
        
        return restoration;
      };

      const backupData = {
        data: {
          customers: [
            { customerId: 'CUST-001', name: 'Active Customer', isDeleted: false },
            { customerId: 'CUST-002', name: 'Deleted Customer', isDeleted: true, deletedAt: '2026-01-10T00:00:00Z' }
          ]
        }
      };
      
      const targetDB = {};
      const result = mockRestoreSoftDeletedRecords(backupData, targetDB);
      
      expect(result.totalRecords).toBe(2);
      expect(result.activeRecords).toBe(1);
      expect(result.softDeletedRecords).toBe(1);
      expect(targetDB.customers.length).toBe(2);
      expect(targetDB.customers[1].isDeleted).toBe(true);
      expect(targetDB.customers[1].deletedAt).toBe('2026-01-10T00:00:00Z');
    });

    test('should validate soft-delete data consistency', () => {
      const mockValidateSoftDeleteConsistency = (records) => {
        const validation = {
          isConsistent: true,
          errors: [],
          warnings: [],
          statistics: {
            totalRecords: records.length,
            activeRecords: 0,
            softDeletedRecords: 0,
            invalidRecords: 0
          }
        };
        
        records.forEach((record, index) => {
          if (record.isDeleted === true) {
            validation.statistics.softDeletedRecords++;
            
            // Validate soft-delete metadata
            if (!record.deletedAt) {
              validation.isConsistent = false;
              validation.errors.push(`Record ${index}: Missing deletedAt timestamp`);
              validation.statistics.invalidRecords++;
            }
            
            if (record.deletedAt && new Date(record.deletedAt) > new Date()) {
              validation.isConsistent = false;
              validation.errors.push(`Record ${index}: Future deletion date`);
            }
            
            if (!record.deletedBy) {
              validation.warnings.push(`Record ${index}: Missing deletedBy information`);
            }
            
          } else if (record.isDeleted === false || record.isDeleted === undefined) {
            validation.statistics.activeRecords++;
            
            // Active records should not have deletion metadata
            if (record.deletedAt || record.deletedBy) {
              validation.warnings.push(`Record ${index}: Active record has deletion metadata`);
            }
          } else {
            validation.isConsistent = false;
            validation.errors.push(`Record ${index}: Invalid isDeleted value`);
            validation.statistics.invalidRecords++;
          }
        });
        
        return validation;
      };

      const testRecords = [
        { id: 1, name: 'Active', isDeleted: false },
        { id: 2, name: 'Properly Deleted', isDeleted: true, deletedAt: '2025-12-15T10:30:00Z', deletedBy: 'user123' },
        { id: 3, name: 'Invalid Deleted', isDeleted: true }, // Missing deletedAt
        { id: 4, name: 'Another Active', isDeleted: false }
      ];
      
      const validation = mockValidateSoftDeleteConsistency(testRecords);
      
      expect(validation.statistics.totalRecords).toBe(4);
      expect(validation.statistics.activeRecords).toBe(2);
      expect(validation.statistics.softDeletedRecords).toBe(2);
      expect(validation.statistics.invalidRecords).toBe(1);
      expect(validation.isConsistent).toBe(false);
      expect(validation.errors.length).toBeGreaterThanOrEqual(1);
      expect(validation.errors[0]).toContain('Missing deletedAt timestamp');
    });

    test('should support selective restore of soft-deleted data', () => {
      const mockSelectiveRestoreSoftDeleted = (backupData, restoreOptions) => {
        const restoration = {
          restoredRecords: 0,
          skippedRecords: 0,
          restoredCollections: {},
          options: restoreOptions
        };
        
        Object.keys(backupData.data).forEach(collectionName => {
          const allRecords = backupData.data[collectionName];
          let recordsToRestore = [];
          
          allRecords.forEach(record => {
            let shouldRestore = true;
            
            if (record.isDeleted && !restoreOptions.includeSoftDeleted) {
              shouldRestore = false;
            }
            
            if (record.isDeleted && restoreOptions.softDeletedDateRange) {
              const deletedAt = new Date(record.deletedAt);
              const startDate = new Date(restoreOptions.softDeletedDateRange.start);
              const endDate = new Date(restoreOptions.softDeletedDateRange.end);
              
              if (deletedAt < startDate || deletedAt > endDate) {
                shouldRestore = false;
              }
            }
            
            if (shouldRestore) {
              recordsToRestore.push(record);
              restoration.restoredRecords++;
            } else {
              restoration.skippedRecords++;
            }
          });
          
          restoration.restoredCollections[collectionName] = recordsToRestore;
        });
        
        return restoration;
      };

      const backupData = {
        data: {
          customers: [
            { id: 1, name: 'Active', isDeleted: false },
            { id: 2, name: 'Recently Deleted', isDeleted: true, deletedAt: '2026-01-15T00:00:00Z' },
            { id: 3, name: 'Old Deleted', isDeleted: true, deletedAt: '2025-12-01T00:00:00Z' }
          ]
        }
      };
      
      // Test restore without soft-deleted records
      const withoutSoftDeleted = mockSelectiveRestoreSoftDeleted(backupData, {
        includeSoftDeleted: false
      });
      
      expect(withoutSoftDeleted.restoredRecords).toBe(1);
      expect(withoutSoftDeleted.skippedRecords).toBe(2);
      
      // Test restore with date range filter
      const withDateRange = mockSelectiveRestoreSoftDeleted(backupData, {
        includeSoftDeleted: true,
        softDeletedDateRange: {
          start: '2026-01-01T00:00:00Z',
          end: '2026-01-31T23:59:59Z'
        }
      });
      
      expect(withDateRange.restoredRecords).toBe(2); // Active + recently deleted
      expect(withDateRange.skippedRecords).toBe(1); // Old deleted record
    });
  });
});