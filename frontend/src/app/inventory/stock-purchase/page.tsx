'use client'

import { API_BASE } from '@/lib/apiBase'
import { useState, useEffect, useCallback } from 'react'
import Layout from '@/components/Layout'
import {
  Card,
  CardBody,
  CardHeader,
  Button,
  Input,
  Chip,
  Textarea,
  Select,
  SelectItem,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from '@heroui/react'
import { 
  ShoppingCart, 
  AlertTriangle, 
  CheckCircle,
  Building2,
  Layers,
  Star,
  Calculator,
  DollarSign,
  Save,
  RefreshCw,
  Info,
  Truck,
  CreditCard,
  Banknote
} from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'
import { useFormatting } from '@/hooks/useFormatting'

interface Supplier {
  _id: string
  name: string
  phone?: string
  email?: string
  address?: string
  dueAmount: number
  formattedDueAmount: string
}

interface FormData {
  supplierId: string
  supplierName: string
  materialType: string
  company: string
  thicknessMM?: number
  quality: string
  quantity: string
  purchasePrice: string
  paymentType: 'paid' | 'due'
  paidAmount: string
  notes: string
}

interface FormDataResponse {
  materialTypes: Array<{ value: string; label: string; bangla: string }>
  brands: {
    Thai: Array<{ id: string; name: string; materialType: string; country?: string }>
    Glass: Array<{ id: string; name: string; materialType: string; country?: string }>
  }
  thicknesses: {
    Glass: Array<{ value: number; label: string; bangla: string }>
    Thai: Array<{ value: number; label: string; bangla: string }>
  }
  qualities: Array<{ value: string; label: string; bangla: string }>
}

export default function StockPurchasePage() {
  const [formData, setFormData] = useState<FormData>({
    supplierId: '',
    supplierName: '',
    materialType: 'Glass',
    company: '',
    thicknessMM: undefined,
    quality: 'Local',
    quantity: '',
    purchasePrice: '',
    paymentType: 'paid',
    paidAmount: '',
    notes: ''
  })

  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [apiFormData, setApiFormData] = useState<FormDataResponse | null>(null)
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null)
  const [totalCost, setTotalCost] = useState(0)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const { language } = useLanguage()
  const { formatCurrency } = useFormatting()

  useEffect(() => {
    fetchInitialData()
  }, [])

  const calculateTotalCost = useCallback(() => {
    const quantity = parseFloat(formData.quantity) || 0
    const price = parseFloat(formData.purchasePrice) || 0
    setTotalCost(quantity * price)
  }, [formData.quantity, formData.purchasePrice])

  useEffect(() => {
    calculateTotalCost()
  }, [calculateTotalCost])

  useEffect(() => {
    if (formData.paymentType === 'paid') {
      setFormData(prev => ({ ...prev, paidAmount: totalCost.toString() }))
    } else {
      setFormData(prev => ({ ...prev, paidAmount: '0' }))
    }
  }, [formData.paymentType, totalCost])

  const fetchInitialData = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const token = localStorage.getItem('token')
      
      // Fetch suppliers and form data in parallel
      const [suppliersResponse, formDataResponse] = await Promise.all([
        fetch(`${API_BASE}/api/suppliers`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${API_BASE}/api/bd-shop-inventory/form-data`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ])

      if (!suppliersResponse.ok || !formDataResponse.ok) {
        throw new Error('Failed to fetch initial data')
      }

      const [suppliersData, formData] = await Promise.all([
        suppliersResponse.json(),
        formDataResponse.json()
      ])
      
      if (suppliersData.success && formData.success) {
        setSuppliers(suppliersData.data)
        setApiFormData(formData.data)
      } else {
        throw new Error('Failed to load data')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleSupplierChange = (supplierId: string) => {
    const supplier = suppliers.find(s => s._id === supplierId)
    if (supplier) {
      setSelectedSupplier(supplier)
      setFormData(prev => ({
        ...prev,
        supplierId: supplier._id,
        supplierName: supplier.name
      }))
    }
  }

  const handleSave = () => {
    // Validation
    const errors: string[] = []
    
    if (!formData.supplierId) errors.push('Supplier is required')
    if (!formData.materialType) errors.push('Material type is required')
    if (!formData.company) errors.push('Company is required')
    if (formData.materialType === 'Glass' && !formData.thicknessMM) errors.push('Thickness is required for Glass')
    if (!formData.quality) errors.push('Quality is required')
    if (!formData.quantity || parseFloat(formData.quantity) <= 0) errors.push('Valid quantity is required')
    if (!formData.purchasePrice || parseFloat(formData.purchasePrice) <= 0) errors.push('Valid purchase price is required')
    
    if (errors.length > 0) {
      setError(errors.join(', '))
      return
    }

    setShowConfirmDialog(true)
  }

  const handleConfirmSave = async () => {
    setSaving(true)
    setError(null)
    setSuccess(null)
    setShowConfirmDialog(false)

    try {
      const token = localStorage.getItem('token')
      
      // Step 1: Find or create the product variant
      const productSearchQuery = {
        materialType: formData.materialType,
        company: formData.company,
        quality: formData.quality,
        ...(formData.materialType === 'Glass' && formData.thicknessMM && { thicknessMM: formData.thicknessMM })
      }

      // Search for existing product
      const searchParams = new URLSearchParams()
      Object.entries(productSearchQuery).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString())
        }
      })

      const productSearchResponse = await fetch(`${API_BASE}/api/products?${searchParams.toString()}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      let product = null
      const isNewProduct = false

      if (productSearchResponse.ok) {
        const productData = await productSearchResponse.json()
        if (productData.success && productData.data.length > 0) {
          // Found existing product
          product = productData.data[0]
        }
      }

      // If no existing product found, create one using BD shop inventory API
      if (!product) {
        const createProductData = {
          materialType: formData.materialType,
          company: formData.company,
          thicknessMM: formData.materialType === 'Glass' ? formData.thicknessMM : undefined,
          quality: formData.quality,
          measurementType: 'SFT', // Default to SFT for stock purchases
          purchasePrice: parseFloat(formData.purchasePrice),
          sellingPrice: parseFloat(formData.purchasePrice) * 1.2, // Default 20% markup
          stockQuantity: parseFloat(formData.quantity),
          notes: formData.notes.trim() || `Stock purchase - ${formData.materialType} ${formData.company}`,
          supplierInfo: {
            supplierId: formData.supplierId,
            supplierName: formData.supplierName,
            paidAmount: parseFloat(formData.paidAmount) || 0,
            paymentMethod: 'cash'
          }
        }

        const createResponse = await fetch(`${API_BASE}/api/bd-shop-inventory/add-stock`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(createProductData)
        })

        const createData = await createResponse.json()
        
        if (createData.success) {
          setSuccess(
            `Stock purchase completed successfully! ` +
            `${createData.data.product.isNewProduct ? 'New product created' : 'Stock added to existing product'}. ` +
            `${createData.data.stockPurchase ? `Purchase No: ${createData.data.stockPurchase.purchaseNo}` : ''}`
          )
          
          // Reset form
          setFormData({
            supplierId: '',
            supplierName: '',
            materialType: 'Glass',
            company: '',
            thicknessMM: undefined,
            quality: 'Local',
            quantity: '',
            purchasePrice: '',
            paymentType: 'paid',
            paidAmount: '',
            notes: ''
          })
          setSelectedSupplier(null)
          setTotalCost(0)
        } else {
          throw new Error(createData.message || 'Failed to create product and stock purchase')
        }
      } else {
        // Use existing product with regular stock purchase API
        const stockPurchaseData = {
          supplierId: formData.supplierId,
          items: [{
            product: product._id,
            quantity: parseFloat(formData.quantity),
            purchasePrice: parseFloat(formData.purchasePrice)
          }],
          paidAmount: parseFloat(formData.paidAmount) || 0,
          paymentMethod: 'cash',
          notes: formData.notes.trim() || `Stock purchase - ${formData.materialType} ${formData.company}`
        }

        const response = await fetch(`${API_BASE}/api/stock-purchases`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(stockPurchaseData)
        })

        const data = await response.json()
        
        if (data.success) {
          setSuccess(
            `Stock purchase completed successfully! Purchase No: ${data.data.stockPurchase.purchaseNo}. ` +
            `Stock added to existing product.`
          )
          
          // Reset form
          setFormData({
            supplierId: '',
            supplierName: '',
            materialType: 'Glass',
            company: '',
            thicknessMM: undefined,
            quality: 'Local',
            quantity: '',
            purchasePrice: '',
            paymentType: 'paid',
            paidAmount: '',
            notes: ''
          })
          setSelectedSupplier(null)
          setTotalCost(0)
        } else {
          throw new Error(data.message || 'Failed to save stock purchase')
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save stock purchase')
    } finally {
      setSaving(false)
    }
  }

  const getBanglaText = (key: string, fallback: string = '') => {
    if (language === 'bn') {
      const banglaTexts: Record<string, string> = {
        'supplier': 'সরবরাহকারী',
        'material_type': 'উপাদানের ধরন',
        'company_brand': 'কোম্পানি / ব্র্যান্ড',
        'thickness': 'পুরুত্ব',
        'quality': 'গুণমান',
        'quantity': 'পরিমাণ',
        'purchase_price': 'ক্রয় মূল্য',
        'payment': 'পেমেন্ট',
        'notes': 'নোট'
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
              <span>Loading stock purchase form...</span>
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
            <CardBody className="pt-6">
              <div className="text-center text-destructive">
                <AlertTriangle className="h-12 w-12 mx-auto mb-4" />
                <p className="font-medium">Failed to load form data</p>
                <p className="text-sm text-muted-foreground mt-1">{error}</p>
                <Button onPress={fetchInitialData} className="mt-4">
                  Try Again
                </Button>
              </div>
            </CardBody>
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
          <ShoppingCart className="h-6 w-6 text-primary" />
          <div>
            <h1 className="heading-1">Stock Purchase</h1>
            <p className="text-muted-foreground">
              Add new stock from suppliers with proper tracking
            </p>
          </div>
        </div>

        {/* Success/Error Messages */}
        {success && (
          <Card className="border-green-200 bg-green-50">
            <CardBody className="pt-6">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <p className="text-green-800 font-medium">{success}</p>
              </div>
            </CardBody>
          </Card>
        )}

        {error && (
          <Card className="border-red-200 bg-red-50">
            <CardBody className="pt-6">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                <p className="text-red-800 font-medium">{error}</p>
              </div>
            </CardBody>
          </Card>
        )}

        {/* Main Form */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Truck className="h-5 w-5" />
              Purchase Details
            </h3>
          </CardHeader>
          <CardBody className="space-y-6">
            {/* Supplier Selection */}
            <div className="space-y-2">
              <label className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Supplier *
                {language === 'bn' && <span className="text-muted-foreground">({getBanglaText('supplier')})</span>}
              </label>
              <Select
                aria-label="Supplier"
                selectedKeys={formData.supplierId ? [formData.supplierId] : []}
                onSelectionChange={(keys) => handleSupplierChange(Array.from(keys)[0] as string)}
                placeholder="Select supplier"
                className="h-12"
              >
                {suppliers.map((supplier) => (
                  <SelectItem key={supplier._id}>
                    <div className="flex items-center justify-between w-full">
                      <span>{supplier.name}</span>
                      {supplier.dueAmount > 0 && (
                        <Chip size="sm" className="ml-2 bg-orange-100 text-orange-800">
                          Due: {supplier.formattedDueAmount}
                        </Chip>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </Select>
              {selectedSupplier && selectedSupplier.dueAmount > 0 && (
                <div className="flex items-center gap-2 p-3 bg-orange-50 border border-orange-200 rounded-md">
                  <Info className="h-4 w-4 text-orange-600" />
                  <span className="text-sm text-orange-800">
                    This supplier has an existing due amount of {selectedSupplier.formattedDueAmount}
                  </span>
                </div>
              )}
            </div>

            {/* Material Type */}
            <div className="space-y-2">
              <label className="flex items-center gap-2">
                <Layers className="h-4 w-4" />
                Material Type *
                {language === 'bn' && <span className="text-muted-foreground">({getBanglaText('material_type')})</span>}
              </label>
              <Select
                aria-label="Material Type"
                selectedKeys={formData.materialType ? [formData.materialType] : []}
                onSelectionChange={(keys) => setFormData(prev => ({ ...prev, materialType: Array.from(keys)[0] as string, company: '', thicknessMM: undefined }))}
                placeholder="Select material type"
                className="h-12"
              >
                {apiFormData.materialTypes.map((type) => (
                  <SelectItem key={type.value}>
                    <div className="flex items-center gap-2">
                      <span>{type.label}</span>
                      {language === 'bn' && <span className="text-muted-foreground">({type.bangla})</span>}
                    </div>
                  </SelectItem>
                ))}
              </Select>
            </div>

            {/* Company/Brand */}
            <div className="space-y-2">
              <label className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Company / Brand *
                {language === 'bn' && <span className="text-muted-foreground">({getBanglaText('company_brand')})</span>}
              </label>
              <Select
                aria-label="Company / Brand"
                selectedKeys={formData.company ? [formData.company] : []}
                onSelectionChange={(keys) => setFormData(prev => ({ ...prev, company: Array.from(keys)[0] as string }))}
                placeholder="Select company"
                className="h-12"
              >
                {(apiFormData.brands[formData.materialType as 'Thai' | 'Glass']?.map((brand) => (
                  <SelectItem key={brand.name}>
                    <div className="flex items-center gap-2">
                      <span>{brand.name}</span>
                      {brand.country && <span className="text-muted-foreground">({brand.country})</span>}
                    </div>
                  </SelectItem>
                )) ?? []) as never}
              </Select>
            </div>

            {/* Thickness (Glass only) */}
            {formData.materialType === 'Glass' && (
              <div className="space-y-2">
                <label className="flex items-center gap-2">
                  <Layers className="h-4 w-4" />
                  Thickness *
                  {language === 'bn' && <span className="text-muted-foreground">({getBanglaText('thickness')})</span>}
                </label>
                <Select
                  aria-label="Thickness"
                  selectedKeys={formData.thicknessMM ? [formData.thicknessMM.toString()] : []}
                  onSelectionChange={(keys) => setFormData(prev => ({ ...prev, thicknessMM: parseInt(Array.from(keys)[0] as string) }))}
                  placeholder="Select thickness"
                  className="h-12"
                >
                  {apiFormData.thicknesses.Glass.map((thickness) => (
                    <SelectItem key={thickness.value.toString()}>
                      <div className="flex items-center gap-2">
                        <span>{thickness.label}</span>
                        {language === 'bn' && <span className="text-muted-foreground">({thickness.bangla})</span>}
                      </div>
                    </SelectItem>
                  ))}
                </Select>
              </div>
            )}

            {/* Quality */}
            <div className="space-y-2">
              <label className="flex items-center gap-2">
                <Star className="h-4 w-4" />
                Quality *
                {language === 'bn' && <span className="text-muted-foreground">({getBanglaText('quality')})</span>}
              </label>
              <Select
                aria-label="Quality"
                selectedKeys={formData.quality ? [formData.quality] : []}
                onSelectionChange={(keys) => setFormData(prev => ({ ...prev, quality: Array.from(keys)[0] as string }))}
                placeholder="Select quality"
                className="h-12"
              >
                {apiFormData.qualities.map((quality) => (
                  <SelectItem key={quality.value}>
                    <div className="flex items-center gap-2">
                      <span>{quality.label}</span>
                      {language === 'bn' && <span className="text-muted-foreground">({quality.bangla})</span>}
                    </div>
                  </SelectItem>
                ))}
              </Select>
            </div>

            {/* Quantity and Purchase Price */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="flex items-center gap-2">
                  <Calculator className="h-4 w-4" />
                  Quantity (SFT) *
                  {language === 'bn' && <span className="text-muted-foreground">({getBanglaText('quantity')})</span>}
                </label>
                <Input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={formData.quantity}
                  onChange={(e) => setFormData(prev => ({ ...prev, quantity: e.target.value }))}
                  placeholder="0.00"
                  className="h-12"
                />
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Purchase Price (৳ per SFT) *
                  {language === 'bn' && <span className="text-muted-foreground">({getBanglaText('purchase_price')})</span>}
                </label>
                <Input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={formData.purchasePrice}
                  onChange={(e) => setFormData(prev => ({ ...prev, purchasePrice: e.target.value }))}
                  placeholder="0.00"
                  className="h-12"
                />
              </div>
            </div>

            {/* Total Cost Display */}
            {totalCost > 0 && (
              <Card className="bg-blue-50 border-blue-200">
                <CardBody className="pt-6">
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-medium text-blue-800">Total Purchase Cost:</span>
                    <span className="text-2xl font-bold text-blue-900">{formatCurrency(totalCost)}</span>
                  </div>
                </CardBody>
              </Card>
            )}

            {/* Payment Type */}
            <div className="space-y-2">
              <label className="flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Payment Type *
                {language === 'bn' && <span className="text-muted-foreground">({getBanglaText('payment')})</span>}
              </label>
              <div className="grid grid-cols-2 gap-4">
                <Button
                  type="button"
                  color={formData.paymentType === 'paid' ? 'primary' : 'default'}
                  variant={formData.paymentType === 'paid' ? 'solid' : 'bordered'}
                  onPress={() => setFormData(prev => ({ ...prev, paymentType: 'paid' }))}
                  className="h-12"
                >
                  <Banknote className="h-4 w-4 mr-2" />
                  Paid in Full
                </Button>
                <Button
                  type="button"
                  color={formData.paymentType === 'due' ? 'primary' : 'default'}
                  variant={formData.paymentType === 'due' ? 'solid' : 'bordered'}
                  onPress={() => setFormData(prev => ({ ...prev, paymentType: 'due' }))}
                  className="h-12"
                >
                  <CreditCard className="h-4 w-4 mr-2" />
                  Add to Due
                </Button>
              </div>
            </div>

            {/* Paid Amount (if partial payment) */}
            {formData.paymentType === 'paid' && (
              <div className="space-y-2">
                <label>Paid Amount (৳)</label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  max={totalCost}
                  value={formData.paidAmount}
                  onChange={(e) => setFormData(prev => ({ ...prev, paidAmount: e.target.value }))}
                  placeholder="0.00"
                  className="h-12"
                />
                {parseFloat(formData.paidAmount) < totalCost && (
                  <p className="text-sm text-orange-600">
                    Due amount: {formatCurrency(totalCost - (parseFloat(formData.paidAmount) || 0))}
                  </p>
                )}
              </div>
            )}

            {/* Notes */}
            <div className="space-y-2">
              <label>
                Notes
                {language === 'bn' && <span className="text-muted-foreground">({getBanglaText('notes')})</span>}
              </label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Additional notes about this purchase..."
                rows={3}
              />
            </div>

            {/* Save Button */}
            <div className="pt-4">
              <Button
                onPress={handleSave}
                isDisabled={saving || !formData.supplierId || !formData.company || !formData.quantity || !formData.purchasePrice}
                className="w-full h-12 text-lg"
                size="lg"
              >
                <Save className="h-5 w-5 mr-2" />
                Create Stock Purchase
              </Button>
            </div>
          </CardBody>
        </Card>

        {/* Confirmation Dialog */}
        <Modal isOpen={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
          <ModalContent>
            {(onClose) => (
              <>
                <ModalHeader className="flex flex-col gap-1">
                  Confirm Stock Purchase
                  <span className="text-sm font-normal text-muted-foreground">
                    Please review the purchase details before confirming.
                  </span>
                </ModalHeader>
                <ModalBody>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div><strong>Supplier:</strong> {formData.supplierName}</div>
                      <div><strong>Material:</strong> {formData.materialType}</div>
                      <div><strong>Company:</strong> {formData.company}</div>
                      <div><strong>Quality:</strong> {formData.quality}</div>
                      {formData.thicknessMM && (
                        <div><strong>Thickness:</strong> {formData.thicknessMM}mm</div>
                      )}
                      <div><strong>Quantity:</strong> {formData.quantity} SFT</div>
                      <div><strong>Unit Price:</strong> {formatCurrency(parseFloat(formData.purchasePrice))}</div>
                      <div><strong>Total Cost:</strong> {formatCurrency(totalCost)}</div>
                      <div><strong>Payment:</strong> {formData.paymentType === 'paid' ? 'Paid' : 'Due'}</div>
                      <div><strong>Paid Amount:</strong> {formatCurrency(parseFloat(formData.paidAmount) || 0)}</div>
                    </div>
                    {totalCost - (parseFloat(formData.paidAmount) || 0) > 0 && (
                      <div className="p-3 bg-orange-50 border border-orange-200 rounded-md">
                        <p className="text-sm text-orange-800">
                          <strong>Due Amount:</strong> {formatCurrency(totalCost - (parseFloat(formData.paidAmount) || 0))}
                        </p>
                      </div>
                    )}
                  </div>
                </ModalBody>
                <ModalFooter>
                  <Button
                    variant="bordered"
                    onPress={onClose}
                    isDisabled={saving}
                  >
                    Cancel
                  </Button>
                  <Button color="primary" onPress={handleConfirmSave} isDisabled={saving}>
                    {saving && <RefreshCw className="h-4 w-4 mr-2 animate-spin" />}
                    Confirm Purchase
                  </Button>
                </ModalFooter>
              </>
            )}
          </ModalContent>
        </Modal>
      </div>
    </Layout>
  )
}