import React from 'react';
import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

const LanguageToggle: React.FC = () => {
  const { t } = useTranslation();
  const { language, changeLanguage } = useLanguage();

  return (
    <button
      onClick={() => changeLanguage(language === 'he' ? 'en' : 'he')}
      className="flex items-center space-x-2 rtl:space-x-reverse px-3 py-2 text-neutral-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
      aria-label={t('settings.language')}
    >
      <Globe className="w-4 h-4" />
      <span className="text-sm font-medium">
        {language === 'he' ? 'EN' : 'עב'}
      </span>
    </button>
  );
};

export default LanguageToggle;