// Language utilities for Bengali/English toggle system

export type Language = 'en' | 'bn';

// Bengali number mapping
const bengaliNumbers: { [key: string]: string } = {
  '0': '০', '1': '১', '2': '২', '3': '৩', '4': '৪',
  '5': '৫', '6': '৬', '7': '৭', '8': '৮', '9': '৯'
};

// English number mapping (for reverse conversion)
const englishNumbers: { [key: string]: string } = {
  '০': '0', '১': '1', '২': '2', '৩': '3', '৪': '4',
  '৫': '5', '৬': '6', '৭': '7', '৮': '8', '৯': '9'
};

/**
 * Convert English numbers to Bengali numbers
 */
export const toBengaliNumber = (text: string): string => {
  return text.replace(/[0-9]/g, (digit) => bengaliNumbers[digit] || digit);
};

/**
 * Convert Bengali numbers to English numbers
 */
export const toEnglishNumber = (text: string): string => {
  return text.replace(/[০-৯]/g, (digit) => englishNumbers[digit] || digit);
};

/**
 * Format currency in Bengali style
 */
export const formatBengaliCurrency = (amount: number | null | undefined): string => {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return `৳${toBengaliNumber('0.00')}`;
  }
  
  const formatted = new Intl.NumberFormat('bn-BD', {
    style: 'currency',
    currency: 'BDT',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
  
  // Replace ৳ symbol and format properly
  return `৳${toBengaliNumber(amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }))}`;
};

/**
 * Format currency in English style
 */
export const formatEnglishCurrency = (amount: number | null | undefined): string => {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return '৳0.00';
  }
  
  return `৳${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

/**
 * Format date in Bengali style
 */
export const formatBengaliDate = (date: Date | string): string => {
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = String(d.getFullYear());
  
  return toBengaliNumber(`${day}-${month}-${year}`);
};

/**
 * Format date in English style
 */
export const formatEnglishDate = (date: Date | string): string => {
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
};

/**
 * Format date with day name in Bengali
 */
export const formatBengaliDateWithDay = (date: Date | string): string => {
  const d = new Date(date);
  const bengaliDays = ['রবিবার', 'সোমবার', 'মঙ্গলবার', 'বুধবার', 'বৃহস্পতিবার', 'শুক্রবার', 'শনিবার'];
  const bengaliMonths = [
    'জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন',
    'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'
  ];
  
  const dayName = bengaliDays[d.getDay()];
  const day = toBengaliNumber(String(d.getDate()));
  const month = bengaliMonths[d.getMonth()];
  const year = toBengaliNumber(String(d.getFullYear()));
  
  return `${dayName}, ${day} ${month} ${year}`;
};

/**
 * Format date with day name in English
 */
export const formatEnglishDateWithDay = (date: Date | string): string => {
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

/**
 * Format number with Bengali locale
 */
export const formatBengaliNumber = (num: number | null | undefined): string => {
  if (num === null || num === undefined || isNaN(num)) {
    return toBengaliNumber('0');
  }
  return toBengaliNumber(num.toLocaleString('en-US'));
};

/**
 * Format number with English locale
 */
export const formatEnglishNumber = (num: number | null | undefined): string => {
  if (num === null || num === undefined || isNaN(num)) {
    return '0';
  }
  return num.toLocaleString('en-US');
};

/**
 * Get currency formatter based on language
 */
export const getCurrencyFormatter = (language: Language) => {
  return language === 'bn' ? formatBengaliCurrency : formatEnglishCurrency;
};

/**
 * Get date formatter based on language
 */
export const getDateFormatter = (language: Language) => {
  return language === 'bn' ? formatBengaliDate : formatEnglishDate;
};

/**
 * Get date with day formatter based on language
 */
export const getDateWithDayFormatter = (language: Language) => {
  return language === 'bn' ? formatBengaliDateWithDay : formatEnglishDateWithDay;
};

/**
 * Get number formatter based on language
 */
export const getNumberFormatter = (language: Language) => {
  return language === 'bn' ? formatBengaliNumber : formatEnglishNumber;
};