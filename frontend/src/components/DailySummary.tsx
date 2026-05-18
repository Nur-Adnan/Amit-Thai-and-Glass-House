'use client';

import { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useFormatting } from '@/hooks/useFormatting';

interface DailySummaryData {
  date: string;
  dateFormatted: string;
  invoices: {
    total: number;
    paid: number;
    partial: number;
    due: number;
  };
  sales: {
    total: number;
    paid: number;
    due: number;
  };
  newDues: {
    count: number;
    amount: number;
  };
  expenses: {
    total: number;
    count: number;
    salaries: number;
    salaryCount: number;
    other: number;
  };
  profit: {
    basic: number;
    margin: string;
  };
  insights: {
    topItems: Array<{
      name: string;
      quantity: number;
      revenue: number;
      invoices: number;
    }>;
    paymentMethods: Array<{
      method: string;
      count: number;
      amount: number;
    }>;
    hourlySales: Array<{
      hour: number;
      sales: number;
      count: number;
    }>;
  };
}

interface DailySummaryProps {
  selectedDate?: string;
  onDateChange?: (date: string) => void;
}

export default function DailySummary({ selectedDate, onDateChange }: DailySummaryProps) {
  const [summary, setSummary] = useState<DailySummaryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { t } = useLanguage();
  const { formatCurrency, formatNumber, formatDateWithDay } = useFormatting();

  const fetchDailySummary = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('token');
      const url = selectedDate 
        ? `http://localhost:3001/api/daily-summary?date=${selectedDate}`
        : 'http://localhost:3001/api/daily-summary';
        
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch daily summary');
      }

      const data = await response.json();
      setSummary(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    fetchDailySummary();
  }, [fetchDailySummary]);

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = e.target.value;
    if (onDateChange) {
      onDateChange(newDate);
    }
  };

  const getPaymentMethodTranslation = (method: string) => {
    switch (method) {
      case 'cash': return t('cash');
      case 'card': return t('card');
      case 'bank_transfer': return t('bankTransfer');
      case 'cheque': return t('cheque');
      default: return method.replace('_', ' ');
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center text-red-600">
          <p>{t('networkError')}: {error}</p>
          <button 
            onClick={fetchDailySummary}
            className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            {t('loading')}
          </button>
        </div>
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center text-gray-500">
          {t('loading')}
        </div>
      </div>
    );
  }

  const currentDate = selectedDate ? new Date(selectedDate) : new Date();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{t('todaysSales')}</h2>
            <p className="text-gray-600">{formatDateWithDay(currentDate)}</p>
          </div>
          <div className="mt-4 sm:mt-0">
            <input
              type="date"
              value={selectedDate || new Date().toISOString().split('T')[0]}
              onChange={handleDateChange}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Invoices */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 text-sm font-medium">📄</span>
              </div>
            </div>
            <div className="ml-4 flex-1">
              <p className="text-sm font-medium text-gray-500">{t('totalInvoices')}</p>
              <p className="text-2xl font-bold text-gray-900">{formatNumber(summary.invoices.total)}</p>
              <div className="mt-1 text-xs text-gray-500">
                {formatNumber(summary.invoices.paid)} {t('paid')} • {formatNumber(summary.invoices.partial)} {t('partial')} • {formatNumber(summary.invoices.due)} {t('due')}
              </div>
            </div>
          </div>
        </div>

        {/* Total Sales */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-green-600 text-sm font-medium">💰</span>
              </div>
            </div>
            <div className="ml-4 flex-1">
              <p className="text-sm font-medium text-gray-500">{t('total')} {t('todaysSales')}</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(summary.sales.total)}</p>
              <div className="mt-1 text-xs text-gray-500">
                {t('paid')}: {formatCurrency(summary.sales.paid)}
              </div>
            </div>
          </div>
        </div>

        {/* Profit */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                summary.profit.basic >= 0 ? 'bg-green-100' : 'bg-red-100'
              }`}>
                <span className={`text-sm font-medium ${
                  summary.profit.basic >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {summary.profit.basic >= 0 ? '📈' : '📉'}
                </span>
              </div>
            </div>
            <div className="ml-4 flex-1">
              <p className="text-sm font-medium text-gray-500">লাভ</p>
              <p className={`text-2xl font-bold ${
                summary.profit.basic >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {formatCurrency(summary.profit.basic)}
              </p>
              <div className="mt-1 text-xs text-gray-500">
                মার্জিন: {formatNumber(parseFloat(summary.profit.margin))}%
              </div>
            </div>
          </div>
        </div>

        {/* New Dues */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                <span className="text-orange-600 text-sm font-medium">⏰</span>
              </div>
            </div>
            <div className="ml-4 flex-1">
              <p className="text-sm font-medium text-gray-500">নতুন {t('due')}</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(summary.newDues.amount)}</p>
              <div className="mt-1 text-xs text-gray-500">
                {formatNumber(summary.newDues.count)} {t('totalInvoices')}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Expenses Breakdown */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">খরচের বিবরণ</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-red-50 rounded-lg">
            <p className="text-sm text-gray-600">মোট খরচ</p>
            <p className="text-xl font-bold text-red-600">{formatCurrency(summary.expenses.total)}</p>
            <p className="text-xs text-gray-500">{formatNumber(summary.expenses.count)} এন্ট্রি</p>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <p className="text-sm text-gray-600">বেতন</p>
            <p className="text-xl font-bold text-purple-600">{formatCurrency(summary.expenses.salaries)}</p>
            <p className="text-xs text-gray-500">{formatNumber(summary.expenses.salaryCount)} পেমেন্ট</p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">অন্যান্য খরচ</p>
            <p className="text-xl font-bold text-gray-600">{formatCurrency(summary.expenses.other)}</p>
            <p className="text-xs text-gray-500">বেতন ছাড়া খরচ</p>
          </div>
        </div>
      </div>

      {/* Top Items and Payment Methods */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Selling Items */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">{t('topProducts')}</h3>
          {summary.insights.topItems.length > 0 ? (
            <div className="space-y-3">
              {summary.insights.topItems.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 truncate">{item.name}</p>
                    <p className="text-sm text-gray-500">
                      {t('quantity')}: {formatNumber(item.quantity)} • {formatNumber(item.invoices)} {t('totalInvoices')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900">{formatCurrency(item.revenue)}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">আজ কোন বিক্রয় নেই</p>
          )}
        </div>

        {/* Payment Methods */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">{t('paymentMethod')}</h3>
          {summary.insights.paymentMethods.length > 0 ? (
            <div className="space-y-3">
              {summary.insights.paymentMethods.map((method, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 capitalize">
                      {getPaymentMethodTranslation(method.method)}
                    </p>
                    <p className="text-sm text-gray-500">{formatNumber(method.count)} লেনদেন</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900">{formatCurrency(method.amount)}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">আজ কোন পেমেন্ট নেই</p>
          )}
        </div>
      </div>

      {/* Hourly Sales Chart */}
      {summary.insights.hourlySales.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">ঘন্টা অনুযায়ী বিক্রয়</h3>
          <div className="grid grid-cols-12 gap-2">
            {Array.from({ length: 24 }, (_, hour) => {
              const hourData = summary.insights.hourlySales.find(h => h.hour === hour);
              const sales = hourData?.sales || 0;
              const maxSales = Math.max(...summary.insights.hourlySales.map(h => h.sales));
              const height = maxSales > 0 ? (sales / maxSales) * 100 : 0;
              
              return (
                <div key={hour} className="text-center">
                  <div className="h-20 flex items-end justify-center mb-1">
                    <div
                      className="w-full bg-blue-500 rounded-t"
                      style={{ height: `${height}%`, minHeight: sales > 0 ? '4px' : '0' }}
                      title={`${formatNumber(hour)}:০০ - ${formatCurrency(sales)}`}
                    ></div>
                  </div>
                  <div className="text-xs text-gray-500">{formatNumber(hour)}</div>
                </div>
              );
            })}
          </div>
          <div className="mt-2 text-xs text-gray-500 text-center">
            ঘন্টা (২৪-ঘন্টা ফরম্যাট)
          </div>
        </div>
      )}
    </div>
  );
}