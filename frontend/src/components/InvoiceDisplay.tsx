'use client'

import { API_BASE } from '@/lib/apiBase'
import React, { useEffect, useState } from 'react'
import Image from 'next/image'
import { Button } from '@heroui/react'
import { useLanguage } from '@/contexts/LanguageContext'
import { useFormatting } from '@/hooks/useFormatting'

interface ShopConfig {
  shopName: string
  address: {
    street: string
    city: string
    state: string
    zipCode: string
    country: string
  }
  phone: {
    primary: string
    secondary?: string
  }
  email: {
    primary: string
  }
  trustInfo?: {
    tradeLicenseNo: string
    shopAddress: string
    contactNumber: string
    displayOnInvoice: boolean
    displayOnPrint: boolean
  }
  logo?: {
    url: string
  }
  currency: {
    symbol: string
    position: string
  }
}

interface InvoiceItem {
  productName: string
  quantity: number
  unit: string
  unitPrice: number
  totalPrice: number
}

interface Invoice {
  invoiceNo: string
  customerName: string
  customerPhone?: string
  customerAddress?: string
  items: InvoiceItem[]
  subtotal: number
  discount: number
  grandTotal: number
  paidAmount: number
  dueAmount: number
  status: string
  paymentMethod: string
  notes?: string
  createdAt: string
}

interface InvoiceDisplayProps {
  invoice: Invoice
  shopConfig?: ShopConfig
  isPrintView?: boolean
  onPrint?: () => void
  onDownloadPDF?: () => void
}

const InvoiceDisplay: React.FC<InvoiceDisplayProps> = ({
  invoice,
  shopConfig,
  isPrintView = false,
  onPrint,
  onDownloadPDF
}) => {
  const { t, language } = useLanguage()
  const { formatCurrency, formatDate, formatNumber } = useFormatting()
  const [config, setConfig] = useState<ShopConfig | null>(shopConfig || null)

  useEffect(() => {
    if (!shopConfig) {
      fetchShopConfig()
    }
  }, [shopConfig])

  const fetchShopConfig = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/shop-config`)
      const data = await response.json()
      if (data.success) {
        setConfig(data.data)
      }
    } catch (error) {
      console.error('Failed to fetch shop config:', error)
    }
  }

  const getStatusTranslation = (status: string) => {
    switch (status) {
      case 'paid': return t('invoicePaid')
      case 'partial': return t('partial')
      case 'unpaid': return t('unpaid')
      default: return status
    }
  }

  const getPaymentMethodTranslation = (method: string) => {
    switch (method) {
      case 'cash': return t('cash')
      case 'card': return t('card')
      case 'bank_transfer': return t('bankTransfer')
      case 'cheque': return t('cheque')
      default: return method
    }
  }

  const getUnitTranslation = (unit: string) => {
    switch (unit) {
      case 'sqft': return t('sqft')
      case 'piece': return t('piece')
      case 'kg': return t('kg')
      case 'meter': return t('meter')
      default: return unit
    }
  }

  const shouldShowTrustInfo = () => {
    if (!config?.trustInfo) return false
    return isPrintView ? config.trustInfo.displayOnPrint : config.trustInfo.displayOnInvoice
  }

  const printStyles = isPrintView ? `
    @media print {
      body { margin: 0; }
      .no-print { display: none !important; }
      .print-only { display: block !important; }
      .invoice-container { 
        box-shadow: none !important; 
        border: none !important;
        margin: 0 !important;
        padding: 20px !important;
      }
    }
  ` : ''

  return (
    <>
      <style>{printStyles}</style>
      <div className={`invoice-container bg-white ${isPrintView ? 'print-view' : 'shadow-lg border border-gray-200'} rounded-lg p-8 max-w-4xl mx-auto`}>
        {/* Header */}
        <div className="border-b-2 border-gray-300 pb-6 mb-6">
          <div className="flex justify-between items-start">
            <div className="flex items-center space-x-4">
              {config?.logo?.url && (
                <Image 
                  src={config.logo.url} 
                  alt="Shop Logo" 
                  width={64}
                  height={64}
                  className="object-contain"
                />
              )}
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {config?.shopName || 'Thai & Aluminum Business'}
                </h1>
                {config?.address && (
                  <p className="text-sm text-gray-600 mt-1">
                    {config.address.street}, {config.address.city}
                    {config.address.state && `, ${config.address.state}`}
                    {config.address.zipCode && ` ${config.address.zipCode}`}
                  </p>
                )}
                <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-600">
                  {config?.phone?.primary && (
                    <span>📞 {config.phone.primary}</span>
                  )}
                  {config?.email?.primary && (
                    <span>✉️ {config.email.primary}</span>
                  )}
                </div>
              </div>
            </div>
            
            <div className="text-right">
              <h2 className="text-xl font-bold text-blue-600 mb-2">
                {language === 'bn' ? 'ইনভয়েস' : 'INVOICE'}
              </h2>
              <div className="text-sm space-y-1">
                <div><strong>{t('invoiceNumber')}:</strong> {invoice.invoiceNo}</div>
                <div><strong>{t('date')}:</strong> {formatDate(new Date(invoice.createdAt))}</div>
                <div>
                  <strong>{t('status')}:</strong> 
                  <span className={`ml-2 px-2 py-1 rounded text-xs font-medium ${
                    invoice.status === 'paid' ? 'bg-green-100 text-green-800' :
                    invoice.status === 'partial' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {getStatusTranslation(invoice.status)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Trust Information for BD Market */}
          {shouldShowTrustInfo() && config?.trustInfo && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                {config.trustInfo.tradeLicenseNo && (
                  <div>
                    <strong className="text-blue-800">
                      {language === 'bn' ? 'ট্রেড লাইসেন্স নং:' : 'Trade License No:'}
                    </strong>
                    <div className="text-blue-700 font-medium">{config.trustInfo.tradeLicenseNo}</div>
                  </div>
                )}
                {config.trustInfo.shopAddress && (
                  <div>
                    <strong className="text-blue-800">
                      {language === 'bn' ? 'দোকানের ঠিকানা:' : 'Shop Address:'}
                    </strong>
                    <div className="text-blue-700">{config.trustInfo.shopAddress}</div>
                  </div>
                )}
                {config.trustInfo.contactNumber && (
                  <div>
                    <strong className="text-blue-800">
                      {language === 'bn' ? 'যোগাযোগ নম্বর:' : 'Contact Number:'}
                    </strong>
                    <div className="text-blue-700 font-medium">{config.trustInfo.contactNumber}</div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Customer Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              {language === 'bn' ? 'বিল প্রাপক:' : 'Bill To:'}
            </h3>
            <div className="space-y-1 text-sm">
              <div className="font-medium text-gray-900">{invoice.customerName}</div>
              {invoice.customerPhone && (
                <div className="text-gray-600">📞 {invoice.customerPhone}</div>
              )}
              {invoice.customerAddress && (
                <div className="text-gray-600">📍 {invoice.customerAddress}</div>
              )}
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              {language === 'bn' ? 'পেমেন্ট তথ্য:' : 'Payment Info:'}
            </h3>
            <div className="space-y-1 text-sm">
              <div><strong>{t('paymentMethod')}:</strong> {getPaymentMethodTranslation(invoice.paymentMethod)}</div>
              <div><strong>{t('paid')}:</strong> {formatCurrency(invoice.paidAmount)}</div>
              <div><strong>{t('due')}:</strong> {formatCurrency(invoice.dueAmount)}</div>
            </div>
          </div>
        </div>

        {/* Invoice Items */}
        <div className="mb-6">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 px-4 py-2 text-left text-sm font-semibold">
                    {language === 'bn' ? 'ক্রমিক' : 'S.No'}
                  </th>
                  <th className="border border-gray-300 px-4 py-2 text-left text-sm font-semibold">
                    {language === 'bn' ? 'পণ্যের বিবরণ' : 'Item Description'}
                  </th>
                  <th className="border border-gray-300 px-4 py-2 text-center text-sm font-semibold">
                    {t('quantity')}
                  </th>
                  <th className="border border-gray-300 px-4 py-2 text-center text-sm font-semibold">
                    {t('unit')}
                  </th>
                  <th className="border border-gray-300 px-4 py-2 text-right text-sm font-semibold">
                    {t('unitPrice')}
                  </th>
                  <th className="border border-gray-300 px-4 py-2 text-right text-sm font-semibold">
                    {t('total')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {invoice.items.map((item, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="border border-gray-300 px-4 py-2 text-sm text-center">
                      {formatNumber(index + 1)}
                    </td>
                    <td className="border border-gray-300 px-4 py-2 text-sm">
                      {item.productName}
                    </td>
                    <td className="border border-gray-300 px-4 py-2 text-sm text-center">
                      {formatNumber(item.quantity)}
                    </td>
                    <td className="border border-gray-300 px-4 py-2 text-sm text-center">
                      {getUnitTranslation(item.unit)}
                    </td>
                    <td className="border border-gray-300 px-4 py-2 text-sm text-right">
                      {formatCurrency(item.unitPrice)}
                    </td>
                    <td className="border border-gray-300 px-4 py-2 text-sm text-right font-medium">
                      {formatCurrency(item.totalPrice)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Invoice Summary */}
        <div className="flex justify-end mb-6">
          <div className="w-full max-w-sm">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between py-1">
                <span>{t('subtotal')}:</span>
                <span>{formatCurrency(invoice.subtotal)}</span>
              </div>
              {invoice.discount > 0 && (
                <div className="flex justify-between py-1 text-red-600">
                  <span>{t('discount')}:</span>
                  <span>-{formatCurrency(invoice.discount)}</span>
                </div>
              )}
              <div className="flex justify-between py-2 text-lg font-bold border-t border-gray-300">
                <span>{t('grandTotal')}:</span>
                <span className="text-green-600">{formatCurrency(invoice.grandTotal)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Notes */}
        {invoice.notes && (
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-2">
              {language === 'bn' ? 'বিশেষ নোট:' : 'Notes:'}
            </h3>
            <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded">{invoice.notes}</p>
          </div>
        )}

        {/* Footer */}
        <div className="border-t border-gray-300 pt-4 mt-6">
          <div className="text-center text-sm text-gray-600">
            <p className="mb-2">
              {language === 'bn' 
                ? 'আমাদের সেবা নেওয়ার জন্য ধন্যবাদ!' 
                : 'Thank you for your business!'
              }
            </p>
            <p className="text-xs">
              {language === 'bn'
                ? 'এই ইনভয়েসটি কম্পিউটার দ্বারা তৈরি এবং স্বাক্ষরের প্রয়োজন নেই।'
                : 'This invoice is computer generated and does not require signature.'
              }
            </p>
          </div>
        </div>

        {/* Action Buttons - Hidden in print view */}
        {!isPrintView && (
          <div className="no-print mt-6 flex justify-center space-x-4">
            <Button
              color="primary"
              onPress={onPrint}
              className="px-6 py-2"
            >
              🖨️ {language === 'bn' ? 'প্রিন্ট করুন' : 'Print'}
            </Button>
            <Button
              color="success"
              onPress={onDownloadPDF}
              className="px-6 py-2 text-white"
            >
              📄 {language === 'bn' ? 'PDF ডাউনলোড' : 'Download PDF'}
            </Button>
          </div>
        )}
      </div>
    </>
  )
}

export default InvoiceDisplay