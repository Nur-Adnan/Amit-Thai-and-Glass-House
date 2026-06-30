'use client'

import { API_BASE } from '@/lib/apiBase'
import { useState, useEffect, useCallback } from 'react'
import Layout from '@/components/Layout'
import {
  Card,
  CardBody,
  CardHeader,
  Button,
  Chip,
  Divider,
  Input,
  Select,
  SelectItem,
} from '@heroui/react'
import {
  Calculator, 
  Plus, 
  AlertTriangle, 
  CheckCircle,
  Package,
  Layers,
  Building2,
  Star,
  Ruler,
  Percent,
  ShoppingCart
} from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'
import { useFormatting } from '@/hooks/useFormatting'

interface ProductVariant {
  id: string
  name: string
  materialType: string
  company: string
  thickness: string | null
  thicknessMM: number | null
  quality: string
  sellingPrice: number
  formattedSellingPrice: string
  stockQuantity: number
  unit: string
  measurementType: string
  displayName: string
  stockStatus: string
  isLowStock: boolean
  isOutOfStock: boolean
}

interface CalculationResult {
  product: {
    id: string
    name: string
    materialType: string
    company: string
    thickness: string | null
    quality: string
    displayName: string
    stockQuantity: number
    stockAfterUse: number
  }
  input: {
    measurementType: string
    dimensions: any
    measurementInput?: any
  }
  calculation: {
    quantityNeeded: number
    unit: string
    unitPrice: number
    totalPrice: number
    formattedUnitPrice: string
    formattedTotalPrice: string
  }
  breakdown: {
    formula: string
    calculation: string
    priceCalculation: string
  }
  stockValidation: {
    isStockSufficient: boolean
    quantityNeeded: number
    availableStock: number
    stockAfterUse: number
    stockStatus: string
  }
  wasteCalculation?: {
    baseArea: number
    wastePercentage: number
    wasteAmount: number
    totalArea: number
  }
}

export default function StockAwareCalculatorPage() {
  // Step 1: Material Type
  const [materialType, setMaterialType] = useState<string>('')
  
  // Step 2: Company
  const [company, setCompany] = useState<string>('')
  const [companies, setCompanies] = useState<string[]>([])
  
  // Step 3: Thickness (if Glass)
  const [thickness, setThickness] = useState<string>('')
  const [thicknesses, setThicknesses] = useState<number[]>([])
  
  // Step 4: Quality
  const [quality, setQuality] = useState<string>('')
  const [qualities, setQualities] = useState<string[]>([])
  
  // Step 5: Measurement Type
  const [measurementType, setMeasurementType] = useState<string>('')
  
  // Step 6: Dimensions
  const [lengthFeet, setLengthFeet] = useState<string>('')
  const [lengthInches, setLengthInches] = useState<string>('')
  const [widthFeet, setWidthFeet] = useState<string>('')
  const [widthInches, setWidthInches] = useState<string>('')
  
  // Step 7: Waste Percentage
  const [wastePercentage, setWastePercentage] = useState<string>('5')
  
  // State
  const [variants, setVariants] = useState<ProductVariant[]>([])
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null)
  const [result, setResult] = useState<CalculationResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { t } = useLanguage()
  const { formatCurrency, formatNumber } = useFormatting()

  // Wrap functions in useCallback to prevent unnecessary re-renders
  const fetchCompanies = useCallback(async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/calculator/companies?materialType=${materialType}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await response.json()
      if (data.success) {
        setCompanies(data.companies)
      }
    } catch (error) {
      console.error('Error fetching companies:', error)
    }
  }, [materialType])

  const fetchThicknesses = useCallback(async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/calculator/thicknesses?materialType=${materialType}&company=${company}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await response.json()
      if (data.success) {
        setThicknesses(data.thicknesses)
      }
    } catch (error) {
      console.error('Error fetching thicknesses:', error)
    }
  }, [materialType, company])

  const fetchQualities = useCallback(async () => {
    try {
      const token = localStorage.getItem('token')
      const params = new URLSearchParams({
        materialType,
        company
      })
      if (thickness) params.append('thickness', thickness)
      
      const response = await fetch(`/api/calculator/qualities?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await response.json()
      if (data.success) {
        setQualities(data.qualities)
      }
    } catch (error) {
      console.error('Error fetching qualities:', error)
    }
  }, [materialType, company, thickness])

  const fetchVariants = useCallback(async () => {
    try {
      const token = localStorage.getItem('token')
      const params = new URLSearchParams({
        materialType,
        company,
        quality
      })
      if (thickness) params.append('thickness', thickness)
      
      const response = await fetch(`/api/calculator/variants?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await response.json()
      if (data.success && data.variants.length > 0) {
        setVariants(data.variants)
        setSelectedVariant(data.variants[0])
      }
    } catch (error) {
      console.error('Error fetching variants:', error)
    }
  }, [materialType, company, quality, thickness])

  const canCalculate = useCallback(() => {
    return selectedVariant && 
           measurementType === 'SFT' && 
           lengthFeet && widthFeet &&
           parseFloat(lengthFeet) > 0 && parseFloat(widthFeet) > 0
  }, [selectedVariant, measurementType, lengthFeet, widthFeet])

  const calculateLive = useCallback(async () => {
    if (!selectedVariant || !canCalculate()) return

    setLoading(true)
    setError(null)

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_BASE}/api/calculator/calculate-stock-aware`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          productId: selectedVariant.id,
          measurementType,
          lengthFeet: parseFloat(lengthFeet) || 0,
          lengthInches: parseFloat(lengthInches) || 0,
          widthFeet: parseFloat(widthFeet) || 0,
          widthInches: parseFloat(widthInches) || 0,
          wastePercentage: parseFloat(wastePercentage) || 0
        })
      })

      const data = await response.json()
      if (data.success) {
        setResult(data.result)
      } else {
        setError(data.message || 'Calculation failed')
      }
    } catch (error) {
      console.error('Error calculating:', error)
      setError('Failed to calculate. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [selectedVariant, canCalculate, measurementType, lengthFeet, lengthInches, widthFeet, widthInches, wastePercentage])

  // Reset dependent fields when parent selection changes
  useEffect(() => {
    if (materialType) {
      setCompany('')
      setThickness('')
      setQuality('')
      setMeasurementType('')
      resetDimensions()
      fetchCompanies()
    }
  }, [materialType, fetchCompanies])

  useEffect(() => {
    if (materialType && company) {
      setThickness('')
      setQuality('')
      setMeasurementType('')
      resetDimensions()
      if (materialType === 'Glass') {
        fetchThicknesses()
      } else {
        fetchQualities()
      }
    }
  }, [materialType, company, fetchThicknesses, fetchQualities])

  useEffect(() => {
    if (materialType === 'Glass' && company && thickness) {
      setQuality('')
      setMeasurementType('')
      resetDimensions()
      fetchQualities()
    }
  }, [materialType, company, thickness, fetchQualities])

  useEffect(() => {
    if (materialType && company && quality && (materialType !== 'Glass' || thickness)) {
      setMeasurementType('')
      resetDimensions()
      fetchVariants()
    }
  }, [materialType, company, thickness, quality, fetchVariants])

  useEffect(() => {
    if (selectedVariant && measurementType && canCalculate()) {
      calculateLive()
    } else {
      setResult(null)
    }
  }, [selectedVariant, measurementType, lengthFeet, lengthInches, widthFeet, widthInches, wastePercentage, canCalculate, calculateLive])

  const resetDimensions = () => {
    setLengthFeet('')
    setLengthInches('')
    setWidthFeet('')
    setWidthInches('')
  }

  const handleAddToInvoice = async () => {
    if (!result || !result.stockValidation.isStockSufficient) return
    
    setLoading(true)
    try {
      // Here you would add to invoice
      alert('Item added to invoice successfully!')
    } catch (error) {
      alert('Failed to add to invoice')
    } finally {
      setLoading(false)
    }
  }

  const resetCalculator = () => {
    setMaterialType('')
    setCompany('')
    setThickness('')
    setQuality('')
    setMeasurementType('')
    resetDimensions()
    setWastePercentage('5')
    setSelectedVariant(null)
    setResult(null)
    setError(null)
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Calculator className="h-6 w-6 text-primary" />
          <div>
            <h1 className="heading-1">Stock-Aware Calculator</h1>
            <p className="text-muted-foreground">
              Calculate with actual stock variants - prevents overselling
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Step-by-Step Selection */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Step 1: Material Type */}
            <Card>
              <CardHeader className="pb-4">
                <div className="flex items-center gap-2">
                  <Chip variant="bordered" size="sm" className="text-xs">STEP 1</Chip>
                  <h3 className="text-lg font-semibold">Material Type</h3>
                </div>
              </CardHeader>
              <CardBody>
                <div className="grid grid-cols-2 gap-3">
                  {['Glass', 'Thai'].map((type) => (
                    <Button
                      key={type}
                      color={materialType === type ? "primary" : "default"}
                      variant={materialType === type ? "solid" : "bordered"}
                      size="lg"
                      onPress={() => setMaterialType(type)}
                      className="h-16 text-lg font-semibold"
                    >
                      <Layers className="h-5 w-5 mr-2" />
                      {type}
                    </Button>
                  ))}
                </div>
              </CardBody>
            </Card>

            {/* Step 2: Company */}
            {materialType && (
              <Card>
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-2">
                    <Chip variant="bordered" size="sm" className="text-xs">STEP 2</Chip>
                    <h3 className="text-lg font-semibold">Company</h3>
                  </div>
                </CardHeader>
                <CardBody>
                  <Select
                    aria-label="Company"
                    placeholder="Select company"
                    selectedKeys={company ? [company] : []}
                    onSelectionChange={(keys) => setCompany(Array.from(keys)[0] as string)}
                    className="h-12"
                  >
                    {companies.map((comp) => (
                      <SelectItem key={comp}>
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4" />
                          {comp}
                        </div>
                      </SelectItem>
                    ))}
                  </Select>
                </CardBody>
              </Card>
            )}

            {/* Step 3: Thickness (Glass only) */}
            {materialType === 'Glass' && company && (
              <Card>
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-2">
                    <Chip variant="bordered" size="sm" className="text-xs">STEP 3</Chip>
                    <h3 className="text-lg font-semibold">Thickness</h3>
                  </div>
                </CardHeader>
                <CardBody>
                  <div className="grid grid-cols-4 gap-3">
                    {thicknesses.map((thick) => (
                      <Button
                        key={thick}
                        color={thickness === thick.toString() ? "primary" : "default"}
                        variant={thickness === thick.toString() ? "solid" : "bordered"}
                        size="lg"
                        onPress={() => setThickness(thick.toString())}
                        className="h-16 flex flex-col"
                      >
                        <Ruler className="h-4 w-4 mb-1" />
                        <span className="font-semibold">{thick}mm</span>
                      </Button>
                    ))}
                  </div>
                </CardBody>
              </Card>
            )}

            {/* Step 4: Quality */}
            {materialType && company && (materialType !== 'Glass' || thickness) && (
              <Card>
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-2">
                    <Chip variant="bordered" size="sm" className="text-xs">STEP {materialType === 'Glass' ? '4' : '3'}</Chip>
                    <h3 className="text-lg font-semibold">Quality</h3>
                  </div>
                </CardHeader>
                <CardBody>
                  <div className="grid grid-cols-3 gap-3">
                    {qualities.map((qual) => (
                      <Button
                        key={qual}
                        color={quality === qual ? "primary" : "default"}
                        variant={quality === qual ? "solid" : "bordered"}
                        size="lg"
                        onPress={() => setQuality(qual)}
                        className="h-16 flex flex-col"
                      >
                        <Star className="h-4 w-4 mb-1" />
                        <span className="font-semibold">{qual}</span>
                      </Button>
                    ))}
                  </div>
                </CardBody>
              </Card>
            )}

            {/* Variant Selection */}
            {variants.length > 0 && (
              <Card>
                <CardHeader className="pb-4">
                  <h3 className="text-lg font-semibold">Available Stock Variants</h3>
                </CardHeader>
                <CardBody>
                  <div className="space-y-3">
                    {variants.map((variant) => (
                      <div
                        key={variant.id}
                        className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                          selectedVariant?.id === variant.id 
                            ? 'border-primary bg-primary/5' 
                            : 'border-border hover:border-primary/50'
                        } ${variant.isOutOfStock ? 'opacity-50' : ''}`}
                        onClick={() => !variant.isOutOfStock && setSelectedVariant(variant)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Package className="h-5 w-5 text-muted-foreground" />
                            <div>
                              <p className="font-medium">{variant.displayName}</p>
                              <p className="text-sm text-muted-foreground">
                                {variant.formattedSellingPrice} per {variant.unit}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <Chip
                              className={
                                variant.isOutOfStock
                                  ? 'bg-red-100 text-red-800'
                                  : variant.isLowStock
                                    ? 'bg-orange-100 text-orange-800'
                                    : 'bg-green-100 text-green-800'
                              }
                            >
                              {variant.stockQuantity} {variant.unit}
                            </Chip>
                            <p className="text-xs text-muted-foreground mt-1">
                              {variant.stockStatus}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardBody>
              </Card>
            )}

            {/* Step 5: Measurement Type */}
            {selectedVariant && (
              <Card>
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-2">
                    <Chip variant="bordered" size="sm" className="text-xs">STEP {materialType === 'Glass' ? '5' : '4'}</Chip>
                    <h3 className="text-lg font-semibold">Measurement Type</h3>
                  </div>
                </CardHeader>
                <CardBody>
                  <Button
                    color={measurementType === 'SFT' ? "primary" : "default"}
                    variant={measurementType === 'SFT' ? "solid" : "bordered"}
                    size="lg"
                    onPress={() => setMeasurementType('SFT')}
                    className="w-full h-16 text-lg font-semibold"
                  >
                    <Calculator className="h-5 w-5 mr-2" />
                    Square Feet (SFT)
                  </Button>
                </CardBody>
              </Card>
            )}

            {/* Step 6: Dimensions */}
            {selectedVariant && measurementType === 'SFT' && (
              <Card>
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-2">
                    <Chip variant="bordered" size="sm" className="text-xs">STEP {materialType === 'Glass' ? '6' : '5'}</Chip>
                    <h3 className="text-lg font-semibold">Length / Width (Feet & Inches)</h3>
                  </div>
                </CardHeader>
                <CardBody>
                  <div className="grid grid-cols-2 gap-6">
                    {/* Length */}
                    <div className="space-y-3">
                      <label className="text-sm font-medium">Length</label>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Input
                            type="number"
                            value={lengthFeet}
                            onChange={(e) => setLengthFeet(e.target.value)}
                            placeholder="0"
                            className="h-14 text-xl font-semibold text-center"
                          />
                          <p className="text-xs text-muted-foreground text-center mt-1">Feet</p>
                        </div>
                        <div>
                          <Input
                            type="number"
                            value={lengthInches}
                            onChange={(e) => setLengthInches(e.target.value)}
                            placeholder="0"
                            max="11"
                            className="h-14 text-xl font-semibold text-center"
                          />
                          <p className="text-xs text-muted-foreground text-center mt-1">Inches</p>
                        </div>
                      </div>
                    </div>

                    {/* Width */}
                    <div className="space-y-3">
                      <label className="text-sm font-medium">Width</label>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Input
                            type="number"
                            value={widthFeet}
                            onChange={(e) => setWidthFeet(e.target.value)}
                            placeholder="0"
                            className="h-14 text-xl font-semibold text-center"
                          />
                          <p className="text-xs text-muted-foreground text-center mt-1">Feet</p>
                        </div>
                        <div>
                          <Input
                            type="number"
                            value={widthInches}
                            onChange={(e) => setWidthInches(e.target.value)}
                            placeholder="0"
                            max="11"
                            className="h-14 text-xl font-semibold text-center"
                          />
                          <p className="text-xs text-muted-foreground text-center mt-1">Inches</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardBody>
              </Card>
            )}

            {/* Step 7: Waste Percentage */}
            {selectedVariant && measurementType === 'SFT' && (lengthFeet || lengthInches) && (widthFeet || widthInches) && (
              <Card>
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-2">
                    <Chip variant="bordered" size="sm" className="text-xs">STEP {materialType === 'Glass' ? '7' : '6'}</Chip>
                    <h3 className="text-lg font-semibold">Waste %</h3>
                  </div>
                </CardHeader>
                <CardBody>
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <Input
                        aria-label="Waste percentage"
                        type="number"
                        value={wastePercentage}
                        onChange={(e) => setWastePercentage(e.target.value)}
                        placeholder="5"
                        min="0"
                        max="50"
                        className="h-14 text-xl font-semibold text-center"
                      />
                    </div>
                    <Percent className="h-6 w-6 text-muted-foreground" />
                    <div className="flex gap-2">
                      {[5, 10, 15].map((percent) => (
                        <Button
                          key={percent}
                          variant="bordered"
                          size="sm"
                          onPress={() => setWastePercentage(percent.toString())}
                        >
                          {percent}%
                        </Button>
                      ))}
                    </div>
                  </div>
                </CardBody>
              </Card>
            )}
          </div>

          {/* Right Column: Live Preview */}
          <div className="space-y-6">
            <Card className="sticky top-6">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-2">
                  <Chip color="default" variant="flat" size="sm" className="text-xs">LIVE PREVIEW</Chip>
                  <h3 className="text-lg font-semibold">Calculation</h3>
                </div>
              </CardHeader>
              <CardBody>
                {error && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-red-600" />
                      <p className="text-sm text-red-800">{error}</p>
                    </div>
                  </div>
                )}

                {selectedVariant && (
                  <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
                    <h4 className="font-medium text-blue-900 mb-2">Selected Variant</h4>
                    <p className="text-sm text-blue-800">{selectedVariant.displayName}</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-sm text-blue-700">Available Stock:</span>
                      <Chip className="bg-blue-100 text-blue-800">
                        {selectedVariant.stockQuantity} {selectedVariant.unit}
                      </Chip>
                    </div>
                  </div>
                )}

                {result ? (
                  <div className="space-y-6">
                    {/* Area Display */}
                    <div className="text-center p-4 bg-muted/50 rounded-lg">
                      <p className="text-sm text-muted-foreground mb-1">Calculated Area</p>
                      <p className="text-2xl font-bold">
                        {formatNumber(result.wasteCalculation?.totalArea || result.calculation.quantityNeeded)} sqft
                      </p>
                      {result.wasteCalculation && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Base: {formatNumber(result.wasteCalculation.baseArea)} + 
                          Waste: {formatNumber(result.wasteCalculation.wasteAmount)}
                        </p>
                      )}
                    </div>

                    {/* Price Display */}
                    <div className={`text-center p-4 rounded-lg ${
                      result.stockValidation.isStockSufficient 
                        ? 'bg-primary/5 border border-primary/20' 
                        : 'bg-red-50 border border-red-200'
                    }`}>
                      <p className={`text-sm mb-1 ${
                        result.stockValidation.isStockSufficient ? 'text-primary/80' : 'text-red-600'
                      }`}>
                        Total Price
                      </p>
                      <p className={`text-3xl font-bold ${
                        result.stockValidation.isStockSufficient ? 'text-primary' : 'text-red-600'
                      }`}>
                        {result.calculation.formattedTotalPrice}
                      </p>
                    </div>

                    {/* Stock Validation */}
                    <div className={`p-4 rounded-lg ${
                      result.stockValidation.isStockSufficient 
                        ? 'bg-green-50 border border-green-200' 
                        : 'bg-red-50 border border-red-200'
                    }`}>
                      <div className="flex items-center gap-2 mb-2">
                        {result.stockValidation.isStockSufficient ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <AlertTriangle className="h-4 w-4 text-red-600" />
                        )}
                        <span className={`font-medium ${
                          result.stockValidation.isStockSufficient ? 'text-green-800' : 'text-red-800'
                        }`}>
                          {result.stockValidation.isStockSufficient ? 'Stock Available' : 'Insufficient Stock'}
                        </span>
                      </div>
                      <div className="text-sm space-y-1">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Required:</span>
                          <span>{formatNumber(result.stockValidation.quantityNeeded)} sqft</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Available:</span>
                          <span>{formatNumber(result.stockValidation.availableStock)} sqft</span>
                        </div>
                        {result.stockValidation.isStockSufficient && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">After use:</span>
                            <span>{formatNumber(result.stockValidation.stockAfterUse)} sqft</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Breakdown */}
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Unit Price:</span>
                        <span>{result.calculation.formattedUnitPrice}/sqft</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Quantity:</span>
                        <span>{formatNumber(result.calculation.quantityNeeded)} sqft</span>
                      </div>
                      <Divider />
                      <div className="flex justify-between font-semibold">
                        <span>Total:</span>
                        <span>{result.calculation.formattedTotalPrice}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Calculator className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      Follow the steps to see live calculation
                    </p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="space-y-3 mt-6">
                  <Button
                    color="primary"
                    onPress={handleAddToInvoice}
                    isDisabled={!result || !result.stockValidation.isStockSufficient || loading}
                    size="lg"
                    className="w-full h-14 text-lg font-semibold"
                  >
                    <ShoppingCart className="h-5 w-5 mr-2" />
                    {!result ? 'Complete Calculation' :
                     !result.stockValidation.isStockSufficient ? 'Insufficient Stock' :
                     loading ? 'Adding...' : 'Add to Invoice'}
                  </Button>

                  <Button
                    onPress={resetCalculator}
                    variant="bordered"
                    size="lg"
                    className="w-full"
                  >
                    Reset Calculator
                  </Button>
                </div>
              </CardBody>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  )
}