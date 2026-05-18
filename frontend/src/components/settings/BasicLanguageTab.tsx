'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Label } from '@/components/ui/label'
import { 
  Globe,
  Save,
  AlertCircle,
  CheckCircle,
  Languages,
  Calendar,
  DollarSign,
  Hash
} from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'
import { useFormatting } from '@/hooks/useFormatting'

export default function BasicLanguageTab() {
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [loading, setLoading] = useState(false)

  const { language, setLanguage } = useLanguage()
  const { formatCurrency, formatNumber, formatDate } = useFormatting()

  // Language options
  const languageOptions = [
    {
      code: 'en',
      name: 'English',
      nativeName: 'English',
      flag: '🇺🇸',
      direction: 'ltr'
    },
    {
      code: 'bn',
      name: 'Bengali',
      nativeName: 'বাংলা',
      flag: '🇧🇩',
      direction: 'ltr'
    }
  ]

  // Sample data for preview
  const sampleData = {
    currency: 19800,
    number: 12345,
    date: new Date(),
    percentage: 85.5
  }

  const handleLanguageChange = (langCode: string) => {
    setLanguage(langCode as any)
    setMessage({ 
      type: 'success', 
      text: 'Language changed successfully'
    })
  }

  const handleSaveSettings = async () => {
    setLoading(true)
    setMessage(null)

    try {
      // Save language preference to localStorage
      localStorage.setItem('preferred-language', language)
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))

      setMessage({ 
        type: 'success', 
        text: 'Language settings saved successfully'
      })
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: 'Failed to save language settings'
      })
    } finally {
      setLoading(false)
    }
  }

  const currentLanguage = languageOptions.find(lang => lang.code === language)

  return (
    <div className="space-y-6">
      {/* Language Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Select Language
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {languageOptions.map((lang) => (
              <div
                key={lang.code}
                className={`p-4 border rounded-lg cursor-pointer transition-all hover:border-primary ${
                  language === lang.code ? 'border-primary bg-primary/5' : 'border-border'
                }`}
                onClick={() => handleLanguageChange(lang.code)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{lang.flag}</span>
                    <div>
                      <div className="font-medium">{lang.name}</div>
                      <div className="text-sm text-muted-foreground">{lang.nativeName}</div>
                    </div>
                  </div>
                  {language === lang.code && (
                    <Badge variant="default">Active</Badge>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="p-4 bg-muted rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Languages className="h-4 w-4" />
              <span className="font-medium">Current Language</span>
            </div>
            <p className="text-sm text-muted-foreground">
              {currentLanguage?.flag} {currentLanguage?.name} ({currentLanguage?.nativeName})
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Formatting Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Hash className="h-5 w-5" />
            Formatting Preview
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Numbers and Currency */}
            <div className="space-y-3">
              <h4 className="font-medium flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Numbers & Currency
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Currency:</span>
                  <span className="font-mono font-semibold">
                    {formatCurrency(sampleData.currency)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Number:</span>
                  <span className="font-mono">
                    {formatNumber(sampleData.number)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Percentage:</span>
                  <span className="font-mono">
                    {formatNumber(sampleData.percentage)}%
                  </span>
                </div>
              </div>
            </div>

            {/* Date and Time */}
            <div className="space-y-3">
              <h4 className="font-medium flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Date & Time
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Short Date:</span>
                  <span className="font-mono">
                    {formatDate(sampleData.date)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Long Date:</span>
                  <span className="font-mono">
                    {sampleData.date.toLocaleDateString(language === 'bn' ? 'bn-BD' : 'en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Time:</span>
                  <span className="font-mono">
                    {sampleData.date.toLocaleTimeString(language === 'bn' ? 'bn-BD' : 'en-US')}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              {language === 'bn' 
                ? 'বাংলা ভাষায় সংখ্যা এবং তারিখ বাংলা অঙ্কে (০-৯) প্রদর্শিত হবে।'
                : 'In Bengali language, numbers and dates will be displayed in Bengali numerals (০-৯).'
              }
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Language Features */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Languages className="h-5 w-5" />
            Language Features
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <h4 className="font-medium">Supported Features</h4>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Complete interface translation</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Localized number formatting</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Localized date formatting</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Currency formatting</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-medium">Business Benefits</h4>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-blue-500" />
                  <span className="text-sm">Easy for local staff to use</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-blue-500" />
                  <span className="text-sm">Builds customer trust</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-blue-500" />
                  <span className="text-sm">Reduces input errors</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-blue-500" />
                  <span className="text-sm">Professional appearance</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save Settings */}
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
          <Button onClick={handleSaveSettings} disabled={loading}>
            <Save className="h-4 w-4 mr-2" />
            {loading ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>
      </div>
    </div>
  )
}