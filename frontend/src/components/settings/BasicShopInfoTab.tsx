'use client'

import { useState, useEffect } from 'react'
import {
  Button,
  Input,
  Card,
  CardBody,
  CardHeader,
  Switch,
  Alert,
} from '@heroui/react'
import {
  Store,
  Phone,
  MapPin,
  FileText,
  Save
} from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'
import { announceToScreenReader } from '@/components/AccessibilityProvider'

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

interface FormErrors {
  shopName?: string
  ownerName?: string
  phone?: string
  address?: string
  contactNumber?: string
  invoicePrefix?: string
  invoiceStartNumber?: string
  taxRate?: string
}

export default function BasicShopInfoTab() {
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
  const [errors, setErrors] = useState<FormErrors>({})

  const { language, t } = useLanguage()

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    if (!config.shopName.trim()) {
      newErrors.shopName = t('required')
    }

    if (!config.ownerName.trim()) {
      newErrors.ownerName = t('required')
    }

    if (!config.phone.trim()) {
      newErrors.phone = t('required')
    } else if (!/^01[3-9]\d{8}$/.test(config.phone)) {
      newErrors.phone = t('invalidPhone')
    }

    if (!config.address.trim()) {
      newErrors.address = t('required')
    }

    if (config.contactNumber && !/^01[3-9]\d{8}$/.test(config.contactNumber)) {
      newErrors.contactNumber = t('invalidPhone')
    }

    if (!config.invoicePrefix.trim()) {
      newErrors.invoicePrefix = t('required')
    }

    if (config.invoiceStartNumber < 1) {
      newErrors.invoiceStartNumber = t('minimumAmount')
    }

    if (config.taxRate < 0 || config.taxRate > 100) {
      newErrors.taxRate = language === 'bn' ? 'কর হার ০ থেকে ১০০ এর মধ্যে হতে হবে' : 'Tax rate must be between 0 and 100'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSave = async () => {
    if (!validateForm()) {
      const errorMessage = t('saveError')
      setMessage({ type: 'error', text: errorMessage })
      announceToScreenReader(errorMessage)
      return
    }

    setLoading(true)
    setMessage(null)

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      const successMessage = t('saveSuccess')
      setMessage({ type: 'success', text: successMessage })
      announceToScreenReader(successMessage)
    } catch (error) {
      const errorMessage = t('saveError')
      setMessage({ type: 'error', text: errorMessage })
      announceToScreenReader(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: keyof ShopConfig, value: string | number | boolean) => {
    setConfig(prev => ({ ...prev, [field]: value }))
    
    // Clear error when user starts typing
    if (errors[field as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  return (
    <div className="space-y-6">
      {/* Basic Shop Information */}
      <Card>
        <CardHeader>
          <h3 className={`flex items-center gap-2 text-lg font-semibold ${language === 'bn' ? 'font-bengali' : ''}`}>
            <Store className="h-5 w-5" />
            {language === 'bn' ? 'দোকানের মৌলিক তথ্য' : 'Basic Shop Information'}
          </h3>
        </CardHeader>
        <CardBody className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label={language === 'bn' ? 'দোকানের নাম' : 'Shop Name'}
              value={config.shopName}
              onChange={(e) => handleInputChange('shopName', e.target.value)}
              placeholder={language === 'bn' ? 'দোকানের নাম প্রবেশ করান' : 'Enter shop name'}
              isInvalid={!!errors.shopName}
              errorMessage={errors.shopName}
              isRequired
              aria-describedby="shop-name-help"
            />

            <Input
              label={language === 'bn' ? 'মালিকের নাম' : 'Owner Name'}
              value={config.ownerName}
              onChange={(e) => handleInputChange('ownerName', e.target.value)}
              placeholder={language === 'bn' ? 'মালিকের নাম প্রবেশ করান' : 'Enter owner name'}
              isInvalid={!!errors.ownerName}
              errorMessage={errors.ownerName}
              isRequired
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label={language === 'bn' ? 'ফোন নম্বর' : 'Phone Number'}
              value={config.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              placeholder="01XXXXXXXXX"
              isInvalid={!!errors.phone}
              errorMessage={errors.phone}
              isRequired
              description={language === 'bn' ? 'বাংলাদেশি ফোন নম্বর (১১ সংখ্যা)' : 'Bangladeshi phone number (11 digits)'}
            />

            <Input
              label={language === 'bn' ? 'মুদ্রা' : 'Currency'}
              value={config.currency}
              onChange={(e) => handleInputChange('currency', e.target.value)}
              placeholder="BDT"
              isDisabled
              description={language === 'bn' ? 'বাংলাদেশি টাকা' : 'Bangladeshi Taka'}
            />
          </div>

          <Input
            label={language === 'bn' ? 'দোকানের ঠিকানা' : 'Shop Address'}
            value={config.address}
            onChange={(e) => handleInputChange('address', e.target.value)}
            placeholder={language === 'bn' ? 'সম্পূর্ণ দোকানের ঠিকানা প্রবেশ করান' : 'Enter complete shop address'}
            isInvalid={!!errors.address}
            errorMessage={errors.address}
            isRequired
          />
        </CardBody>
      </Card>

      {/* Trust Information */}
      <Card>
        <CardHeader>
          <h3 className={`flex items-center gap-2 text-lg font-semibold ${language === 'bn' ? 'font-bengali' : ''}`}>
            <FileText className="h-5 w-5" />
            {language === 'bn' ? 'বিশ্বস্ততার তথ্য' : 'Trust Information'}
          </h3>
        </CardHeader>
        <CardBody className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label={language === 'bn' ? 'ট্রেড লাইসেন্স নং' : 'Trade License No.'}
              value={config.tradeLicenseNo}
              onChange={(e) => handleInputChange('tradeLicenseNo', e.target.value)}
              placeholder={language === 'bn' ? 'ট্রেড লাইসেন্স নম্বর প্রবেশ করান' : 'Enter trade license number'}
              description={language === 'bn' ? 'গ্রাহকদের আস্থার জন্য' : 'For customer trust'}
            />

            <Input
              label={language === 'bn' ? 'যোগাযোগের নম্বর' : 'Contact Number'}
              value={config.contactNumber}
              onChange={(e) => handleInputChange('contactNumber', e.target.value)}
              placeholder="01XXXXXXXXX"
              isInvalid={!!errors.contactNumber}
              errorMessage={errors.contactNumber}
              description={language === 'bn' ? 'ইনভয়েসে প্রদর্শনের জন্য' : 'For display on invoices'}
            />
          </div>

          <Input
            label={language === 'bn' ? 'দোকানের ঠিকানা (ইনভয়েসের জন্য)' : 'Shop Address (for invoices)'}
            value={config.shopAddress}
            onChange={(e) => handleInputChange('shopAddress', e.target.value)}
            placeholder={language === 'bn' ? 'ইনভয়েসে প্রদর্শনের জন্য ঠিকানা' : 'Address to display on invoices'}
          />

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <label className={`text-sm font-medium ${language === 'bn' ? 'font-bengali' : ''}`}>
                  {language === 'bn' ? 'ইনভয়েসে দেখান' : 'Display on Invoice'}
                </label>
                <p className={`text-sm text-muted-foreground ${language === 'bn' ? 'font-bengali' : ''}`}>
                  {language === 'bn' ? 'ইনভয়েস ভিউতে বিশ্বস্ততার তথ্য দেখান' : 'Show trust information on invoice view'}
                </p>
              </div>
              <Switch
                isSelected={config.displayOnInvoice}
                onValueChange={(checked) => handleInputChange('displayOnInvoice', checked)}
                aria-label={language === 'bn' ? 'ইনভয়েসে প্রদর্শন টগল করুন' : 'Toggle display on invoice'}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <label className={`text-sm font-medium ${language === 'bn' ? 'font-bengali' : ''}`}>
                  {language === 'bn' ? 'প্রিন্টে দেখান' : 'Display on Print'}
                </label>
                <p className={`text-sm text-muted-foreground ${language === 'bn' ? 'font-bengali' : ''}`}>
                  {language === 'bn' ? 'প্রিন্ট করা ইনভয়েসে বিশ্বস্ততার তথ্য দেখান' : 'Show trust information on printed invoices'}
                </p>
              </div>
              <Switch
                isSelected={config.displayOnPrint}
                onValueChange={(checked) => handleInputChange('displayOnPrint', checked)}
                aria-label={language === 'bn' ? 'প্রিন্টে প্রদর্শন টগল করুন' : 'Toggle display on print'}
              />
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Invoice Settings */}
      <Card>
        <CardHeader>
          <h3 className={`flex items-center gap-2 text-lg font-semibold ${language === 'bn' ? 'font-bengali' : ''}`}>
            <FileText className="h-5 w-5" />
            {language === 'bn' ? 'ইনভয়েস সেটিংস' : 'Invoice Settings'}
          </h3>
        </CardHeader>
        <CardBody className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label={language === 'bn' ? 'ইনভয়েস প্রিফিক্স' : 'Invoice Prefix'}
              value={config.invoicePrefix}
              onChange={(e) => handleInputChange('invoicePrefix', e.target.value)}
              placeholder="INV"
              isInvalid={!!errors.invoicePrefix}
              errorMessage={errors.invoicePrefix}
              isRequired
            />

            <Input
              label={language === 'bn' ? 'শুরুর নম্বর' : 'Start Number'}
              type="number"
              value={String(config.invoiceStartNumber)}
              onChange={(e) => handleInputChange('invoiceStartNumber', parseInt(e.target.value) || 1)}
              placeholder="1"
              isInvalid={!!errors.invoiceStartNumber}
              errorMessage={errors.invoiceStartNumber}
              isRequired
              min="1"
            />

            <Input
              label={language === 'bn' ? 'কর হার (%)' : 'Tax Rate (%)'}
              type="number"
              step="0.01"
              value={String(config.taxRate)}
              onChange={(e) => handleInputChange('taxRate', parseFloat(e.target.value) || 0)}
              placeholder="0"
              isInvalid={!!errors.taxRate}
              errorMessage={errors.taxRate}
              min="0"
              max="100"
            />
          </div>

          <div className={`p-4 bg-muted rounded-lg ${language === 'bn' ? 'font-bengali' : ''}`}>
            <p className="text-sm text-muted-foreground">
              {language === 'bn' ? 'ইনভয়েস ফরম্যাট প্রিভিউ' : 'Invoice format preview'}: {config.invoicePrefix}-202501-{String(config.invoiceStartNumber).padStart(4, '0')}
            </p>
          </div>
        </CardBody>
      </Card>

      {/* Save Button and Messages */}
      <div className="space-y-4">
        {message && (
          <Alert
            color={message.type === 'success' ? 'success' : 'danger'}
            description={message.text}
          />
        )}

        <div className="flex justify-end">
          <Button
            onPress={handleSave}
            isDisabled={loading}
            isLoading={loading}
            color="primary"
            startContent={!loading ? <Save className="h-4 w-4" /> : undefined}
            className={language === 'bn' ? 'font-bengali' : ''}
            aria-describedby={loading ? 'save-status' : undefined}
          >
            {loading ? t('loading') : t('save')}
          </Button>
          {loading && (
            <span id="save-status" className="sr-only">
              {t('loading')}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}