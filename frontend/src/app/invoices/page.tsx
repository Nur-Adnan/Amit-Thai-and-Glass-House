'use client'

import { useState, useEffect, useCallback } from 'react'
import Layout from '@/components/Layout'
import {
  Card,
  CardBody,
  CardHeader,
  Button,
  Input,
  Chip,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  Select,
  SelectItem,
} from '@heroui/react'
import { EmptyState } from '@/components/ui/empty-state'
import { StatusBadge } from '@/components/ui/status-badge'
import {
  ProfessionalTable,
  ProfessionalTableHeader,
  ProfessionalTableRow,
  ProfessionalTableCell,
  TableBody,
  TableHeader
} from '@/components/ui/professional-table'
import { 
  Search, 
  Receipt, 
  Eye, 
  Printer, 
  Download,
  Calendar,
  User,
  DollarSign,
  Filter,
  Plus
} from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'
import { useFormatting } from '@/hooks/useFormatting'

// Helper function to format variant information consistently
const formatVariantInfo = (item: InvoiceItem) => {
  if (!item.materialType || !item.company) {
    return null;
  }
  
  const parts = [item.materialType, item.company];
  if (item.thicknessMM) parts.push(`${item.thicknessMM}mm`);
  if (item.quality) parts.push(item.quality);
  
  return {
    display: parts.join(' - '),
    materialType: item.materialType,
    company: item.company,
    thickness: item.thicknessMM ? `${item.thicknessMM}mm` : null,
    quality: item.quality,
    sizeInfo: item.calculatedArea ? `Area: ${item.calculatedArea} ${item.unit}` : null
  };
};

interface InvoiceItem {
  productName: string
  quantity: number
  unit: string
  unitPrice: number
  totalPrice: number
  // Variant tracking fields
  materialType?: string
  company?: string
  thicknessMM?: number
  quality?: string
  measurementType?: string
  calculatedArea?: number
}

interface Invoice {
  _id: string
  invoiceNo: string
  customerName: string
  customerPhone?: string
  customerAddress?: string
  items: InvoiceItem[]
  subtotal: number
  discountAmount: number
  grandTotal: number
  paidAmount: number
  dueAmount: number
  status: 'paid' | 'partial' | 'due'
  paymentMethod: string
  notes?: string
  createdAt: string
  updatedAt: string
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [filteredInvoices, setFilteredInvoices] = useState<Invoice[]>([])
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const { t } = useLanguage()
  const { formatCurrency, formatDate } = useFormatting()

  const fetchInvoices = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('http://localhost:3001/api/invoices', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch invoices')
      }

      const data = await response.json()
      if (data.success) {
        setInvoices(data.data)
      } else {
        throw new Error(data.message || 'Failed to fetch invoices')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const filterInvoices = useCallback(() => {
    let filtered = invoices

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(invoice => 
        invoice.invoiceNo.toLowerCase().includes(term) ||
        invoice.customerName.toLowerCase().includes(term) ||
        invoice.customerPhone?.toLowerCase().includes(term)
      )
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(invoice => invoice.status === statusFilter)
    }

    setFilteredInvoices(filtered)
  }, [invoices, searchTerm, statusFilter])

  useEffect(() => {
    fetchInvoices()
  }, [])

  useEffect(() => {
    filterInvoices()
  }, [filterInvoices])

  const handlePrint = (invoice: Invoice) => {
    const printWindow = window.open('', '_blank')
    if (!printWindow) return

    const printContent = generatePrintHTML(invoice)
    printWindow.document.open()
    printWindow.document.write(printContent)
    printWindow.document.close()
    
    printWindow.onload = () => {
      printWindow.print()
    }
  }

  const handleDownloadPDF = async (invoice: Invoice) => {
    try {
      const html2pdf = (await import('html2pdf.js')).default
      
      const printContent = generatePrintHTML(invoice)
      const tempDiv = document.createElement('div')
      tempDiv.innerHTML = printContent
      document.body.appendChild(tempDiv)

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
      }

      await html2pdf().set(opt).from(tempDiv).save()
      document.body.removeChild(tempDiv)
    } catch (error) {
      console.error('Error generating PDF:', error)
      alert('Error generating PDF. Please try again.')
    }
  }

  const generatePrintHTML = (invoice: Invoice) => {
    return `
      <!DOCTYPE html>
      <html lang="bn">
        <head>
          <title>Invoice ${invoice.invoiceNo}</title>
          <meta charset="UTF-8">
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Bengali:wght@400;500;600;700&display=swap');
            
            body { 
              font-family: 'Noto Sans Bengali', Arial, sans-serif; 
              margin: 0; 
              padding: 15mm; 
              color: #000;
              font-size: 12px;
              line-height: 1.4;
              background: white;
            }
            
            .invoice-container {
              max-width: 210mm;
              margin: 0 auto;
              background: white;
            }
            
            .header { 
              text-align: center; 
              margin-bottom: 20px; 
              border-bottom: 2px solid #000;
              padding-bottom: 15px;
            }
            
            .company-name { 
              font-size: 22px; 
              font-weight: 700; 
              color: #000;
              margin-bottom: 5px;
              text-transform: uppercase;
              letter-spacing: 1px;
            }
            
            .company-tagline {
              font-size: 14px;
              color: #333;
              margin-bottom: 8px;
              font-weight: 500;
            }
            
            .company-details {
              font-size: 11px;
              color: #444;
              line-height: 1.3;
            }
            
            .trade-license {
              font-weight: 600;
              color: #000;
              margin-top: 5px;
            }
            
            .invoice-title { 
              font-size: 18px; 
              font-weight: 700; 
              margin: 15px 0;
              text-align: center;
              text-transform: uppercase;
              letter-spacing: 1px;
              border: 2px solid #000;
              padding: 8px;
              display: inline-block;
              min-width: 120px;
            }
            
            .invoice-meta {
              display: flex;
              justify-content: space-between;
              margin-bottom: 20px;
              gap: 20px;
            }
            
            .customer-info, .invoice-info { 
              width: 48%;
              border: 1px solid #ccc;
              padding: 12px;
              background: #f9f9f9;
            }
            
            .info-title { 
              font-weight: 700; 
              font-size: 13px; 
              margin-bottom: 8px;
              color: #000;
              border-bottom: 1px solid #ddd;
              padding-bottom: 3px;
            }
            
            .info-item { 
              margin-bottom: 4px;
              font-size: 11px;
            }
            
            .info-label {
              font-weight: 600;
              display: inline-block;
              width: 60px;
            }
            
            table { 
              width: 100%; 
              border-collapse: collapse; 
              margin: 15px 0;
              border: 2px solid #000;
            }
            
            th, td { 
              border: 1px solid #333; 
              padding: 8px 6px; 
              text-align: left;
              font-size: 11px;
            }
            
            th { 
              background-color: #f0f0f0; 
              font-weight: 700;
              text-align: center;
              font-size: 12px;
            }
            
            .text-right { 
              text-align: right;
            }
            
            .text-center {
              text-align: center;
            }
            
            .product-name {
              font-weight: 600;
              margin-bottom: 2px;
              font-size: 11px;
            }
            
            .variant-info {
              font-size: 10px;
              color: #555;
              margin-top: 2px;
              font-style: italic;
            }
            
            .variant-specs {
              font-size: 10px;
              color: #666;
              margin-top: 1px;
            }
            
            .totals { 
              margin-top: 15px; 
              border: 2px solid #000;
              padding: 10px;
              background: #f9f9f9;
            }
            
            .total-row { 
              display: flex; 
              justify-content: space-between; 
              margin: 3px 0;
              padding: 2px 0;
              font-size: 12px;
            }
            
            .total-label {
              font-weight: 600;
            }
            
            .total-amount {
              font-weight: 600;
              min-width: 80px;
              text-align: right;
            }
            
            .grand-total { 
              font-size: 14px; 
              font-weight: 700; 
              border-top: 2px solid #000;
              padding-top: 8px;
              margin-top: 8px;
              background: #f0f0f0;
              padding: 8px;
            }
            
            .payment-info {
              margin-top: 15px;
              border: 1px solid #ccc;
              padding: 10px;
              background: #f9f9f9;
            }
            
            .status-badge {
              display: inline-block;
              padding: 3px 8px;
              border-radius: 3px;
              font-size: 10px;
              font-weight: 700;
              text-transform: uppercase;
              border: 1px solid;
            }
            
            .status-paid { 
              background-color: #e8f5e8; 
              color: #2d5a2d; 
              border-color: #2d5a2d;
            }
            
            .status-partial { 
              background-color: #fff3cd; 
              color: #856404; 
              border-color: #856404;
            }
            
            .status-due { 
              background-color: #f8d7da; 
              color: #721c24; 
              border-color: #721c24;
            }
            
            .footer {
              margin-top: 25px;
              text-align: center;
              font-size: 10px;
              color: #666;
              border-top: 1px solid #ccc;
              padding-top: 15px;
            }
            
            .footer-note {
              font-weight: 600;
              margin-bottom: 5px;
              color: #000;
            }
            
            .bangla-text {
              font-family: 'Noto Sans Bengali', Arial, sans-serif;
            }
            
            .currency {
              font-family: 'Noto Sans Bengali', Arial, sans-serif;
              font-weight: 600;
            }
            
            @media print {
              body { 
                margin: 0; 
                padding: 10mm;
                font-size: 11px;
              }
              .no-print { display: none; }
              .invoice-container {
                max-width: none;
              }
              .header {
                margin-bottom: 15px;
                padding-bottom: 10px;
              }
              .invoice-title {
                font-size: 16px;
                padding: 6px;
              }
              table {
                margin: 10px 0;
              }
              th, td {
                padding: 6px 4px;
                font-size: 10px;
              }
            }
            
            @page {
              size: A4;
              margin: 10mm;
            }
          </style>
        </head>
        <body>
          <div class="invoice-container">
            <div class="header">
              <div class="company-name">Thai & Aluminum Glass House</div>
              <div class="company-tagline bangla-text">পেশাদার গ্লাস সমাধান | Professional Glass Solutions</div>
              <div class="company-details">
                <div>📍 Shop Address: Dhanmondi, Dhaka-1205, Bangladesh</div>
                <div>📞 Phone: +880-1XXX-XXXXXX | 📧 Email: info@thaiglass.com</div>
                <div class="trade-license">🏢 Trade License No: TRAD/DH/2024/001234</div>
              </div>
            </div>

            <div style="text-align: center;">
              <div class="invoice-title bangla-text">চালান | INVOICE</div>
            </div>

            <div class="invoice-meta">
              <div class="customer-info">
                <div class="info-title bangla-text">🏠 গ্রাহকের তথ্য | Customer Information</div>
                <div class="info-item">
                  <span class="info-label bangla-text">নাম:</span>
                  <strong>${invoice.customerName}</strong>
                </div>
                ${invoice.customerPhone ? `
                  <div class="info-item">
                    <span class="info-label bangla-text">ফোন:</span>
                    ${invoice.customerPhone}
                  </div>
                ` : ''}
                ${invoice.customerAddress ? `
                  <div class="info-item">
                    <span class="info-label bangla-text">ঠিকানা:</span>
                    ${invoice.customerAddress}
                  </div>
                ` : ''}
              </div>
              
              <div class="invoice-info">
                <div class="info-title bangla-text">📋 চালানের তথ্য | Invoice Details</div>
                <div class="info-item">
                  <span class="info-label bangla-text">চালান নং:</span>
                  <strong>${invoice.invoiceNo}</strong>
                </div>
                <div class="info-item">
                  <span class="info-label bangla-text">তারিখ:</span>
                  ${formatDate(new Date(invoice.createdAt))}
                </div>
                <div class="info-item">
                  <span class="info-label bangla-text">অবস্থা:</span>
                  <span class="status-badge status-${invoice.status}">
                    ${invoice.status === 'paid' ? 'পরিশোধিত | PAID' : 
                      invoice.status === 'partial' ? 'আংশিক | PARTIAL' : 
                      'বকেয়া | DUE'}
                  </span>
                </div>
              </div>
            </div>

            <table>
              <thead>
                <tr>
                  <th class="bangla-text">পণ্যের বিবরণ<br>Product Details</th>
                  <th class="bangla-text">পরিমাণ<br>Qty</th>
                  <th class="bangla-text">একক<br>Unit</th>
                  <th class="bangla-text">দর<br>Rate</th>
                  <th class="bangla-text">মোট<br>Total</th>
                </tr>
              </thead>
              <tbody>
                ${invoice.items.map(item => {
                  // Use the helper function for consistent formatting
                  const variantInfo = formatVariantInfo(item);
                  
                  return `
                    <tr>
                      <td>
                        <div class="product-name">${item.productName}</div>
                        ${variantInfo ? `
                          <div class="variant-info">
                            <strong>ব্র্যান্ড:</strong> ${variantInfo.materialType} - ${variantInfo.company}
                          </div>
                          ${variantInfo.thickness ? `
                            <div class="variant-specs">
                              <strong>পুরুত্ব:</strong> ${variantInfo.thickness} | 
                              <strong>মান:</strong> ${variantInfo.quality || 'Standard'}
                            </div>
                          ` : ''}
                        ` : ''}
                        ${variantInfo?.sizeInfo ? `
                          <div class="variant-specs">
                            <strong>আকার:</strong> ${variantInfo.sizeInfo}
                          </div>
                        ` : ''}
                      </td>
                      <td class="text-center">${item.quantity}</td>
                      <td class="text-center">${item.unit}</td>
                      <td class="text-right currency">${formatCurrency(item.unitPrice)}</td>
                      <td class="text-right currency">${formatCurrency(item.totalPrice)}</td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>

            <div class="totals">
              <div class="total-row">
                <span class="total-label bangla-text">উপমোট | Subtotal:</span>
                <span class="total-amount currency">${formatCurrency(invoice.subtotal)}</span>
              </div>
              ${invoice.discountAmount > 0 ? `
                <div class="total-row">
                  <span class="total-label bangla-text">ছাড় | Discount:</span>
                  <span class="total-amount currency">-${formatCurrency(invoice.discountAmount)}</span>
                </div>
              ` : ''}
              <div class="total-row grand-total">
                <span class="total-label bangla-text">সর্বমোট | Grand Total:</span>
                <span class="total-amount currency">${formatCurrency(invoice.grandTotal)}</span>
              </div>
            </div>

            <div class="payment-info">
              <div class="total-row">
                <span class="total-label bangla-text">প্রদত্ত | Paid Amount:</span>
                <span class="total-amount currency">${formatCurrency(invoice.paidAmount)}</span>
              </div>
              <div class="total-row">
                <span class="total-label bangla-text">বকেয়া | Due Amount:</span>
                <span class="total-amount currency" style="color: ${invoice.dueAmount > 0 ? '#721c24' : '#2d5a2d'}">
                  ${formatCurrency(invoice.dueAmount)}
                </span>
              </div>
            </div>

            ${invoice.notes ? `
              <div style="margin-top: 15px; border: 1px solid #ccc; padding: 10px; background: #f9f9f9;">
                <div class="info-title bangla-text">📝 বিশেষ নোট | Notes:</div>
                <div style="font-size: 11px;">${invoice.notes}</div>
              </div>
            ` : ''}

            <div class="footer">
              <div class="footer-note bangla-text">আপনার ব্যবসার জন্য ধন্যবাদ!</div>
              <div class="footer-note">Thank you for your business!</div>
              <div>Generated on ${formatDate(new Date())} | Powered by Thai Glass POS</div>
              <div style="margin-top: 8px; font-size: 9px;">
                <strong>বিঃদ্রঃ</strong> এই চালানটি কম্পিউটার দ্বারা তৈরি এবং স্বাক্ষরের প্রয়োজন নেই।<br>
                <strong>Note:</strong> This invoice is computer generated and does not require signature.
              </div>
            </div>
          </div>
        </body>
      </html>
    `
  }

  if (loading) {
    return (
      <Layout>
        <div className="space-professional">
          <div className="flex items-center justify-center h-64">
            <div className="loading-spinner h-8 w-8"></div>
          </div>
        </div>
      </Layout>
    )
  }

  if (error) {
    return (
      <Layout>
        <div className="space-professional">
          <Card>
            <CardBody className="pt-6">
              <EmptyState
                icon={Receipt}
                title="Error loading invoices"
                description={error}
                action={{
                  label: "Try Again",
                  onClick: fetchInvoices
                }}
              />
            </CardBody>
          </Card>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="space-professional">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Receipt className="h-6 w-6 text-primary" />
            <div>
              <h1 className="heading-1">{t('invoices')}</h1>
              <p className="text-muted-foreground">
                Manage and track all your invoices
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Chip color="default" variant="flat" className="text-sm">
              {filteredInvoices.length} invoices
            </Chip>
            <Button color="primary" startContent={<Plus className="h-4 w-4" />}>
              New Invoice
            </Button>
          </div>
        </div>

        {/* Search and Filters */}
        <Card>
          <CardBody className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground z-10" />
                <Input
                  aria-label="Search invoices"
                  placeholder="Search invoices..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <Select
                  aria-label="Filter by status"
                  selectedKeys={statusFilter ? [statusFilter] : []}
                  onSelectionChange={(keys) => setStatusFilter(Array.from(keys)[0] as string)}
                  className="w-40"
                >
                  <SelectItem key="all">All Status</SelectItem>
                  <SelectItem key="paid">Paid</SelectItem>
                  <SelectItem key="partial">Partial</SelectItem>
                  <SelectItem key="due">Due</SelectItem>
                </Select>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Invoice List */}
        <Card>
          <CardHeader className="flex flex-col items-start gap-1">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              Invoice List
            </h3>
          </CardHeader>
          <CardBody>
            {filteredInvoices.length === 0 ? (
              <EmptyState
                icon={Receipt}
                title="No invoices found"
                description={searchTerm ? "Try adjusting your search terms" : "Create your first invoice to get started"}
                action={{
                  label: "Create Invoice",
                  onClick: () => window.location.href = '/invoice'
                }}
              />
            ) : (
              <ProfessionalTable>
                <TableHeader>
                  <tr>
                    <ProfessionalTableHeader icon={Calendar}>
                      Date
                    </ProfessionalTableHeader>
                    <ProfessionalTableHeader>
                      Invoice No
                    </ProfessionalTableHeader>
                    <ProfessionalTableHeader icon={User}>
                      Customer
                    </ProfessionalTableHeader>
                    <ProfessionalTableHeader icon={DollarSign}>
                      Amount
                    </ProfessionalTableHeader>
                    <ProfessionalTableHeader>
                      Status
                    </ProfessionalTableHeader>
                    <ProfessionalTableHeader>
                      Actions
                    </ProfessionalTableHeader>
                  </tr>
                </TableHeader>
                <TableBody>
                  {filteredInvoices.map((invoice, index) => (
                    <ProfessionalTableRow key={invoice._id || `invoice-${index}`}>
                      <ProfessionalTableCell>
                        <span className="font-medium">
                          {formatDate(new Date(invoice.createdAt))}
                        </span>
                      </ProfessionalTableCell>
                      <ProfessionalTableCell>
                        <span className="font-mono font-semibold">
                          {invoice.invoiceNo}
                        </span>
                      </ProfessionalTableCell>
                      <ProfessionalTableCell>
                        <div>
                          <div className="font-medium">{invoice.customerName}</div>
                          {invoice.customerPhone && (
                            <div className="text-sm text-muted-foreground">
                              {invoice.customerPhone}
                            </div>
                          )}
                        </div>
                      </ProfessionalTableCell>
                      <ProfessionalTableCell>
                        <div className="font-semibold">
                          {formatCurrency(invoice.grandTotal)}
                        </div>
                        {invoice.dueAmount > 0 && (
                          <div className="text-sm text-red-600">
                            Due: {formatCurrency(invoice.dueAmount)}
                          </div>
                        )}
                      </ProfessionalTableCell>
                      <ProfessionalTableCell>
                        <StatusBadge 
                          status={invoice.status} 
                          animate={invoice.status === 'due'}
                        />
                      </ProfessionalTableCell>
                      <ProfessionalTableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            isIconOnly
                            variant="light"
                            size="sm"
                            onPress={() => setSelectedInvoice(invoice)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>

                          <Button
                            isIconOnly
                            variant="light"
                            size="sm"
                            onPress={() => handlePrint(invoice)}
                          >
                            <Printer className="h-4 w-4" />
                          </Button>

                          <Button
                            isIconOnly
                            variant="light"
                            size="sm"
                            onPress={() => handleDownloadPDF(invoice)}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      </ProfessionalTableCell>
                    </ProfessionalTableRow>
                  ))}
                </TableBody>
              </ProfessionalTable>
            )}
          </CardBody>
        </Card>

        {/* Invoice Details Modal */}
        <Modal
          isOpen={!!selectedInvoice}
          onOpenChange={(open) => { if (!open) setSelectedInvoice(null) }}
          size="4xl"
          scrollBehavior="inside"
        >
          <ModalContent>
            {(onClose) => (
              <>
                <ModalHeader className="flex flex-col gap-1">
                  Invoice Details - {selectedInvoice?.invoiceNo}
                </ModalHeader>
                <ModalBody className="pb-6">
                  {selectedInvoice && (
                    <InvoiceDetails
                      invoice={selectedInvoice}
                      onPrint={() => handlePrint(selectedInvoice)}
                      onDownloadPDF={() => handleDownloadPDF(selectedInvoice)}
                    />
                  )}
                </ModalBody>
              </>
            )}
          </ModalContent>
        </Modal>
      </div>
    </Layout>
  )
}

// Invoice Details Component
function InvoiceDetails({ 
  invoice, 
  onPrint, 
  onDownloadPDF 
}: { 
  invoice: Invoice
  onPrint: () => void
  onDownloadPDF: () => void
}) {
  const { formatCurrency, formatDate } = useFormatting()

  return (
    <div className="space-professional-sm">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="heading-2">Invoice {invoice.invoiceNo}</h2>
          <p className="text-muted-foreground">
            Created on {formatDate(new Date(invoice.createdAt))}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={invoice.status} />
          <Button onPress={onPrint} variant="bordered" size="sm" startContent={<Printer className="h-4 w-4" />}>
            Print
          </Button>
          <Button onPress={onDownloadPDF} variant="bordered" size="sm" startContent={<Download className="h-4 w-4" />}>
            PDF
          </Button>
        </div>
      </div>

      {/* Business Header Info */}
      <Card>
        <CardHeader className="flex flex-col items-start gap-1">
          <div className="text-center w-full">
            <div className="text-xl font-bold">Thai & Aluminum Glass House</div>
            <div className="text-sm text-muted-foreground mt-1">
              পেশাদার গ্লাস সমাধান | Professional Glass Solutions
            </div>
            <div className="text-xs text-muted-foreground mt-2">
              📍 Dhanmondi, Dhaka-1205 | 📞 +880-1XXX-XXXXXX | 🏢 Trade License: TRAD/DH/2024/001234
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Customer Info */}
      <Card>
        <CardHeader className="flex flex-col items-start gap-1">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <User className="h-5 w-5" />
            গ্রাহকের তথ্য | Customer Information
          </h3>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">নাম | Name</p>
              <p className="font-semibold">{invoice.customerName}</p>
            </div>
            {invoice.customerPhone && (
              <div>
                <p className="text-sm text-muted-foreground">ফোন | Phone</p>
                <p className="font-semibold">{invoice.customerPhone}</p>
              </div>
            )}
            {invoice.customerAddress && (
              <div className="md:col-span-2">
                <p className="text-sm text-muted-foreground">ঠিকানা | Address</p>
                <p className="font-semibold">{invoice.customerAddress}</p>
              </div>
            )}
          </div>
        </CardBody>
      </Card>

      {/* Items */}
      <Card>
        <CardHeader className="flex flex-col items-start gap-1">
          <h3 className="text-lg font-semibold">পণ্যের তালিকা | Items</h3>
        </CardHeader>
        <CardBody>
          <ProfessionalTable>
            <TableHeader>
              <tr>
                <ProfessionalTableHeader>
                  পণ্যের বিবরণ<br />
                  <span className="text-xs font-normal">Product Details</span>
                </ProfessionalTableHeader>
                <ProfessionalTableHeader>
                  পরিমাণ<br />
                  <span className="text-xs font-normal">Qty</span>
                </ProfessionalTableHeader>
                <ProfessionalTableHeader>
                  একক<br />
                  <span className="text-xs font-normal">Unit</span>
                </ProfessionalTableHeader>
                <ProfessionalTableHeader>
                  দর<br />
                  <span className="text-xs font-normal">Rate</span>
                </ProfessionalTableHeader>
                <ProfessionalTableHeader align="right">
                  মোট<br />
                  <span className="text-xs font-normal">Total</span>
                </ProfessionalTableHeader>
              </tr>
            </TableHeader>
            <TableBody>
              {invoice.items.map((item, index) => {
                // Use the helper function for consistent formatting
                const variantInfo = formatVariantInfo(item);
                
                return (
                  <ProfessionalTableRow key={`item-${index}-${item.productName}`}>
                    <ProfessionalTableCell>
                      <div>
                        <div className="font-medium">{item.productName}</div>
                        {variantInfo && (
                          <div className="text-sm text-muted-foreground mt-1">
                            <strong>ব্র্যান্ড:</strong> {variantInfo.display}
                          </div>
                        )}
                        {variantInfo?.thickness && (
                          <div className="text-sm text-muted-foreground">
                            <strong>পুরুত্ব:</strong> {variantInfo.thickness} | 
                            <strong>মান:</strong> {variantInfo.quality || 'Standard'}
                          </div>
                        )}
                        {variantInfo?.sizeInfo && (
                          <div className="text-sm text-muted-foreground">
                            <strong>আকার:</strong> {variantInfo.sizeInfo}
                          </div>
                        )}
                      </div>
                    </ProfessionalTableCell>
                    <ProfessionalTableCell>{item.quantity}</ProfessionalTableCell>
                    <ProfessionalTableCell>{item.unit}</ProfessionalTableCell>
                    <ProfessionalTableCell>৳{formatCurrency(item.unitPrice).replace('৳', '')}</ProfessionalTableCell>
                    <ProfessionalTableCell align="right">
                      <span className="font-semibold">
                        ৳{formatCurrency(item.totalPrice).replace('৳', '')}
                      </span>
                    </ProfessionalTableCell>
                  </ProfessionalTableRow>
                );
              })}
            </TableBody>
          </ProfessionalTable>
        </CardBody>
      </Card>

      {/* Totals */}
      <Card>
        <CardHeader className="flex flex-col items-start gap-1">
          <h3 className="text-lg font-semibold">পেমেন্ট সারাংশ | Payment Summary</h3>
        </CardHeader>
        <CardBody>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span>উপমোট | Subtotal</span>
              <span className="font-semibold">৳{formatCurrency(invoice.subtotal).replace('৳', '')}</span>
            </div>
            {invoice.discountAmount > 0 && (
              <div className="flex justify-between">
                <span>ছাড় | Discount</span>
                <span className="font-semibold text-red-600">
                  -৳{formatCurrency(invoice.discountAmount).replace('৳', '')}
                </span>
              </div>
            )}
            <div className="flex justify-between text-lg font-bold border-t pt-3">
              <span>সর্বমোট | Grand Total</span>
              <span>৳{formatCurrency(invoice.grandTotal).replace('৳', '')}</span>
            </div>
            <div className="flex justify-between">
              <span>প্রদত্ত | Paid Amount</span>
              <span className="font-semibold text-green-600">
                ৳{formatCurrency(invoice.paidAmount).replace('৳', '')}
              </span>
            </div>
            <div className="flex justify-between">
              <span>বকেয়া | Due Amount</span>
              <span className={`font-semibold ${
                invoice.dueAmount > 0 ? 'text-red-600' : 'text-green-600'
              }`}>
                ৳{formatCurrency(invoice.dueAmount).replace('৳', '')}
              </span>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Notes */}
      {invoice.notes && (
        <Card>
          <CardHeader className="flex flex-col items-start gap-1">
            <h3 className="text-lg font-semibold">বিশেষ নোট | Notes</h3>
          </CardHeader>
          <CardBody>
            <p>{invoice.notes}</p>
          </CardBody>
        </Card>
      )}
    </div>
  )
}