import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { useLanguage } from './contexts/LanguageContext';

// Layout components
import AuthLayout from './components/layout/AuthLayout';
import AppLayout from './components/layout/AppLayout';

// Auth pages
import LoginPage from './pages/auth/LoginPage';
import GoogleCallbackPage from './pages/auth/GoogleCallbackPage';

// Admin pages
import AdminDashboard from './pages/admin/AdminDashboard';
import ParticipantsPage from './pages/admin/ParticipantsPage';
import AdminSessionsPage from './pages/admin/AdminSessionsPage';
import AdminSessionDetailPage from './pages/admin/AdminSessionDetailPage';
import ReportsPage from './pages/admin/ReportsPage';

// Participant pages
import ParticipantDashboard from './pages/participant/ParticipantDashboard';
import ParticipantSessionsPage from './pages/participant/ParticipantSessionsPage';

// Shared pages
import SessionJoinPage from './pages/shared/SessionJoinPage';
import SettingsPage from './pages/shared/SettingsPage';
import NotFoundPage from './pages/shared/NotFoundPage';

// Protected route component
interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
  requireParticipant?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requireAdmin = false, 
  requireParticipant = false 
}) => {
  const { isAuthenticated, isAdmin, isParticipant } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requireAdmin && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  if (requireParticipant && !isParticipant) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

// Public route component (redirect if authenticated)
interface PublicRouteProps {
  children: React.ReactNode;
}

const PublicRoute: React.FC<PublicRouteProps> = ({ children }) => {
  const { isAuthenticated, isAdmin } = useAuth();

  if (isAuthenticated) {
    // Redirect to appropriate dashboard based on role
    return <Navigate to={isAdmin ? "/admin" : "/dashboard"} replace />;
  }

  return <>{children}</>;
};

// Home redirect component
const HomeRedirect: React.FC = () => {
  const { isAuthenticated, isAdmin } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Navigate to={isAdmin ? "/admin" : "/dashboard"} replace />;
};

function App() {
  const { direction } = useLanguage();

  return (
    <div className={`min-h-screen bg-primary-50 ${direction === 'rtl' ? 'rtl' : 'ltr'}`}>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={
          <PublicRoute>
            <AuthLayout>
              <LoginPage />
            </AuthLayout>
          </PublicRoute>
        } />
        
        <Route path="/auth/google/callback" element={
          <PublicRoute>
            <GoogleCallbackPage />
          </PublicRoute>
        } />

        {/* Session join page (accessible without login but better with login) */}
        <Route path="/session/:sessionId" element={<SessionJoinPage />} />

        {/* Protected routes */}
        <Route path="/" element={<HomeRedirect />} />

        {/* Admin routes */}
        <Route path="/admin" element={
          <ProtectedRoute requireAdmin>
            <AppLayout>
              <AdminDashboard />
            </AppLayout>
          </ProtectedRoute>
        } />

        <Route path="/admin/participants" element={
          <ProtectedRoute requireAdmin>
            <AppLayout>
              <ParticipantsPage />
            </AppLayout>
          </ProtectedRoute>
        } />

        <Route path="/admin/sessions" element={
          <ProtectedRoute requireAdmin>
            <AppLayout>
              <AdminSessionsPage />
            </AppLayout>
          </ProtectedRoute>
        } />

        <Route path="/admin/sessions/:sessionId" element={
          <ProtectedRoute requireAdmin>
            <AppLayout>
              <AdminSessionDetailPage />
            </AppLayout>
          </ProtectedRoute>
        } />

        <Route path="/admin/reports" element={
          <ProtectedRoute requireAdmin>
            <AppLayout>
              <ReportsPage />
            </AppLayout>
          </ProtectedRoute>
        } />

        {/* Participant routes */}
        <Route path="/dashboard" element={
          <ProtectedRoute requireParticipant>
            <AppLayout>
              <ParticipantDashboard />
            </AppLayout>
          </ProtectedRoute>
        } />

        <Route path="/sessions" element={
          <ProtectedRoute requireParticipant>
            <AppLayout>
              <ParticipantSessionsPage />
            </AppLayout>
          </ProtectedRoute>
        } />

        {/* Shared authenticated routes */}
        <Route path="/settings" element={
          <ProtectedRoute>
            <AppLayout>
              <SettingsPage />
            </AppLayout>
          </ProtectedRoute>
        } />

        {/* 404 page */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </div>
  );
}

export default App;