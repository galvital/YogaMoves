import { useState } from 'react';
import { useMutation } from 'react-query';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { authApi, handleApiError } from '../utils/api';
import { useAuth } from '../contexts/AuthContext';

// Google OAuth hook
export const useGoogleAuth = () => {
  const { login } = useAuth();
  const { t } = useTranslation();

  return useMutation(
    async (code: string) => {
      const response = await authApi.googleCallback(code);
      return response.data;
    },
    {
      onSuccess: (data) => {
        login(data.accessToken, data.refreshToken, data.user);
        toast.success(t('auth.loginSuccess'));
      },
      onError: (error: any) => {
        const apiError = handleApiError(error);
        toast.error(apiError.error);
      },
    }
  );
};

// SMS OTP hooks
export const useRequestOtp = () => {
  const { t } = useTranslation();

  return useMutation(
    async (phoneNumber: string) => {
      const response = await authApi.requestOtp(phoneNumber);
      return response.data;
    },
    {
      onSuccess: () => {
        toast.success(t('auth.otpSent'));
      },
      onError: (error: any) => {
        const apiError = handleApiError(error);
        toast.error(apiError.error);
      },
    }
  );
};

export const useVerifyOtp = () => {
  const { login } = useAuth();
  const { t } = useTranslation();

  return useMutation(
    async ({ phoneNumber, code }: { phoneNumber: string; code: string }) => {
      const response = await authApi.verifyOtp(phoneNumber, code);
      return response.data;
    },
    {
      onSuccess: (data) => {
        login(data.accessToken, data.refreshToken, data.user);
        toast.success(t('auth.loginSuccess'));
      },
      onError: (error: any) => {
        const apiError = handleApiError(error);
        toast.error(apiError.error);
      },
    }
  );
};

// Logout hook
export const useLogout = () => {
  const { logout } = useAuth();
  const { t } = useTranslation();

  return useMutation(
    async () => {
      const refreshToken = localStorage.getItem('refresh_token');
      if (refreshToken) {
        await authApi.logout(refreshToken);
      }
    },
    {
      onSuccess: () => {
        logout();
        toast.success(t('auth.logoutSuccess'));
      },
      onError: (error: any) => {
        // Logout locally even if server request fails
        logout();
        console.error('Logout error:', error);
      },
    }
  );
};

// Aliases for backward compatibility
export const useGoogleLogin = useGoogleAuth;
export const usePhoneLogin = useVerifyOtp;
export const useSendOtp = useRequestOtp;

// Phone number validation hook
export const usePhoneValidation = () => {
  const [isValid, setIsValid] = useState(false);
  const [formatted, setFormatted] = useState('');

  const validatePhone = (phone: string) => {
    // Remove all non-digits
    const cleaned = phone.replace(/\D/g, '');
    
    // Check if it's a valid Israeli mobile number
    const isValidPattern = /^(972[5][0-9]{8}|05[0-9]{8})$/.test(cleaned);
    
    setIsValid(isValidPattern);
    
    // Format for display
    let formattedPhone = phone;
    if (cleaned.length >= 3) {
      if (cleaned.startsWith('05')) {
        // 05X-XXX-XXXX
        formattedPhone = cleaned.replace(/^(05\d)(\d{3})(\d{4}).*/, '$1-$2-$3');
      } else if (cleaned.startsWith('972')) {
        // +972-5X-XXX-XXXX
        formattedPhone = cleaned.replace(/^(972)(5\d)(\d{3})(\d{4}).*/, '+$1-$2-$3-$4');
      }
    }
    
    setFormatted(formattedPhone);
    
    return {
      isValid: isValidPattern,
      formatted: formattedPhone,
      normalized: isValidPattern ? (cleaned.startsWith('972') ? `+${cleaned}` : `+972${cleaned.substring(1)}`) : '',
    };
  };

  return {
    isValid,
    formatted,
    validatePhone,
  };
};