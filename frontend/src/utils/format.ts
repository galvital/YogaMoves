import { format, formatDistanceToNow, isToday, isTomorrow, isYesterday, parseISO } from 'date-fns';
import { he, enUS } from 'date-fns/locale';

export const formatDate = (date: string | Date, language: 'en' | 'he' = 'he'): string => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  const locale = language === 'he' ? he : enUS;
  
  return format(dateObj, 'dd/MM/yyyy', { locale });
};

export const formatTime = (time: string): string => {
  // time is in HH:mm format
  return time;
};

export const formatDateTime = (datetime: string | Date, language: 'en' | 'he' = 'he'): string => {
  const dateObj = typeof datetime === 'string' ? parseISO(datetime) : datetime;
  const locale = language === 'he' ? he : enUS;
  
  return format(dateObj, 'dd/MM/yyyy HH:mm', { locale });
};

export const formatDateTimeRelative = (datetime: string | Date, language: 'en' | 'he' = 'he'): string => {
  const dateObj = typeof datetime === 'string' ? parseISO(datetime) : datetime;
  const locale = language === 'he' ? he : enUS;
  
  if (isToday(dateObj)) {
    return language === 'he' ? 'היום' : 'Today';
  } else if (isTomorrow(dateObj)) {
    return language === 'he' ? 'מחר' : 'Tomorrow';
  } else if (isYesterday(dateObj)) {
    return language === 'he' ? 'אתמול' : 'Yesterday';
  }
  
  return formatDistanceToNow(dateObj, { 
    addSuffix: true, 
    locale 
  });
};

export const formatPhoneNumber = (phone: string): string => {
  // Format Israeli phone number for display
  const cleaned = phone.replace(/\D/g, '');
  
  if (cleaned.startsWith('972')) {
    // +972 5x xxx xxxx
    const withoutCountry = cleaned.substring(3);
    if (withoutCountry.length === 9) {
      return `+972 ${withoutCountry.substring(0, 2)} ${withoutCountry.substring(2, 5)} ${withoutCountry.substring(5)}`;
    }
  } else if (cleaned.startsWith('05')) {
    // 05x xxx xxxx
    if (cleaned.length === 10) {
      return `${cleaned.substring(0, 3)} ${cleaned.substring(3, 6)} ${cleaned.substring(6)}`;
    }
  }
  
  return phone; // Return original if can't format
};

export const validatePhoneNumber = (phone: string): boolean => {
  // Israeli phone number validation
  const cleaned = phone.replace(/\D/g, '');
  
  // Patterns for Israeli mobile numbers
  const patterns = [
    /^972[5][0-9]{8}$/, // 972 5x xxx xxxx
    /^05[0-9]{8}$/, // 05x xxx xxxx
  ];
  
  return patterns.some(pattern => pattern.test(cleaned));
};

export const normalizePhoneNumber = (phone: string): string => {
  // Convert to +972 format
  const cleaned = phone.replace(/\D/g, '');
  
  if (cleaned.startsWith('972')) {
    return `+${cleaned}`;
  } else if (cleaned.startsWith('05')) {
    return `+972${cleaned.substring(1)}`;
  }
  
  return phone;
};

export const formatPercentage = (value: number, decimals: number = 0): string => {
  return `${value.toFixed(decimals)}%`;
};

export const getStatusColor = (status: 'joining' | 'not_joining' | 'maybe'): string => {
  switch (status) {
    case 'joining':
      return 'bg-secondary-100 text-secondary-800';
    case 'not_joining':
      return 'bg-red-100 text-red-800';
    case 'maybe':
      return 'bg-accent-100 text-accent-800';
    default:
      return 'bg-neutral-100 text-neutral-800';
  }
};

export const getStatusText = (status: 'joining' | 'not_joining' | 'maybe', language: 'en' | 'he' = 'he'): string => {
  const texts = {
    he: {
      joining: 'משתתף',
      not_joining: 'לא משתתף',
      maybe: 'אולי משתתף',
    },
    en: {
      joining: 'Joining',
      not_joining: 'Not Joining',
      maybe: 'Maybe Joining',
    },
  };
  
  return texts[language][status];
};

export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    } else {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-9999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      
      try {
        const result = document.execCommand('copy');
        document.body.removeChild(textArea);
        return result;
      } catch (error) {
        document.body.removeChild(textArea);
        return false;
      }
    }
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    return false;
  }
};

export const generateSessionShareUrl = (sessionId: string): string => {
  const baseUrl = window.location.origin;
  return `${baseUrl}/session/${sessionId}`;
};

export const getDayOfWeek = (date: string | Date, language: 'en' | 'he' = 'he'): string => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  const locale = language === 'he' ? he : enUS;
  
  return format(dateObj, 'EEEE', { locale });
};

export const getMonthName = (month: number, language: 'en' | 'he' = 'he'): string => {
  const date = new Date(2023, month - 1, 1); // month is 1-indexed
  const locale = language === 'he' ? he : enUS;
  
  return format(date, 'MMMM', { locale });
};

export const isSessionUpcoming = (datetime: string): boolean => {
  return new Date(datetime) > new Date();
};

export const isSessionToday = (date: string): boolean => {
  return isToday(parseISO(date));
};

export const canEditResponse = (sessionDatetime: string, adminOverride: boolean): boolean => {
  return isSessionUpcoming(sessionDatetime) && !adminOverride;
};