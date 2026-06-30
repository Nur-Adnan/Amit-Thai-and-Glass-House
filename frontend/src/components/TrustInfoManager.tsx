'use client'

import { API_BASE } from '@/lib/apiBase'
import React, { useState, useEffect } from 'react'
import { Button, Input, Textarea, Checkbox } from '@heroui/react'
import { useLanguage } from '@/contexts/LanguageContext'

interface TrustInfo {
  tradeLicenseNo: string
  shopAddress: string
  contactNumber: string
  displayOnInvoice: boolean
  displayOnPrint: boolean
}

interface TrustInfoManagerProps {
  onSave?: (trustInfo: TrustInfo) => void
  className?: string
}

const TrustInfoManager: React.FC<TrustInfoManagerProps> = ({ onSave, className = '' }) => {
  const { t, language } = useLanguage()
  const [trustInfo, setTrustInfo] = useState<TrustInfo>({
    tradeLicenseNo: '',
    shopAddress: '',
    contactNumber: '',
    displayOnInvoice: true,
    displayOnPrint: true
  })
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  useEffect(() => {
    fetchTrustInfo()
  }, [])

  const fetchTrustInfo = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_BASE}/api/shop-config/admin`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await response.json()
      
      if (data.success && data.data?.trustInfo) {
        setTrustInfo(data.data.trustInfo)
      }
    } catch (error) {
      console.error('Failed to fetch trust info:', error)
      setMessage({ type: 'error', text: 'Failed to load trust information' })
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    setMessage(null)

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_BASE}/api/shop-config/trust-info`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(trustInfo)
      })

      const data = await response.json()

      if (data.success) {
        setMessage({ 
          type: 'success', 
          text: language === 'bn' ? 'বিশ্বস্ততার তথ্য সফলভাবে আপডেট হয়েছে' : 'Trust information updated successfully' 
        })
        onSave?.(trustInfo)
      } else {
        throw new Error(data.message || 'Failed to update trust information')
      }
    } catch (error) {
      console.error('Failed to save trust info:', error)
      setMessage({ 
        type: 'error', 
        text: language === 'bn' ? 'তথ্য সংরক্ষণে ব্যর্থ' : 'Failed to save trust information' 
      })
    } finally {
      setSaving(false)
    }
  }

  const handleInputChange = (field: keyof TrustInfo, value: string | boolean) => {
    setTrustInfo(prev => ({ ...prev, [field]: value }))
    setMessage(null) // Clear any existing messages
  }

  const validatePhoneNumber = (phone: string): boolean => {
    const bdPhoneRegex = /^(\+880|880|0)?[1-9]\d{8,10}$/
    return !phone || bdPhoneRegex.test(phone)
  }

  const isPhoneValid = validatePhoneNumber(trustInfo.contactNumber)

  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">
            {language === 'bn' ? 'বিশ্বস্ততার তথ্য' : 'Trust Information'}
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            {language === 'bn' 
              ? 'গ্রাহকদের আস্থা অর্জনের জন্য ব্যবসায়িক তথ্য যোগ করুন'
              : 'Add business information to build customer trust'
            }
          </p>
        </div>
        <div className="text-2xl">🏪</div>
      </div>

      {message && (
        <div className={`mb-6 p-4 rounded-lg ${
          message.type === 'success' 
            ? 'bg-green-50 border border-green-200 text-green-800' 
            : 'bg-red-50 border border-red-200 text-red-800'
        }`}>
          <div className="flex items-center">
            <span className="mr-2">
              {message.type === 'success' ? '✅' : '❌'}
            </span>
            {message.text}
          </div>
        </div>
      )}

      <div className="space-y-6">
        {/* Trade License Number */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {language === 'bn' ? 'ট্রেড লাইসেন্স নম্বর' : 'Trade License Number'}
            <span className="text-gray-500 ml-1">
              ({language === 'bn' ? 'ঐচ্ছিক' : 'Optional'})
            </span>
          </label>
          <Input
            type="text"
            value={trustInfo.tradeLicenseNo}
            onChange={(e) => handleInputChange('tradeLicenseNo', e.target.value)}
            className="w-full"
            placeholder={language === 'bn' ? 'যেমন: TRAD/DSCC/123456/2024' : 'e.g., TRAD/DSCC/123456/2024'}
          />
          <p className="text-xs text-gray-500 mt-1">
            {language === 'bn' 
              ? 'সিটি কর্পোরেশন বা পৌরসভা থেকে প্রাপ্ত ট্রেড লাইসেন্স নম্বর'
              : 'Trade license number from City Corporation or Municipality'
            }
          </p>
        </div>

        {/* Shop Address */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {language === 'bn' ? 'দোকানের ঠিকানা' : 'Shop Address'}
            <span className="text-gray-500 ml-1">
              ({language === 'bn' ? 'ঐচ্ছিক' : 'Optional'})
            </span>
          </label>
          <Textarea
            value={trustInfo.shopAddress}
            onChange={(e) => handleInputChange('shopAddress', e.target.value)}
            minRows={3}
            className="w-full"
            placeholder={language === 'bn'
              ? 'যেমন: ১২৩ নিউ মার্কেট, ধানমন্ডি, ঢাকা-১২০৫'
              : 'e.g., 123 New Market, Dhanmondi, Dhaka-1205'
            }
          />
          <p className="text-xs text-gray-500 mt-1">
            {language === 'bn' 
              ? 'গ্রাহকদের দেখানোর জন্য দোকানের সম্পূর্ণ ঠিকানা'
              : 'Complete shop address to display to customers'
            }
          </p>
        </div>

        {/* Contact Number */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {language === 'bn' ? 'যোগাযোগ নম্বর' : 'Contact Number'}
            <span className="text-gray-500 ml-1">
              ({language === 'bn' ? 'ঐচ্ছিক' : 'Optional'})
            </span>
          </label>
          <Input
            type="tel"
            value={trustInfo.contactNumber}
            onChange={(e) => handleInputChange('contactNumber', e.target.value)}
            isInvalid={!isPhoneValid}
            className="w-full"
            placeholder={language === 'bn' ? 'যেমন: ০১৭১২৩৪৫৬৭৮' : 'e.g., 01712345678'}
          />
          {!isPhoneValid && (
            <p className="text-xs text-red-600 mt-1">
              {language === 'bn' 
                ? 'বৈধ বাংলাদেশী ফোন নম্বর দিন (যেমন: ০১৭XXXXXXXX)'
                : 'Please enter a valid Bangladesh phone number (e.g., 01712345678)'
              }
            </p>
          )}
          <p className="text-xs text-gray-500 mt-1">
            {language === 'bn' 
              ? 'গ্রাহকদের যোগাযোগের জন্য প্রধান ফোন নম্বর'
              : 'Primary phone number for customer contact'
            }
          </p>
        </div>

        {/* Display Options */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            {language === 'bn' ? 'প্রদর্শন সেটিংস' : 'Display Settings'}
          </h3>
          
          <div className="space-y-4">
            <div className="flex items-center">
              <Checkbox
                id="displayOnInvoice"
                isSelected={trustInfo.displayOnInvoice}
                onValueChange={(checked) => handleInputChange('displayOnInvoice', checked)}
                classNames={{ label: 'text-sm text-gray-700' }}
              >
                {language === 'bn' ? 'ইনভয়েসে দেখান' : 'Display on Invoice'}
              </Checkbox>
            </div>

            <div className="flex items-center">
              <Checkbox
                id="displayOnPrint"
                isSelected={trustInfo.displayOnPrint}
                onValueChange={(checked) => handleInputChange('displayOnPrint', checked)}
                classNames={{ label: 'text-sm text-gray-700' }}
              >
                {language === 'bn' ? 'প্রিন্ট ভিউতে দেখান' : 'Display on Print View'}
              </Checkbox>
            </div>
          </div>

          <p className="text-xs text-gray-500 mt-3">
            {language === 'bn' 
              ? 'এই তথ্যগুলো গ্রাহকদের আস্থা বৃদ্ধি করে এবং ব্যবসায়িক বিশ্বাসযোগ্যতা প্রতিষ্ঠা করে।'
              : 'This information builds customer trust and establishes business credibility.'
            }
          </p>
        </div>

        {/* Save Button */}
        <div className="flex justify-end pt-6 border-t">
          <Button
            onPress={handleSave}
            isDisabled={saving || !isPhoneValid}
            isLoading={saving}
            color="primary"
          >
            {saving ? (
              language === 'bn' ? 'সংরক্ষণ করা হচ্ছে...' : 'Saving...'
            ) : (
              <>
                💾 {language === 'bn' ? 'সংরক্ষণ করুন' : 'Save Changes'}
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default TrustInfoManager