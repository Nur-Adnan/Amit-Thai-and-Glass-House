'use client'

import { useState } from 'react'
import Layout from '@/components/Layout'
import BusinessSummaryCards from '@/components/BusinessSummaryCards'
import DailySummary from '@/components/DailySummary'
import FinancialWarnings from '@/components/FinancialWarnings'
import { useLanguage } from '@/contexts/LanguageContext'
import { Divider } from '@heroui/react'

export default function DashboardPage() {
  const [selectedDate, setSelectedDate] = useState<string>('');
  const { t } = useLanguage();

  return (
    <Layout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="heading-1">{t('dashboard')}</h1>
          <p className="text-muted-foreground mt-2">
            Get instant business clarity with key metrics and insights
          </p>
        </div>
        
        {/* Business Summary Cards - Instant Clarity */}
        <BusinessSummaryCards />
        
        <Divider />
        
        {/* Financial Warnings */}
        <FinancialWarnings />
        
        <Divider />
        
        {/* Detailed Daily Summary */}
        <div>
          <h2 className="heading-3 mb-4">Detailed Analysis</h2>
          <DailySummary 
            selectedDate={selectedDate} 
            onDateChange={setSelectedDate}
          />
        </div>
      </div>
    </Layout>
  )
}