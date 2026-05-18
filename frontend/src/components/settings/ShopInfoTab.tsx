'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Store,
  Phone,
  MapPin,
  FileText,
  Save,
  AlertCircle,
  CheckCircle
} from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'
import { useFormatting } from '@/hooks/useFormatting'

interface ShopConfig {
  shopName: string
  ownerName: string
  phone: string
  address: string
  tradeLicenseNo: string
  shopAddress: string
  contactNumber: string
  displayOnInvoice: boolean
  displayOnPrint: boolean
  invoicePrefix: string
  invoiceStartNumber: number
  taxRate: number
  currency: string
}

export default function ShopInfoTab() {
  const [config, setConfig] = useState<ShopConfig>({
    shopName: '',
    ownerName: '',
    phone: '',
    address: '',
    tradeLicenseNo: '',
    shopAddress: '',
    contactNumber: '',
    displayOnInvoice: true,
    displayOnPrint: true,
    invoicePrefix: 'INV',
    invoiceStartNumber: 1,
    taxRate: 0,
    currency: 'BDT'
  })
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  const { t: globalT } = useLanguage()
  
  // Local translation helper for shop info
  const t = (key: string, fallback: string) => {
    // For now, just return the fallback since we don't have these keys in the main translations
    return fallback
  }
  const { formatCurrency } = useFormatting()

  useEffect(() => {
    fetchShopConfig()
  }, [])

  const fetchShopConfig = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('http://localhost:3001/api/shop-config', {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success && data.data) {
          setConfig({
            shopName: data.data.shopName || '',
            ownerName: data.data.ownerName || '',
            phone: data.data.phone || '',
            address: data.data.address || '',
            tradeLicenseNo: data.data.trustInfo?.tradeLicenseNo || '',
            shopAddress: data.data.trustInfo?.shopAddress || '',
            contactNumber: data.data.trustInfo?.contactNumber || '',
            displayOnInvoice: data.data.trustInfo?.displayOnInvoice ?? true,
            displayOnPrint: data.data.trustInfo?.displayOnPrint ?? true,
            invoicePrefix: data.data.invoiceSettings?.prefix || 'INV',
            invoiceStartNumber: data.data.invoiceSettings?.startNumber || 1,
            taxRate: data.data.taxRate || 0,
            currency: data.data.currency || 'BDT'
          })
        }
      }
    } catch (error) {
      console.error('Error fetching shop config:', error)
    }
  }

  const handleSave = async () => {
    setLoading(true)
    setMessage(null)

    try {
      const token = localStorage.getItem('token')
      const response = await fetch('http://localhost:3001/api/shop-config', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          shopName: config.shopName,
          ownerName: config.ownerName,
          phone: config.phone,
          address: config.address,
          trustInfo: {
            tradeLicenseNo: config.tradeLicenseNo,
            shopAddress: config.shopAddress,
            contactNumber: config.contactNumber,
            displayOnInvoice: config.displayOnInvoice,
            displayOnPrint: config.displayOnPrint
          },
          invoiceSettings: {
            prefix: config.invoicePrefix,
            startNumber: config.invoiceStartNumber
          },
          taxRate: config.taxRate,
          currency: config.currency
        })
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setMessage({ type: 'success', text: t('settings.shopInfo.saveSuccess', 'Shop information updated successfully') })
      } else {
        setMessage({ type: 'error', text: data.message || t('settings.shopInfo.saveError', 'Failed to update shop information') })
      }
    } catch (error) {
      setMessage({ type: 'error', text: t('settings.shopInfo.saveError', 'Failed to update shop information') })
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: keyof ShopConfig, value: string | number | boolean) => {
    setConfig(prev => ({ ...prev, [field]: value }))
  }

  return (
    <div className="space-y-6">
      {/* Basic Shop Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Store className="h-5 w-5" />
            {t('settings.shopInfo.basicInfo', 'Basic Shop Information')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="shopName">{t('settings.shopInfo.shopName', 'Shop Name')} *</Label>
              <Input
                id="shopName"
                value={config.shopName}
                onChange={(e) => handleInputChange('shopName', e.target.value)}
                placeholder={t('settings.shopInfo.shopNamePlaceholder', 'Enter shop name')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ownerName">{t('settings.shopInfo.ownerName', 'Owner Name')} *</Label>
              <Input
                id="ownerName"
                value={config.ownerName}
                onChange={(e) => handleInputChange('ownerName', e.target.value)}
                placeholder={t('settings.shopInfo.ownerNamePlaceholder', 'Enter owner name')}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone">{t('settings.shopInfo.phone', 'Phone Number')} *</Label>
              <Input
                id="phone"
                value={config.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                placeholder="01XXXXXXXXX"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="currency">{t('settings.shopInfo.currency', 'Currency')}</Label>
              <Input
                id="currency"
                value={config.currency}
                onChange={(e) => handleInputChange('currency', e.target.value)}
                placeholder="BDT"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">{t('settings.shopInfo.address', 'Shop Address')} *</Label>
            <Input
              id="address"
              value={config.address}
              onChange={(e) => handleInputChange('address', e.target.value)}
              placeholder={t('settings.shopInfo.addressPlaceholder', 'Enter complete shop address')}
            />
          </div>
        </CardContent>
      </Card>

      {/* Trust Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {t('settings.shopInfo.trustInfo', 'Trust Information')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tradeLicenseNo">{t('settings.shopInfo.tradeLicense', 'Trade License No.')}</Label>
              <Input
                id="tradeLicenseNo"
                value={config.tradeLicenseNo}
                onChange={(e) => handleInputChange('tradeLicenseNo', e.target.value)}
                placeholder={t('settings.shopInfo.tradeLicensePlaceholder', 'Enter trade license number')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contactNumber">{t('settings.shopInfo.contactNumber', 'Contact Number')}</Label>
              <Input
                id="contactNumber"
                value={config.contactNumber}
                onChange={(e) => handleInputChange('contactNumber', e.target.value)}
                placeholder="01XXXXXXXXX"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="shopAddress">{t('settings.shopInfo.shopAddress', 'Shop Address (for invoices)')}</Label>
            <Input
              id="shopAddress"
              value={config.shopAddress}
              onChange={(e) => handleInputChange('shopAddress', e.target.value)}
              placeholder={t('settings.shopInfo.shopAddressPlaceholder', 'Address to display on invoices')}
            />
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>{t('settings.shopInfo.displayOnInvoice', 'Display on Invoice')}</Label>
                <p className="text-sm text-muted-foreground">
                  {t('settings.shopInfo.displayOnInvoiceDesc', 'Show trust information on invoice view')}
                </p>
              </div>
              <Switch
                checked={config.displayOnInvoice}
                onCheckedChange={(checked) => handleInputChange('displayOnInvoice', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>{t('settings.shopInfo.displayOnPrint', 'Display on Print')}</Label>
                <p className="text-sm text-muted-foreground">
                  {t('settings.shopInfo.displayOnPrintDesc', 'Show trust information on printed invoices')}
                </p>
              </div>
              <Switch
                checked={config.displayOnPrint}
                onCheckedChange={(checked) => handleInputChange('displayOnPrint', checked)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Invoice Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {t('settings.shopInfo.invoiceSettings', 'Invoice Settings')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="invoicePrefix">{t('settings.shopInfo.invoicePrefix', 'Invoice Prefix')}</Label>
              <Input
                id="invoicePrefix"
                value={config.invoicePrefix}
                onChange={(e) => handleInputChange('invoicePrefix', e.target.value)}
                placeholder="INV"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="invoiceStartNumber">{t('settings.shopInfo.startNumber', 'Start Number')}</Label>
              <Input
                id="invoiceStartNumber"
                type="number"
                value={config.invoiceStartNumber}
                onChange={(e) => handleInputChange('invoiceStartNumber', parseInt(e.target.value) || 1)}
                placeholder="1"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="taxRate">{t('settings.shopInfo.taxRate', 'Tax Rate (%)')}</Label>
              <Input
                id="taxRate"
                type="number"
                step="0.01"
                value={config.taxRate}
                onChange={(e) => handleInputChange('taxRate', parseFloat(e.target.value) || 0)}
                placeholder="0"
              />
            </div>
          </div>

          <div className="p-4 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground">
              {t('settings.shopInfo.invoicePreview', 'Invoice format preview')}: {config.invoicePrefix}-202501-{String(config.invoiceStartNumber).padStart(4, '0')}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Save Button and Messages */}
      <div className="space-y-4">
        {message && (
          <Alert variant={message.type === 'error' ? 'destructive' : 'default'}>
            {message.type === 'success' ? (
              <CheckCircle className="h-4 w-4" />
            ) : (
              <AlertCircle className="h-4 w-4" />
            )}
            <AlertDescription>{message.text}</AlertDescription>
          </Alert>
        )}

        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={loading}>
            <Save className="h-4 w-4 mr-2" />
            {loading ? t('common.saving', 'Saving...') : t('common.save', 'Save Changes')}
          </Button>
        </div>
      </div>
    </div>
  )
}