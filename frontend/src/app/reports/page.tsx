'use client'

import { API_BASE } from '@/lib/apiBase'
import { useState, useEffect } from 'react'
import Layout from '@/components/Layout'
import { Card, CardBody, CardHeader, Button, Input } from '@heroui/react'
import { useFormatting } from '@/hooks/useFormatting'

interface Filters {
  startDate: string
  endDate: string
  customer: string
  product: string
  category: string
}

interface SalesReport {
  date: string
  invoiceCount: number
  totalSales: number
  totalPaid: number
  totalDue: number
  avgOrderValue: number
  topCustomer: string
  topProduct: string
}

interface ProfitReport {
  period: string
  revenue: number
  costs: number
  netProfit: number
  profitMargin: number
  invoiceCount: number
  avgProfit: number
}

interface ExpenseReport {
  category: string
  amount: number
  percentage: number
  count: number
  avgAmount: number
}

interface ReportData {
  sales: SalesReport[]
  profit: ProfitReport[]
  expenses: ExpenseReport[]
  cashVsDue: any[]
}

export default function ReportsPage() {
  const [loading, setLoading] = useState(true)
  const [reportData, setReportData] = useState<ReportData | null>(null)
  const [showChart, setShowChart] = useState(false)
  const [filters, setFilters] = useState<Filters>({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    customer: '',
    product: '',
    category: 'all'
  })

  const { formatCurrency, formatNumber, formatDate } = useFormatting()

  const processReportData = (salesData: any, profitData: any, expensesData: any, invoicesData: any): ReportData => {
    const sales: SalesReport[] = []
    const profit: ProfitReport[] = []
    const expenses: ExpenseReport[] = []
    const cashVsDue: any[] = []

    return { sales, profit, expenses, cashVsDue }
  }

  useEffect(() => {
    const fetchReportData = async () => {
      setLoading(true)
      try {
        const token = localStorage.getItem('token')
        
        const queryParams = new URLSearchParams({
          startDate: filters.startDate,
          endDate: filters.endDate,
          limit: '1000'
        })
        
        if (filters.customer.trim()) {
          queryParams.append('customer', filters.customer)
        }
        if (filters.product.trim()) {
          queryParams.append('product', filters.product)
        }
        if (filters.category && filters.category !== 'all') {
          queryParams.append('category', filters.category)
        }
        
        const [salesRes, profitRes, expensesRes, invoicesRes] = await Promise.all([
          fetch(`${API_BASE}/api/dashboard/todays-sales`, {
            headers: { 'Authorization': `Bearer ${token}` }
          }),
          fetch(`${API_BASE}/api/profit/dashboard`, {
            headers: { 'Authorization': `Bearer ${token}` }
          }),
          fetch(`${API_BASE}/api/expenses/stats`, {
            headers: { 'Authorization': `Bearer ${token}` }
          }),
          fetch(`${API_BASE}/api/invoices?${queryParams.toString()}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          })
        ])

        const [salesData, profitData, expensesData, invoicesData] = await Promise.all([
          salesRes.ok ? salesRes.json() : { success: false },
          profitRes.ok ? profitRes.json() : { success: false },
          expensesRes.ok ? expensesRes.json() : { success: false },
          invoicesRes.ok ? invoicesRes.json() : { success: false }
        ])

        const processedData = processReportData(salesData, profitData, expensesData, invoicesData)
        setReportData(processedData)
      } catch (error) {
        console.error('Error fetching report data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchReportData()
  }, [filters])

  const handleFilterChange = (key: keyof Filters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const exportReport = (reportType: string) => {
    if (!reportData) return
    
    let csvContent = 'Date,Data\n'
    const data: any[] = []
    
    switch (reportType) {
      case 'sales':
        data.push(...reportData.sales)
        break
      case 'profit':
        data.push(...reportData.profit)
        break
      case 'expenses':
        data.push(...reportData.expenses)
        break
      default:
        return
    }

    data.forEach(row => {
      csvContent += `${Object.values(row).join(',')}\n`
    })

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `${reportType}-report-${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <div className="text-lg">Loading reports...</div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Reports & Analytics</h1>
          <div className="flex space-x-2">
            <Button
              onPress={() => exportReport('sales')}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Export Sales
            </Button>
            <Button
              onPress={() => exportReport('profit')}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
            >
              Export Profit
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
          <div>
            <label className="block text-sm font-medium mb-1">Start Date</label>
            <Input
              type="date"
              value={filters.startDate}
              onChange={(e) => handleFilterChange('startDate', e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">End Date</label>
            <Input
              type="date"
              value={filters.endDate}
              onChange={(e) => handleFilterChange('endDate', e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Customer</label>
            <Input
              type="text"
              value={filters.customer}
              onChange={(e) => handleFilterChange('customer', e.target.value)}
              placeholder="Customer name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Product</label>
            <Input
              type="text"
              value={filters.product}
              onChange={(e) => handleFilterChange('product', e.target.value)}
              placeholder="Product name"
            />
          </div>
        </div>

        {/* Report Content */}
        {reportData && (
          <div className="space-y-6">
            <Card>
              <CardHeader className="flex flex-col items-start gap-1">
                <h3 className="text-lg font-semibold">Sales Report</h3>
              </CardHeader>
              <CardBody>
                <div className="text-center py-8 text-gray-500">
                  Sales data will be displayed here
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardHeader className="flex flex-col items-start gap-1">
                <h3 className="text-lg font-semibold">Profit Report</h3>
              </CardHeader>
              <CardBody>
                <div className="text-center py-8 text-gray-500">
                  Profit data will be displayed here
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardHeader className="flex flex-col items-start gap-1">
                <h3 className="text-lg font-semibold">Cash vs Due Analysis</h3>
              </CardHeader>
              <CardBody>
                <div className="text-center py-8 text-gray-500">
                  Cash vs Due data will be displayed here
                </div>
              </CardBody>
            </Card>
          </div>
        )}
      </div>
    </Layout>
  )
}