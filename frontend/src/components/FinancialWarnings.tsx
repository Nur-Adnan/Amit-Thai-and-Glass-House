'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Button } from '@heroui/react'
import { useLanguage } from '@/contexts/LanguageContext'
import { useFormatting } from '@/hooks/useFormatting'

interface Alert {
  type: string
  severity: 'high' | 'medium' | 'low'
  title: string
  message: string
  value: number
  threshold: number
  recommendation: string
}

interface Warning {
  type: string
  severity: 'high' | 'medium' | 'low'
  title: string
  message: string
  value: number
  threshold?: number
  recommendation: string
  customers?: Array<{ name: string; due: string }>
}

interface Recommendation {
  type: string
  priority: 'high' | 'medium' | 'low'
  title: string
  description: string
  expectedImpact: string
}

interface FinancialAnalytics {
  period: {
    startDate: string
    endDate: string
    days: number
  }
  salesOverview: {
    totalSales: { amount: number; formatted: string }
    totalPaid: { amount: number; formatted: string }
    totalDue: { amount: number; formatted: string }
    cashSalesPercentage: number
    dueSalesPercentage: number
  }
  warningSignals: {
    alerts: Alert[]
    warnings: Warning[]
    recommendations: Recommendation[]
    summary: {
      totalAlerts: number
      totalWarnings: number
      overallRiskLevel: 'high' | 'medium' | 'low'
    }
  }
  trends: {
    sales: { current: number; previous: number; trend: number; direction: 'up' | 'down' }
    cashCollection: { current: number; previous: number; trend: number; direction: 'up' | 'down' }
    dueAmount: { current: number; previous: number; trend: number; direction: 'up' | 'down' }
  }
}

interface FinancialWarningsProps {
  className?: string
  period?: string
}

const FinancialWarnings: React.FC<FinancialWarningsProps> = ({ className = '', period = '30' }) => {
  const { t, language } = useLanguage()
  const { formatCurrency, formatNumber } = useFormatting()
  const [analytics, setAnalytics] = useState<FinancialAnalytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  const fetchAnalytics = useCallback(async () => {
    try {
      setError(null)
      const token = localStorage.getItem('token')
      const response = await fetch(`http://localhost:3001/api/financial-analytics/overview?period=${period}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      const data = await response.json()
      
      if (data.success) {
        setAnalytics(data.data)
      } else {
        throw new Error(data.message || 'Failed to fetch analytics')
      }
    } catch (error) {
      console.error('Failed to fetch financial analytics:', error)
      setError(error instanceof Error ? error.message : 'Failed to load financial data')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [period])

  useEffect(() => {
    fetchAnalytics()
  }, [fetchAnalytics])

  const handleRefresh = () => {
    setRefreshing(true)
    fetchAnalytics()
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'text-red-800 bg-red-50 border-red-200'
      case 'medium': return 'text-yellow-800 bg-yellow-50 border-yellow-200'
      case 'low': return 'text-blue-800 bg-blue-50 border-blue-200'
      default: return 'text-gray-800 bg-gray-50 border-gray-200'
    }
  }

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'high': return '🚨'
      case 'medium': return '⚠️'
      case 'low': return 'ℹ️'
      default: return '📊'
    }
  }

  const getTrendIcon = (direction: string, isPositive: boolean = true) => {
    if (direction === 'up') {
      return isPositive ? '📈' : '📉'
    } else {
      return isPositive ? '📉' : '📈'
    }
  }

  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-4">
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className}`}>
        <div className="text-center">
          <div className="text-red-600 text-4xl mb-4">⚠️</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {language === 'bn' ? 'ডেটা লোড করতে ব্যর্থ' : 'Failed to Load Data'}
          </h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button
            onPress={handleRefresh}
            color="primary"
          >
            {language === 'bn' ? 'পুনরায় চেষ্টা করুন' : 'Try Again'}
          </Button>
        </div>
      </div>
    )
  }

  if (!analytics) return null

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header with Refresh */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">
            {language === 'bn' ? 'আর্থিক সতর্কতা সংকেত' : 'Financial Warning Signals'}
          </h2>
          <p className="text-sm text-gray-600">
            {language === 'bn' 
              ? `গত ${analytics.period.days} দিনের বিশ্লেষণ`
              : `Analysis for last ${analytics.period.days} days`
            }
          </p>
        </div>
        <Button
          onPress={handleRefresh}
          isDisabled={refreshing}
          variant="flat"
          size="sm"
        >
          {refreshing ? '🔄' : '🔄'} {language === 'bn' ? 'রিফ্রেশ' : 'Refresh'}
        </Button>
      </div>

      {/* Overall Risk Level */}
      <div className={`p-4 rounded-lg border ${getSeverityColor(analytics.warningSignals.summary.overallRiskLevel)}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">{getSeverityIcon(analytics.warningSignals.summary.overallRiskLevel)}</span>
            <div>
              <h3 className="font-medium">
                {language === 'bn' ? 'সামগ্রিক ঝুঁকির মাত্রা' : 'Overall Risk Level'}
              </h3>
              <p className="text-sm capitalize">
                {analytics.warningSignals.summary.overallRiskLevel === 'high' 
                  ? (language === 'bn' ? 'উচ্চ' : 'High')
                  : analytics.warningSignals.summary.overallRiskLevel === 'medium'
                  ? (language === 'bn' ? 'মধ্যম' : 'Medium')
                  : (language === 'bn' ? 'নিম্ন' : 'Low')
                }
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-600">
              {analytics.warningSignals.summary.totalAlerts} {language === 'bn' ? 'সতর্কতা' : 'Alerts'} • 
              {analytics.warningSignals.summary.totalWarnings} {language === 'bn' ? 'সতর্কতা' : 'Warnings'}
            </div>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">
                {language === 'bn' ? 'নগদ বিক্রয়' : 'Cash Sales'}
              </p>
              <p className="text-2xl font-bold text-green-600">
                {formatNumber(analytics.salesOverview.cashSalesPercentage)}%
              </p>
            </div>
            <div className="text-3xl">💰</div>
          </div>
          <div className="mt-2 flex items-center text-sm">
            <span className={`mr-1 ${analytics.trends.cashCollection.direction === 'up' ? 'text-green-600' : 'text-red-600'}`}>
              {getTrendIcon(analytics.trends.cashCollection.direction, true)}
            </span>
            <span className={analytics.trends.cashCollection.direction === 'up' ? 'text-green-600' : 'text-red-600'}>
              {formatNumber(Math.abs(analytics.trends.cashCollection.trend))}%
            </span>
            <span className="text-gray-500 ml-1">
              {language === 'bn' ? 'গত সময়ের তুলনায়' : 'vs last period'}
            </span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">
                {language === 'bn' ? 'বাকি বিক্রয়' : 'Due Sales'}
              </p>
              <p className="text-2xl font-bold text-orange-600">
                {formatNumber(analytics.salesOverview.dueSalesPercentage)}%
              </p>
            </div>
            <div className="text-3xl">📋</div>
          </div>
          <div className="mt-2 flex items-center text-sm">
            <span className={`mr-1 ${analytics.trends.dueAmount.direction === 'up' ? 'text-green-600' : 'text-red-600'}`}>
              {getTrendIcon(analytics.trends.dueAmount.direction, false)}
            </span>
            <span className={analytics.trends.dueAmount.direction === 'up' ? 'text-green-600' : 'text-red-600'}>
              {formatNumber(Math.abs(analytics.trends.dueAmount.trend))}%
            </span>
            <span className="text-gray-500 ml-1">
              {language === 'bn' ? 'গত সময়ের তুলনায়' : 'vs last period'}
            </span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">
                {language === 'bn' ? 'মোট বকেয়া' : 'Total Due'}
              </p>
              <p className="text-2xl font-bold text-red-600">
                {analytics.salesOverview.totalDue.formatted}
              </p>
            </div>
            <div className="text-3xl">⏰</div>
          </div>
          <div className="mt-2 text-sm text-gray-600">
            {language === 'bn' 
              ? `মোট বিক্রয়ের ${formatNumber(analytics.salesOverview.dueSalesPercentage)}%`
              : `${formatNumber(analytics.salesOverview.dueSalesPercentage)}% of total sales`
            }
          </div>
        </div>
      </div>

      {/* High Priority Alerts */}
      {analytics.warningSignals.alerts.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <span className="mr-2">🚨</span>
            {language === 'bn' ? 'জরুরি সতর্কতা' : 'Critical Alerts'}
          </h3>
          <div className="space-y-4">
            {analytics.warningSignals.alerts.map((alert, index) => (
              <div key={index} className={`p-4 rounded-lg border ${getSeverityColor(alert.severity)}`}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium mb-1">{alert.title}</h4>
                    <p className="text-sm mb-2">{alert.message}</p>
                    <p className="text-xs font-medium">
                      💡 {language === 'bn' ? 'সুপারিশ:' : 'Recommendation:'} {alert.recommendation}
                    </p>
                  </div>
                  <div className="text-right ml-4">
                    <div className="text-lg font-bold">
                      {alert.type.includes('PERCENTAGE') 
                        ? `${formatNumber(alert.value)}%`
                        : formatCurrency(alert.value)
                      }
                    </div>
                    <div className="text-xs text-gray-600">
                      {language === 'bn' ? 'সীমা:' : 'Threshold:'} {
                        alert.type.includes('PERCENTAGE') 
                          ? `${formatNumber(alert.threshold)}%`
                          : formatCurrency(alert.threshold)
                      }
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Warnings */}
      {analytics.warningSignals.warnings.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <span className="mr-2">⚠️</span>
            {language === 'bn' ? 'সতর্কতা' : 'Warnings'}
          </h3>
          <div className="space-y-4">
            {analytics.warningSignals.warnings.map((warning, index) => (
              <div key={index} className={`p-4 rounded-lg border ${getSeverityColor(warning.severity)}`}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium mb-1">{warning.title}</h4>
                    <p className="text-sm mb-2">{warning.message}</p>
                    {warning.customers && (
                      <div className="mb-2">
                        <p className="text-xs font-medium mb-1">
                          {language === 'bn' ? 'প্রভাবিত গ্রাহক:' : 'Affected Customers:'}
                        </p>
                        <div className="text-xs space-y-1">
                          {warning.customers.slice(0, 3).map((customer, idx) => (
                            <div key={idx} className="flex justify-between">
                              <span>{customer.name}</span>
                              <span className="font-medium">{customer.due}</span>
                            </div>
                          ))}
                          {warning.customers.length > 3 && (
                            <div className="text-gray-500">
                              +{warning.customers.length - 3} {language === 'bn' ? 'আরো' : 'more'}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    <p className="text-xs font-medium">
                      💡 {language === 'bn' ? 'সুপারিশ:' : 'Recommendation:'} {warning.recommendation}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommendations */}
      {analytics.warningSignals.recommendations.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <span className="mr-2">💡</span>
            {language === 'bn' ? 'উন্নতির সুপারিশ' : 'Improvement Recommendations'}
          </h3>
          <div className="space-y-4">
            {analytics.warningSignals.recommendations.map((rec, index) => (
              <div key={index} className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center mb-2">
                      <h4 className="font-medium">{rec.title}</h4>
                      <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
                        rec.priority === 'high' ? 'bg-red-100 text-red-800' :
                        rec.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {rec.priority === 'high' 
                          ? (language === 'bn' ? 'উচ্চ' : 'High')
                          : rec.priority === 'medium'
                          ? (language === 'bn' ? 'মধ্যম' : 'Medium')
                          : (language === 'bn' ? 'নিম্ন' : 'Low')
                        } {language === 'bn' ? 'অগ্রাধিকার' : 'Priority'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 mb-2">{rec.description}</p>
                    <p className="text-xs text-green-700 font-medium">
                      📊 {language === 'bn' ? 'প্রত্যাশিত প্রভাব:' : 'Expected Impact:'} {rec.expectedImpact}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No Issues */}
      {analytics.warningSignals.summary.totalAlerts === 0 && analytics.warningSignals.summary.totalWarnings === 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
          <div className="text-4xl mb-4">✅</div>
          <h3 className="text-lg font-medium text-green-800 mb-2">
            {language === 'bn' ? 'সব ঠিক আছে!' : 'All Good!'}
          </h3>
          <p className="text-green-700">
            {language === 'bn' 
              ? 'আপনার আর্থিক অবস্থা স্বাস্থ্যকর এবং কোনো জরুরি সমস্যা নেই।'
              : 'Your financial health is good with no critical issues detected.'
            }
          </p>
        </div>
      )}
    </div>
  )
}

export default FinancialWarnings