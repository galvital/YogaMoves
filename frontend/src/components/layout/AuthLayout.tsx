import React from 'react';
import { useTranslation } from 'react-i18next';
import LanguageToggle from '../common/LanguageToggle';

interface AuthLayoutProps {
  children: React.ReactNode;
}

const AuthLayout: React.FC<AuthLayoutProps> = ({ children }) => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-gradient-yoga flex flex-col">
      {/* Header */}
      <header className="safe-top">
        <div className="container py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3 rtl:space-x-reverse">
              {/* App logo/icon placeholder */}
              <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">🧘‍♀️</span>
              </div>
              <h1 className="text-xl font-display font-semibold text-primary-700">
                {t('app.name')}
              </h1>
            </div>
            <LanguageToggle />
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 flex flex-col justify-center py-8">
        <div className="container">
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer className="safe-bottom py-6">
        <div className="container text-center">
          <p className="text-sm text-neutral-500">
            {t('app.tagline')}
          </p>
        </div>
      </footer>
    </div>
  );
};

export default AuthLayout;