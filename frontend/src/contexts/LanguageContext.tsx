import React, { createContext, useContext, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LanguageContextType } from '../types';

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

interface LanguageProviderProps {
  children: React.ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const { i18n } = useTranslation();
  const [language, setLanguage] = useState<'en' | 'he'>('he');
  const [direction, setDirection] = useState<'ltr' | 'rtl'>('rtl');

  // Initialize language from i18n
  useEffect(() => {
    const currentLang = i18n.language as 'en' | 'he';
    setLanguage(currentLang);
    setDirection(currentLang === 'he' ? 'rtl' : 'ltr');
  }, [i18n.language]);

  // Update document direction when language changes
  useEffect(() => {
    document.documentElement.dir = direction;
    document.documentElement.lang = language;
    
    // Update body classes for potential styling
    document.body.classList.remove('rtl', 'ltr');
    document.body.classList.add(direction);
  }, [direction, language]);

  const changeLanguage = async (lang: 'en' | 'he') => {
    try {
      await i18n.changeLanguage(lang);
      setLanguage(lang);
      setDirection(lang === 'he' ? 'rtl' : 'ltr');
      
      // Save to localStorage
      localStorage.setItem('yogamoves-language', lang);
    } catch (error) {
      console.error('Failed to change language:', error);
    }
  };

  const value: LanguageContextType = {
    language,
    direction,
    changeLanguage,
  };

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};