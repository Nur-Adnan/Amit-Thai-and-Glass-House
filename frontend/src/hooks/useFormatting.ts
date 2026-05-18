'use client'

import { useLanguage } from '@/contexts/LanguageContext';
import {
  getCurrencyFormatter,
  getDateFormatter,
  getDateWithDayFormatter,
  getNumberFormatter,
  Language
} from '@/utils/language';

export const useFormatting = () => {
  const { language } = useLanguage();

  const formatCurrency = (amount: number | null | undefined): string => {
    const formatter = getCurrencyFormatter(language);
    return formatter(amount);
  };

  const formatDate = (date: Date | string): string => {
    const formatter = getDateFormatter(language);
    return formatter(date);
  };

  const formatDateWithDay = (date: Date | string): string => {
    const formatter = getDateWithDayFormatter(language);
    return formatter(date);
  };

  const formatNumber = (num: number | null | undefined): string => {
    const formatter = getNumberFormatter(language);
    return formatter(num);
  };

  return {
    formatCurrency,
    formatDate,
    formatDateWithDay,
    formatNumber,
    language
  };
};