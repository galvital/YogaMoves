import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Home } from 'lucide-react';

const NotFoundPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50 flex items-center justify-center p-4">
      <div className="text-center">
        <span className="text-8xl mb-4 block">🧘‍♀️</span>
        <h1 className="text-6xl font-bold text-primary-600 mb-2">404</h1>
        <h2 className="text-2xl font-semibold text-gray-700 mb-4">{t('notFound.title')}</h2>
        <p className="text-gray-500 mb-8 max-w-md">{t('notFound.description')}</p>
        <button
          onClick={() => navigate('/')}
          className="inline-flex items-center gap-2 py-3 px-6 bg-primary-600 text-white rounded-xl font-medium hover:bg-primary-700 transition-colors"
        >
          <Home className="w-5 h-5" />
          {t('notFound.goHome')}
        </button>
      </div>
    </div>
  );
};

export default NotFoundPage;
