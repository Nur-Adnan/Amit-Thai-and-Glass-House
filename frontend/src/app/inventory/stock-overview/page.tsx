'use client'

import { useState, useEffect, useCallback } from 'react'
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
  ProfessionalTable,
  ProfessionalTableHeader,
  ProfessionalTableRow,
  ProfessionalTableCell,
  Table,
  TableBody,
  TableHeader
} from '@/components/ui/professional-table'
import { 
  Package, 
  Search, 
  Filter,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Eye
} from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'
import { useFormatting } from '@/hooks/useFormatting'

interface StockItem {
  _id: string
  name: string
  materialType: 'Thai' | 'Glass'
  company: string
  thicknessMM?: number
  quality: 'Local' | 'Imported' | 'Premium'
  stockQuantity: number
  unit: string
  measurementType: string
  stockStatus: 'In Stock' | 'Low Stock' | 'Out of Stock'
  formattedStockQuantity: string
  sellingPrice: number
  formattedSellingPrice: string
}

interface FilterOptions {
  materialType: string
  company: string
  thickness: string
  lowStockOnly: boolean
}

export default function StockOverviewPage() {
  const [stockItems, setStockItems] = useState<StockItem[]>([])
  const [filteredItems, setFilteredItems] = useState<StockItem[]>([])
  const [companies, setCompanies] = useState<string[]>([])
  const [thicknesses, setThicknesses] = useState<number[]>([])
  const [filters, setFilters] = useState<FilterOptions>({
    materialType: 'all',
    company: 'all',
    thickness: 'all',
    lowStockOnly: false
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  const { t } = useLanguage()
  const { formatCurrency, formatNumber } = useFormatting()

  useEffect(() => {
    fetchStockData()
  }, [])

  const applyFilters = useCallback(() => {
    let filtered = stockItems

    // Material type filter
    if (filters.materialType !== 'all') {
      filtered = filtered.filter(item => item.materialType === filters.materialType)
    }

    // Company filter
    if (filters.company !== 'all') {
      filtered = filtered.filter(item => item.company === filters.company)
    }

    // Thickness filter
    if (filters.thickness !== 'all') {
      const thicknessValue = parseInt(filters.thickness)
      filtered = filtered.filter(item => item.thicknessMM === thicknessValue)
    }

    // Low stock only filter
    if (filters.lowStockOnly) {
      filtered = filtered.filter(item => 
        item.stockStatus === 'Low Stock' || item.stockStatus === 'Out of Stock'
      )
    }

    // Sort by stock status (critical first) then by company and thickness
    filtered.sort((a, b) => {
      // Out of stock first
      if (a.stockStatus === 'Out of Stock' && b.stockStatus !== 'Out of Stock') return -1
      if (b.stockStatus === 'Out of Stock' && a.stockStatus !== 'Out of Stock') return 1
      
      // Low stock second
      if (a.stockStatus === 'Low Stock' && b.stockStatus === 'In Stock') return -1
      if (b.stockStatus === 'Low Stock' && a.stockStatus === 'In Stock') return 1
      
      // Then by company
      const companyCompare = a.company.localeCompare(b.company)
      if (companyCompare !== 0) return companyCompare
      
      // Then by thickness
      const aThickness = a.thicknessMM || 0
      const bThickness = b.thicknessMM || 0
      return aThickness - bThickness
    })

    setFilteredItems(filtered)
  }, [stockItems, filters])

  useEffect(() => {
    applyFilters()
  }, [applyFilters])

  const fetchStockData = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const token = localStorage.getItem('token')
      
      // Fetch all products with stock information
      const response = await fetch('http://localhost:3001/api/products?limit=1000&includeStock=true', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch stock data')
      }

      const data = await response.json()
      
      if (data.success) {
        // Filter only products with variant information (Thai & Glass)
        const variantProducts = data.data.filter((product: StockItem) => 
          product.materialType && ['Thai', 'Glass'].includes(product.materialType) && product.company
        )
        
        setStockItems(variantProducts)
        
        // Extract unique companies and thicknesses for filters
        const uniqueCompanies = Array.from(new Set(variantProducts.map((item: StockItem) => item.company))) as string[]
        const thicknessValues = variantProducts
          .filter((item: StockItem) => item.thicknessMM)
          .map((item: StockItem) => item.thicknessMM as number)
        const uniqueThicknesses = (Array.from(new Set(thicknessValues)) as number[]).sort((a: number, b: number) => a - b)
        
        setCompanies(uniqueCompanies.sort())
        setThicknesses(uniqueThicknesses)
      } else {
        throw new Error(data.message || 'Failed to fetch stock data')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchStockData()
    setRefreshing(false)
  }

  const getStockBadge = (item: StockItem) => {
    if (item.stockStatus === 'Out of Stock') {
      return (
        <Badge className="bg-red-600 text-white border-red-700 font-bold">
          🔴 Out of Stock
        </Badge>
      )
    }

    if (item.stockStatus === 'Low Stock') {
      return (
        <Badge className="bg-red-500 text-white border-red-600 font-bold">
          🔴 Low Stock
        </Badge>
      )
    }

    return (
      <Badge className="bg-green-500 text-white border-green-600 font-bold">
        🟢 Healthy Stock
      </Badge>
    )
  }

  const getStockQuantityDisplay = (item: StockItem) => {
    let className = "font-semibold text-lg"
    
    if (item.stockStatus === 'Out of Stock') {
      className += " text-red-600"
    } else if (item.stockStatus === 'Low Stock') {
      className += " text-red-500"
    } else {
      className += " text-green-600"
    }

    return (
      <span className={className}>
        {formatNumber(item.stockQuantity)} {item.measurementType}
      </span>
    )
  }

  const getThicknessDisplay = (item: StockItem) => {
    if (item.materialType === 'Thai' || !item.thicknessMM) {
      return <span className="text-muted-foreground">-</span>
    }
    return <span className="font-medium">{item.thicknessMM}mm</span>
  }

  const getQualityBadge = (quality: string) => {
    const colors = {
      'Local': 'bg-blue-100 text-blue-800 border-blue-200',
      'Imported': 'bg-purple-100 text-purple-800 border-purple-200',
      'Premium': 'bg-gold-100 text-gold-800 border-gold-200'
    }
    
    return (
      <Badge className={colors[quality as keyof typeof colors] || 'bg-gray-100 text-gray-800'}>
        {quality}
      </Badge>
    )
  }

  if (loading) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="flex items-center gap-3">
              <RefreshCw className="h-6 w-6 animate-spin text-primary" />
              <span>Loading stock overview...</span>
            </div>
          </div>
        </div>
      </Layout>
    )
  }

  if (error) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center text-destructive">
                <AlertTriangle className="h-12 w-12 mx-auto mb-4" />
                <p className="font-medium">Error loading stock overview</p>
                <p className="text-sm text-muted-foreground mt-1">{error}</p>
                <Button onClick={fetchStockData} className="mt-4">
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
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Eye className="h-6 w-6 text-primary" />
            <div>
              <h1 className="heading-1">Stock Overview</h1>
              <p className="text-muted-foreground">
                Quick view of stock by company & thickness
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              onClick={handleRefresh} 
              variant="outline" 
              size="sm"
              disabled={refreshing}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Material Type Filter */}
              <div>
                <label className="text-sm font-medium mb-2 block">Material Type</label>
                <Select 
                  value={filters.materialType} 
                  onValueChange={(value) => setFilters(prev => ({ ...prev, materialType: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Materials" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Materials</SelectItem>
                    <SelectItem value="Thai">Thai Glass</SelectItem>
                    <SelectItem value="Glass">Glass</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Company Filter */}
              <div>
                <label className="text-sm font-medium mb-2 block">Company</label>
                <Select 
                  value={filters.company} 
                  onValueChange={(value) => setFilters(prev => ({ ...prev, company: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Companies" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Companies</SelectItem>
                    {companies.map((company) => (
                      <SelectItem key={company} value={company}>
                        {company}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Thickness Filter */}
              <div>
                <label className="text-sm font-medium mb-2 block">Thickness</label>
                <Select 
                  value={filters.thickness} 
                  onValueChange={(value) => setFilters(prev => ({ ...prev, thickness: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Thickness" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Thickness</SelectItem>
                    {thicknesses.map((thickness) => (
                      <SelectItem key={thickness} value={thickness.toString()}>
                        {thickness}mm
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Low Stock Only Filter */}
              <div>
                <label className="text-sm font-medium mb-2 block">Stock Status</label>
                <Button
                  variant={filters.lowStockOnly ? "default" : "outline"}
                  onClick={() => setFilters(prev => ({ ...prev, lowStockOnly: !prev.lowStockOnly }))}
                  className="w-full h-10"
                >
                  {filters.lowStockOnly ? (
                    <>
                      <AlertTriangle className="h-4 w-4 mr-2" />
                      Low Stock Only
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      All Stock
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stock Overview Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Stock Overview ({filteredItems.length} items)
              </div>
              {filters.lowStockOnly && (
                <Badge className="bg-red-100 text-red-800 border-red-200">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  Critical Stock Only
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredItems.length === 0 ? (
              <div className="text-center py-12">
                <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-lg font-medium text-muted-foreground">No stock items found</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {filters.lowStockOnly 
                    ? "No low stock items match your filters" 
                    : "Try adjusting your filters"
                  }
                </p>
              </div>
            ) : (
              <ProfessionalTable>
                <TableHeader>
                  <tr>
                    <ProfessionalTableHeader>Material</ProfessionalTableHeader>
                    <ProfessionalTableHeader>Company</ProfessionalTableHeader>
                    <ProfessionalTableHeader>Thickness</ProfessionalTableHeader>
                    <ProfessionalTableHeader>Quality</ProfessionalTableHeader>
                    <ProfessionalTableHeader>Stock</ProfessionalTableHeader>
                    <ProfessionalTableHeader>Unit</ProfessionalTableHeader>
                    <ProfessionalTableHeader>Status</ProfessionalTableHeader>
                  </tr>
                </TableHeader>
                <TableBody>
                  {filteredItems.map((item, index) => (
                    <ProfessionalTableRow 
                      key={item._id || `item-${index}`}
                      highlight={
                        item.stockStatus === 'Out of Stock' ? 'danger' :
                        item.stockStatus === 'Low Stock' ? 'warning' : 'none'
                      }
                    >
                      <ProfessionalTableCell>
                        <Badge variant={item.materialType === 'Thai' ? 'default' : 'secondary'}>
                          {item.materialType}
                        </Badge>
                      </ProfessionalTableCell>
                      <ProfessionalTableCell>
                        <span className="font-medium">{item.company}</span>
                      </ProfessionalTableCell>
                      <ProfessionalTableCell>
                        {getThicknessDisplay(item)}
                      </ProfessionalTableCell>
                      <ProfessionalTableCell>
                        {getQualityBadge(item.quality)}
                      </ProfessionalTableCell>
                      <ProfessionalTableCell>
                        {getStockQuantityDisplay(item)}
                      </ProfessionalTableCell>
                      <ProfessionalTableCell>
                        <span className="text-muted-foreground">{item.measurementType}</span>
                      </ProfessionalTableCell>
                      <ProfessionalTableCell>
                        {getStockBadge(item)}
                      </ProfessionalTableCell>
                    </ProfessionalTableRow>
                  ))}
                </TableBody>
              </ProfessionalTable>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  )
}