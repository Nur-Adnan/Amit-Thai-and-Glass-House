'use client';

import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, DollarSign, AlertTriangle, Package } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useLanguage } from '@/contexts/LanguageContext';
import { useFormatting } from '@/hooks/useFormatting';

interface BusinessSummaryData {
  todaysSales: {
    amount: number;
    count: number;
    trend: number; // percentage change from yesterday
  };
  todaysProfit: {
    amount: number;
    margin: number;
    trend: number;
  };
  newDue: {
    amount: number;
    count: number;
    trend: number;
  };
  lowStockItems: {
    count: number;
    criticalCount: number; // items with 0 stock
    items: Array<{
      name: string;
      currentStock: number;
      minStock: number;
      category: string;
    }>;
  };
}

export default function BusinessSummaryCards() {
  const [data, setData] = useState<BusinessSummaryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { t } = useLanguage();
  const { formatCurrency, formatNumber } = useFormatting();

  useEffect(() => {
    fetchBusinessSummary();
  }, []);

  const fetchBusinessSummary = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/api/business-summary', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch business summary');
      }

      const result = await response.json();
      setData(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const getTrendIcon = (trend: number | null | undefined) => {
    const trendValue = trend || 0;
    if (trendValue > 0) return <TrendingUp className="h-4 w-4 text-green-600" />;
    if (trendValue < 0) return <TrendingDown className="h-4 w-4 text-red-600" />;
    return null;
  };

  const getTrendColor = (trend: number | null | undefined) => {
    const trendValue = trend || 0;
    if (trendValue > 0) return 'text-green-600';
    if (trendValue < 0) return 'text-red-600';
    return 'text-gray-500';
  };

  const formatTrend = (trend: number | null | undefined) => {
    const trendValue = trend || 0;
    const sign = trendValue > 0 ? '+' : '';
    return `${sign}${formatNumber(Math.abs(trendValue))}%`;
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-2">
              <div className="h-4 bg-muted rounded w-3/4"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-muted rounded w-1/2 mb-2"></div>
              <div className="h-3 bg-muted rounded w-full"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card className="col-span-full">
        <CardContent className="pt-6">
          <div className="text-center text-destructive">
            <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
            <p className="font-medium">{t('networkError')}</p>
            <p className="text-sm text-muted-foreground mt-1">{error}</p>
            <button 
              onClick={fetchBusinessSummary}
              className="mt-3 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              {t('loading')}
            </button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {/* Today Sales */}
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {t('todaysSales')}
          </CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-foreground mb-1">
            {formatCurrency(data.todaysSales?.amount || 0)}
          </div>
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {formatNumber(data.todaysSales?.count || 0)} {t('totalInvoices')}
            </p>
            <div className={`flex items-center gap-1 text-sm ${getTrendColor(data.todaysSales?.trend || 0)}`}>
              {getTrendIcon(data.todaysSales?.trend || 0)}
              <span>{formatTrend(data.todaysSales?.trend || 0)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Today Profit */}
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Today&apos;s Profit
          </CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className={`text-3xl font-bold mb-1 ${
            (data.todaysProfit?.amount || 0) >= 0 ? 'text-green-600' : 'text-red-600'
          }`}>
            {formatCurrency(data.todaysProfit?.amount || 0)}
          </div>
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {formatNumber(data.todaysProfit?.margin || 0)}% margin
            </p>
            <div className={`flex items-center gap-1 text-sm ${getTrendColor(data.todaysProfit?.trend || 0)}`}>
              {getTrendIcon(data.todaysProfit?.trend || 0)}
              <span>{formatTrend(data.todaysProfit?.trend || 0)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* New Due */}
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            New Due Today
          </CardTitle>
          <AlertTriangle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-red-600 mb-1">
            {formatCurrency(data.newDue?.amount || 0)}
          </div>
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {formatNumber(data.newDue?.count || 0)} new dues
            </p>
            <div className={`flex items-center gap-1 text-sm ${getTrendColor(data.newDue?.trend || 0)}`}>
              {getTrendIcon(data.newDue?.trend || 0)}
              <span>{formatTrend(data.newDue?.trend || 0)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Low Stock Items */}
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Low Stock Alert
          </CardTitle>
          <Package className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="flex items-baseline gap-2 mb-1">
            <span className={`text-3xl font-bold ${
              (data.lowStockItems?.criticalCount || 0) > 0 ? 'text-red-600' : 
              (data.lowStockItems?.count || 0) > 0 ? 'text-yellow-600' : 'text-green-600'
            }`}>
              {formatNumber(data.lowStockItems?.count || 0)}
            </span>
            {(data.lowStockItems?.criticalCount || 0) > 0 && (
              <Badge variant="destructive" className="text-xs">
                {formatNumber(data.lowStockItems?.criticalCount || 0)} critical
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            items need restocking
          </p>
          
          {(data.lowStockItems?.items?.length || 0) > 0 && (
            <>
              <Separator className="my-3" />
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Critical Items
                </p>
                {(data.lowStockItems?.items || []).slice(0, 3).map((item, index) => (
                  <div key={index} className="flex items-center justify-between text-xs">
                    <span className="truncate flex-1 mr-2">{item.name}</span>
                    <Badge 
                      variant={item.currentStock === 0 ? "destructive" : "secondary"}
                      className="text-xs"
                    >
                      {formatNumber(item.currentStock)}
                    </Badge>
                  </div>
                ))}
                {(data.lowStockItems?.items?.length || 0) > 3 && (
                  <p className="text-xs text-muted-foreground">
                    +{formatNumber((data.lowStockItems?.items?.length || 0) - 3)} more items
                  </p>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}