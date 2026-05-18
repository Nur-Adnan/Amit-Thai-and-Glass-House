'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';

interface ShopConfig {
  shopName: string;
  logo?: {
    url?: string;
  };
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  phone: {
    primary: string;
    secondary?: string;
  };
  email: {
    primary?: string;
  };
  website?: string;
  footerNote: string;
  termsAndConditions?: string;
  currency: {
    code: string;
    symbol: string;
    position: 'before' | 'after';
  };
  tax: {
    enabled: boolean;
    rate: number;
    label: string;
  };
  invoiceSettings: {
    showLogo: boolean;
    showAddress: boolean;
    showPhone: boolean;
    showEmail: boolean;
    showWebsite: boolean;
    showFooterNote: boolean;
    showTerms: boolean;
    showTax: boolean;
    logoSize: 'small' | 'medium' | 'large';
  };
  theme: {
    primaryColor: string;
    secondaryColor: string;
    fontFamily: string;
  };
}

interface InvoiceItem {
  productName: string;
  quantity: number;
  unit?: string;
  unitPrice: number;
  totalPrice: number;
  // Calculator-based items
  isCalculatorItem?: boolean;
  dimensions?: {
    length?: number;
    width?: number;
    area?: number;
  };
}

interface Invoice {
  _id: string;
  invoiceNo: string;
  customerName: string;
  customerPhone?: string;
  customerAddress?: string;
  items: InvoiceItem[];
  subtotal: number;
  discount: number;
  discountType: 'amount' | 'percentage';
  grandTotal: number;
  paidAmount: number;
  dueAmount: number;
  status: 'paid' | 'partial' | 'due';
  paymentMethod: string;
  notes?: string;
  createdAt: string;
}

interface PrintableInvoiceProps {
  invoice: Invoice;
  onClose: () => void;
}

export default function PrintableInvoice({ invoice, onClose }: PrintableInvoiceProps) {
  const [shopConfig, setShopConfig] = useState<ShopConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchShopConfig();
  }, []);

  const fetchShopConfig = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/shop-config');
      if (response.ok) {
        const data = await response.json();
        setShopConfig(data.data);
      }
    } catch (error) {
      console.error('Error fetching shop config:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    if (!shopConfig) return `৳${amount.toFixed(2)}`;
    
    const formatted = amount.toLocaleString('en-BD', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
    
    return shopConfig.currency.position === 'before' 
      ? `${shopConfig.currency.symbol}${formatted}`
      : `${formatted}${shopConfig.currency.symbol}`;
  };

  const handlePrint = () => {
    // Hide all other elements and show only the printable content
    const originalContents = document.body.innerHTML;
    const printContents = printRef.current?.innerHTML;

    if (printContents) {
      document.body.innerHTML = printContents;
      window.print();
      document.body.innerHTML = originalContents;
      window.location.reload(); // Reload to restore the page
    }
  };

  const handleDownloadPDF = async () => {
    setIsGeneratingPDF(true);
    try {
      // Import html2pdf dynamically
      const html2pdf = (await import('html2pdf.js')).default;
      
      const element = printRef.current;
      if (!element) return;

      const opt = {
        margin: [10, 10, 10, 10] as [number, number, number, number],
        filename: `${invoice.invoiceNo}.pdf`,
        image: { type: 'jpeg' as const, quality: 0.98 },
        html2canvas: { 
          scale: 2,
          useCORS: true,
          letterRendering: true
        },
        jsPDF: { 
          unit: 'mm', 
          format: 'a4', 
          orientation: 'portrait' as const
        }
      };

      await html2pdf().set(opt).from(element).save();
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF. Please try again.');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-lg">
          <div className="text-center">Loading invoice...</div>
        </div>
      </div>
    );
  }

  const config = shopConfig || {
    shopName: 'Thai & Aluminum Business',
    address: {
      street: 'Business Address',
      city: 'Dhaka',
      state: 'Dhaka Division',
      zipCode: '1000',
      country: 'Bangladesh'
    },
    phone: { primary: '+880-XXX-XXXXXX' },
    email: { primary: 'info@business.com' },
    footerNote: 'Thank you for your business!',
    currency: { code: 'BDT', symbol: '৳', position: 'before' as const },
    tax: { enabled: false, rate: 0, label: 'VAT' },
    invoiceSettings: {
      showLogo: true,
      showAddress: true,
      showPhone: true,
      showEmail: true,
      showWebsite: false,
      showFooterNote: true,
      showTerms: false,
      showTax: false,
      logoSize: 'medium' as const
    },
    theme: {
      primaryColor: '#000000', // Black for print
      secondaryColor: '#333333',
      fontFamily: 'Arial'
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header with controls - Hidden in print */}
        <div className="flex justify-between items-center p-4 border-b border-gray-200 print:hidden no-print">
          <h2 className="text-xl font-semibold text-gray-900">Invoice - {invoice.invoiceNo}</h2>
          <div className="flex space-x-2">
            <button
              onClick={handlePrint}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 flex items-center"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              Print
            </button>
            <button
              onClick={handleDownloadPDF}
              disabled={isGeneratingPDF}
              className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 flex items-center disabled:opacity-50"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              {isGeneratingPDF ? 'Generating...' : 'Download PDF'}
            </button>
            <button
              onClick={onClose}
              className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
            >
              Close
            </button>
          </div>
        </div>

        {/* Printable Invoice Content - A4 Optimized */}
        <div 
          ref={printRef}
          className="print-content"
          style={{
            width: '210mm',
            minHeight: '297mm',
            margin: '0 auto',
            padding: '20mm',
            backgroundColor: 'white',
            color: 'black',
            fontSize: '12px',
            lineHeight: '1.4',
            fontFamily: 'Arial, sans-serif'
          }}
        >
          {/* Header Section */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '30px', borderBottom: '2px solid #000', paddingBottom: '15px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              {config.invoiceSettings.showLogo && config.logo?.url && (
                <Image 
                  src={config.logo.url} 
                  alt="Logo" 
                  width={config.invoiceSettings.logoSize === 'small' ? 40 : 
                         config.invoiceSettings.logoSize === 'medium' ? 60 : 80}
                  height={config.invoiceSettings.logoSize === 'small' ? 40 : 
                          config.invoiceSettings.logoSize === 'medium' ? 60 : 80}
                  style={{
                    objectFit: 'contain'
                  }}
                />
              )}
              <div>
                <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: '0 0 8px 0', color: '#000' }}>
                  {config.shopName}
                </h1>
                {config.invoiceSettings.showAddress && (
                  <div style={{ fontSize: '11px', color: '#333', lineHeight: '1.3' }}>
                    <div>{config.address.street}</div>
                    <div>{config.address.city}, {config.address.state} {config.address.zipCode}</div>
                    <div>{config.address.country}</div>
                  </div>
                )}
                <div style={{ marginTop: '8px', fontSize: '11px', color: '#333' }}>
                  {config.invoiceSettings.showPhone && (
                    <div>Phone: {config.phone.primary}</div>
                  )}
                  {config.invoiceSettings.showEmail && config.email.primary && (
                    <div>Email: {config.email.primary}</div>
                  )}
                  {config.invoiceSettings.showWebsite && config.website && (
                    <div>Web: {config.website}</div>
                  )}
                </div>
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 'bold', margin: '0 0 10px 0', color: '#000' }}>
                INVOICE
              </h2>
              <div style={{ fontSize: '11px', lineHeight: '1.5' }}>
                <div><strong>Invoice No:</strong> {invoice.invoiceNo}</div>
                <div><strong>Date:</strong> {new Date(invoice.createdAt).toLocaleDateString('en-GB')}</div>
                <div><strong>Status:</strong> {invoice.status.toUpperCase()}</div>
              </div>
            </div>
          </div>

          {/* Customer Information */}
          <div style={{ marginBottom: '25px', padding: '12px', border: '1px solid #ccc', backgroundColor: '#f9f9f9' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 'bold', margin: '0 0 8px 0', color: '#000' }}>
              Bill To:
            </h3>
            <div style={{ fontSize: '12px' }}>
              <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>{invoice.customerName}</div>
              {invoice.customerPhone && <div>Phone: {invoice.customerPhone}</div>}
              {invoice.customerAddress && <div>{invoice.customerAddress}</div>}
            </div>
          </div>

          {/* Items Table */}
          <div style={{ marginBottom: '25px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #000' }}>
              <thead>
                <tr style={{ backgroundColor: '#f0f0f0' }}>
                  <th style={{ border: '1px solid #000', padding: '8px', textAlign: 'left', fontSize: '11px', fontWeight: 'bold' }}>
                    Item Description
                  </th>
                  <th style={{ border: '1px solid #000', padding: '8px', textAlign: 'center', fontSize: '11px', fontWeight: 'bold', width: '80px' }}>
                    Qty
                  </th>
                  <th style={{ border: '1px solid #000', padding: '8px', textAlign: 'right', fontSize: '11px', fontWeight: 'bold', width: '100px' }}>
                    Unit Price
                  </th>
                  <th style={{ border: '1px solid #000', padding: '8px', textAlign: 'right', fontSize: '11px', fontWeight: 'bold', width: '100px' }}>
                    Total
                  </th>
                </tr>
              </thead>
              <tbody>
                {invoice.items.map((item, index) => (
                  <tr key={index}>
                    <td style={{ border: '1px solid #000', padding: '8px', fontSize: '11px', verticalAlign: 'top' }}>
                      <div style={{ fontWeight: 'bold', marginBottom: '2px' }}>{item.productName}</div>
                      {item.unit && (
                        <div style={{ color: '#666', fontSize: '10px' }}>Unit: {item.unit}</div>
                      )}
                      {/* Calculator-based item details */}
                      {item.isCalculatorItem && item.dimensions && (
                        <div style={{ color: '#666', fontSize: '10px', marginTop: '4px' }}>
                          {item.dimensions.length && item.dimensions.width && (
                            <div>Dimensions: {item.dimensions.length}&quot; × {item.dimensions.width}&quot;</div>
                          )}
                          {item.dimensions.area && (
                            <div>Area: {item.dimensions.area.toFixed(2)} sq ft</div>
                          )}
                        </div>
                      )}
                    </td>
                    <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center', fontSize: '11px' }}>
                      {item.quantity}
                    </td>
                    <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'right', fontSize: '11px' }}>
                      {formatCurrency(item.unitPrice)}
                    </td>
                    <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'right', fontSize: '11px', fontWeight: 'bold' }}>
                      {formatCurrency(item.totalPrice)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals Section */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '25px' }}>
            <div style={{ width: '250px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #ccc', fontSize: '11px' }}>
                <span>Subtotal:</span>
                <span>{formatCurrency(invoice.subtotal)}</span>
              </div>
              
              {invoice.discount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #ccc', fontSize: '11px' }}>
                  <span>
                    Discount {invoice.discountType === 'percentage' ? `(${invoice.discount}%)` : ''}:
                  </span>
                  <span>-{formatCurrency(
                    invoice.discountType === 'percentage' 
                      ? (invoice.subtotal * invoice.discount) / 100 
                      : invoice.discount
                  )}</span>
                </div>
              )}

              {config.invoiceSettings.showTax && config.tax.enabled && config.tax.rate > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #ccc', fontSize: '11px' }}>
                  <span>{config.tax.label} ({config.tax.rate}%):</span>
                  <span>{formatCurrency((invoice.grandTotal * config.tax.rate) / 100)}</span>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '2px solid #000', fontSize: '14px', fontWeight: 'bold' }}>
                <span>Grand Total:</span>
                <span>{formatCurrency(invoice.grandTotal)}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: '11px' }}>
                <span>Paid Amount:</span>
                <span style={{ color: invoice.paidAmount > 0 ? '#000' : '#666' }}>
                  {formatCurrency(invoice.paidAmount)}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: '12px', fontWeight: 'bold' }}>
                <span>Due Amount:</span>
                <span style={{ color: invoice.dueAmount > 0 ? '#000' : '#666' }}>
                  {formatCurrency(invoice.dueAmount)}
                </span>
              </div>
            </div>
          </div>

          {/* Payment Information */}
          <div style={{ marginBottom: '25px', padding: '12px', border: '1px solid #ccc', backgroundColor: '#f9f9f9' }}>
            <h3 style={{ fontSize: '12px', fontWeight: 'bold', margin: '0 0 8px 0', color: '#000' }}>
              Payment Information:
            </h3>
            <div style={{ fontSize: '11px' }}>
              <div><strong>Payment Method:</strong> {invoice.paymentMethod.replace('_', ' ').toUpperCase()}</div>
              {invoice.notes && (
                <div style={{ marginTop: '4px' }}><strong>Notes:</strong> {invoice.notes}</div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div style={{ borderTop: '1px solid #ccc', paddingTop: '15px', marginTop: 'auto' }}>
            {config.invoiceSettings.showFooterNote && config.footerNote && (
              <div style={{ textAlign: 'center', marginBottom: '15px' }}>
                <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#000' }}>
                  {config.footerNote}
                </div>
              </div>
            )}

            {config.invoiceSettings.showTerms && config.termsAndConditions && (
              <div style={{ marginBottom: '15px' }}>
                <h4 style={{ fontSize: '11px', fontWeight: 'bold', margin: '0 0 6px 0', color: '#000' }}>
                  Terms & Conditions:
                </h4>
                <div style={{ fontSize: '10px', color: '#333', whiteSpace: 'pre-line' }}>
                  {config.termsAndConditions}
                </div>
              </div>
            )}

            <div style={{ textAlign: 'center', fontSize: '10px', color: '#666', borderTop: '1px solid #eee', paddingTop: '10px' }}>
              <div>Generated on {new Date().toLocaleString('en-GB')}</div>
              <div>This is a computer-generated invoice.</div>
            </div>
          </div>
        </div>
      </div>

      {/* Print-specific styles */}
      <style jsx>{`
        @media print {
          .no-print {
            display: none !important;
          }
          
          .print-content {
            width: 210mm !important;
            min-height: 297mm !important;
            margin: 0 !important;
            padding: 15mm !important;
            box-shadow: none !important;
            border: none !important;
            background: white !important;
            color: black !important;
            font-size: 12px !important;
            line-height: 1.4 !important;
          }
          
          body {
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
          }
          
          * {
            -webkit-print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
          
          table {
            page-break-inside: avoid !important;
          }
          
          tr {
            page-break-inside: avoid !important;
            page-break-after: auto !important;
          }
          
          thead {
            display: table-header-group !important;
          }
          
          tfoot {
            display: table-footer-group !important;
          }
        }
        
        @page {
          size: A4;
          margin: 15mm;
        }
      `}</style>
    </div>
  );
}