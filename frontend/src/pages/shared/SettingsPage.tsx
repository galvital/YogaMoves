import React from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { Globe, LogOut, User, Phone, Mail, Shield } from 'lucide-react';

const SettingsPage: React.FC = () => {
  const { t } = useTranslation();
  const { user, logout, isAdmin } = useAuth();
  const { language, changeLanguage } = useLanguage();

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">{t('settings.title')}</h1>

      {/* Profile Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
          <User className="w-5 h-5 text-primary-500" />
          {t('settings.profile')}
        </h2>
        <div className="space-y-3">
          <div className="flex items-center gap-3 py-2">
            <User className="w-5 h-5 text-gray-400" />
            <div>
              <p className="text-sm text-gray-500">{t('settings.name')}</p>
              <p className="font-medium text-gray-800">{user?.name || '-'}</p>
            </div>
          </div>
          {user?.email && (
            <div className="flex items-center gap-3 py-2">
              <Mail className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">{t('settings.email')}</p>
                <p className="font-medium text-gray-800">{user.email}</p>
              </div>
            </div>
          )}
          {user?.phoneNumber && (
            <div className="flex items-center gap-3 py-2">
              <Phone className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">{t('settings.phone')}</p>
                <p className="font-medium text-gray-800 ltr">{user.phoneNumber}</p>
              </div>
            </div>
          )}
          <div className="flex items-center gap-3 py-2">
            <Shield className="w-5 h-5 text-gray-400" />
            <div>
              <p className="text-sm text-gray-500">{t('settings.role')}</p>
              <p className="font-medium text-gray-800">
                {isAdmin ? t('settings.admin') : t('settings.participant')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Language Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
          <Globe className="w-5 h-5 text-primary-500" />
          {t('settings.language')}
        </h2>
        <div className="flex gap-3">
          <button
            onClick={() => changeLanguage('he')}
            className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all ${
              language === 'he'
                ? 'bg-primary-600 text-white shadow-md'
                : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
            }`}
          >
            🇮🇱 עברית
          </button>
          <button
            onClick={() => changeLanguage('en')}
            className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all ${
              language === 'en'
                ? 'bg-primary-600 text-white shadow-md'
                : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
            }`}
          >
            🇬🇧 English
          </button>
        </div>
      </div>

      {/* Logout */}
      <button
        onClick={logout}
        className="w-full py-3 px-6 bg-red-50 text-red-600 rounded-xl font-medium hover:bg-red-100 transition-colors flex items-center justify-center gap-2"
      >
        <LogOut className="w-5 h-5" />
        {t('auth.logout')}
      </button>
    </div>
  );
};

export default SettingsPage;
