'use client'

import { useState, useEffect } from 'react'
import Layout from '@/components/Layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { 
  Package, 
  Plus, 
  Search, 
  AlertTriangle, 
  CheckCircle,
  Building2,
  Layers,
  Star,
  Calculator,
  DollarSign,
  Save,
  RefreshCw,
  Info
} from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'
import { useFormatting } from '@/hooks/useFormatting'

interface FormData {
  materialType: string
  company: string
  thicknessMM?: number
  quality: string
  measurementType: string
  purchasePrice: string
  sellingPrice: string
  stockQuantity: string
  notes: string
}

interface Company {
  id: string
  name: string
  materialType: string
  country?: string
  notes?: string
  label: string
  value: string
}

interface FormDataResponse {
  materialTypes: Array<{ value: string; label: string; bangla: string }>
  brands: {
    Thai: Company[]
    Glass: Company[]
  }
  thicknesses: {
    Glass: Array<{ value: number; label: string; bangla: string }>
    Thai: Array<{ value: number; label: string; bangla: string }>
  }
  qualities: Array<{ value: string; label: string; bangla: string }>
  measurementTypes: Array<{ value: string; label: string; bangla: string }>
  defaultValues: {
    materialType: string
    measurementType: string
    quality: string
  }
}

interface NewCompanyData {
  name: string
  materialType: string
  country: string
  notes: string
}

export default function BDShopStockPage() {
  const [formData, setFormData] = useState<FormData>({
    materialType: 'Glass',
    company: '',
    thicknessMM: undefined,
    quality: 'Local',
    measurementType: 'SFT',
    purchasePrice: '',
    sellingPrice: '',
    stockQuantity: '',
    notes: ''
  })

  const [apiFormData, setApiFormData] = useState<FormDataResponse | null>(null)
  const [companies, setCompanies] = useState<Company[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  
  // New company dialog state
  const [showNewCompanyDialog, setShowNewCompanyDialog] = useState(false)
  const [newCompanyData, setNewCompanyData] = useState<NewCompanyData>({
    name: '',
    materialType: 'Glass',
    country: '',
    notes: ''
  })
  const [addingCompany, setAddingCompany] = useState(false)

  const { t, language } = useLanguage()
  const { formatCurrency } = useFormatting()

  useEffect(() => {
    fetchFormData()
  }, [])

  useEffect(() => {
    if (formData.materialType && apiFormData) {
      const materialCompanies = apiFormData.brands[formData.materialType as 'Thai' | 'Glass'] || []
      setCompanies(materialCompanies)
      setSearchResults(materialCompanies)
      setSearchQuery('')
      
      // Reset company selection when material type changes
      setFormData(prev => ({ ...prev, company: '' }))
    }
  }, [formData.materialType, apiFormData])

  useEffect(() => {
    const searchCompanies = async (query: string) => {
      if (query.length < 2) return
      
      try {
        const token = localStorage.getItem('token')
        const response = await fetch(
          `http://localhost:3001/api/bd-shop-inventory/search-companies?q=${encodeURIComponent(query)}&materialType=${formData.materialType}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          }
        )

        if (response.ok) {
          const data = await response.json()
          if (data.success) {
            setSearchResults(data.data)
          }
        }
      } catch (err) {
        console.error('Search error:', err)
      }
    }

    if (searchQuery.length >= 2) {
      searchCompanies(searchQuery)
    } else {
      setSearchResults(companies)
    }
  }, [searchQuery, companies, formData.materialType])

  const fetchFormData = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('http://localhost:3001/api/bd-shop-inventory/form-data', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch form data')
      }

      const data = await response.json()
      
      if (data.success) {
        setApiFormData(data.data)
        // Set default values
        setFormData(prev => ({
          ...prev,
          materialType: data.data.defaultValues.materialType,
          measurementType: data.data.defaultValues.measurementType,
          quality: data.data.defaultValues.quality
        }))
      } else {
        throw new Error(data.message || 'Failed to fetch form data')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleAddNewCompany = async () => {
    if (!newCompanyData.name.trim()) {
      setError('Company name is required')
      return
    }

    setAddingCompany(true)
    setError(null)

    try {
      const token = localStorage.getItem('token')
      // Use the existing brands API instead of the problematic bd-shop-inventory endpoint
      const response = await fetch('http://localhost:3001/api/brands', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...newCompanyData,
          materialType: formData.materialType
        })
      })

      const data = await response.json()
      
      if (data.success) {
        // Add new company to the list
        const newCompany = {
          id: data.data._id,
          name: data.data.name,
          materialType: data.data.materialType,
          country: data.data.country,
          notes: data.data.notes,
          label: `${data.data.name}${data.data.country ? ` (${data.data.country})` : ''}`,
          value: data.data.name
        }
        setCompanies(prev => [...prev, newCompany])
        setSearchResults(prev => [...prev, newCompany])
        
        // Select the new company
        setFormData(prev => ({ ...prev, company: newCompany.name }))
        
        // Reset dialog
        setNewCompanyData({
          name: '',
          materialType: formData.materialType,
          country: '',
          notes: ''
        })
        setShowNewCompanyDialog(false)
        setSuccess(`Company "${newCompany.name}" added successfully`)
      } else {
        throw new Error(data.message || 'Failed to add company')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add company')
    } finally {
      setAddingCompany(false)
    }
  }

  const handleSaveStock = async () => {
    // Validation
    const errors: string[] = []
    
    if (!formData.materialType) errors.push('Material type is required')
    if (!formData.company) errors.push('Company is required')
    if (formData.materialType === 'Glass' && !formData.thicknessMM) errors.push('Thickness is required for Glass')
    if (!formData.quality) errors.push('Quality is required')
    if (!formData.measurementType) errors.push('Measurement type is required')
    if (!formData.sellingPrice || parseFloat(formData.sellingPrice) <= 0) errors.push('Valid selling price is required')
    if (!formData.stockQuantity || parseFloat(formData.stockQuantity) <= 0) errors.push('Valid stock quantity is required')
    
    if (errors.length > 0) {
      setError(errors.join(', '))
      return
    }

    setSaving(true)
    setError(null)
    setSuccess(null)

    try {
      const token = localStorage.getItem('token')
      const response = await fetch('http://localhost:3001/api/bd-shop-inventory/add-stock', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          materialType: formData.materialType,
          company: formData.company,
          thicknessMM: formData.materialType === 'Glass' ? formData.thicknessMM : undefined,
          quality: formData.quality,
          measurementType: formData.measurementType,
          purchasePrice: parseFloat(formData.purchasePrice) || 0,
          sellingPrice: parseFloat(formData.sellingPrice),
          stockQuantity: parseFloat(formData.stockQuantity),
          notes: formData.notes.trim() || undefined
        })
      })

      const data = await response.json()
      
      if (data.success) {
        setSuccess(
          data.data.product.isNewProduct 
            ? `New product "${data.data.product.name}" created with ${data.data.product.formattedStockQuantity} stock`
            : `Added ${formData.stockQuantity} ${formData.measurementType} to existing product "${data.data.product.name}"`
        )
        
        // Reset form
        setFormData({
          materialType: formData.materialType, // Keep material type
          company: '',
          thicknessMM: undefined,
          quality: 'Local',
          measurementType: 'SFT',
          purchasePrice: '',
          sellingPrice: '',
          stockQuantity: '',
          notes: ''
        })
      } else {
        throw new Error(data.message || 'Failed to save stock')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save stock')
    } finally {
      setSaving(false)
    }
  }

  const getBanglaText = (key: string, fallback: string = '') => {
    if (language === 'bn') {
      const banglaTexts: Record<string, string> = {
        'material_type': 'উপাদানের ধরন',
        'company_brand': 'কোম্পানি / ব্র্যান্ড',
        'thickness': 'পুরুত্ব',
        'quality': 'গুণমান',
        'measurement_type': 'পরিমাপের ধরন',
        'purchase_price': 'ক্রয় মূল্য',
        'selling_price': 'বিক্রয় মূল্য',
        'stock_quantity': 'স্টক পরিমাণ',
        'notes': 'নোট',
        'thai_glass': 'থাই গ্লাস',
        'glass': 'কাঁচ',
        'local': 'দেশীয়',
        'imported': 'আমদানিকৃত',
        'premium': 'প্রিমিয়াম',
        'square_feet': 'বর্গফুট',
        'running_feet': 'রানিং ফুট',
        'panel': 'প্যানেল',
        'sheet': 'শিট',
        'piece': 'পিস'
      }
      return banglaTexts[key] || fallback
    }
    return fallback
  }

  if (loading) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="flex items-center gap-3">
              <RefreshCw className="h-6 w-6 animate-spin text-primary" />
              <span>Loading form data...</span>
            </div>
          </div>
        </div>
      </Layout>
    )
  }

  if (!apiFormData) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center text-destructive">
                <AlertTriangle className="h-12 w-12 mx-auto mb-4" />
                <p className="font-medium">Failed to load form data</p>
                <p className="text-sm text-muted-foreground mt-1">{error}</p>
                <Button onClick={fetchFormData} className="mt-4">
                  Try Again
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Package className="h-6 w-6 text-primary" />
          <div>
            <h1 className="heading-1">BD Shop Stock Addition</h1>
            <p className="text-muted-foreground">
              Add Thai & Glass stock exactly as done in BD shops
            </p>
          </div>
        </div>

        {/* Success/Error Messages */}
        {success && (
          <Card className="border-green-200 bg-green-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <p className="text-green-800 font-medium">{success}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {error && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                <p className="text-red-800 font-medium">{error}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Add New Stock
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Material Type */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Layers className="h-4 w-4" />
                Material Type
                {language === 'bn' && <span className="text-muted-foreground">({getBanglaText('material_type')})</span>}
              </Label>
              <Select 
                value={formData.materialType} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, materialType: value }))}
              >
                <SelectTrigger className="h-12">
                  <SelectValue placeholder="Select material type" />
                </SelectTrigger>
                <SelectContent>
                  {apiFormData.materialTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      <div className="flex items-center gap-2">
                        <span>{type.label}</span>
                        {language === 'bn' && <span className="text-muted-foreground">({type.bangla})</span>}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Company/Brand */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Company / Brand
                {language === 'bn' && <span className="text-muted-foreground">({getBanglaText('company_brand')})</span>}
              </Label>
              <div className="space-y-2">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search companies..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 h-12"
                  />
                </div>
                
                {searchResults.length > 0 && (
                  <div className="border rounded-md max-h-40 overflow-y-auto">
                    {searchResults.map((company) => (
                      <div
                        key={company.id}
                        className={`p-3 cursor-pointer hover:bg-accent border-b last:border-b-0 ${
                          formData.company === company.name ? 'bg-primary/10 border-primary' : ''
                        }`}
                        onClick={() => setFormData(prev => ({ ...prev, company: company.name }))}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{company.name}</p>
                            {company.country && (
                              <p className="text-sm text-muted-foreground">{company.country}</p>
                            )}
                          </div>
                          {formData.company === company.name && (
                            <CheckCircle className="h-4 w-4 text-primary" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                <Dialog open={showNewCompanyDialog} onOpenChange={setShowNewCompanyDialog}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="w-full h-12">
                      <Plus className="h-4 w-4 mr-2" />
                      Add New Company
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add New Company</DialogTitle>
                      <DialogDescription>
                        Add a new {formData.materialType} company to the database
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label>Company Name *</Label>
                        <Input
                          value={newCompanyData.name}
                          onChange={(e) => setNewCompanyData(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="Enter company name"
                        />
                      </div>
                      <div>
                        <Label>Country</Label>
                        <Input
                          value={newCompanyData.country}
                          onChange={(e) => setNewCompanyData(prev => ({ ...prev, country: e.target.value }))}
                          placeholder="e.g., Bangladesh, China, India"
                        />
                      </div>
                      <div>
                        <Label>Notes</Label>
                        <Textarea
                          value={newCompanyData.notes}
                          onChange={(e) => setNewCompanyData(prev => ({ ...prev, notes: e.target.value }))}
                          placeholder="Additional notes about the company"
                          rows={3}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button 
                        variant="outline" 
                        onClick={() => setShowNewCompanyDialog(false)}
                        disabled={addingCompany}
                      >
                        Cancel
                      </Button>
                      <Button onClick={handleAddNewCompany} disabled={addingCompany}>
                        {addingCompany && <RefreshCw className="h-4 w-4 mr-2 animate-spin" />}
                        Add Company
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            {/* Thickness (Glass only) */}
            {formData.materialType === 'Glass' && (
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Layers className="h-4 w-4" />
                  Thickness
                  {language === 'bn' && <span className="text-muted-foreground">({getBanglaText('thickness')})</span>}
                </Label>
                <Select 
                  value={formData.thicknessMM?.toString() || ''} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, thicknessMM: parseInt(value) }))}
                >
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="Select thickness" />
                  </SelectTrigger>
                  <SelectContent>
                    {apiFormData.thicknesses.Glass.map((thickness) => (
                      <SelectItem key={thickness.value} value={thickness.value.toString()}>
                        <div className="flex items-center gap-2">
                          <span>{thickness.label}</span>
                          {language === 'bn' && <span className="text-muted-foreground">({thickness.bangla})</span>}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Quality */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Star className="h-4 w-4" />
                Quality
                {language === 'bn' && <span className="text-muted-foreground">({getBanglaText('quality')})</span>}
              </Label>
              <Select 
                value={formData.quality} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, quality: value }))}
              >
                <SelectTrigger className="h-12">
                  <SelectValue placeholder="Select quality" />
                </SelectTrigger>
                <SelectContent>
                  {apiFormData.qualities.map((quality) => (
                    <SelectItem key={quality.value} value={quality.value}>
                      <div className="flex items-center gap-2">
                        <span>{quality.label}</span>
                        {language === 'bn' && <span className="text-muted-foreground">({quality.bangla})</span>}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Measurement Type */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Calculator className="h-4 w-4" />
                Measurement Type
                {language === 'bn' && <span className="text-muted-foreground">({getBanglaText('measurement_type')})</span>}
              </Label>
              <Select 
                value={formData.measurementType} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, measurementType: value }))}
              >
                <SelectTrigger className="h-12">
                  <SelectValue placeholder="Select measurement type" />
                </SelectTrigger>
                <SelectContent>
                  {apiFormData.measurementTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      <div className="flex items-center gap-2">
                        <span>{type.label}</span>
                        {language === 'bn' && <span className="text-muted-foreground">({type.bangla})</span>}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Prices */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Purchase Price (৳ per unit)
                  {language === 'bn' && <span className="text-muted-foreground">({getBanglaText('purchase_price')})</span>}
                </Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.purchasePrice}
                  onChange={(e) => setFormData(prev => ({ ...prev, purchasePrice: e.target.value }))}
                  placeholder="0.00"
                  className="h-12"
                />
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Info className="h-3 w-3" />
                  Optional - for cost tracking
                </p>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Selling Price (৳ per unit) *
                  {language === 'bn' && <span className="text-muted-foreground">({getBanglaText('selling_price')})</span>}
                </Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={formData.sellingPrice}
                  onChange={(e) => setFormData(prev => ({ ...prev, sellingPrice: e.target.value }))}
                  placeholder="0.00"
                  className="h-12"
                  required
                />
              </div>
            </div>

            {/* Stock Quantity */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Package className="h-4 w-4" />
                Stock Quantity *
                {language === 'bn' && <span className="text-muted-foreground">({getBanglaText('stock_quantity')})</span>}
              </Label>
              <Input
                type="number"
                step="0.01"
                min="0.01"
                value={formData.stockQuantity}
                onChange={(e) => setFormData(prev => ({ ...prev, stockQuantity: e.target.value }))}
                placeholder="0.00"
                className="h-12"
                required
              />
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label>
                Notes
                {language === 'bn' && <span className="text-muted-foreground">({getBanglaText('notes')})</span>}
              </Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Additional notes about this stock..."
                rows={3}
              />
            </div>

            {/* Save Button */}
            <div className="pt-4">
              <Button 
                onClick={handleSaveStock} 
                disabled={saving || !formData.company || !formData.sellingPrice || !formData.stockQuantity}
                className="w-full h-12 text-lg"
                size="lg"
              >
                {saving && <RefreshCw className="h-5 w-5 mr-2 animate-spin" />}
                <Save className="h-5 w-5 mr-2" />
                Save Stock
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  )
}