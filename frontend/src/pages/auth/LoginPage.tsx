import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Mail, Phone, ArrowRight, Loader2 } from 'lucide-react';
import { useGoogleLogin, usePhoneLogin, useSendOtp, useVerifyOtp } from '../../hooks/useAuth';

const LoginPage: React.FC = () => {
  const { t } = useTranslation();
  const [mode, setMode] = useState<'select' | 'phone' | 'otp'>('select');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otpCode, setOtpCode] = useState('');

  const googleLogin = useGoogleLogin();
  const phoneLogin = usePhoneLogin();
  const sendOtp = useSendOtp();
  const verifyOtp = useVerifyOtp();

  const handleGoogleLogin = async () => {
    try {
      const res = await fetch('/api/auth/google/url');
      const data = await res.json();
      if (data.authUrl || data.url) {
        window.location.href = data.authUrl || data.url;
      }
    } catch (err) {
      console.error('Failed to get Google auth URL', err);
    }
  };

  const handlePhoneSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (phoneNumber.trim()) {
      sendOtp.mutate(phoneNumber, {
        onSuccess: () => {
          setMode('otp');
        }
      });
    }
  };

  const handleOtpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (otpCode.trim()) {
      verifyOtp.mutate({ phoneNumber, code: otpCode });
    }
  };

  const formatPhoneNumber = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 10) {
      return numbers.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3').replace(/^(\d{3})-(\d{3})-(\d{1})$/, '$1-$2-$3');
    }
    return value;
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="w-20 h-20 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <span className="text-3xl">🧘‍♀️</span>
          </div>
          <h1 className="font-display text-3xl font-bold text-primary-700 mb-2">
            {t('app.name')}
          </h1>
          <p className="text-neutral-500 text-lg">
            {t('app.tagline')}
          </p>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-2xl shadow-xl p-8 animate-slide-up">
          {mode === 'select' && (
            <div className="space-y-4">
              <h2 className="text-2xl font-semibold text-center text-neutral-800 mb-6">
                {t('auth.login')}
              </h2>

              {/* Google Login */}
              <button
                onClick={handleGoogleLogin}
                disabled={googleLogin.isLoading}
                className="w-full flex items-center justify-center space-x-3 rtl:space-x-reverse bg-white border-2 border-neutral-200 hover:border-primary-300 text-neutral-700 font-medium py-4 px-6 rounded-xl transition-all duration-200 hover:shadow-md group disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Mail className="w-5 h-5 text-red-500" />
                <span>{t('auth.googleLogin')}</span>
                {googleLogin.isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-transform" />
                )}
              </button>

              {/* Phone Login */}
              <button
                onClick={() => setMode('phone')}
                className="w-full flex items-center justify-center space-x-3 rtl:space-x-reverse bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white font-medium py-4 px-6 rounded-xl transition-all duration-200 hover:shadow-lg transform hover:scale-[1.02] group"
              >
                <Phone className="w-5 h-5" />
                <span>{t('auth.phoneLogin')}</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-transform" />
              </button>
            </div>
          )}

          {mode === 'phone' && (
            <form onSubmit={handlePhoneSubmit} className="space-y-6">
              <button
                type="button"
                onClick={() => setMode('select')}
                className="text-primary-600 hover:text-primary-700 text-sm font-medium"
              >
                ← {t('app.back')}
              </button>

              <h2 className="text-2xl font-semibold text-center text-neutral-800">
                {t('auth.phoneLogin')}
              </h2>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-neutral-700 mb-2">
                  {t('auth.phoneNumber')}
                </label>
                <input
                  type="tel"
                  id="phone"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="05X-XXX-XXXX"
                  className="w-full px-4 py-3 border-2 border-neutral-200 focus:border-primary-500 focus:ring-0 rounded-lg text-lg transition-colors"
                  dir="ltr"
                />
                <p className="text-xs text-neutral-500 mt-1">
                  {t('auth.phoneFormat')}
                </p>
              </div>

              <button
                type="submit"
                disabled={sendOtp.isLoading || !phoneNumber.trim()}
                className="w-full bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white font-medium py-4 px-6 rounded-xl transition-all duration-200 hover:shadow-lg transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center space-x-2"
              >
                {sendOtp.isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <span>{t('auth.sendOtp')}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {mode === 'otp' && (
            <form onSubmit={handleOtpSubmit} className="space-y-6">
              <button
                type="button"
                onClick={() => setMode('phone')}
                className="text-primary-600 hover:text-primary-700 text-sm font-medium"
              >
                ← {t('app.back')}
              </button>

              <h2 className="text-2xl font-semibold text-center text-neutral-800">
                {t('auth.verifyOtp')}
              </h2>

              <div className="text-center">
                <p className="text-neutral-600 mb-4">
                  {t('auth.otpSent')} {phoneNumber}
                </p>

                <div>
                  <label htmlFor="otp" className="block text-sm font-medium text-neutral-700 mb-2">
                    {t('auth.otpCode')}
                  </label>
                  <input
                    type="text"
                    id="otp"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="123456"
                    className="w-full px-4 py-3 border-2 border-neutral-200 focus:border-primary-500 focus:ring-0 rounded-lg text-xl text-center tracking-widest font-mono transition-colors"
                    dir="ltr"
                    maxLength={6}
                  />
                </div>
              </div>

              <div className="space-y-3">
                <button
                  type="submit"
                  disabled={verifyOtp.isLoading || otpCode.length !== 6}
                  className="w-full bg-gradient-to-r from-secondary-500 to-secondary-600 hover:from-secondary-600 hover:to-secondary-700 text-white font-medium py-4 px-6 rounded-xl transition-all duration-200 hover:shadow-lg transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center space-x-2"
                >
                  {verifyOtp.isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <span>{t('auth.verifyOtp')}</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => sendOtp.mutate(phoneNumber)}
                  disabled={sendOtp.isLoading}
                  className="w-full text-primary-600 hover:text-primary-700 font-medium py-2 transition-colors"
                >
                  {sendOtp.isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                  ) : (
                    t('auth.resendOtp')
                  )}
                </button>
              </div>
            </form>
          )}

          {/* Error Display */}
          {(googleLogin.error || phoneLogin.error || sendOtp.error || verifyOtp.error) && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">
                {googleLogin.error?.message || 
                 phoneLogin.error?.message || 
                 sendOtp.error?.message || 
                 verifyOtp.error?.message}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-neutral-500 text-sm">
          <p>🧘‍♀️ מצא את האיזון הפנימי שלך</p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;