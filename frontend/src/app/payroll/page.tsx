'use client'

import { useState, useEffect, useCallback } from 'react'
import Layout from '@/components/Layout'

interface Employee {
  _id: string
  employeeId: string
  name: string
  department: string
  position: string
  monthlySalary: number
  isActive: boolean
}

interface SalaryPayment {
  _id: string
  employee: {
    employeeId: string
    name: string
    department: string
  }
  paymentMonth: number
  paymentYear: number
  grossSalary: number
  totalDeductions: number
  netSalary: number
  status: 'due' | 'paid'
  paymentDate?: string
  allowances: {
    hra: number
    transport: number
    medical: number
    other: number
  }
  deductions: {
    pf: number
    esi: number
    tax: number
    advance: number
    other: number
  }
  overtime: {
    hours: number
    rate: number
    amount: number
  }
}

export default function PayrollPage() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [salaryPayments, setSalaryPayments] = useState<SalaryPayment[]>([])
  const [loading, setLoading] = useState(false)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [selectedPayment, setSelectedPayment] = useState<SalaryPayment | null>(null)
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1)
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear())

  // Form state
  const [selectedEmployee, setSelectedEmployee] = useState('')
  const [allowances, setAllowances] = useState({
    hra: 0,
    transport: 0,
    medical: 0,
    other: 0
  })
  const [deductions, setDeductions] = useState({
    pf: 0,
    esi: 0,
    tax: 0,
    advance: 0,
    other: 0
  })
  const [overtime, setOvertime] = useState({
    hours: 0,
    rate: 0
  })
  const [actualWorkingDays, setActualWorkingDays] = useState(30)

  const fetchSalaryPayments = useCallback(async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`http://localhost:3001/api/salary-payments?month=${currentMonth}&year=${currentYear}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      })
      const data = await response.json()
      if (data.success) {
        setSalaryPayments(data.data)
      }
    } catch (error) {
      console.error('Failed to fetch salary payments:', error)
    }
  }, [currentMonth, currentYear])

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const token = localStorage.getItem('token')
        const response = await fetch('http://localhost:3001/api/employees?isActive=true', {
          headers: { 'Authorization': `Bearer ${token}` },
        })
        const data = await response.json()
        if (data.success) {
          setEmployees(data.data)
        }
      } catch (error) {
        console.error('Failed to fetch employees:', error)
      }
    }

    fetchEmployees()
    fetchSalaryPayments()
  }, [currentMonth, currentYear, fetchSalaryPayments])

  const calculateGrossSalary = () => {
    const employee = employees.find(e => e._id === selectedEmployee)
    if (!employee) return 0

    const baseSalary = employee.monthlySalary
    const totalAllowances = Object.values(allowances).reduce((sum, val) => sum + val, 0)
    const overtimeAmount = overtime.hours * overtime.rate

    return baseSalary + totalAllowances + overtimeAmount
  }

  const calculateTotalDeductions = () => {
    return Object.values(deductions).reduce((sum, val) => sum + val, 0)
  }

  const calculateNetSalary = () => {
    return Math.max(0, calculateGrossSalary() - calculateTotalDeductions())
  }

  const handleCreateSalary = async () => {
    if (!selectedEmployee) {
      alert('Please select an employee')
      return
    }

    setLoading(true)
    try {
      const employee = employees.find(e => e._id === selectedEmployee)
      const token = localStorage.getItem('token')
      const response = await fetch('http://localhost:3001/api/salary-payments', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          employeeId: employee?.employeeId,
          paymentMonth: currentMonth,
          paymentYear: currentYear,
          allowances,
          deductions,
          overtime,
          actualWorkingDays
        }),
      })

      const data = await response.json()
      if (data.success) {
        setShowCreateForm(false)
        resetForm()
        fetchSalaryPayments()
        alert('Salary payment created successfully!')
      } else {
        alert(data.message || 'Failed to create salary payment')
      }
    } catch (error) {
      console.error('Failed to create salary payment:', error)
      alert('Failed to create salary payment')
    } finally {
      setLoading(false)
    }
  }

  const handleMarkAsPaid = async (paymentId: string) => {
    if (!confirm('Mark this salary as paid?')) return

    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`http://localhost:3001/api/salary-payments/${paymentId}/pay`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paymentDate: new Date().toISOString().split('T')[0],
          paymentMethod: 'bank_transfer'
        }),
      })

      const data = await response.json()
      if (data.success) {
        fetchSalaryPayments()
        alert('Salary marked as paid successfully!')
      } else {
        alert(data.message || 'Failed to mark salary as paid')
      }
    } catch (error) {
      console.error('Failed to mark salary as paid:', error)
      alert('Failed to mark salary as paid')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setSelectedEmployee('')
    setAllowances({ hra: 0, transport: 0, medical: 0, other: 0 })
    setDeductions({ pf: 0, esi: 0, tax: 0, advance: 0, other: 0 })
    setOvertime({ hours: 0, rate: 0 })
    setActualWorkingDays(30)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount)
  }

  const getStatusColor = (status: string) => {
    return status === 'paid' ? 'status-paid' : 'status-due'
  }

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  const totalGrossSalary = salaryPayments.reduce((sum, payment) => sum + payment.grossSalary, 0)
  const totalNetSalary = salaryPayments.reduce((sum, payment) => sum + payment.netSalary, 0)
  const totalPaid = salaryPayments.filter(p => p.status === 'paid').reduce((sum, payment) => sum + payment.netSalary, 0)
  const totalDue = salaryPayments.filter(p => p.status === 'due').reduce((sum, payment) => sum + payment.netSalary, 0)

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Payroll Management</h1>
            <p className="text-gray-600">Manage employee salaries and payments</p>
          </div>
          <button
            onClick={() => setShowCreateForm(true)}
            className="mt-4 sm:mt-0 btn-primary"
          >
            Create Salary Payment
          </button>
        </div>

        {/* Month/Year Selector */}
        <div className="card">
          <div className="flex items-center space-x-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Month</label>
              <select
                value={currentMonth}
                onChange={(e) => setCurrentMonth(parseInt(e.target.value))}
                className="input-field"
              >
                {monthNames.map((month, index) => (
                  <option key={index} value={index + 1}>{month}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
              <select
                value={currentYear}
                onChange={(e) => setCurrentYear(parseInt(e.target.value))}
                className="input-field"
              >
                {Array.from({ length: 5 }, (_, i) => currentYear - 2 + i).map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="metric-card">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <span className="text-blue-600 text-xl">👥</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Employees</p>
                <p className="text-2xl font-bold text-gray-900">{salaryPayments.length}</p>
              </div>
            </div>
          </div>

          <div className="metric-card">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <span className="text-green-600 text-xl">💰</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Gross</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalGrossSalary)}</p>
              </div>
            </div>
          </div>

          <div className="metric-card">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <span className="text-purple-600 text-xl">✅</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Paid</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(totalPaid)}</p>
              </div>
            </div>
          </div>

          <div className="metric-card">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <span className="text-red-600 text-xl">⏳</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Due</p>
                <p className="text-2xl font-bold text-red-600">{formatCurrency(totalDue)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Salary Payments List */}
        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            {monthNames[currentMonth - 1]} {currentYear} Salary Payments
          </h3>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Employee
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Department
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Gross Salary
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Deductions
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Net Salary
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {salaryPayments.map((payment) => (
                  <tr key={payment._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{payment.employee.name}</div>
                      <div className="text-sm text-gray-500">{payment.employee.employeeId}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {payment.employee.department}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {formatCurrency(payment.grossSalary)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">
                      {formatCurrency(payment.totalDeductions)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                      {formatCurrency(payment.netSalary)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={getStatusColor(payment.status)}>
                        {payment.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <button
                        onClick={() => setSelectedPayment(payment)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        View
                      </button>
                      {payment.status === 'due' && (
                        <button
                          onClick={() => handleMarkAsPaid(payment._id)}
                          className="text-green-600 hover:text-green-900"
                          disabled={loading}
                        >
                          Mark Paid
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {salaryPayments.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <span className="text-4xl mb-4 block">💰</span>
              <p>No salary payments found for {monthNames[currentMonth - 1]} {currentYear}</p>
            </div>
          )}
        </div>

        {/* Create Salary Payment Modal */}
        {showCreateForm && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Create Salary Payment - {monthNames[currentMonth - 1]} {currentYear}
                </h3>
                <button
                  onClick={() => setShowCreateForm(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-6">
                {/* Employee Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Select Employee *</label>
                  <select
                    value={selectedEmployee}
                    onChange={(e) => setSelectedEmployee(e.target.value)}
                    className="input-field"
                  >
                    <option value="">Choose an employee</option>
                    {employees.map((employee) => (
                      <option key={employee._id} value={employee._id}>
                        {employee.name} ({employee.employeeId}) - {employee.department}
                      </option>
                    ))}
                  </select>
                </div>

                {selectedEmployee && (
                  <>
                    {/* Base Salary Display */}
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h4 className="font-medium text-blue-900 mb-2">Base Salary Information</h4>
                      <p className="text-blue-700">
                        Monthly Salary: {formatCurrency(employees.find(e => e._id === selectedEmployee)?.monthlySalary || 0)}
                      </p>
                    </div>

                    {/* Allowances */}
                    <div>
                      <h4 className="font-medium text-gray-900 mb-3">Allowances</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">HRA</label>
                          <input
                            type="number"
                            value={allowances.hra}
                            onChange={(e) => setAllowances({...allowances, hra: parseFloat(e.target.value) || 0})}
                            className="input-field"
                            placeholder="0"
                            step="0.01"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Transport</label>
                          <input
                            type="number"
                            value={allowances.transport}
                            onChange={(e) => setAllowances({...allowances, transport: parseFloat(e.target.value) || 0})}
                            className="input-field"
                            placeholder="0"
                            step="0.01"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Medical</label>
                          <input
                            type="number"
                            value={allowances.medical}
                            onChange={(e) => setAllowances({...allowances, medical: parseFloat(e.target.value) || 0})}
                            className="input-field"
                            placeholder="0"
                            step="0.01"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Other</label>
                          <input
                            type="number"
                            value={allowances.other}
                            onChange={(e) => setAllowances({...allowances, other: parseFloat(e.target.value) || 0})}
                            className="input-field"
                            placeholder="0"
                            step="0.01"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Deductions */}
                    <div>
                      <h4 className="font-medium text-gray-900 mb-3">Deductions</h4>
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">PF</label>
                          <input
                            type="number"
                            value={deductions.pf}
                            onChange={(e) => setDeductions({...deductions, pf: parseFloat(e.target.value) || 0})}
                            className="input-field"
                            placeholder="0"
                            step="0.01"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">ESI</label>
                          <input
                            type="number"
                            value={deductions.esi}
                            onChange={(e) => setDeductions({...deductions, esi: parseFloat(e.target.value) || 0})}
                            className="input-field"
                            placeholder="0"
                            step="0.01"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Tax</label>
                          <input
                            type="number"
                            value={deductions.tax}
                            onChange={(e) => setDeductions({...deductions, tax: parseFloat(e.target.value) || 0})}
                            className="input-field"
                            placeholder="0"
                            step="0.01"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Advance</label>
                          <input
                            type="number"
                            value={deductions.advance}
                            onChange={(e) => setDeductions({...deductions, advance: parseFloat(e.target.value) || 0})}
                            className="input-field"
                            placeholder="0"
                            step="0.01"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Other</label>
                          <input
                            type="number"
                            value={deductions.other}
                            onChange={(e) => setDeductions({...deductions, other: parseFloat(e.target.value) || 0})}
                            className="input-field"
                            placeholder="0"
                            step="0.01"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Overtime */}
                    <div>
                      <h4 className="font-medium text-gray-900 mb-3">Overtime</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Hours</label>
                          <input
                            type="number"
                            value={overtime.hours}
                            onChange={(e) => setOvertime({...overtime, hours: parseFloat(e.target.value) || 0})}
                            className="input-field"
                            placeholder="0"
                            step="0.5"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Rate per Hour</label>
                          <input
                            type="number"
                            value={overtime.rate}
                            onChange={(e) => setOvertime({...overtime, rate: parseFloat(e.target.value) || 0})}
                            className="input-field"
                            placeholder="0"
                            step="0.01"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Working Days */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Actual Working Days</label>
                      <input
                        type="number"
                        value={actualWorkingDays}
                        onChange={(e) => setActualWorkingDays(parseInt(e.target.value) || 30)}
                        className="input-field w-32"
                        placeholder="30"
                        min="1"
                        max="31"
                      />
                    </div>

                    {/* Salary Summary */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-medium text-gray-900 mb-3">Salary Summary</h4>
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                          <p className="text-sm text-gray-600">Gross Salary</p>
                          <p className="text-lg font-semibold text-gray-900">{formatCurrency(calculateGrossSalary())}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Total Deductions</p>
                          <p className="text-lg font-semibold text-red-600">{formatCurrency(calculateTotalDeductions())}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Net Salary</p>
                          <p className="text-xl font-bold text-green-600">{formatCurrency(calculateNetSalary())}</p>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {/* Actions */}
                <div className="flex justify-end space-x-3 pt-4 border-t">
                  <button
                    onClick={() => setShowCreateForm(false)}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateSalary}
                    disabled={loading || !selectedEmployee}
                    className="btn-primary disabled:opacity-50"
                  >
                    {loading ? 'Creating...' : 'Create Salary Payment'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Salary Payment Details Modal */}
        {selectedPayment && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-2xl shadow-lg rounded-md bg-white">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Salary Payment Details</h3>
                <button
                  onClick={() => setSelectedPayment(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Employee</label>
                    <p className="text-sm text-gray-900">{selectedPayment.employee.name}</p>
                    <p className="text-xs text-gray-500">{selectedPayment.employee.employeeId}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Department</label>
                    <p className="text-sm text-gray-900">{selectedPayment.employee.department}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Period</label>
                    <p className="text-sm text-gray-900">
                      {monthNames[selectedPayment.paymentMonth - 1]} {selectedPayment.paymentYear}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Status</label>
                    <span className={getStatusColor(selectedPayment.status)}>
                      {selectedPayment.status.toUpperCase()}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Allowances</h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>HRA:</span>
                        <span>{formatCurrency(selectedPayment.allowances.hra)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Transport:</span>
                        <span>{formatCurrency(selectedPayment.allowances.transport)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Medical:</span>
                        <span>{formatCurrency(selectedPayment.allowances.medical)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Other:</span>
                        <span>{formatCurrency(selectedPayment.allowances.other)}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Deductions</h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>PF:</span>
                        <span>{formatCurrency(selectedPayment.deductions.pf)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>ESI:</span>
                        <span>{formatCurrency(selectedPayment.deductions.esi)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Tax:</span>
                        <span>{formatCurrency(selectedPayment.deductions.tax)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Advance:</span>
                        <span>{formatCurrency(selectedPayment.deductions.advance)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Other:</span>
                        <span>{formatCurrency(selectedPayment.deductions.other)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-sm text-gray-600">Gross Salary</p>
                      <p className="text-lg font-semibold text-gray-900">{formatCurrency(selectedPayment.grossSalary)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Total Deductions</p>
                      <p className="text-lg font-semibold text-red-600">{formatCurrency(selectedPayment.totalDeductions)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Net Salary</p>
                      <p className="text-xl font-bold text-green-600">{formatCurrency(selectedPayment.netSalary)}</p>
                    </div>
                  </div>
                </div>

                {selectedPayment.overtime.hours > 0 && (
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <h4 className="font-medium text-blue-900 mb-1">Overtime</h4>
                    <p className="text-sm text-blue-700">
                      {selectedPayment.overtime.hours} hours × {formatCurrency(selectedPayment.overtime.rate)} = {formatCurrency(selectedPayment.overtime.amount)}
                    </p>
                  </div>
                )}

                {selectedPayment.paymentDate && (
                  <div className="bg-green-50 p-3 rounded-lg">
                    <h4 className="font-medium text-green-900 mb-1">Payment Information</h4>
                    <p className="text-sm text-green-700">
                      Paid on: {new Date(selectedPayment.paymentDate).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}