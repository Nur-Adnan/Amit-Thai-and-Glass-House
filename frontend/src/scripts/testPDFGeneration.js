// Test PDF generation functionality
// This would be run in the browser console to test PDF generation

const testPDFGeneration = async () => {
  console.log('🧪 Testing PDF Generation...');
  
  try {
    // Import html2pdf dynamically (same as in the component)
    const html2pdf = (await import('html2pdf.js')).default;
    console.log('✅ html2pdf.js loaded successfully');
    
    // Create test HTML content
    const testHTML = `
      <div style="padding: 20px; font-family: Arial, sans-serif;">
        <h1 style="color: #2563eb;">Test Invoice</h1>
        <p><strong>Invoice No:</strong> INV-202601-TEST</p>
        <p><strong>Customer:</strong> Test Customer</p>
        <p><strong>Amount:</strong> ৳১,০০০.০০</p>
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <tr style="background: #f8f9fa;">
            <th style="border: 1px solid #ddd; padding: 8px;">Item</th>
            <th style="border: 1px solid #ddd; padding: 8px;">Qty</th>
            <th style="border: 1px solid #ddd; padding: 8px;">Price</th>
          </tr>
          <tr>
            <td style="border: 1px solid #ddd; padding: 8px;">Test Glass</td>
            <td style="border: 1px solid #ddd; padding: 8px;">10</td>
            <td style="border: 1px solid #ddd; padding: 8px;">৳১,০০০.০০</td>
          </tr>
        </table>
      </div>
    `;
    
    // Create temporary div
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = testHTML;
    document.body.appendChild(tempDiv);
    
    // PDF generation options
    const opt = {
      margin: [10, 10, 10, 10],
      filename: 'test-invoice.pdf',
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { 
        scale: 2,
        useCORS: true,
        letterRendering: true
      },
      jsPDF: { 
        unit: 'mm', 
        format: 'a4', 
        orientation: 'portrait'
      }
    };
    
    // Generate PDF
    await html2pdf().set(opt).from(tempDiv).save();
    
    // Cleanup
    document.body.removeChild(tempDiv);
    
    console.log('✅ PDF generation test completed successfully');
    console.log('📄 Test PDF should have been downloaded');
    
  } catch (error) {
    console.error('❌ PDF generation test failed:', error);
  }
};

// Export for browser testing
if (typeof window !== 'undefined') {
  window.testPDFGeneration = testPDFGeneration;
  console.log('💡 Run testPDFGeneration() in browser console to test PDF generation');
}