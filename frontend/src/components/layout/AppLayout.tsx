import React from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import BottomNavigation from '../navigation/BottomNavigation';
import TopBar from '../navigation/TopBar';

interface AppLayoutProps {
  children: React.ReactNode;
}

const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-primary-50 pb-16 safe-bottom">
      {/* Top bar */}
      <TopBar />
      
      {/* Main content */}
      <main className="pt-16 pb-2">
        {children}
      </main>
      
      {/* Bottom navigation */}
      <BottomNavigation />
    </div>
  );
};

export default AppLayout;