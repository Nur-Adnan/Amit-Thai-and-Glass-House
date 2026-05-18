'use client'

import { useState, useEffect, useCallback } from 'react'
import Layout from '@/components/Layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  Users, 
  Search, 
  AlertTriangle, 
  TrendingUp,
  Filter,
  RefreshCw,
  Phone,
  CreditCard,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  UserX,
  Shield
} from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'
import { useFormatting } from '@/hooks/useFormatting'

interface Customer {
  _id: string
  customerId: string
  name: string
  phone?: string
  email?: string
  customerType: 'regular' | 'walk-in' | 'corporate' | 'vip'
  totalDue: number
  formattedTotalDue: string
  creditLimit: number
  formattedCreditLimit: string
  creditUtilization: number
  creditAvailable: number
  formattedCreditAvailable: string
  dueAging: {
    current: number
    days0to30: number
    days31to60: number
    days60plus: number
  }
  formattedDueAging: {
    current: string
    days0to30: string
    days31to60: string
    days60plus: string
    total: string
  }
  creditStatus: 'good' | 'warning' | 'blocked' | 'overdue'
  creditRisk: 'low' | 'medium' | 'high' | 'overdue' | 'over-limit' | 'no-limit'
  creditRiskBadge: {
    text: string
    class: string
  }
  canCreateInvoice: boolean
  invoiceBlockReason?: string
  lastCreditReview: string
  isActive: boolean
  createdAt: string
}

interface CustomerStats {
  totalCustomers: number
  totalDueAmount: number
  formattedTotalDueAmount: string
  currentDue: number
  days0to30: number
  days31to60: number
  days60plus: number
  overLimitCustomers: number
  blockedCustomers: number
  overdueCustomers: number
  agingPercentages: {
    current: number
    days0to30: number
    days31to60: number
    days60plus: number
  }
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([])
  const [stats, setStats] = useState<CustomerStats | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [riskFilter, setRiskFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  const { t } = useLanguage()
  const { formatCurrency, formatNumber, formatDate } = useFormatting()

  const filterCustomers = useCallback(() => {
    let filtered = customers

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(customer =>
        customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (customer.phone && customer.phone.includes(searchTerm)) ||
        (customer.email && customer.email.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    }

    // Risk filter
    if (riskFilter !== 'all') {
      filtered = filtered.filter(customer => customer.creditRisk === riskFilter)
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(customer => customer.creditStatus === statusFilter)
    }

    setFilteredCustomers(filtered)
  }, [customers, searchTerm, riskFilter, statusFilter])

  useEffect(() => {
    fetchCustomerData()
  }, [])

  useEffect(() => {
    filterCustomers()
  }, [filterCustomers])

  const fetchCustomerData = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const token = localStorage.getItem('token')
      
      // Fetch due aging report which includes customer data and stats
      const response = await fetch('http://localhost:3001/api/customer-credit/due-aging?includeZeroDue=true&limit=1000', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch customer data')
      }

      const data = await response.json()
      
      if (data.success) {
        setCustomers(data.data.customers)
        setStats(data.data.summary)
      } else {
        throw new Error(data.message || 'Failed to fetch customer data')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchCustomerData()
    setRefreshing(false)
  }

  const getRiskBadge = (customer: Customer) => {
    const { creditRisk, creditStatus } = customer

    if (creditRisk === 'over-limit') {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <Badge className="bg-red-600 text-white border-red-700 animate-pulse font-bold text-xs px-3 py-1">
                <XCircle className="h-3 w-3 mr-1" />
                OVER LIMIT
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p className="font-semibold text-red-600">Critical: Credit limit exceeded!</p>
              <p>Due: {customer.formattedTotalDue} | Limit: {customer.formattedCreditLimit}</p>
              <p>Invoice creation blocked</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )
    }

    if (creditRisk === 'overdue' || creditStatus === 'overdue') {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <Badge className="bg-red-500 text-white border-red-600 animate-pulse font-bold text-xs px-3 py-1">
                <Clock className="h-3 w-3 mr-1" />
                OVERDUE
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p className="font-semibold text-red-600">Overdue payments detected!</p>
              <p>60+ days: {customer.formattedDueAging.days60plus}</p>
              <p>Immediate collection required</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )
    }

    if (creditStatus === 'blocked') {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <Badge className="bg-red-700 text-white border-red-800 font-bold text-xs px-3 py-1">
                <UserX className="h-3 w-3 mr-1" />
                BLOCKED
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p className="font-semibold text-red-600">Customer blocked!</p>
              <p>Reason: {customer.invoiceBlockReason}</p>
              <p>Contact management to unblock</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )
    }

    if (creditRisk === 'high') {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <Badge className="bg-orange-500 text-white border-orange-600 font-bold text-xs px-3 py-1">
                <AlertTriangle className="h-3 w-3 mr-1" />
                HIGH RISK
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p className="font-semibold text-orange-600">High credit utilization!</p>
              <p>Utilization: {customer.creditUtilization}%</p>
              <p>Monitor closely</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )
    }

    if (creditRisk === 'medium') {
      return (
        <Badge className="bg-yellow-500 text-white border-yellow-600 text-xs px-3 py-1">
          <AlertCircle className="h-3 w-3 mr-1" />
          Medium Risk
        </Badge>
      )
    }

    return (
      <Badge className="bg-green-100 text-green-800 border-green-200 text-xs px-3 py-1">
        <CheckCircle className="h-3 w-3 mr-1" />
        Low Risk
      </Badge>
    )
  }

  const getDueAgingDisplay = (customer: Customer) => {
    const { dueAging, formattedDueAging } = customer
    
    if (customer.totalDue === 0) {
      return (
        <div className="text-sm text-muted-foreground">
          No outstanding dues
        </div>
      )
    }

    return (
      <div className="space-y-1">
        {dueAging.current > 0 && (
          <div className="flex justify-between text-xs">
            <span className="text-blue-600">Current:</span>
            <span className="font-medium text-blue-600">{formattedDueAging.current}</span>
          </div>
        )}
        {dueAging.days0to30 > 0 && (
          <div className="flex justify-between text-xs">
            <span className="text-green-600">0-30 days:</span>
            <span className="font-medium text-green-600">{formattedDueAging.days0to30}</span>
          </div>
        )}
        {dueAging.days31to60 > 0 && (
          <div className="flex justify-between text-xs">
            <span className="text-orange-600">31-60 days:</span>
            <span className="font-medium text-orange-600">{formattedDueAging.days31to60}</span>
          </div>
        )}
        {dueAging.days60plus > 0 && (
          <div className="flex justify-between text-xs">
            <span className="text-red-600 font-bold animate-pulse">60+ days:</span>
            <span className="font-bold text-red-600 animate-pulse">{formattedDueAging.days60plus}</span>
          </div>
        )}
      </div>
    )
  }

  const getTotalDueDisplay = (customer: Customer) => {
    let className = "font-semibold text-lg"
    
    if (customer.creditRisk === 'over-limit' || customer.creditRisk === 'overdue') {
      className += " text-red-600 animate-pulse"
    } else if (customer.creditRisk === 'high') {
      className += " text-orange-600"
    } else if (customer.totalDue > 0) {
      className += " text-blue-600"
    } else {
      className += " text-green-600"
    }

    return (
      <span className={className}>
        {customer.formattedTotalDue}
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
              <span>Loading customers...</span>
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
                <AlertCircle className="h-12 w-12 mx-auto mb-4" />
                <p className="font-medium">Error loading customers</p>
                <p className="text-sm text-muted-foreground mt-1">{error}</p>
                <Button onClick={fetchCustomerData} className="mt-4">
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
            <Users className="h-6 w-6 text-primary" />
            <div>
              <h1 className="heading-1">Customer Management</h1>
              <p className="text-muted-foreground">
                Control risky dues and monitor customer credit
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

        {/* Critical Alerts */}
        {stats && (stats.blockedCustomers > 0 || stats.overdueCustomers > 0 || stats.overLimitCustomers > 0) && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 mb-4">
                <AlertTriangle className="h-6 w-6 text-red-600 animate-pulse" />
                <h3 className="text-lg font-bold text-red-800">CUSTOMER RISK ALERTS</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {stats.overLimitCustomers > 0 && (
                  <div className="bg-red-100 border border-red-300 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <XCircle className="h-5 w-5 text-red-600" />
                      <span className="font-bold text-red-800">OVER LIMIT</span>
                    </div>
                    <p className="text-2xl font-bold text-red-600">{stats.overLimitCustomers}</p>
                    <p className="text-sm text-red-700">Customers exceeded credit limit</p>
                  </div>
                )}
                {stats.overdueCustomers > 0 && (
                  <div className="bg-red-100 border border-red-300 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="h-5 w-5 text-red-600" />
                      <span className="font-bold text-red-800">OVERDUE</span>
                    </div>
                    <p className="text-2xl font-bold text-red-600">{stats.overdueCustomers}</p>
                    <p className="text-sm text-red-700">Customers with overdue payments</p>
                  </div>
                )}
                {stats.blockedCustomers > 0 && (
                  <div className="bg-red-100 border border-red-300 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <UserX className="h-5 w-5 text-red-600" />
                      <span className="font-bold text-red-800">BLOCKED</span>
                    </div>
                    <p className="text-2xl font-bold text-red-600">{stats.blockedCustomers}</p>
                    <p className="text-sm text-red-700">Customers blocked from new invoices</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <Users className="h-8 w-8 text-blue-600" />
                  <div>
                    <p className="text-sm text-muted-foreground">Total Customers</p>
                    <p className="text-2xl font-bold">{stats.totalCustomers}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <DollarSign className="h-8 w-8 text-red-600" />
                  <div>
                    <p className="text-sm text-muted-foreground">Total Outstanding</p>
                    <p className="text-2xl font-bold text-red-600">{stats.formattedTotalDueAmount}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <Clock className="h-8 w-8 text-orange-600" />
                  <div>
                    <p className="text-sm text-muted-foreground">60+ Days Overdue</p>
                    <p className="text-2xl font-bold text-orange-600">{formatCurrency(stats.days60plus)}</p>
                    <p className="text-xs text-muted-foreground">{stats.agingPercentages.days60plus}% of total</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <Shield className="h-8 w-8 text-green-600" />
                  <div>
                    <p className="text-sm text-muted-foreground">Current Due</p>
                    <p className="text-2xl font-bold text-green-600">{formatCurrency(stats.currentDue)}</p>
                    <p className="text-xs text-muted-foreground">{stats.agingPercentages.current}% of total</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Search */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search customers by name, ID, phone, or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-12"
                />
              </div>
              
              {/* Risk Filter */}
              <Select value={riskFilter} onValueChange={setRiskFilter}>
                <SelectTrigger className="w-full sm:w-[180px] h-12">
                  <SelectValue placeholder="Risk Level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Risk Levels</SelectItem>
                  <SelectItem value="critical">🚨 Critical Only</SelectItem>
                  <SelectItem value="over-limit">❌ Over Limit</SelectItem>
                  <SelectItem value="overdue">⏰ Overdue</SelectItem>
                  <SelectItem value="high">⚠️ High Risk</SelectItem>
                  <SelectItem value="medium">🟡 Medium Risk</SelectItem>
                  <SelectItem value="low">✅ Low Risk</SelectItem>
                </SelectContent>
              </Select>

              {/* Status Filter */}
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[180px] h-12">
                  <SelectValue placeholder="Credit Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="blocked">🚫 Blocked</SelectItem>
                  <SelectItem value="overdue">⏰ Overdue</SelectItem>
                  <SelectItem value="warning">⚠️ Warning</SelectItem>
                  <SelectItem value="good">✅ Good</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Customer Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Customer List
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredCustomers.length === 0 ? (
              <EmptyState
                icon={Users}
                title="No customers found"
                description={searchTerm ? "Try adjusting your search terms" : "Add your first customer to get started"}
                action={{
                  label: "Add Customer",
                  onClick: () => window.location.href = '/customers/new'
                }}
              />
            ) : (
              <ProfessionalTable>
                <TableHeader>
                  <tr>
                    <ProfessionalTableHeader>Customer</ProfessionalTableHeader>
                    <ProfessionalTableHeader icon={Phone}>Phone</ProfessionalTableHeader>
                    <ProfessionalTableHeader icon={DollarSign}>Total Due</ProfessionalTableHeader>
                    <ProfessionalTableHeader icon={CreditCard}>Credit Limit</ProfessionalTableHeader>
                    <ProfessionalTableHeader>Due Aging</ProfessionalTableHeader>
                    <ProfessionalTableHeader>Risk Status</ProfessionalTableHeader>
                  </tr>
                </TableHeader>
                <TableBody>
                  {filteredCustomers.map((customer, index) => (
                    <ProfessionalTableRow 
                      key={customer._id || `customer-${index}`}
                      highlight={
                        customer.creditRisk === 'over-limit' || customer.creditRisk === 'overdue' ? 'danger' :
                        customer.creditRisk === 'high' ? 'warning' : 'none'
                      }
                    >
                      <ProfessionalTableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            {(customer.creditRisk === 'over-limit' || customer.creditRisk === 'overdue' || customer.creditStatus === 'blocked') && (
                              <AlertTriangle className="h-4 w-4 text-red-500 animate-pulse" />
                            )}
                            <span className="font-medium">{customer.name}</span>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {customer.customerId}
                          </div>
                          <Badge variant={customer.customerType === 'corporate' ? 'default' : 'secondary'} className="text-xs">
                            {customer.customerType}
                          </Badge>
                        </div>
                      </ProfessionalTableCell>
                      <ProfessionalTableCell>
                        {customer.phone ? (
                          <div className="flex items-center gap-1">
                            <Phone className="h-3 w-3 text-muted-foreground" />
                            <span className="text-sm">{customer.phone}</span>
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">-</span>
                        )}
                      </ProfessionalTableCell>
                      <ProfessionalTableCell>
                        {getTotalDueDisplay(customer)}
                      </ProfessionalTableCell>
                      <ProfessionalTableCell>
                        <div className="space-y-1">
                          <div className="font-medium">{customer.formattedCreditLimit}</div>
                          {customer.creditLimit > 0 && (
                            <div className="text-xs text-muted-foreground">
                              {customer.creditUtilization}% used
                            </div>
                          )}
                        </div>
                      </ProfessionalTableCell>
                      <ProfessionalTableCell>
                        {getDueAgingDisplay(customer)}
                      </ProfessionalTableCell>
                      <ProfessionalTableCell>
                        {getRiskBadge(customer)}
                        {!customer.canCreateInvoice && (
                          <div className="mt-1">
                            <StatusBadge status="blocked" size="sm" />
                          </div>
                        )}
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