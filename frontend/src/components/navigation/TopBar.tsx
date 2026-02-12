import React from 'react';
import { useTranslation } from 'react-i18next';
import { LogOut, Settings } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useLogout } from '../../hooks/useAuth';
import LanguageToggle from '../common/LanguageToggle';

const TopBar: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const logoutMutation = useLogout();

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-30 bg-white/90 backdrop-blur-md border-b border-neutral-200 safe-top">
      <div className="container py-3">
        <div className="flex items-center justify-between">
          {/* Logo and user greeting */}
          <div className="flex items-center space-x-3 rtl:space-x-reverse">
            <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">🧘‍♀️</span>
            </div>
            <div>
              <h1 className="font-display font-semibold text-primary-700">
                {t('app.name')}
              </h1>
              <p className="text-xs text-neutral-500">
                {user?.role === 'admin' ? '👨‍🏫' : '🧘‍♂️'} {user?.name}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-2 rtl:space-x-reverse">
            <LanguageToggle />
            
            <button
              onClick={handleLogout}
              disabled={logoutMutation.isLoading}
              className="p-2 text-neutral-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              aria-label={t('auth.logout')}
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default TopBar;