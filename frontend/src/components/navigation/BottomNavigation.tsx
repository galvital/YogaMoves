import React from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Calendar, 
  Users, 
  BarChart3, 
  Settings,
  Home
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const BottomNavigation: React.FC = () => {
  const { t } = useTranslation();
  const { isAdmin } = useAuth();
  const location = useLocation();

  const adminNavItems = [
    {
      path: '/admin',
      icon: LayoutDashboard,
      label: t('navigation.home'),
      exact: true,
    },
    {
      path: '/admin/sessions',
      icon: Calendar,
      label: t('navigation.sessions'),
    },
    {
      path: '/admin/participants',
      icon: Users,
      label: t('navigation.participants'),
    },
    {
      path: '/admin/reports',
      icon: BarChart3,
      label: t('navigation.reports'),
    },
    {
      path: '/settings',
      icon: Settings,
      label: t('navigation.settings'),
    },
  ];

  const participantNavItems = [
    {
      path: '/dashboard',
      icon: Home,
      label: t('navigation.home'),
      exact: true,
    },
    {
      path: '/sessions',
      icon: Calendar,
      label: t('navigation.sessions'),
    },
    {
      path: '/settings',
      icon: Settings,
      label: t('navigation.settings'),
    },
  ];

  const navItems = isAdmin ? adminNavItems : participantNavItems;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-20 bg-white/95 backdrop-blur-md border-t border-neutral-200 safe-bottom">
      <div className="container">
        <div className="flex items-center justify-around py-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.exact 
              ? location.pathname === item.path
              : location.pathname.startsWith(item.path);

            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center justify-center px-3 py-2 rounded-lg transition-all duration-200 ${
                  isActive
                    ? 'text-primary-600 bg-primary-50'
                    : 'text-neutral-500 hover:text-primary-600 hover:bg-primary-50/50'
                }`}
              >
                <Icon className={`w-6 h-6 mb-1 ${isActive ? 'scale-110' : ''} transition-transform`} />
                <span className="text-xs font-medium leading-none">
                  {item.label}
                </span>
              </NavLink>
            );
          })}
        </div>
      </div>
    </nav>
  );
};

export default BottomNavigation;