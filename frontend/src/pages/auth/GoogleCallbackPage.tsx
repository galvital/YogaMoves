import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Loader2, AlertCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const GoogleCallbackPage: React.FC = () => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login, isAdmin } = useAuth();

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get('code');
      const error = searchParams.get('error');

      if (error) {
        console.error('Google OAuth error:', error);
        setTimeout(() => {
          navigate('/login', { replace: true });
        }, 3000);
        return;
      }

      if (!code) {
        console.error('No authorization code received');
        setTimeout(() => {
          navigate('/login', { replace: true });
        }, 3000);
        return;
      }

      try {
        const response = await fetch('/api/auth/google/callback', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ code }),
        });

        if (!response.ok) {
          throw new Error('Failed to exchange code for tokens');
        }

        const data = await response.json();
        
        if (data.accessToken && data.refreshToken && data.user) {
          login(data.accessToken, data.refreshToken, data.user);
          
          // Redirect to appropriate dashboard
          const redirectTo = data.user.role === 'admin' ? '/admin' : '/dashboard';
          navigate(redirectTo, { replace: true });
        } else {
          throw new Error('Invalid response data');
        }
      } catch (error) {
        console.error('Google callback error:', error);
        setTimeout(() => {
          navigate('/login', { replace: true });
        }, 3000);
      }
    };

    handleCallback();
  }, [searchParams, navigate, login]);

  const error = searchParams.get('error');

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-secondary-50 p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-full flex items-center justify-center">
            {error ? (
              <AlertCircle className="w-8 h-8 text-white" />
            ) : (
              <Loader2 className="w-8 h-8 text-white animate-spin" />
            )}
          </div>

          {error ? (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-red-600">
                שגיאה בהתחברות
              </h2>
              <p className="text-neutral-600">
                אירעה שגיאה בעת ההתחברות עם Google. מפנה חזרה לדף הכניסה...
              </p>
              <div className="text-xs text-red-500 bg-red-50 p-3 rounded-lg">
                {error}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-primary-700">
                מתחבר...
              </h2>
              <p className="text-neutral-600">
                מעבד את פרטי ההתחברות שלך עם Google
              </p>
              <div className="flex items-center justify-center space-x-2 text-primary-500">
                <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GoogleCallbackPage;