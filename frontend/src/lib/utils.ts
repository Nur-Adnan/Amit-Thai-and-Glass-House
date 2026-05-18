import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Currency formatting utilities for BD market
export function formatCurrency(amount: number, currency: string = 'BDT'): string {
  return new Intl.NumberFormat('en-BD', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount).replace('BDT', '৳')
}

// Number formatting with Bengali numerals
export function formatNumber(num: number, useBengaliNumerals: boolean = false): string {
  const formatted = new Intl.NumberFormat('en-US').format(num)
  
  if (useBengaliNumerals) {
    return toBengaliNumerals(formatted)
  }
  
  return formatted
}

// Convert English numerals to Bengali
export function toBengaliNumerals(text: string): string {
  const bengaliNumbers: { [key: string]: string } = {
    '0': '০', '1': '১', '2': '২', '3': '৩', '4': '৪',
    '5': '৫', '6': '৬', '7': '৭', '8': '৮', '9': '৯'
  }
  
  return text.replace(/[0-9]/g, (digit) => bengaliNumbers[digit] || digit)
}

// Percentage formatting
export function formatPercentage(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`
}

// Status color utilities
export function getStatusColor(status: string): string {
  const statusColors: { [key: string]: string } = {
    'paid': 'text-success-700 bg-success-100',
    'partial': 'text-warning-700 bg-warning-100',
    'due': 'text-danger-700 bg-danger-100',
    'unpaid': 'text-danger-700 bg-danger-100',
    'pending': 'text-gray-700 bg-gray-100',
    'active': 'text-success-700 bg-success-100',
    'inactive': 'text-gray-700 bg-gray-100',
    'high': 'text-danger-700 bg-danger-100',
    'medium': 'text-warning-700 bg-warning-100',
    'low': 'text-success-700 bg-success-100',
  }
  
  return statusColors[status.toLowerCase()] || 'text-gray-700 bg-gray-100'
}

// Risk level utilities
export function getRiskLevelIcon(level: string): string {
  const icons: { [key: string]: string } = {
    'high': '🚨',
    'medium': '⚠️',
    'low': '✅',
  }
  
  return icons[level.toLowerCase()] || '📊'
}

// Trend direction utilities
export function getTrendIcon(direction: 'up' | 'down', isPositive: boolean = true): string {
  if (direction === 'up') {
    return isPositive ? '📈' : '📉'
  } else {
    return isPositive ? '📉' : '📈'
  }
}

// Date formatting for BD market
export function formatDate(date: Date | string, locale: string = 'en-BD'): string {
  const d = new Date(date)
  return d.toLocaleDateString(locale, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
}

// Validation utilities
export function isValidBDPhone(phone: string): boolean {
  const bdPhoneRegex = /^(\+880|880|0)?[1-9]\d{8,10}$/
  return bdPhoneRegex.test(phone)
}

export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}