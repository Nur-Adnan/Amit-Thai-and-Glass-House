'use client'

import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Language } from '@/utils/language';

interface LanguageToggleProps {
  className?: string;
}

const LanguageToggle: React.FC<LanguageToggleProps> = ({ className = '' }) => {
  const { language, setLanguage, t } = useLanguage();

  const toggleLanguage = () => {
    const newLanguage: Language = language === 'en' ? 'bn' : 'en';
    setLanguage(newLanguage);
  };

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <span className="text-sm text-gray-600">{t('language')}:</span>
      <button
        onClick={toggleLanguage}
        className="flex items-center space-x-1 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
        title={`Switch to ${language === 'en' ? 'বাংলা' : 'English'}`}
      >
        <span className="text-lg">
          {language === 'en' ? '🇧🇩' : '🇺🇸'}
        </span>
        <span>
          {language === 'en' ? 'বাংলা' : 'English'}
        </span>
      </button>
    </div>
  );
};

export default LanguageToggle;