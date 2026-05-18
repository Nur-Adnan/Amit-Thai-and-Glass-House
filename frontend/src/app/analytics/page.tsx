'use client'

import { useState, useEffect, useCallback } from 'react'
import Layout from '@/components/Layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  ProfessionalTable,
  ProfessionalTableHeader,
  ProfessionalTableRow,
  ProfessionalTableCell,
  TableBody,
  TableHeader
} from '@/components/ui/professional-table'
import { 
  BarChart3, 
  TrendingUp, 
  Package, 
  DollarSign,
  Download,
  Filter,
  RefreshCw,
  Building2,
  Layers,
  Award,
  Zap
} from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'
import { useFormatting } from '@/hooks/useFormatting'

interface AnalyticsFilters {
  materialType: string
  company: string
  quality: string
  startDate: string
  endDate: string
  sortBy: string
  sortOrder: 'asc' | 'desc'
}

interface StockByCompanyData {
  company: string
  materialType: string
  quality: string
  totalStock: number
  formattedTotalStock: string
  formattedTotalValue: string
  formattedPotentialProfit: string
  formattedProfitMargin: string
  productCount: number
  thicknessRange: string
}

interface ProfitByThicknessData {
  thicknessMM: number
  totalProfit: number
  formattedTotalProfit: string
  formattedTotalRevenue: string
  formattedProfitMargin: string
  totalQuantitySold: number
  formattedTotalQuantitySold: string
  companies: string[]
  qualities: string[]
}

interface SalesByBrandData {
  company: string
  materialType: string
  quality: string
  totalRevenue: number
  formattedTotalRevenue: string
  formattedTotalQuantitySold: string
  customerCount: number
  invoiceCount: number
  formattedAvgOrderValue: string
  thicknessRange: string
  salesPeriod: string
}

interface FastMovingVariantData {
  thicknessMM: number
  materialType: string
  movementCategory: string
  formattedVelocity: string
  formattedTotalQuantitySold: string
  formattedTotalRevenue: string
  formattedStockDays: string
  stockStatus: string
  companiesList: string
  qualitiesList: string
}

export default function AnalyticsPage() {
  const [activeTab, setActiveTab] = useState('stock-by-company')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<AnalyticsFilters>({
    materialType: 'all',
    company: '',
    quality: 'all',
    startDate: '',
    endDate: '',
    sortBy: '',
    sortOrder: 'desc'
  })

  // Data states
  const [stockByCompanyData, setStockByCompanyData] = useState<{
    summary: any
    companies: StockByCompanyData[]
  } | null>(null)
  
  const [profitByThicknessData, setProfitByThicknessData] = useState<{
    summary: any
    thicknessGroups: ProfitByThicknessData[]
  } | null>(null)
  
  const [salesByBrandData, setSalesByBrandData] = useState<{
    summary: any
    brands: SalesByBrandData[]
  } | null>(null)
  
  const [fastMovingData, setFastMovingData] = useState<{
    summary: any
    thicknesses: FastMovingVariantData[]
    categoryGroups: any[]
  } | null>(null)

  const { t } = useLanguage()
  const { formatCurrency, formatDate } = useFormatting()

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      const queryParams = new URLSearchParams()
      
      // Add filters to query params
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== 'all') queryParams.append(key, value)
      })

      let endpoint = ''
      switch (activeTab) {
        case 'stock-by-company':
          endpoint = 'stock-by-company'
          break
        case 'profit-by-thickness':
          endpoint = 'profit-by-thickness'
          break
        case 'sales-by-brand':
          endpoint = 'sales-by-brand'
          break
        case 'fast-moving-variants':
          endpoint = 'fast-moving-thickness'
          break
        default:
          endpoint = 'stock-by-company'
      }

      const response = await fetch(`http://localhost:3001/api/business-analytics/${endpoint}?${queryParams}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const contentType = response.headers.get('content-type')
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Response is not JSON')
      }

      const result = await response.json()
      if (result.success) {
        switch (activeTab) {
          case 'stock-by-company':
            setStockByCompanyData(result.data)
            break
          case 'profit-by-thickness':
            setProfitByThicknessData(result.data)
            break
          case 'sales-by-brand':
            setSalesByBrandData(result.data)
            break
          case 'fast-moving-variants':
            setFastMovingData(result.data)
            break
        }
      } else {
        setError(result.message || 'Failed to load analytics data')
      }
    } catch (error) {
      console.error('Error loading analytics:', error)
      setError('Failed to load analytics data')
    } finally {
      setLoading(false)
    }
  }, [activeTab, filters])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleFilterChange = (key: keyof AnalyticsFilters, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }))
  }

  const resetFilters = () => {
    setFilters({
      materialType: 'all',
      company: '',
      quality: 'all',
      startDate: '',
      endDate: '',
      sortBy: '',
      sortOrder: 'desc'
    })
  }

  const exportToCSV = (data: any[], filename: string) => {
    if (!data || data.length === 0) return

    const headers = Object.keys(data[0]).filter(key => !key.startsWith('_'))
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header]
          return typeof value === 'string' && value.includes(',') ? `"${value}"` : value
        }).join(',')
      )
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${filename}-${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  }

  const getMovementCategoryBadge = (category: string) => {
    switch (category) {
      case 'Fast Moving':
        return <Badge className="bg-green-100 text-green-800">Fast Moving</Badge>
      case 'Medium Moving':
        return <Badge className="bg-yellow-100 text-yellow-800">Medium Moving</Badge>
      case 'Slow Moving':
        return <Badge className="bg-orange-100 text-orange-800">Slow Moving</Badge>
      case 'Very Slow Moving':
        return <Badge className="bg-red-100 text-red-800">Very Slow Moving</Badge>
      default:
        return <Badge variant="secondary">{category}</Badge>
    }
  }

  const getStockStatusBadge = (status: string) => {
    switch (status) {
      case 'Critical':
        return <Badge className="bg-red-100 text-red-800">Critical</Badge>
      case 'Low':
        return <Badge className="bg-yellow-100 text-yellow-800">Low</Badge>
      case 'Normal':
        return <Badge className="bg-green-100 text-green-800">Normal</Badge>
      case 'High':
        return <Badge className="bg-blue-100 text-blue-800">High</Badge>
      case 'Excess':
        return <Badge className="bg-purple-100 text-purple-800">Excess</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  return (
    <Layout>
      <div className="space-professional">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BarChart3 className="h-6 w-6 text-primary" />
            <div>
              <h1 className="heading-1">ব্যবসায়িক বিশ্লেষণ | Business Analytics</h1>
              <p className="text-muted-foreground">
                Make better decisions with comprehensive business insights
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={resetFilters}>
              <Filter className="h-4 w-4 mr-2" />
              Reset Filters
            </Button>
            <Button variant="outline" onClick={loadData} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <div className="space-y-2">
                <Label htmlFor="materialType">Material Type</Label>
                <Select value={filters.materialType} onValueChange={(value) => handleFilterChange('materialType', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Materials" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Materials</SelectItem>
                    <SelectItem value="Thai">Thai</SelectItem>
                    <SelectItem value="Glass">Glass</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="quality">Quality</Label>
                <Select value={filters.quality} onValueChange={(value) => handleFilterChange('quality', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Qualities" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Qualities</SelectItem>
                    <SelectItem value="Local">Local</SelectItem>
                    <SelectItem value="Imported">Imported</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => handleFilterChange('startDate', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => handleFilterChange('endDate', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="sortOrder">Sort Order</Label>
                <Select value={filters.sortOrder} onValueChange={(value: 'asc' | 'desc') => handleFilterChange('sortOrder', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="desc">Highest First</SelectItem>
                    <SelectItem value="asc">Lowest First</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end">
                <Button onClick={loadData} disabled={loading} className="w-full">
                  Apply Filters
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Analytics Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="stock-by-company" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Stock by Company
            </TabsTrigger>
            <TabsTrigger value="profit-by-thickness" className="flex items-center gap-2">
              <Layers className="h-4 w-4" />
              Profit by Thickness
            </TabsTrigger>
            <TabsTrigger value="sales-by-brand" className="flex items-center gap-2">
              <Award className="h-4 w-4" />
              Sales by Brand
            </TabsTrigger>
            <TabsTrigger value="fast-moving-variants" className="flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Fast-Moving Variants
            </TabsTrigger>
          </TabsList>

          {/* Stock by Company Tab */}
          <TabsContent value="stock-by-company">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    স্টক কোম্পানি অনুযায়ী | Stock by Company
                  </CardTitle>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => stockByCompanyData && exportToCSV(stockByCompanyData.companies, 'stock-by-company')}
                    disabled={!stockByCompanyData}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export CSV
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {stockByCompanyData && (
                  <>
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                      <Card>
                        <CardContent className="pt-6">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-primary">
                              {stockByCompanyData.summary.totalCompanies}
                            </div>
                            <div className="text-sm text-muted-foreground">Companies</div>
                          </div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="pt-6">
                          <div className="text-center">
                            <div className="text-2xl font-bold">
                              {stockByCompanyData.summary.formattedTotalStock}
                            </div>
                            <div className="text-sm text-muted-foreground">Total Stock</div>
                          </div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="pt-6">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-green-600">
                              {stockByCompanyData.summary.formattedTotalValue}
                            </div>
                            <div className="text-sm text-muted-foreground">Stock Value</div>
                          </div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="pt-6">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-blue-600">
                              {stockByCompanyData.summary.formattedProfitMargin}
                            </div>
                            <div className="text-sm text-muted-foreground">Profit Margin</div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Data Table */}
                    <ProfessionalTable>
                      <TableHeader>
                        <tr>
                          <ProfessionalTableHeader>
                            কোম্পানি<br />
                            <span className="text-xs font-normal">Company</span>
                          </ProfessionalTableHeader>
                          <ProfessionalTableHeader>
                            ম্যাটেরিয়াল<br />
                            <span className="text-xs font-normal">Material</span>
                          </ProfessionalTableHeader>
                          <ProfessionalTableHeader>
                            মান<br />
                            <span className="text-xs font-normal">Quality</span>
                          </ProfessionalTableHeader>
                          <ProfessionalTableHeader>
                            স্টক<br />
                            <span className="text-xs font-normal">Stock</span>
                          </ProfessionalTableHeader>
                          <ProfessionalTableHeader>
                            মূল্য<br />
                            <span className="text-xs font-normal">Value</span>
                          </ProfessionalTableHeader>
                          <ProfessionalTableHeader>
                            লাভ<br />
                            <span className="text-xs font-normal">Profit</span>
                          </ProfessionalTableHeader>
                          <ProfessionalTableHeader>
                            পণ্য<br />
                            <span className="text-xs font-normal">Products</span>
                          </ProfessionalTableHeader>
                          <ProfessionalTableHeader>
                            পুরুত্ব<br />
                            <span className="text-xs font-normal">Thickness</span>
                          </ProfessionalTableHeader>
                        </tr>
                      </TableHeader>
                      <TableBody>
                        {stockByCompanyData.companies.map((company, index) => (
                          <ProfessionalTableRow key={`${company.company}-${index}`}>
                            <ProfessionalTableCell>
                              <div className="font-medium">{company.company}</div>
                            </ProfessionalTableCell>
                            <ProfessionalTableCell>
                              <Badge variant="outline">{company.materialType}</Badge>
                            </ProfessionalTableCell>
                            <ProfessionalTableCell>
                              <Badge variant="secondary">{company.quality}</Badge>
                            </ProfessionalTableCell>
                            <ProfessionalTableCell>
                              <span className="font-semibold">{company.formattedTotalStock}</span>
                            </ProfessionalTableCell>
                            <ProfessionalTableCell>
                              <span className="font-semibold text-green-600">{company.formattedTotalValue}</span>
                            </ProfessionalTableCell>
                            <ProfessionalTableCell>
                              <div>
                                <div className="font-semibold">{company.formattedPotentialProfit}</div>
                                <div className="text-sm text-muted-foreground">{company.formattedProfitMargin}</div>
                              </div>
                            </ProfessionalTableCell>
                            <ProfessionalTableCell>
                              <span className="text-center">{company.productCount}</span>
                            </ProfessionalTableCell>
                            <ProfessionalTableCell>
                              <span className="text-sm">{company.thicknessRange}</span>
                            </ProfessionalTableCell>
                          </ProfessionalTableRow>
                        ))}
                      </TableBody>
                    </ProfessionalTable>
                  </>
                )}
                
                {loading && (
                  <div className="flex items-center justify-center h-32">
                    <div className="loading-spinner h-8 w-8"></div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Profit by Thickness Tab */}
          <TabsContent value="profit-by-thickness">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Layers className="h-5 w-5" />
                    পুরুত্ব অনুযায়ী লাভ | Profit by Thickness
                  </CardTitle>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => profitByThicknessData && exportToCSV(profitByThicknessData.thicknessGroups, 'profit-by-thickness')}
                    disabled={!profitByThicknessData}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export CSV
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {profitByThicknessData && (
                  <>
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                      <Card>
                        <CardContent className="pt-6">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-primary">
                              {profitByThicknessData.summary.totalThicknesses}
                            </div>
                            <div className="text-sm text-muted-foreground">Thicknesses</div>
                          </div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="pt-6">
                          <div className="text-center">
                            <div className="text-2xl font-bold">
                              {profitByThicknessData.summary.formattedTotalQuantitySold}
                            </div>
                            <div className="text-sm text-muted-foreground">Total Sold</div>
                          </div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="pt-6">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-green-600">
                              {profitByThicknessData.summary.formattedTotalRevenue}
                            </div>
                            <div className="text-sm text-muted-foreground">Revenue</div>
                          </div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="pt-6">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-blue-600">
                              {profitByThicknessData.summary.formattedOverallProfit}
                            </div>
                            <div className="text-sm text-muted-foreground">Total Profit</div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Data Table */}
                    <ProfessionalTable>
                      <TableHeader>
                        <tr>
                          <ProfessionalTableHeader>
                            পুরুত্ব<br />
                            <span className="text-xs font-normal">Thickness</span>
                          </ProfessionalTableHeader>
                          <ProfessionalTableHeader>
                            বিক্রয়<br />
                            <span className="text-xs font-normal">Sales</span>
                          </ProfessionalTableHeader>
                          <ProfessionalTableHeader>
                            আয়<br />
                            <span className="text-xs font-normal">Revenue</span>
                          </ProfessionalTableHeader>
                          <ProfessionalTableHeader>
                            লাভ<br />
                            <span className="text-xs font-normal">Profit</span>
                          </ProfessionalTableHeader>
                          <ProfessionalTableHeader>
                            লাভের হার<br />
                            <span className="text-xs font-normal">Margin</span>
                          </ProfessionalTableHeader>
                          <ProfessionalTableHeader>
                            কোম্পানি<br />
                            <span className="text-xs font-normal">Companies</span>
                          </ProfessionalTableHeader>
                          <ProfessionalTableHeader>
                            মান<br />
                            <span className="text-xs font-normal">Qualities</span>
                          </ProfessionalTableHeader>
                        </tr>
                      </TableHeader>
                      <TableBody>
                        {profitByThicknessData.thicknessGroups.map((thickness, index) => (
                          <ProfessionalTableRow key={`${thickness.thicknessMM}-${index}`}>
                            <ProfessionalTableCell>
                              <span className="font-semibold text-lg">{thickness.thicknessMM}mm</span>
                            </ProfessionalTableCell>
                            <ProfessionalTableCell>
                              <span className="font-semibold">{thickness.formattedTotalQuantitySold}</span>
                            </ProfessionalTableCell>
                            <ProfessionalTableCell>
                              <span className="font-semibold text-green-600">{thickness.formattedTotalRevenue}</span>
                            </ProfessionalTableCell>
                            <ProfessionalTableCell>
                              <span className="font-semibold text-blue-600">{thickness.formattedTotalProfit}</span>
                            </ProfessionalTableCell>
                            <ProfessionalTableCell>
                              <Badge variant={parseFloat(thickness.formattedProfitMargin) > 30 ? 'default' : parseFloat(thickness.formattedProfitMargin) > 15 ? 'secondary' : 'outline'}>
                                {thickness.formattedProfitMargin}
                              </Badge>
                            </ProfessionalTableCell>
                            <ProfessionalTableCell>
                              <div className="text-sm">
                                {thickness.companies.slice(0, 3).map((company: string, i: number) => (
                                  <Badge key={i} variant="outline" className="mr-1 mb-1 text-xs">
                                    {company}
                                  </Badge>
                                ))}
                                {thickness.companies.length > 3 && (
                                  <span className="text-xs text-muted-foreground">
                                    +{thickness.companies.length - 3} more
                                  </span>
                                )}
                              </div>
                            </ProfessionalTableCell>
                            <ProfessionalTableCell>
                              <div className="text-sm">
                                {thickness.qualities.map((quality: string, i: number) => (
                                  <Badge key={i} variant="secondary" className="mr-1 text-xs">
                                    {quality}
                                  </Badge>
                                ))}
                              </div>
                            </ProfessionalTableCell>
                          </ProfessionalTableRow>
                        ))}
                      </TableBody>
                    </ProfessionalTable>
                  </>
                )}
                
                {loading && (
                  <div className="flex items-center justify-center h-32">
                    <div className="loading-spinner h-8 w-8"></div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Sales by Brand Tab */}
          <TabsContent value="sales-by-brand">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Award className="h-5 w-5" />
                    ব্র্যান্ড অনুযায়ী বিক্রয় | Sales by Brand
                  </CardTitle>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => salesByBrandData && exportToCSV(salesByBrandData.brands, 'sales-by-brand')}
                    disabled={!salesByBrandData}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export CSV
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {salesByBrandData && (
                  <>
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                      <Card>
                        <CardContent className="pt-6">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-primary">
                              {salesByBrandData.summary.totalBrands}
                            </div>
                            <div className="text-sm text-muted-foreground">Brands</div>
                          </div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="pt-6">
                          <div className="text-center">
                            <div className="text-2xl font-bold">
                              {salesByBrandData.summary.formattedTotalQuantitySold}
                            </div>
                            <div className="text-sm text-muted-foreground">Total Sold</div>
                          </div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="pt-6">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-green-600">
                              {salesByBrandData.summary.formattedTotalRevenue}
                            </div>
                            <div className="text-sm text-muted-foreground">Revenue</div>
                          </div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="pt-6">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-blue-600">
                              {salesByBrandData.summary.totalCustomers}
                            </div>
                            <div className="text-sm text-muted-foreground">Customers</div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Data Table */}
                    <ProfessionalTable>
                      <TableHeader>
                        <tr>
                          <ProfessionalTableHeader>
                            ব্র্যান্ড<br />
                            <span className="text-xs font-normal">Brand</span>
                          </ProfessionalTableHeader>
                          <ProfessionalTableHeader>
                            ম্যাটেরিয়াল<br />
                            <span className="text-xs font-normal">Material</span>
                          </ProfessionalTableHeader>
                          <ProfessionalTableHeader>
                            মান<br />
                            <span className="text-xs font-normal">Quality</span>
                          </ProfessionalTableHeader>
                          <ProfessionalTableHeader>
                            বিক্রয়<br />
                            <span className="text-xs font-normal">Sales</span>
                          </ProfessionalTableHeader>
                          <ProfessionalTableHeader>
                            আয়<br />
                            <span className="text-xs font-normal">Revenue</span>
                          </ProfessionalTableHeader>
                          <ProfessionalTableHeader>
                            গ্রাহক<br />
                            <span className="text-xs font-normal">Customers</span>
                          </ProfessionalTableHeader>
                          <ProfessionalTableHeader>
                            অর্ডার<br />
                            <span className="text-xs font-normal">Orders</span>
                          </ProfessionalTableHeader>
                          <ProfessionalTableHeader>
                            পুরুত্ব<br />
                            <span className="text-xs font-normal">Thickness</span>
                          </ProfessionalTableHeader>
                        </tr>
                      </TableHeader>
                      <TableBody>
                        {salesByBrandData.brands.map((brand, index) => (
                          <ProfessionalTableRow key={`${brand.company}-${index}`}>
                            <ProfessionalTableCell>
                              <div className="font-semibold text-lg">{brand.company}</div>
                            </ProfessionalTableCell>
                            <ProfessionalTableCell>
                              <Badge variant="outline">{brand.materialType}</Badge>
                            </ProfessionalTableCell>
                            <ProfessionalTableCell>
                              <Badge variant="secondary">{brand.quality}</Badge>
                            </ProfessionalTableCell>
                            <ProfessionalTableCell>
                              <span className="font-semibold">{brand.formattedTotalQuantitySold}</span>
                            </ProfessionalTableCell>
                            <ProfessionalTableCell>
                              <span className="font-semibold text-green-600">{brand.formattedTotalRevenue}</span>
                            </ProfessionalTableCell>
                            <ProfessionalTableCell>
                              <div className="text-center">
                                <div className="font-semibold">{brand.customerCount}</div>
                                <div className="text-xs text-muted-foreground">customers</div>
                              </div>
                            </ProfessionalTableCell>
                            <ProfessionalTableCell>
                              <div>
                                <div className="font-semibold">{brand.invoiceCount}</div>
                                <div className="text-xs text-muted-foreground">{brand.formattedAvgOrderValue}</div>
                              </div>
                            </ProfessionalTableCell>
                            <ProfessionalTableCell>
                              <span className="text-sm">{brand.thicknessRange}</span>
                            </ProfessionalTableCell>
                          </ProfessionalTableRow>
                        ))}
                      </TableBody>
                    </ProfessionalTable>
                  </>
                )}
                
                {loading && (
                  <div className="flex items-center justify-center h-32">
                    <div className="loading-spinner h-8 w-8"></div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Fast-Moving Variants Tab */}
          <TabsContent value="fast-moving-variants">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5" />
                    দ্রুত বিক্রয় | Fast-Moving Variants
                  </CardTitle>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => fastMovingData && exportToCSV(fastMovingData.thicknesses, 'fast-moving-variants')}
                    disabled={!fastMovingData}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export CSV
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {fastMovingData && (
                  <>
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                      <Card>
                        <CardContent className="pt-6">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-primary">
                              {fastMovingData.summary.totalThicknesses}
                            </div>
                            <div className="text-sm text-muted-foreground">Variants</div>
                          </div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="pt-6">
                          <div className="text-center">
                            <div className="text-2xl font-bold">
                              {fastMovingData.summary.formattedTotalQuantitySold}
                            </div>
                            <div className="text-sm text-muted-foreground">Total Sold</div>
                          </div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="pt-6">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-green-600">
                              {fastMovingData.summary.formattedTotalRevenue}
                            </div>
                            <div className="text-sm text-muted-foreground">Revenue</div>
                          </div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="pt-6">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-blue-600">
                              {fastMovingData.summary.formattedAvgVelocity}
                            </div>
                            <div className="text-sm text-muted-foreground">Avg Velocity</div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Data Table */}
                    <ProfessionalTable>
                      <TableHeader>
                        <tr>
                          <ProfessionalTableHeader>
                            পুরুত্ব<br />
                            <span className="text-xs font-normal">Thickness</span>
                          </ProfessionalTableHeader>
                          <ProfessionalTableHeader>
                            ম্যাটেরিয়াল<br />
                            <span className="text-xs font-normal">Material</span>
                          </ProfessionalTableHeader>
                          <ProfessionalTableHeader>
                            গতি<br />
                            <span className="text-xs font-normal">Movement</span>
                          </ProfessionalTableHeader>
                          <ProfessionalTableHeader>
                            বেগ<br />
                            <span className="text-xs font-normal">Velocity</span>
                          </ProfessionalTableHeader>
                          <ProfessionalTableHeader>
                            বিক্রয়<br />
                            <span className="text-xs font-normal">Sales</span>
                          </ProfessionalTableHeader>
                          <ProfessionalTableHeader>
                            স্টক অবস্থা<br />
                            <span className="text-xs font-normal">Stock Status</span>
                          </ProfessionalTableHeader>
                          <ProfessionalTableHeader>
                            কোম্পানি<br />
                            <span className="text-xs font-normal">Companies</span>
                          </ProfessionalTableHeader>
                        </tr>
                      </TableHeader>
                      <TableBody>
                        {fastMovingData.thicknesses.map((variant, index) => (
                          <ProfessionalTableRow key={`${variant.thicknessMM}-${index}`}>
                            <ProfessionalTableCell>
                              <span className="font-semibold">{variant.thicknessMM}mm</span>
                            </ProfessionalTableCell>
                            <ProfessionalTableCell>
                              <Badge variant="outline">{variant.materialType}</Badge>
                            </ProfessionalTableCell>
                            <ProfessionalTableCell>
                              {getMovementCategoryBadge(variant.movementCategory)}
                            </ProfessionalTableCell>
                            <ProfessionalTableCell>
                              <span className="font-semibold">{variant.formattedVelocity}</span>
                            </ProfessionalTableCell>
                            <ProfessionalTableCell>
                              <div>
                                <div className="font-semibold">{variant.formattedTotalQuantitySold}</div>
                                <div className="text-sm text-muted-foreground">{variant.formattedTotalRevenue}</div>
                              </div>
                            </ProfessionalTableCell>
                            <ProfessionalTableCell>
                              <div>
                                {getStockStatusBadge(variant.stockStatus)}
                                <div className="text-sm text-muted-foreground mt-1">{variant.formattedStockDays}</div>
                              </div>
                            </ProfessionalTableCell>
                            <ProfessionalTableCell>
                              <div className="text-sm">
                                <div><strong>Brands:</strong> {variant.companiesList}</div>
                                <div><strong>Quality:</strong> {variant.qualitiesList}</div>
                              </div>
                            </ProfessionalTableCell>
                          </ProfessionalTableRow>
                        ))}
                      </TableBody>
                    </ProfessionalTable>
                  </>
                )}
                
                {loading && (
                  <div className="flex items-center justify-center h-32">
                    <div className="loading-spinner h-8 w-8"></div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  )
}