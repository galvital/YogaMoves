import axios, { AxiosResponse } from 'axios';
import { ApiError } from '../types';

// Create axios instance
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (refreshToken) {
          const response = await axios.post('/api/auth/refresh', {
            refreshToken,
          });

          const { accessToken } = response.data;
          localStorage.setItem('access_token', accessToken);

          // Retry original request
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, redirect to login
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// Helper function to handle API errors
export const handleApiError = (error: any): ApiError => {
  if (error.response) {
    // Server responded with error status
    return {
      error: error.response.data?.error || 'Server error occurred',
      details: error.response.data?.details,
    };
  } else if (error.request) {
    // Request was made but no response received
    return {
      error: 'Network error. Please check your connection.',
    };
  } else {
    // Something else happened
    return {
      error: 'An unknown error occurred.',
    };
  }
};

// Auth API
export const authApi = {
  getGoogleAuthUrl: () => api.get('/auth/google/url'),
  googleCallback: (code: string) =>
    api.post('/auth/google/callback', { code }),
  requestOtp: (phoneNumber: string) =>
    api.post('/auth/otp/request', { phoneNumber }),
  verifyOtp: (phoneNumber: string, code: string) =>
    api.post('/auth/otp/verify', { phoneNumber, code }),
  refreshToken: (refreshToken: string) =>
    api.post('/auth/refresh', { refreshToken }),
  logout: (refreshToken: string) => api.post('/auth/logout', { refreshToken }),
};

// Participants API (Admin only)
export const participantsApi = {
  getParticipants: () => api.get('/admin/participants'),
  createParticipant: (data: { name: string; phoneNumber: string }) =>
    api.post('/admin/participants', data),
  updateParticipant: (id: string, data: { name: string; phoneNumber: string }) =>
    api.put(`/admin/participants/${id}`, data),
  deleteParticipant: (id: string) => api.delete(`/admin/participants/${id}`),
};

// Sessions API (Admin)
export const adminSessionsApi = {
  getSessions: () => api.get('/admin/sessions'),
  getSession: (id: string) => api.get(`/admin/sessions/${id}`),
  createSession: (data: {
    title: string;
    description?: string;
    date: string;
    time: string;
    showResponsesToParticipants?: boolean;
  }) => api.post('/admin/sessions', data),
  updateSession: (
    id: string,
    data: {
      title: string;
      description?: string;
      date: string;
      time: string;
      showResponsesToParticipants?: boolean;
    }
  ) => api.put(`/admin/sessions/${id}`, data),
  deleteSession: (id: string) => api.delete(`/admin/sessions/${id}`),
  updateResponse: (
    sessionId: string,
    participantId: string,
    status: string
  ) =>
    api.put(`/admin/sessions/${sessionId}/responses/${participantId}`, {
      status,
    }),
};

// Sessions API (Participants)
export const participantSessionsApi = {
  getSessions: () => api.get('/participants/sessions'),
  getSession: (id: string) => api.get(`/participants/sessions/${id}`),
  submitResponse: (sessionId: string, status: string) =>
    api.post(`/participants/sessions/${sessionId}/responses`, { status }),
  deleteResponse: (sessionId: string) =>
    api.delete(`/participants/sessions/${sessionId}/responses`),
};

// Reports API (Admin only)
export const reportsApi = {
  getMonthlyReport: (year: number, month: number) =>
    api.get(`/reports/monthly/${year}/${month}`),
  getAvailableMonths: () => api.get('/reports/available-months'),
  getOverallStats: () => api.get('/reports/stats'),
};

export default api;