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
  Tooltip,
  Select,
  SelectItem,
} from '@heroui/react'
import { EmptyState } from '@/components/ui/empty-state'
import { StatusBadge } from '@/components/ui/status-badge'
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
  AlertTriangle, 
  TrendingDown,
  Filter,
  RefreshCw,
  Eye,
  Package2,
  AlertCircle,
  CheckCircle,
  XCircle,
  Plus
} from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'
import { useFormatting } from '@/hooks/useFormatting'

interface Product {
  _id: string
  name: string
  category: 'Thai' | 'Glass'
  stockQuantity: number
  unit: string
  purchasePrice: number
  sellingPrice: number
  stockStatus: 'In Stock' | 'Low Stock' | 'Out of Stock'
  stockValue: string
  formattedPurchasePrice: string
  formattedSellingPrice: string
  profitMargin: string
  profitAmount: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

interface InventoryStats {
  totalProducts: number
  lowStockCount: number
  outOfStockCount: number
  totalStockValue: number
  categories: {
    Thai: { count: number; stockValue: number }
    Glass: { count: number; stockValue: number }
  }
}

export default function InventoryPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [stats, setStats] = useState<InventoryStats | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [stockFilter, setStockFilter] = useState<string>('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  const { t } = useLanguage()
  const { formatCurrency, formatNumber } = useFormatting()

  const fetchInventoryData = useCallback(async () => {
    setLoading(true)
    setError(null)
    
    try {
      const token = localStorage.getItem('token')
      
      // Fetch products
      const productsResponse = await fetch('http://localhost:3001/api/products?limit=1000', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (!productsResponse.ok) {
        throw new Error(`HTTP error! status: ${productsResponse.status}`)
      }
      
      const contentType = productsResponse.headers.get('content-type')
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Response is not JSON')
      }
      
      const productsData = await productsResponse.json()
      
      if (productsData.success && productsData.data && Array.isArray(productsData.data.products)) {
        const products = productsData.data.products
        setProducts(products)
        
        // Calculate summary with safe array operations
        const totalProducts = products.length
        const lowStockCount = products.filter((p: any) => 
          p && typeof p.stockQuantity === 'number' && typeof p.lowStockThreshold === 'number' && 
          p.stockQuantity <= p.lowStockThreshold
        ).length
        const outOfStockCount = products.filter((p: any) => 
          p && typeof p.stockQuantity === 'number' && p.stockQuantity === 0
        ).length
        const totalValue = products.reduce((sum: number, p: any) => {
          if (p && typeof p.stockQuantity === 'number' && typeof p.sellingPrice === 'number') {
            return sum + (p.stockQuantity * p.sellingPrice)
          }
          return sum
        }, 0)
        
        setStats({
          totalProducts,
          lowStockCount,
          outOfStockCount,
          totalStockValue: totalValue,
          categories: {
            Thai: { count: 0, stockValue: 0 },
            Glass: { count: 0, stockValue: 0 }
          }
        })
      } else {
        // Handle case where data structure is unexpected
        console.warn('Unexpected API response structure:', productsData)
        setProducts([])
        setStats({
          totalProducts: 0,
          lowStockCount: 0,
          outOfStockCount: 0,
          totalStockValue: 0,
          categories: {
            Thai: { count: 0, stockValue: 0 },
            Glass: { count: 0, stockValue: 0 }
          }
        })
        setError(productsData.message || 'Invalid data format received from server')
      }
    } catch (error) {
      console.error('Error fetching inventory:', error)
      setError('Failed to fetch inventory data')
    } finally {
      setLoading(false)
    }
  }, [])

  const filterProducts = useCallback(() => {
    // Ensure products is always an array
    const safeProducts = Array.isArray(products) ? products : []
    let filtered = safeProducts

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(product =>
        product && 
        product.name && 
        (product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
         (product.category && product.category.toLowerCase().includes(searchTerm.toLowerCase())))
      )
    }

    // Category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(product => product && product.category === categoryFilter)
    }

    // Stock filter
    if (stockFilter === 'low') {
      filtered = filtered.filter(product => product && product.stockStatus === 'Low Stock')
    } else if (stockFilter === 'out') {
      filtered = filtered.filter(product => product && product.stockStatus === 'Out of Stock')
    }

    setFilteredProducts(filtered)
  }, [products, searchTerm, categoryFilter, stockFilter])

  useEffect(() => {
    fetchInventoryData()
  }, [fetchInventoryData])

  useEffect(() => {
    filterProducts()
  }, [filterProducts])

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchInventoryData()
    setRefreshing(false)
  }

  const getStockBadge = (product: Product) => {
    const { stockStatus, stockQuantity } = product

    if (stockStatus === 'Out of Stock') {
      return (
        <Tooltip
          content={
            <div>
              <p className="font-semibold text-red-600">Critical: No stock available!</p>
              <p>Immediate restocking required</p>
            </div>
          }
        >
          <Chip className="bg-red-600 text-white border-red-700 animate-pulse font-bold text-xs px-3 py-1">
            <XCircle className="h-3 w-3 mr-1" />
            OUT OF STOCK
          </Chip>
        </Tooltip>
      )
    }

    if (stockStatus === 'Low Stock') {
      return (
        <Tooltip
          content={
            <div>
              <p className="font-semibold text-orange-600">Warning: Only {stockQuantity} {product.unit} left!</p>
              <p>Consider restocking soon</p>
            </div>
          }
        >
          <Chip className="bg-orange-500 text-white border-orange-600 animate-pulse font-bold text-xs px-3 py-1">
            <AlertTriangle className="h-3 w-3 mr-1" />
            LOW STOCK
          </Chip>
        </Tooltip>
      )
    }

    return (
      <Chip className="bg-green-100 text-green-800 border-green-200">
        <CheckCircle className="h-3 w-3 mr-1" />
        In Stock
      </Chip>
    )
  }

  const getStockQuantityDisplay = (product: Product) => {
    const { stockQuantity, unit, stockStatus } = product
    
    let className = "font-semibold"
    
    if (stockStatus === 'Out of Stock') {
      className += " text-red-600 text-lg font-bold"
    } else if (stockStatus === 'Low Stock') {
      className += " text-orange-600 text-lg font-bold"
    } else {
      className += " text-green-600"
    }

    return (
      <span className={className}>
        {formatNumber(stockQuantity)} {unit}
      </span>
    )
  }

  if (loading) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="flex items-center gap-3">
              <RefreshCw className="h-6 w-6 animate-spin text-primary" />
              <span>Loading inventory...</span>
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
            <CardBody className="pt-6">
              <div className="text-center text-destructive">
                <AlertCircle className="h-12 w-12 mx-auto mb-4" />
                <p className="font-medium">Error loading inventory</p>
                <p className="text-sm text-muted-foreground mt-1">{error}</p>
                <Button onPress={fetchInventoryData} color="primary" className="mt-4">
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
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Package className="h-6 w-6 text-primary" />
            <div>
              <h1 className="heading-1">Inventory Management</h1>
              <p className="text-muted-foreground">
                Monitor stock levels and prevent stock mistakes
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onPress={() => window.location.href = '/inventory/stock-overview'}
              variant="bordered"
              size="sm"
            >
              <Eye className="h-4 w-4 mr-2" />
              Stock Overview
            </Button>
            <Button
              onPress={() => window.location.href = '/inventory/stock-purchase'}
              color="primary"
              size="sm"
            >
              <Plus className="h-4 w-4 mr-2" />
              Stock Purchase
            </Button>
            <Button
              onPress={() => window.location.href = '/inventory/bd-shop-stock'}
              variant="bordered"
              size="sm"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add BD Shop Stock
            </Button>
            <Button
              onPress={handleRefresh}
              variant="bordered"
              size="sm"
              isDisabled={refreshing}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Critical Alerts */}
        {stats && (stats.lowStockCount > 0 || stats.outOfStockCount > 0) && (
          <Card className="border-red-200 bg-red-50">
            <CardBody className="pt-6">
              <div className="flex items-center gap-3 mb-4">
                <AlertTriangle className="h-6 w-6 text-red-600 animate-pulse" />
                <h3 className="text-lg font-bold text-red-800">STOCK ALERTS</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {stats.outOfStockCount > 0 && (
                  <div className="bg-red-100 border border-red-300 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <XCircle className="h-5 w-5 text-red-600" />
                      <span className="font-bold text-red-800">OUT OF STOCK</span>
                    </div>
                    <p className="text-2xl font-bold text-red-600">{stats.outOfStockCount}</p>
                    <p className="text-sm text-red-700">Products need immediate restocking</p>
                  </div>
                )}
                {stats.lowStockCount > 0 && (
                  <div className="bg-orange-100 border border-orange-300 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="h-5 w-5 text-orange-600" />
                      <span className="font-bold text-orange-800">LOW STOCK</span>
                    </div>
                    <p className="text-2xl font-bold text-orange-600">{stats.lowStockCount}</p>
                    <p className="text-sm text-orange-700">Products running low</p>
                  </div>
                )}
              </div>
            </CardBody>
          </Card>
        )}

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardBody className="pt-6">
                <div className="flex items-center gap-3">
                  <Package2 className="h-8 w-8 text-blue-600" />
                  <div>
                    <p className="text-sm text-muted-foreground">Total Products</p>
                    <p className="text-2xl font-bold">{stats.totalProducts}</p>
                  </div>
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardBody className="pt-6">
                <div className="flex items-center gap-3">
                  <TrendingDown className="h-8 w-8 text-green-600" />
                  <div>
                    <p className="text-sm text-muted-foreground">Stock Value</p>
                    <p className="text-2xl font-bold">{formatCurrency(stats.totalStockValue)}</p>
                  </div>
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardBody className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 font-bold text-sm">T</span>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Thai Products</p>
                    <p className="text-2xl font-bold">{stats.categories.Thai.count}</p>
                    <p className="text-xs text-muted-foreground">{formatCurrency(stats.categories.Thai.stockValue)}</p>
                  </div>
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardBody className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 bg-purple-100 rounded-full flex items-center justify-center">
                    <span className="text-purple-600 font-bold text-sm">G</span>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Glass Products</p>
                    <p className="text-2xl font-bold">{stats.categories.Glass.count}</p>
                    <p className="text-xs text-muted-foreground">{formatCurrency(stats.categories.Glass.stockValue)}</p>
                  </div>
                </div>
              </CardBody>
            </Card>
          </div>
        )}

        {/* Filters */}
        <Card>
          <CardBody className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Search */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground z-10" />
                <Input
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-12"
                />
              </div>

              {/* Category Filter */}
              <Select
                selectedKeys={categoryFilter ? [categoryFilter] : []}
                onSelectionChange={(keys) => setCategoryFilter(Array.from(keys)[0] as string)}
                placeholder="Category"
                aria-label="Category"
                className="w-full sm:w-[180px]"
              >
                <SelectItem key="all">All Categories</SelectItem>
                <SelectItem key="Thai">Thai</SelectItem>
                <SelectItem key="Glass">Glass</SelectItem>
              </Select>

              {/* Stock Filter */}
              <Select
                selectedKeys={stockFilter ? [stockFilter] : []}
                onSelectionChange={(keys) => setStockFilter(Array.from(keys)[0] as string)}
                placeholder="Stock Status"
                aria-label="Stock Status"
                className="w-full sm:w-[180px]"
              >
                <SelectItem key="all">All Stock</SelectItem>
                <SelectItem key="critical">🚨 Critical Only</SelectItem>
                <SelectItem key="out">❌ Out of Stock</SelectItem>
                <SelectItem key="low">⚠️ Low Stock</SelectItem>
              </Select>
            </div>
          </CardBody>
        </Card>

        {/* Inventory Table */}
        <Card>
          <CardHeader className="flex flex-col items-start gap-1">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Package className="h-5 w-5" />
              Inventory List
            </h3>
          </CardHeader>
          <CardBody>
            {filteredProducts.length === 0 ? (
              <EmptyState
                icon={Package}
                title="No products found"
                description={searchTerm ? "Try adjusting your search terms" : "Add your first product to get started"}
                action={{
                  label: "Add Product",
                  onClick: () => window.location.href = '/products/new'
                }}
              />
            ) : (
              <ProfessionalTable>
                <TableHeader>
                  <tr>
                    <ProfessionalTableHeader>Product</ProfessionalTableHeader>
                    <ProfessionalTableHeader>Category</ProfessionalTableHeader>
                    <ProfessionalTableHeader>Stock</ProfessionalTableHeader>
                    <ProfessionalTableHeader>Unit</ProfessionalTableHeader>
                    <ProfessionalTableHeader>Status</ProfessionalTableHeader>
                    <ProfessionalTableHeader>Purchase Price</ProfessionalTableHeader>
                    <ProfessionalTableHeader>Selling Price</ProfessionalTableHeader>
                    <ProfessionalTableHeader>Stock Value</ProfessionalTableHeader>
                  </tr>
                </TableHeader>
                <TableBody>
                  {filteredProducts.map((product, index) => (
                    <ProfessionalTableRow 
                      key={product._id || `product-${index}`}
                      highlight={
                        product.stockStatus === 'Out of Stock' ? 'danger' :
                        product.stockStatus === 'Low Stock' ? 'warning' : 'none'
                      }
                    >
                      <ProfessionalTableCell>
                        <div className="flex items-center gap-2">
                          {(product.stockStatus === 'Out of Stock' || product.stockStatus === 'Low Stock') && (
                            <AlertTriangle className="h-4 w-4 text-red-500 animate-pulse" />
                          )}
                          <span className="font-medium">{product.name}</span>
                        </div>
                      </ProfessionalTableCell>
                      <ProfessionalTableCell>
                        <Chip
                          size="sm"
                          color={product.category === 'Thai' ? 'primary' : 'default'}
                          variant="flat"
                        >
                          {product.category}
                        </Chip>
                      </ProfessionalTableCell>
                      <ProfessionalTableCell>
                        {getStockQuantityDisplay(product)}
                      </ProfessionalTableCell>
                      <ProfessionalTableCell>
                        <span className="text-muted-foreground">{product.unit}</span>
                      </ProfessionalTableCell>
                      <ProfessionalTableCell>
                        <StatusBadge 
                          status={
                            product.stockStatus === 'In Stock' ? 'in-stock' :
                            product.stockStatus === 'Low Stock' ? 'low-stock' : 'out-of-stock'
                          }
                          animate={product.stockStatus !== 'In Stock'}
                        />
                      </ProfessionalTableCell>
                      <ProfessionalTableCell>
                        <span className="font-medium">{product.formattedPurchasePrice}</span>
                      </ProfessionalTableCell>
                      <ProfessionalTableCell>
                        <span className="font-medium">{product.formattedSellingPrice}</span>
                      </ProfessionalTableCell>
                      <ProfessionalTableCell>
                        <span className="font-semibold">
                          {formatCurrency(product.stockQuantity * product.purchasePrice)}
                        </span>
                      </ProfessionalTableCell>
                    </ProfessionalTableRow>
                  ))}
                </TableBody>
              </ProfessionalTable>
            )}
          </CardBody>
        </Card>
      </div>
    </Layout>
  )
}