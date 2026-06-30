'use client'

import { useState, useEffect, useCallback } from 'react'
import Layout from '@/components/Layout'
import {
  Card,
  CardHeader,
  CardBody,
  Button,
  Input,
  Chip,
  Tabs,
  Tab,
  Select,
  SelectItem,
} from '@heroui/react'
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
        return <Chip size="sm" className="bg-green-100 text-green-800">Fast Moving</Chip>
      case 'Medium Moving':
        return <Chip size="sm" className="bg-yellow-100 text-yellow-800">Medium Moving</Chip>
      case 'Slow Moving':
        return <Chip size="sm" className="bg-orange-100 text-orange-800">Slow Moving</Chip>
      case 'Very Slow Moving':
        return <Chip size="sm" className="bg-red-100 text-red-800">Very Slow Moving</Chip>
      default:
        return <Chip size="sm" color="default" variant="flat">{category}</Chip>
    }
  }

  const getStockStatusBadge = (status: string) => {
    switch (status) {
      case 'Critical':
        return <Chip size="sm" className="bg-red-100 text-red-800">Critical</Chip>
      case 'Low':
        return <Chip size="sm" className="bg-yellow-100 text-yellow-800">Low</Chip>
      case 'Normal':
        return <Chip size="sm" className="bg-green-100 text-green-800">Normal</Chip>
      case 'High':
        return <Chip size="sm" className="bg-blue-100 text-blue-800">High</Chip>
      case 'Excess':
        return <Chip size="sm" className="bg-purple-100 text-purple-800">Excess</Chip>
      default:
        return <Chip size="sm" color="default" variant="flat">{status}</Chip>
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
            <Button variant="bordered" onPress={resetFilters}>
              <Filter className="h-4 w-4 mr-2" />
              Reset Filters
            </Button>
            <Button variant="bordered" onPress={loadData} isDisabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader className="flex flex-col items-start gap-1">
            <h3 className="text-sm font-semibold">Filters</h3>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <div className="space-y-2">
                <Select
                  label="Material Type"
                  selectedKeys={filters.materialType ? [filters.materialType] : []}
                  onSelectionChange={(keys) => handleFilterChange('materialType', Array.from(keys)[0] as string)}
                  placeholder="All Materials"
                >
                  <SelectItem key="all">All Materials</SelectItem>
                  <SelectItem key="Thai">Thai</SelectItem>
                  <SelectItem key="Glass">Glass</SelectItem>
                </Select>
              </div>

              <div className="space-y-2">
                <Select
                  label="Quality"
                  selectedKeys={filters.quality ? [filters.quality] : []}
                  onSelectionChange={(keys) => handleFilterChange('quality', Array.from(keys)[0] as string)}
                  placeholder="All Qualities"
                >
                  <SelectItem key="all">All Qualities</SelectItem>
                  <SelectItem key="Local">Local</SelectItem>
                  <SelectItem key="Imported">Imported</SelectItem>
                </Select>
              </div>

              <div className="space-y-2">
                <Input
                  id="startDate"
                  label="Start Date"
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => handleFilterChange('startDate', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Input
                  id="endDate"
                  label="End Date"
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => handleFilterChange('endDate', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Select
                  label="Sort Order"
                  selectedKeys={filters.sortOrder ? [filters.sortOrder] : []}
                  onSelectionChange={(keys) => handleFilterChange('sortOrder', Array.from(keys)[0] as string)}
                >
                  <SelectItem key="desc">Highest First</SelectItem>
                  <SelectItem key="asc">Lowest First</SelectItem>
                </Select>
              </div>

              <div className="flex items-end">
                <Button color="primary" onPress={loadData} isDisabled={loading} className="w-full">
                  Apply Filters
                </Button>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Analytics Tabs */}
        <Tabs
          selectedKey={activeTab}
          onSelectionChange={(key) => setActiveTab(String(key))}
          aria-label="Business analytics views"
        >
          {/* Stock by Company Tab */}
          <Tab
            key="stock-by-company"
            title={
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Stock by Company
              </div>
            }
          >
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between w-full">
                  <h3 className="flex items-center gap-2 text-lg font-semibold">
                    <Building2 className="h-5 w-5" />
                    স্টক কোম্পানি অনুযায়ী | Stock by Company
                  </h3>
                  <Button
                    variant="bordered"
                    size="sm"
                    onPress={() => stockByCompanyData && exportToCSV(stockByCompanyData.companies, 'stock-by-company')}
                    isDisabled={!stockByCompanyData}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export CSV
                  </Button>
                </div>
              </CardHeader>
              <CardBody>
                {stockByCompanyData && (
                  <>
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                      <Card>
                        <CardBody className="pt-6">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-primary">
                              {stockByCompanyData.summary.totalCompanies}
                            </div>
                            <div className="text-sm text-muted-foreground">Companies</div>
                          </div>
                        </CardBody>
                      </Card>
                      <Card>
                        <CardBody className="pt-6">
                          <div className="text-center">
                            <div className="text-2xl font-bold">
                              {stockByCompanyData.summary.formattedTotalStock}
                            </div>
                            <div className="text-sm text-muted-foreground">Total Stock</div>
                          </div>
                        </CardBody>
                      </Card>
                      <Card>
                        <CardBody className="pt-6">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-green-600">
                              {stockByCompanyData.summary.formattedTotalValue}
                            </div>
                            <div className="text-sm text-muted-foreground">Stock Value</div>
                          </div>
                        </CardBody>
                      </Card>
                      <Card>
                        <CardBody className="pt-6">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-blue-600">
                              {stockByCompanyData.summary.formattedProfitMargin}
                            </div>
                            <div className="text-sm text-muted-foreground">Profit Margin</div>
                          </div>
                        </CardBody>
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
                              <Chip size="sm" variant="bordered">{company.materialType}</Chip>
                            </ProfessionalTableCell>
                            <ProfessionalTableCell>
                              <Chip size="sm" color="default" variant="flat">{company.quality}</Chip>
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
              </CardBody>
            </Card>
          </Tab>

          {/* Profit by Thickness Tab */}
          <Tab
            key="profit-by-thickness"
            title={
              <div className="flex items-center gap-2">
                <Layers className="h-4 w-4" />
                Profit by Thickness
              </div>
            }
          >
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between w-full">
                  <h3 className="flex items-center gap-2 text-lg font-semibold">
                    <Layers className="h-5 w-5" />
                    পুরুত্ব অনুযায়ী লাভ | Profit by Thickness
                  </h3>
                  <Button
                    variant="bordered"
                    size="sm"
                    onPress={() => profitByThicknessData && exportToCSV(profitByThicknessData.thicknessGroups, 'profit-by-thickness')}
                    isDisabled={!profitByThicknessData}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export CSV
                  </Button>
                </div>
              </CardHeader>
              <CardBody>
                {profitByThicknessData && (
                  <>
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                      <Card>
                        <CardBody className="pt-6">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-primary">
                              {profitByThicknessData.summary.totalThicknesses}
                            </div>
                            <div className="text-sm text-muted-foreground">Thicknesses</div>
                          </div>
                        </CardBody>
                      </Card>
                      <Card>
                        <CardBody className="pt-6">
                          <div className="text-center">
                            <div className="text-2xl font-bold">
                              {profitByThicknessData.summary.formattedTotalQuantitySold}
                            </div>
                            <div className="text-sm text-muted-foreground">Total Sold</div>
                          </div>
                        </CardBody>
                      </Card>
                      <Card>
                        <CardBody className="pt-6">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-green-600">
                              {profitByThicknessData.summary.formattedTotalRevenue}
                            </div>
                            <div className="text-sm text-muted-foreground">Revenue</div>
                          </div>
                        </CardBody>
                      </Card>
                      <Card>
                        <CardBody className="pt-6">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-blue-600">
                              {profitByThicknessData.summary.formattedOverallProfit}
                            </div>
                            <div className="text-sm text-muted-foreground">Total Profit</div>
                          </div>
                        </CardBody>
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
                              {parseFloat(thickness.formattedProfitMargin) > 30 ? (
                                <Chip size="sm" color="primary" variant="flat">{thickness.formattedProfitMargin}</Chip>
                              ) : parseFloat(thickness.formattedProfitMargin) > 15 ? (
                                <Chip size="sm" color="default" variant="flat">{thickness.formattedProfitMargin}</Chip>
                              ) : (
                                <Chip size="sm" variant="bordered">{thickness.formattedProfitMargin}</Chip>
                              )}
                            </ProfessionalTableCell>
                            <ProfessionalTableCell>
                              <div className="text-sm">
                                {thickness.companies.slice(0, 3).map((company: string, i: number) => (
                                  <Chip key={i} size="sm" variant="bordered" className="mr-1 mb-1 text-xs">
                                    {company}
                                  </Chip>
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
                                  <Chip key={i} size="sm" color="default" variant="flat" className="mr-1 text-xs">
                                    {quality}
                                  </Chip>
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
              </CardBody>
            </Card>
          </Tab>

          {/* Sales by Brand Tab */}
          <Tab
            key="sales-by-brand"
            title={
              <div className="flex items-center gap-2">
                <Award className="h-4 w-4" />
                Sales by Brand
              </div>
            }
          >
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between w-full">
                  <h3 className="flex items-center gap-2 text-lg font-semibold">
                    <Award className="h-5 w-5" />
                    ব্র্যান্ড অনুযায়ী বিক্রয় | Sales by Brand
                  </h3>
                  <Button
                    variant="bordered"
                    size="sm"
                    onPress={() => salesByBrandData && exportToCSV(salesByBrandData.brands, 'sales-by-brand')}
                    isDisabled={!salesByBrandData}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export CSV
                  </Button>
                </div>
              </CardHeader>
              <CardBody>
                {salesByBrandData && (
                  <>
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                      <Card>
                        <CardBody className="pt-6">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-primary">
                              {salesByBrandData.summary.totalBrands}
                            </div>
                            <div className="text-sm text-muted-foreground">Brands</div>
                          </div>
                        </CardBody>
                      </Card>
                      <Card>
                        <CardBody className="pt-6">
                          <div className="text-center">
                            <div className="text-2xl font-bold">
                              {salesByBrandData.summary.formattedTotalQuantitySold}
                            </div>
                            <div className="text-sm text-muted-foreground">Total Sold</div>
                          </div>
                        </CardBody>
                      </Card>
                      <Card>
                        <CardBody className="pt-6">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-green-600">
                              {salesByBrandData.summary.formattedTotalRevenue}
                            </div>
                            <div className="text-sm text-muted-foreground">Revenue</div>
                          </div>
                        </CardBody>
                      </Card>
                      <Card>
                        <CardBody className="pt-6">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-blue-600">
                              {salesByBrandData.summary.totalCustomers}
                            </div>
                            <div className="text-sm text-muted-foreground">Customers</div>
                          </div>
                        </CardBody>
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
                              <Chip size="sm" variant="bordered">{brand.materialType}</Chip>
                            </ProfessionalTableCell>
                            <ProfessionalTableCell>
                              <Chip size="sm" color="default" variant="flat">{brand.quality}</Chip>
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
              </CardBody>
            </Card>
          </Tab>

          {/* Fast-Moving Variants Tab */}
          <Tab
            key="fast-moving-variants"
            title={
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4" />
                Fast-Moving Variants
              </div>
            }
          >
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between w-full">
                  <h3 className="flex items-center gap-2 text-lg font-semibold">
                    <Zap className="h-5 w-5" />
                    দ্রুত বিক্রয় | Fast-Moving Variants
                  </h3>
                  <Button
                    variant="bordered"
                    size="sm"
                    onPress={() => fastMovingData && exportToCSV(fastMovingData.thicknesses, 'fast-moving-variants')}
                    isDisabled={!fastMovingData}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export CSV
                  </Button>
                </div>
              </CardHeader>
              <CardBody>
                {fastMovingData && (
                  <>
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                      <Card>
                        <CardBody className="pt-6">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-primary">
                              {fastMovingData.summary.totalThicknesses}
                            </div>
                            <div className="text-sm text-muted-foreground">Variants</div>
                          </div>
                        </CardBody>
                      </Card>
                      <Card>
                        <CardBody className="pt-6">
                          <div className="text-center">
                            <div className="text-2xl font-bold">
                              {fastMovingData.summary.formattedTotalQuantitySold}
                            </div>
                            <div className="text-sm text-muted-foreground">Total Sold</div>
                          </div>
                        </CardBody>
                      </Card>
                      <Card>
                        <CardBody className="pt-6">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-green-600">
                              {fastMovingData.summary.formattedTotalRevenue}
                            </div>
                            <div className="text-sm text-muted-foreground">Revenue</div>
                          </div>
                        </CardBody>
                      </Card>
                      <Card>
                        <CardBody className="pt-6">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-blue-600">
                              {fastMovingData.summary.formattedAvgVelocity}
                            </div>
                            <div className="text-sm text-muted-foreground">Avg Velocity</div>
                          </div>
                        </CardBody>
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
                              <Chip size="sm" variant="bordered">{variant.materialType}</Chip>
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
              </CardBody>
            </Card>
          </Tab>
        </Tabs>
      </div>
    </Layout>
  )
}