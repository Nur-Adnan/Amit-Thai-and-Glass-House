'use client'

import { useState, useEffect, useCallback } from 'react'
import Layout from '@/components/Layout'
import {
  Card,
  CardBody,
  CardHeader,
  Button,
  Input,
  Chip,
  Select,
  SelectItem,
  Tabs,
  Tab,
} from '@heroui/react'
import {
  DollarSign,
  Plus,
  Check,
  AlertTriangle,
  Calendar,
  User,
  Receipt,
  CreditCard,
  Building,
  RefreshCw,
  TrendingUp,
  TrendingDown
} from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'
import { useFormatting } from '@/hooks/useFormatting'

interface Expense {
  _id: string
  expenseId: string
  title: string
  amount: number
  category: string
  expenseDate: string
  paymentMethod: string
  status: 'pending' | 'approved' | 'rejected'
  createdAt: string
}

interface SalaryPayment {
  _id: string
  employee: {
    _id: string
    name: string
    employeeId: string
  }
  paymentMonth: number
  paymentYear: number
  netSalary: number
  status: 'due' | 'paid'
  paymentDate?: string
  createdAt: string
}

interface FinanceStats {
  expenses: {
    total: number
    thisMonth: number
    pending: number
  }
  salaries: {
    total: number
    thisMonth: number
    due: number
  }
}

export default function FinancePage() {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [salaries, setSalaries] = useState<SalaryPayment[]>([])
  const [stats, setStats] = useState<FinanceStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')

  // Form states
  const [expenseForm, setExpenseForm] = useState({
    title: '',
    amount: '',
    category: '',
    expenseDate: new Date().toISOString().split('T')[0],
    paymentMethod: 'cash',
    description: ''
  })

  const [salaryForm, setSalaryForm] = useState({
    employee: '',
    baseSalary: '',
    paymentMonth: new Date().getMonth() + 1,
    paymentYear: new Date().getFullYear(),
    paymentMethod: 'bank_transfer'
  })

  const { t } = useLanguage()
  const { formatCurrency, formatDate } = useFormatting()

  const expenseCategories = [
    'Office Rent',
    'Utilities',
    'Equipment',
    'Marketing',
    'Travel',
    'Supplies',
    'Maintenance',
    'Insurance',
    'Professional Services',
    'Other'
  ]

  const paymentMethods = [
    { value: 'cash', label: 'Cash' },
    { value: 'bank_transfer', label: 'Bank Transfer' },
    { value: 'card', label: 'Card' },
    { value: 'cheque', label: 'Cheque' }
  ]

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  const fetchFinanceData = useCallback(async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('token')

      // Fetch expenses
      const expensesResponse = await fetch('http://localhost:3001/api/expenses?limit=50', {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      // Fetch salary payments
      const salariesResponse = await fetch('http://localhost:3001/api/salary-payments?limit=50', {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      let expensesList: Expense[] = []
      let salariesList: SalaryPayment[] = []

      if (expensesResponse.ok) {
        const expensesData = await expensesResponse.json()
        if (expensesData.success && Array.isArray(expensesData.data)) {
          expensesList = expensesData.data
          setExpenses(expensesList)
        }
      }

      if (salariesResponse.ok) {
        const salariesData = await salariesResponse.json()
        if (salariesData.success && Array.isArray(salariesData.data)) {
          salariesList = salariesData.data
          setSalaries(salariesList)
        }
      }

      // Calculate stats with guaranteed arrays
      calculateStats(expensesList, salariesList)
    } catch (error) {
      console.error('Error fetching finance data:', error)
      // Set empty arrays and calculate stats even on error
      setExpenses([])
      setSalaries([])
      calculateStats([], [])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchFinanceData()
  }, [fetchFinanceData])

  const calculateStats = (expenseList: Expense[], salaryList: SalaryPayment[]) => {
    // Ensure we have arrays to work with
    const safeExpenseList = Array.isArray(expenseList) ? expenseList : []
    const safeSalaryList = Array.isArray(salaryList) ? salaryList : []

    const currentMonth = new Date().getMonth() + 1
    const currentYear = new Date().getFullYear()

    const expenseStats = {
      total: safeExpenseList.reduce((sum, exp) => sum + (exp.amount || 0), 0),
      thisMonth: safeExpenseList
        .filter(exp => {
          if (!exp.expenseDate) return false
          const expDate = new Date(exp.expenseDate)
          return expDate.getMonth() + 1 === currentMonth && expDate.getFullYear() === currentYear
        })
        .reduce((sum, exp) => sum + (exp.amount || 0), 0),
      pending: safeExpenseList.filter(exp => exp.status === 'pending').length
    }

    const salaryStats = {
      total: safeSalaryList.reduce((sum, sal) => sum + (sal.netSalary || 0), 0),
      thisMonth: safeSalaryList
        .filter(sal => sal.paymentMonth === currentMonth && sal.paymentYear === currentYear)
        .reduce((sum, sal) => sum + (sal.netSalary || 0), 0),
      due: safeSalaryList.filter(sal => sal.status === 'due').length
    }

    setStats({ expenses: expenseStats, salaries: salaryStats })
  }

  const handleExpenseSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const token = localStorage.getItem('token')
      const response = await fetch('http://localhost:3001/api/expenses', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...expenseForm,
          amount: parseFloat(expenseForm.amount)
        })
      })

      if (response.ok) {
        setExpenseForm({
          title: '',
          amount: '',
          category: '',
          expenseDate: new Date().toISOString().split('T')[0],
          paymentMethod: 'cash',
          description: ''
        })
        fetchFinanceData()
      }
    } catch (error) {
      console.error('Error creating expense:', error)
    } finally {
      setSubmitting(false)
    }
  }

  const handleSalarySubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const token = localStorage.getItem('token')
      const response = await fetch('http://localhost:3001/api/salary-payments', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...salaryForm,
          baseSalary: parseFloat(salaryForm.baseSalary)
        })
      })

      if (response.ok) {
        setSalaryForm({
          employee: '',
          baseSalary: '',
          paymentMonth: new Date().getMonth() + 1,
          paymentYear: new Date().getFullYear(),
          paymentMethod: 'bank_transfer'
        })
        fetchFinanceData()
      }
    } catch (error) {
      console.error('Error creating salary payment:', error)
    } finally {
      setSubmitting(false)
    }
  }

  const getStatusIcon = (status: string, type: 'expense' | 'salary') => {
    if (type === 'salary') {
      return status === 'paid' ? (
        <Check className="h-4 w-4 text-green-600" />
      ) : (
        <AlertTriangle className="h-4 w-4 text-orange-600" />
      )
    } else {
      return status === 'approved' ? (
        <Check className="h-4 w-4 text-green-600" />
      ) : status === 'pending' ? (
        <AlertTriangle className="h-4 w-4 text-orange-600" />
      ) : (
        <AlertTriangle className="h-4 w-4 text-red-600" />
      )
    }
  }

  const getStatusBadge = (status: string, type: 'expense' | 'salary') => {
    if (type === 'salary') {
      return status === 'paid' ? (
        <Chip className="bg-green-100 text-green-800 border-green-200">
          <Check className="h-3 w-3 mr-1" />
          Paid
        </Chip>
      ) : (
        <Chip className="bg-orange-100 text-orange-800 border-orange-200">
          <AlertTriangle className="h-3 w-3 mr-1" />
          Due
        </Chip>
      )
    } else {
      return status === 'approved' ? (
        <Chip className="bg-green-100 text-green-800 border-green-200">
          <Check className="h-3 w-3 mr-1" />
          Approved
        </Chip>
      ) : status === 'pending' ? (
        <Chip className="bg-orange-100 text-orange-800 border-orange-200">
          <AlertTriangle className="h-3 w-3 mr-1" />
          Pending
        </Chip>
      ) : (
        <Chip className="bg-red-100 text-red-800 border-red-200">
          <AlertTriangle className="h-3 w-3 mr-1" />
          Rejected
        </Chip>
      )
    }
  }

  // Group entries by month
  const groupByMonth = (items: any[], dateField: string) => {
    // Ensure we have an array to work with
    const safeItems = Array.isArray(items) ? items : []

    const grouped = safeItems.reduce((acc: Record<string, any[]>, item: any) => {
      // Check if item and dateField exist
      if (!item || !item[dateField]) return acc

      try {
        const date = new Date(item[dateField])
        // Check if date is valid
        if (isNaN(date.getTime())) return acc

        const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`

        if (!acc[monthYear]) {
          acc[monthYear] = []
        }
        acc[monthYear].push(item)
      } catch (error) {
        console.warn('Error processing date for grouping:', error)
      }

      return acc
    }, {} as Record<string, any[]>)

    return Object.keys(grouped)
      .sort((a, b) => b.localeCompare(a))
      .map(monthYear => ({
        monthYear,
        items: grouped[monthYear]
      }))
  }

  if (loading) {
    return (
      <Layout>
        <div className="w-full">
          <div className="flex items-center justify-center h-64">
            <RefreshCw className="h-6 w-6 animate-spin text-primary mr-2" />
            <span>Loading finance data...</span>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="w-full space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <DollarSign className="h-6 w-6 text-primary" />
            <div>
              <h1 className="heading-1">Finance Management</h1>
              <p className="text-muted-foreground">Simple expense and payroll entry</p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardBody className="pt-6">
                <div className="flex items-center gap-3">
                  <TrendingDown className="h-8 w-8 text-red-600" />
                  <div>
                    <p className="text-sm text-muted-foreground">Total Expenses</p>
                    <p className="text-2xl font-bold text-red-600">{formatCurrency(stats.expenses.total)}</p>
                  </div>
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardBody className="pt-6">
                <div className="flex items-center gap-3">
                  <TrendingUp className="h-8 w-8 text-blue-600" />
                  <div>
                    <p className="text-sm text-muted-foreground">Total Salaries</p>
                    <p className="text-2xl font-bold text-blue-600">{formatCurrency(stats.salaries.total)}</p>
                  </div>
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardBody className="pt-6">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="h-8 w-8 text-orange-600" />
                  <div>
                    <p className="text-sm text-muted-foreground">Pending Expenses</p>
                    <p className="text-2xl font-bold text-orange-600">{stats.expenses.pending}</p>
                  </div>
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardBody className="pt-6">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="h-8 w-8 text-orange-600" />
                  <div>
                    <p className="text-sm text-muted-foreground">Due Salaries</p>
                    <p className="text-2xl font-bold text-orange-600">{stats.salaries.due}</p>
                  </div>
                </div>
              </CardBody>
            </Card>
          </div>
        )}

        {/* Main Content */}
        <Tabs
          aria-label="Finance sections"
          selectedKey={activeTab}
          onSelectionChange={(key) => setActiveTab(String(key))}
        >
          {/* Overview Tab */}
          <Tab key="overview" title="Overview" className="space-y-6">
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {/* Recent Expenses */}
              <Card>
                <CardHeader className="flex flex-col items-start gap-1">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Receipt className="h-5 w-5" />
                    Recent Expenses
                  </h3>
                </CardHeader>
                <CardBody>
                  <div className="space-y-4">
                    {Array.isArray(expenses) && expenses.length > 0 ? (
                      groupByMonth(expenses.slice(0, 10), 'expenseDate').map(group => (
                        <div key={group.monthYear}>
                          <h4 className="font-semibold text-sm text-muted-foreground mb-2">
                            {new Date(group.monthYear + '-01').toLocaleDateString('en-US', {
                              month: 'long',
                              year: 'numeric'
                            })}
                          </h4>
                          <div className="space-y-2">
                            {group.items.map((expense) => (
                              <div key={expense._id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                                <div className="flex items-center gap-3">
                                  {getStatusIcon(expense.status, 'expense')}
                                  <div>
                                    <p className="font-medium">{expense.title || 'Untitled Expense'}</p>
                                    <p className="text-sm text-muted-foreground">{expense.category || 'No Category'}</p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className="font-semibold">{formatCurrency(expense.amount || 0)}</p>
                                  {getStatusBadge(expense.status, 'expense')}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <Receipt className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No expenses found</p>
                      </div>
                    )}
                  </div>
                </CardBody>
              </Card>

              {/* Recent Salaries */}
              <Card>
                <CardHeader className="flex flex-col items-start gap-1">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Recent Salaries
                  </h3>
                </CardHeader>
                <CardBody>
                  <div className="space-y-4">
                    {Array.isArray(salaries) && salaries.length > 0 ? (
                      groupByMonth(salaries.slice(0, 10), 'createdAt').map(group => (
                        <div key={group.monthYear}>
                          <h4 className="font-semibold text-sm text-muted-foreground mb-2">
                            {new Date(group.monthYear + '-01').toLocaleDateString('en-US', {
                              month: 'long',
                              year: 'numeric'
                            })}
                          </h4>
                          <div className="space-y-2">
                            {group.items.map((salary) => (
                              <div key={salary._id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                                <div className="flex items-center gap-3">
                                  {getStatusIcon(salary.status, 'salary')}
                                  <div>
                                    <p className="font-medium">{salary.employee?.name || 'Unknown Employee'}</p>
                                    <p className="text-sm text-muted-foreground">
                                      {months[salary.paymentMonth - 1] || 'Unknown Month'} {salary.paymentYear}
                                    </p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className="font-semibold">{formatCurrency(salary.netSalary || 0)}</p>
                                  {getStatusBadge(salary.status, 'salary')}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No salary payments found</p>
                      </div>
                    )}
                  </div>
                </CardBody>
              </Card>
            </div>
          </Tab>

          {/* Add Expense Tab */}
          <Tab key="add-expense" title="Add Expense">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader className="flex flex-col items-start gap-1">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Plus className="h-5 w-5" />
                    Add New Expense
                  </h3>
                </CardHeader>
                <CardBody>
                  <form onSubmit={handleExpenseSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Input
                        id="expense-title"
                        label="Expense Title"
                        value={expenseForm.title}
                        onChange={(e) => setExpenseForm({...expenseForm, title: e.target.value})}
                        placeholder="Enter expense title"
                        isRequired
                      />
                    </div>

                    <div className="space-y-2">
                      <Input
                        id="expense-amount"
                        label="Amount"
                        type="number"
                        step="0.01"
                        value={expenseForm.amount}
                        onChange={(e) => setExpenseForm({...expenseForm, amount: e.target.value})}
                        placeholder="0.00"
                        isRequired
                      />
                    </div>

                    <div className="space-y-2">
                      <Select
                        label="Category"
                        placeholder="Select category"
                        selectedKeys={expenseForm.category ? [expenseForm.category] : []}
                        onSelectionChange={(keys) => setExpenseForm({...expenseForm, category: Array.from(keys)[0] as string})}
                      >
                        {expenseCategories.map(category => (
                          <SelectItem key={category}>{category}</SelectItem>
                        ))}
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Input
                        id="expense-date"
                        label="Date"
                        type="date"
                        value={expenseForm.expenseDate}
                        onChange={(e) => setExpenseForm({...expenseForm, expenseDate: e.target.value})}
                        isRequired
                      />
                    </div>

                    <div className="space-y-2">
                      <Select
                        label="Payment Method"
                        selectedKeys={expenseForm.paymentMethod ? [expenseForm.paymentMethod] : []}
                        onSelectionChange={(keys) => setExpenseForm({...expenseForm, paymentMethod: Array.from(keys)[0] as string})}
                      >
                        {paymentMethods.map(method => (
                          <SelectItem key={method.value}>{method.label}</SelectItem>
                        ))}
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Input
                        id="expense-description"
                        label="Description (Optional)"
                        value={expenseForm.description}
                        onChange={(e) => setExpenseForm({...expenseForm, description: e.target.value})}
                        placeholder="Additional details"
                      />
                    </div>

                    <Button type="submit" isDisabled={submitting} className="w-full">
                      {submitting ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Adding Expense...
                        </>
                      ) : (
                        <>
                          <Plus className="h-4 w-4 mr-2" />
                          Add Expense
                        </>
                      )}
                    </Button>
                  </form>
                </CardBody>
              </Card>

              {/* Recent Expenses Preview */}
              <Card>
                <CardHeader className="flex flex-col items-start gap-1">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Receipt className="h-5 w-5" />
                    Recent Expenses Preview
                  </h3>
                </CardHeader>
                <CardBody>
                  <div className="space-y-3">
                    {Array.isArray(expenses) && expenses.length > 0 ? (
                      expenses.slice(0, 5).map((expense) => (
                        <div key={expense._id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                          <div className="flex items-center gap-3">
                            {getStatusIcon(expense.status, 'expense')}
                            <div>
                              <p className="font-medium text-sm">{expense.title || 'Untitled Expense'}</p>
                              <p className="text-xs text-muted-foreground">{expense.category || 'No Category'}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-sm">{formatCurrency(expense.amount || 0)}</p>
                            {getStatusBadge(expense.status, 'expense')}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <Receipt className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No expenses yet</p>
                      </div>
                    )}
                  </div>
                </CardBody>
              </Card>
            </div>
          </Tab>

          {/* Add Salary Tab */}
          <Tab key="add-salary" title="Add Salary">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader className="flex flex-col items-start gap-1">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Plus className="h-5 w-5" />
                    Add Salary Payment
                  </h3>
                </CardHeader>
                <CardBody>
                  <form onSubmit={handleSalarySubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Input
                        id="salary-employee"
                        label="Employee"
                        value={salaryForm.employee}
                        onChange={(e) => setSalaryForm({...salaryForm, employee: e.target.value})}
                        placeholder="Employee ID or Name"
                        isRequired
                      />
                    </div>

                    <div className="space-y-2">
                      <Input
                        id="salary-amount"
                        label="Base Salary"
                        type="number"
                        step="0.01"
                        value={salaryForm.baseSalary}
                        onChange={(e) => setSalaryForm({...salaryForm, baseSalary: e.target.value})}
                        placeholder="0.00"
                        isRequired
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Select
                          label="Month"
                          selectedKeys={[salaryForm.paymentMonth.toString()]}
                          onSelectionChange={(keys) => setSalaryForm({...salaryForm, paymentMonth: parseInt(Array.from(keys)[0] as string)})}
                        >
                          {months.map((month, index) => (
                            <SelectItem key={(index + 1).toString()}>{month}</SelectItem>
                          ))}
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Select
                          label="Year"
                          selectedKeys={[salaryForm.paymentYear.toString()]}
                          onSelectionChange={(keys) => setSalaryForm({...salaryForm, paymentYear: parseInt(Array.from(keys)[0] as string)})}
                        >
                          {[2024, 2025, 2026].map(year => (
                            <SelectItem key={year.toString()}>{year.toString()}</SelectItem>
                          ))}
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Select
                        label="Payment Method"
                        selectedKeys={salaryForm.paymentMethod ? [salaryForm.paymentMethod] : []}
                        onSelectionChange={(keys) => setSalaryForm({...salaryForm, paymentMethod: Array.from(keys)[0] as string})}
                      >
                        <SelectItem key="bank_transfer">Bank Transfer</SelectItem>
                        <SelectItem key="cash">Cash</SelectItem>
                        <SelectItem key="cheque">Cheque</SelectItem>
                      </Select>
                    </div>

                    <Button type="submit" isDisabled={submitting} className="w-full">
                      {submitting ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Adding Salary...
                        </>
                      ) : (
                        <>
                          <Plus className="h-4 w-4 mr-2" />
                          Add Salary Payment
                        </>
                      )}
                    </Button>
                  </form>
                </CardBody>
              </Card>

              {/* Recent Salaries Preview */}
              <Card>
                <CardHeader className="flex flex-col items-start gap-1">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Recent Salaries Preview
                  </h3>
                </CardHeader>
                <CardBody>
                  <div className="space-y-3">
                    {Array.isArray(salaries) && salaries.length > 0 ? (
                      salaries.slice(0, 5).map((salary) => (
                        <div key={salary._id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                          <div className="flex items-center gap-3">
                            {getStatusIcon(salary.status, 'salary')}
                            <div>
                              <p className="font-medium text-sm">{salary.employee?.name || 'Unknown Employee'}</p>
                              <p className="text-xs text-muted-foreground">
                                {months[salary.paymentMonth - 1] || 'Unknown Month'} {salary.paymentYear}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-sm">{formatCurrency(salary.netSalary || 0)}</p>
                            {getStatusBadge(salary.status, 'salary')}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <User className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No salary payments yet</p>
                      </div>
                    )}
                  </div>
                </CardBody>
              </Card>
            </div>
          </Tab>
        </Tabs>
      </div>
    </Layout>
  )
}
