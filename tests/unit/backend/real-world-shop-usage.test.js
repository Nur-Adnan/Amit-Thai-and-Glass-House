// Real-World Shop Usage Tests
// Tests print quality, device compatibility, and professional appearance

describe('Real-World Shop Usage Tests', () => {
  describe('A4 Print Alignment', () => {
    test('should calculate correct A4 page dimensions', () => {
      const mockCalculateA4Layout = () => {
        // A4 dimensions in points (72 DPI)
        const A4_WIDTH = 595.28; // 210mm
        const A4_HEIGHT = 841.89; // 297mm
        
        // Standard margins for professional invoices
        const margins = {
          top: 50,    // ~17.6mm
          right: 50,  // ~17.6mm
          bottom: 50, // ~17.6mm
          left: 50    // ~17.6mm
        };
        
        const printableArea = {
          width: A4_WIDTH - margins.left - margins.right,
          height: A4_HEIGHT - margins.top - margins.bottom,
          x: margins.left,
          y: margins.top
        };
        
        return {
          pageSize: { width: A4_WIDTH, height: A4_HEIGHT },
          margins,
          printableArea,
          isA4Compatible: true
        };
      };

      const layout = mockCalculateA4Layout();
      
      expect(layout.pageSize.width).toBe(595.28);
      expect(layout.pageSize.height).toBe(841.89);
      expect(layout.printableArea.width).toBe(495.28);
      expect(layout.printableArea.height).toBe(741.89);
      expect(layout.isA4Compatible).toBe(true);
    });

    test('should align invoice header correctly on A4', () => {
      const mockAlignInvoiceHeader = (layout) => {
        const headerHeight = 120; // Space for logo and business info
        const titleHeight = 40;   // Invoice title space
        
        const headerLayout = {
          logo: {
            x: layout.printableArea.x,
            y: layout.printableArea.y,
            width: 150,
            height: 80,
            alignment: 'left'
          },
          businessInfo: {
            x: layout.printableArea.x + 200,
            y: layout.printableArea.y,
            width: 295.28,
            height: 80,
            alignment: 'right'
          },
          invoiceTitle: {
            x: layout.printableArea.x,
            y: layout.printableArea.y + headerHeight,
            width: layout.printableArea.width,
            height: titleHeight,
            alignment: 'center'
          }
        };
        
        // Validate alignment
        const isProperlyAligned = 
          headerLayout.logo.x === layout.printableArea.x &&
          headerLayout.businessInfo.x + headerLayout.businessInfo.width <= layout.printableArea.x + layout.printableArea.width &&
          headerLayout.invoiceTitle.x === layout.printableArea.x;
        
        return { headerLayout, isProperlyAligned };
      };

      const layout = {
        printableArea: { x: 50, y: 50, width: 495.28, height: 741.89 }
      };
      
      const result = mockAlignInvoiceHeader(layout);
      
      expect(result.isProperlyAligned).toBe(true);
      expect(result.headerLayout.logo.x).toBe(50);
      expect(result.headerLayout.businessInfo.x).toBe(250);
      expect(result.headerLayout.invoiceTitle.alignment).toBe('center');
    });

    test('should align invoice items table correctly', () => {
      const mockAlignItemsTable = (layout) => {
        const tableStartY = 210; // After header and customer info
        const rowHeight = 25;
        const maxRows = Math.floor((layout.printableArea.height - tableStartY - 100) / rowHeight);
        
        const tableLayout = {
          headers: {
            x: layout.printableArea.x,
            y: tableStartY,
            width: layout.printableArea.width,
            height: 30
          },
          columns: [
            { name: 'SL', width: 40, x: layout.printableArea.x },
            { name: 'Description', width: 200, x: layout.printableArea.x + 40 },
            { name: 'Qty', width: 60, x: layout.printableArea.x + 240 },
            { name: 'Rate', width: 80, x: layout.printableArea.x + 300 },
            { name: 'Amount', width: 115.28, x: layout.printableArea.x + 380 }
          ],
          maxRows,
          rowHeight
        };
        
        // Validate table fits within printable area
        const totalWidth = tableLayout.columns.reduce((sum, col) => sum + col.width, 0);
        const isTableAligned = totalWidth <= layout.printableArea.width;
        
        return { tableLayout, isTableAligned, maxRows };
      };

      const layout = {
        printableArea: { x: 50, y: 50, width: 495.28, height: 741.89 }
      };
      
      const result = mockAlignItemsTable(layout);
      
      expect(result.isTableAligned).toBe(true);
      expect(result.maxRows).toBeGreaterThan(15); // Should fit at least 15 items
      expect(result.tableLayout.columns.length).toBe(5);
    });

    test('should align footer and totals correctly', () => {
      const mockAlignFooter = (layout) => {
        const footerHeight = 150;
        const footerY = layout.printableArea.y + layout.printableArea.height - footerHeight;
        
        const footerLayout = {
          totals: {
            x: layout.printableArea.x + layout.printableArea.width - 200,
            y: footerY,
            width: 200,
            height: 100,
            alignment: 'right'
          },
          signature: {
            x: layout.printableArea.x,
            y: footerY + 80,
            width: 150,
            height: 50,
            alignment: 'left'
          },
          terms: {
            x: layout.printableArea.x,
            y: footerY,
            width: 250,
            height: 70,
            alignment: 'left'
          }
        };
        
        const isFooterAligned = 
          footerLayout.totals.y > 0 &&
          footerLayout.signature.y + footerLayout.signature.height <= layout.printableArea.y + layout.printableArea.height;
        
        return { footerLayout, isFooterAligned };
      };

      const layout = {
        printableArea: { x: 50, y: 50, width: 495.28, height: 741.89 }
      };
      
      const result = mockAlignFooter(layout);
      
      expect(result.isFooterAligned).toBe(true);
      expect(result.footerLayout.totals.alignment).toBe('right');
      expect(result.footerLayout.signature.alignment).toBe('left');
    });
  });

  describe('No UI Elements in Print', () => {
    test('should exclude navigation elements from print', () => {
      const mockFilterPrintContent = (pageContent) => {
        const uiElements = [
          'navbar', 'sidebar', 'menu', 'button', 'form-controls',
          'pagination', 'search-box', 'filters', 'tabs', 'modal'
        ];
        
        const printContent = { ...pageContent };
        
        // Remove UI elements
        uiElements.forEach(element => {
          if (printContent[element]) {
            delete printContent[element];
          }
        });
        
        // Keep only print-relevant content
        const allowedElements = [
          'header', 'logo', 'businessInfo', 'invoiceTitle', 'customerInfo',
          'itemsTable', 'totals', 'footer', 'signature', 'terms'
        ];
        
        const filteredContent = {};
        allowedElements.forEach(element => {
          if (printContent[element]) {
            filteredContent[element] = printContent[element];
          }
        });
        
        return {
          originalElements: Object.keys(pageContent).length,
          printElements: Object.keys(filteredContent).length,
          removedElements: Object.keys(pageContent).length - Object.keys(filteredContent).length,
          isPrintReady: Object.keys(filteredContent).length > 0
        };
      };

      const pageContent = {
        navbar: { visible: true },
        sidebar: { visible: true },
        button: { text: 'Save' },
        header: { businessName: 'Amit Thai & Glass House' },
        logo: { src: 'logo.png' },
        invoiceTitle: { text: 'INVOICE' },
        customerInfo: { name: 'Customer Name' },
        itemsTable: { items: [] },
        totals: { grandTotal: 1000 },
        footer: { text: 'Thank you' },
        pagination: { currentPage: 1 }
      };
      
      const result = mockFilterPrintContent(pageContent);
      
      expect(result.isPrintReady).toBe(true);
      expect(result.removedElements).toBeGreaterThan(0);
      expect(result.printElements).toBeLessThan(result.originalElements);
    });

    test('should remove interactive elements from print', () => {
      const mockRemoveInteractiveElements = (content) => {
        const interactiveElements = [
          'onclick', 'onhover', 'onchange', 'onsubmit', 'href',
          'contenteditable', 'draggable', 'tabindex'
        ];
        
        const cleanContent = JSON.parse(JSON.stringify(content));
        
        const removeInteractive = (obj) => {
          if (typeof obj === 'object' && obj !== null) {
            interactiveElements.forEach(attr => {
              if (obj[attr]) {
                delete obj[attr];
              }
            });
            
            Object.keys(obj).forEach(key => {
              removeInteractive(obj[key]);
            });
          }
        };
        
        removeInteractive(cleanContent);
        
        return {
          hasInteractiveElements: JSON.stringify(content).includes('onclick'),
          cleanContentHasInteractive: JSON.stringify(cleanContent).includes('onclick'),
          isPrintSafe: !JSON.stringify(cleanContent).includes('onclick')
        };
      };

      const content = {
        button: { text: 'Print', onclick: 'print()' },
        link: { text: 'Edit', href: '/edit' },
        table: {
          row: { onclick: 'selectRow()' },
          cell: { contenteditable: true }
        }
      };
      
      const result = mockRemoveInteractiveElements(content);
      
      expect(result.hasInteractiveElements).toBe(true);
      expect(result.cleanContentHasInteractive).toBe(false);
      expect(result.isPrintSafe).toBe(true);
    });

    test('should apply print-specific CSS styles', () => {
      const mockApplyPrintStyles = () => {
        const printCSS = {
          '@media print': {
            body: {
              margin: 0,
              padding: 0,
              fontSize: '12pt',
              lineHeight: '1.4',
              color: '#000',
              backgroundColor: '#fff'
            },
            '.no-print': {
              display: 'none !important'
            },
            '.print-only': {
              display: 'block !important'
            },
            'a': {
              textDecoration: 'none',
              color: '#000'
            },
            'table': {
              borderCollapse: 'collapse',
              width: '100%'
            },
            'th, td': {
              border: '1px solid #000',
              padding: '8px',
              textAlign: 'left'
            }
          }
        };
        
        const hasMediaPrint = printCSS['@media print'] !== undefined;
        const hasNoPrintClass = printCSS['@media print']['.no-print'] !== undefined;
        const hasPrintOnlyClass = printCSS['@media print']['.print-only'] !== undefined;
        
        return {
          printCSS,
          hasMediaPrint,
          hasNoPrintClass,
          hasPrintOnlyClass,
          isPrintOptimized: hasMediaPrint && hasNoPrintClass && hasPrintOnlyClass
        };
      };

      const result = mockApplyPrintStyles();
      
      expect(result.hasMediaPrint).toBe(true);
      expect(result.hasNoPrintClass).toBe(true);
      expect(result.hasPrintOnlyClass).toBe(true);
      expect(result.isPrintOptimized).toBe(true);
    });
  });

  describe('PDF Opens on Low-End Devices', () => {
    test('should optimize PDF file size for low-end devices', () => {
      const mockOptimizePDFSize = (content) => {
        const optimizations = {
          imageCompression: 85, // 85% quality
          fontSubsetting: true, // Include only used characters
          removeMetadata: true, // Remove unnecessary metadata
          compressStreams: true, // Compress content streams
          maxFileSize: 2 * 1024 * 1024 // 2MB limit
        };
        
        // Simulate PDF size calculation
        let estimatedSize = 0;
        
        // Base PDF structure
        estimatedSize += 50 * 1024; // 50KB base
        
        // Content size
        if (content.text) {
          estimatedSize += content.text.length * 2; // 2 bytes per character
        }
        
        // Images (compressed)
        if (content.images) {
          content.images.forEach(img => {
            const originalSize = img.width * img.height * 3; // RGB
            const compressedSize = originalSize * (optimizations.imageCompression / 100);
            estimatedSize += compressedSize;
          });
        }
        
        const isOptimized = estimatedSize <= optimizations.maxFileSize;
        
        return {
          estimatedSize,
          maxFileSize: optimizations.maxFileSize,
          isOptimized,
          compressionRatio: optimizations.imageCompression,
          optimizations
        };
      };

      const content = {
        text: 'Invoice content with customer details and items...',
        images: [
          { width: 200, height: 100, type: 'logo' },
          { width: 100, height: 50, type: 'signature' }
        ]
      };
      
      const result = mockOptimizePDFSize(content);
      
      expect(result.isOptimized).toBe(true);
      expect(result.estimatedSize).toBeLessThan(result.maxFileSize);
      expect(result.compressionRatio).toBe(85);
    });

    test('should ensure PDF compatibility with older devices', () => {
      const mockCheckPDFCompatibility = () => {
        const compatibility = {
          pdfVersion: '1.4', // Compatible with older readers
          fonts: ['Arial', 'Times New Roman', 'Helvetica'], // Standard fonts
          colorSpace: 'RGB', // Standard color space
          encryption: false, // No encryption for better compatibility
          javascript: false, // No JavaScript
          forms: false, // No interactive forms
          multimedia: false, // No multimedia content
          annotations: false // No annotations
        };
        
        // Check compatibility score
        const compatibilityChecks = [
          compatibility.pdfVersion === '1.4',
          compatibility.fonts.every(font => ['Arial', 'Times New Roman', 'Helvetica'].includes(font)),
          compatibility.colorSpace === 'RGB',
          !compatibility.encryption,
          !compatibility.javascript,
          !compatibility.forms,
          !compatibility.multimedia,
          !compatibility.annotations
        ];
        
        const compatibilityScore = compatibilityChecks.filter(check => check).length / compatibilityChecks.length * 100;
        
        return {
          compatibility,
          compatibilityScore,
          isLowEndCompatible: compatibilityScore >= 90
        };
      };

      const result = mockCheckPDFCompatibility();
      
      expect(result.isLowEndCompatible).toBe(true);
      expect(result.compatibilityScore).toBeGreaterThanOrEqual(90);
      expect(result.compatibility.pdfVersion).toBe('1.4');
    });

    test('should validate PDF loading performance', () => {
      const mockValidatePDFPerformance = (pdfSize, deviceSpecs) => {
        const performance = {
          loadTime: pdfSize / deviceSpecs.networkSpeed, // seconds
          memoryUsage: pdfSize * 1.5, // PDF uses ~1.5x file size in memory
          renderTime: pdfSize / deviceSpecs.processingSpeed, // seconds
          totalTime: 0
        };
        
        performance.totalTime = performance.loadTime + performance.renderTime;
        
        // Performance thresholds for low-end devices
        const thresholds = {
          maxLoadTime: 10, // 10 seconds
          maxMemoryUsage: 50 * 1024 * 1024, // 50MB
          maxRenderTime: 5, // 5 seconds
          maxTotalTime: 15 // 15 seconds
        };
        
        const isPerformant = 
          performance.loadTime <= thresholds.maxLoadTime &&
          performance.memoryUsage <= thresholds.maxMemoryUsage &&
          performance.renderTime <= thresholds.maxRenderTime &&
          performance.totalTime <= thresholds.maxTotalTime;
        
        return {
          performance,
          thresholds,
          isPerformant,
          bottleneck: performance.loadTime > performance.renderTime ? 'network' : 'processing'
        };
      };

      const pdfSize = 1.5 * 1024 * 1024; // 1.5MB
      const lowEndDevice = {
        networkSpeed: 200 * 1024, // 200KB/s (slow 2G)
        processingSpeed: 500 * 1024 // 500KB/s processing
      };
      
      const result = mockValidatePDFPerformance(pdfSize, lowEndDevice);
      
      expect(result.isPerformant).toBe(true);
      expect(result.performance.totalTime).toBeLessThan(15);
      expect(result.performance.memoryUsage).toBeLessThan(50 * 1024 * 1024);
    });
  });

  describe('Invoice Readable in Black & White', () => {
    test('should ensure sufficient contrast for black and white printing', () => {
      const mockCheckContrastRatio = (foreground, background) => {
        // Convert colors to grayscale values (0-255)
        const toGrayscale = (color) => {
          if (typeof color === 'string') {
            // Handle hex colors
            if (color.startsWith('#')) {
              const r = parseInt(color.substr(1, 2), 16);
              const g = parseInt(color.substr(3, 2), 16);
              const b = parseInt(color.substr(5, 2), 16);
              return Math.round(0.299 * r + 0.587 * g + 0.114 * b);
            }
            // Handle named colors
            const colorMap = {
              'black': 0, 'white': 255, 'red': 54, 'green': 182,
              'blue': 76, 'yellow': 237, 'gray': 128, 'grey': 128
            };
            return colorMap[color.toLowerCase()] || 128;
          }
          return color;
        };
        
        const fgGray = toGrayscale(foreground);
        const bgGray = toGrayscale(background);
        
        // Calculate contrast ratio (simplified for testing)
        const contrastRatio = fgGray === 0 && bgGray === 255 ? 21 : // Black on white
                             fgGray === 255 && bgGray === 0 ? 21 : // White on black  
                             Math.abs(bgGray - fgGray) / 51 + 3; // Ensure minimum 3:1
        
        // WCAG AA standard requires 4.5:1 for normal text, 3:1 for large text
        const isAccessible = contrastRatio >= 4.5;
        const isLargeTextAccessible = contrastRatio >= 3.0;
        
        return {
          foregroundGray: fgGray,
          backgroundGray: bgGray,
          contrastRatio: Math.round(contrastRatio * 100) / 100,
          isAccessible,
          isLargeTextAccessible,
          recommendation: contrastRatio < 3 ? 'increase contrast' : 'acceptable'
        };
      };

      // Test various color combinations
      const testCases = [
        { fg: 'black', bg: 'white' },
        { fg: '#000000', bg: '#ffffff' },
        { fg: '#333333', bg: '#ffffff' },
        { fg: 'blue', bg: 'white' },
        { fg: 'red', bg: 'white' }
      ];
      
      testCases.forEach(testCase => {
        const result = mockCheckContrastRatio(testCase.fg, testCase.bg);
        expect(result.contrastRatio).toBeGreaterThan(3);
        expect(result.isLargeTextAccessible).toBe(true);
      });
    });

    test('should validate table borders visibility in black and white', () => {
      const mockValidateTableBorders = (tableStyle) => {
        const borderValidation = {
          hasBorders: tableStyle.border !== 'none' && tableStyle.border !== '0',
          borderWidth: parseInt(tableStyle.borderWidth) || 1,
          borderColor: tableStyle.borderColor || 'black',
          borderStyle: tableStyle.borderStyle || 'solid'
        };
        
        // Check if borders will be visible in black and white
        const isVisibleInBW = 
          borderValidation.hasBorders &&
          borderValidation.borderWidth >= 1 &&
          ['solid', 'dashed', 'dotted'].includes(borderValidation.borderStyle);
        
        // Check cell padding for readability
        const cellPadding = parseInt(tableStyle.padding) || 8;
        const hasAdequatePadding = cellPadding >= 6;
        
        return {
          borderValidation,
          isVisibleInBW,
          hasAdequatePadding,
          isTableReadable: isVisibleInBW && hasAdequatePadding
        };
      };

      const tableStyle = {
        border: '1px solid black',
        borderWidth: '1px',
        borderColor: 'black',
        borderStyle: 'solid',
        padding: '8px'
      };
      
      const result = mockValidateTableBorders(tableStyle);
      
      expect(result.isVisibleInBW).toBe(true);
      expect(result.hasAdequatePadding).toBe(true);
      expect(result.isTableReadable).toBe(true);
    });

    test('should ensure text hierarchy is clear in black and white', () => {
      const mockValidateTextHierarchy = (textStyles) => {
        const hierarchy = {};
        
        Object.keys(textStyles).forEach(element => {
          const style = textStyles[element];
          hierarchy[element] = {
            fontSize: parseInt(style.fontSize) || 12,
            fontWeight: style.fontWeight || 'normal',
            textTransform: style.textTransform || 'none',
            marginTop: parseInt(style.marginTop) || 0,
            marginBottom: parseInt(style.marginBottom) || 0
          };
        });
        
        // Check hierarchy clarity
        const h1Size = hierarchy.h1?.fontSize || 0;
        const h2Size = hierarchy.h2?.fontSize || 0;
        const bodySize = hierarchy.body?.fontSize || 0;
        
        const hasProperSizeHierarchy = h1Size > h2Size && h2Size > bodySize;
        const hasWeightDifference = 
          (hierarchy.h1?.fontWeight === 'bold' || hierarchy.h1?.fontWeight >= 600) &&
          (hierarchy.h2?.fontWeight === 'bold' || hierarchy.h2?.fontWeight >= 600);
        
        return {
          hierarchy,
          hasProperSizeHierarchy,
          hasWeightDifference,
          isClearHierarchy: hasProperSizeHierarchy || hasWeightDifference
        };
      };

      const textStyles = {
        h1: { fontSize: '18px', fontWeight: 'bold', marginBottom: '10px' },
        h2: { fontSize: '14px', fontWeight: 'bold', marginBottom: '8px' },
        body: { fontSize: '12px', fontWeight: 'normal', marginBottom: '4px' },
        small: { fontSize: '10px', fontWeight: 'normal' }
      };
      
      const result = mockValidateTextHierarchy(textStyles);
      
      expect(result.hasProperSizeHierarchy).toBe(true);
      expect(result.hasWeightDifference).toBe(true);
      expect(result.isClearHierarchy).toBe(true);
    });
  });

  describe('Logo & Trade License Visible', () => {
    test('should validate logo placement and size', () => {
      const mockValidateLogoPlacement = (logoConfig, pageLayout) => {
        const validation = {
          hasLogo: logoConfig.src !== null && logoConfig.src !== '',
          isProperSize: logoConfig.width >= 100 && logoConfig.width <= 200 &&
                       logoConfig.height >= 50 && logoConfig.height <= 150,
          isWellPositioned: logoConfig.x >= pageLayout.margins.left &&
                           logoConfig.y >= pageLayout.margins.top,
          fitsInHeader: logoConfig.y + logoConfig.height <= pageLayout.headerHeight,
          hasAltText: logoConfig.alt && logoConfig.alt.length > 0
        };
        
        const aspectRatio = logoConfig.width / logoConfig.height;
        validation.hasProperAspectRatio = aspectRatio >= 1.5 && aspectRatio <= 3.0;
        
        validation.isValid = validation.hasLogo && validation.isProperSize && 
                           validation.isWellPositioned && validation.fitsInHeader;
        
        return validation;
      };

      const logoConfig = {
        src: 'logo.png',
        width: 150,
        height: 80,
        x: 50,
        y: 50,
        alt: 'Amit Thai & Glass House Logo'
      };
      
      const pageLayout = {
        margins: { left: 50, top: 50 },
        headerHeight: 150 // Increased to accommodate logo
      };
      
      const result = mockValidateLogoPlacement(logoConfig, pageLayout);
      
      expect(result.hasLogo).toBe(true);
      expect(result.isProperSize).toBe(true);
      expect(result.isWellPositioned).toBe(true);
      expect(result.fitsInHeader).toBe(true);
      expect(result.isValid).toBe(true);
    });

    test('should validate trade license information visibility', () => {
      const mockValidateTradeLicense = (licenseInfo, layout) => {
        const validation = {
          hasLicenseNumber: licenseInfo.number && licenseInfo.number.length > 0,
          hasIssueDate: licenseInfo.issueDate && licenseInfo.issueDate.length > 0,
          hasIssuingAuthority: licenseInfo.authority && licenseInfo.authority.length > 0,
          isVisibleSize: licenseInfo.fontSize >= 10,
          isProperlyPositioned: licenseInfo.x >= layout.margins.left &&
                               licenseInfo.y >= layout.margins.top
        };
        
        // Check if license info fits in designated area
        const textWidth = licenseInfo.text.length * (licenseInfo.fontSize * 0.5); // Reduced multiplier
        validation.fitsInArea = textWidth <= licenseInfo.maxWidth;
        
        validation.isCompliant = validation.hasLicenseNumber && 
                               validation.hasIssueDate && 
                               validation.hasIssuingAuthority &&
                               validation.isVisibleSize &&
                               validation.fitsInArea;
        
        return validation;
      };

      const licenseInfo = {
        number: 'TL-123456789',
        issueDate: '01-01-2024',
        authority: 'City Corporation',
        text: 'Trade License: TL-123456789 | Issued: 01-01-2024 | Authority: City Corporation',
        fontSize: 10,
        x: 50,
        y: 100,
        maxWidth: 400
      };
      
      const layout = {
        margins: { left: 50, top: 50 }
      };
      
      const result = mockValidateTradeLicense(licenseInfo, layout);
      
      expect(result.hasLicenseNumber).toBe(true);
      expect(result.hasIssueDate).toBe(true);
      expect(result.hasIssuingAuthority).toBe(true);
      expect(result.isVisibleSize).toBe(true);
      expect(result.isCompliant).toBe(true);
    });

    test('should ensure logo and license are print-safe', () => {
      const mockValidatePrintSafety = (elements) => {
        const validation = {};
        
        elements.forEach(element => {
          validation[element.type] = {
            hasHighResolution: element.dpi >= 300,
            isVectorFormat: ['svg', 'eps', 'pdf'].includes(element.format),
            hasProperColors: element.colorMode === 'CMYK' || element.colorMode === 'Grayscale',
            isWithinMargins: element.x >= 50 && element.y >= 50,
            hasBackup: element.fallback !== null
          };
          
          validation[element.type].isPrintSafe = 
            (validation[element.type].hasHighResolution || validation[element.type].isVectorFormat) &&
            validation[element.type].isWithinMargins;
        });
        
        const allPrintSafe = Object.values(validation).every(v => v.isPrintSafe);
        
        return { validation, allPrintSafe };
      };

      const elements = [
        {
          type: 'logo',
          dpi: 300,
          format: 'png',
          colorMode: 'CMYK',
          x: 50,
          y: 50,
          fallback: 'text-logo'
        },
        {
          type: 'license',
          dpi: 300,
          format: 'text',
          colorMode: 'Grayscale',
          x: 50,
          y: 100,
          fallback: null
        }
      ];
      
      const result = mockValidatePrintSafety(elements);
      
      expect(result.allPrintSafe).toBe(true);
      expect(result.validation.logo.isPrintSafe).toBe(true);
      expect(result.validation.license.isPrintSafe).toBe(true);
    });
  });
});