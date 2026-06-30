'use client'

import React from 'react';
import { Button } from '@heroui/react';
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
      <Button
        onPress={toggleLanguage}
        variant="bordered"
        size="sm"
        className="flex items-center space-x-1 text-sm font-medium"
        title={`Switch to ${language === 'en' ? 'বাংলা' : 'English'}`}
      >
        <span className="text-lg">
          {language === 'en' ? '🇧🇩' : '🇺🇸'}
        </span>
        <span>
          {language === 'en' ? 'বাংলা' : 'English'}
        </span>
      </Button>
    </div>
  );
};

export default LanguageToggle;