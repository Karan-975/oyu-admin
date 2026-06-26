import axios from 'axios';
import { useAuthStore } from '../stores/auth.store';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

let refreshTokenPromise: Promise<{ accessToken: string; refreshToken: string }> | null = null;

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
});

// Request interceptor - attach access token
apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Response interceptor - auto-refresh on 401
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = useAuthStore.getState().refreshToken;

      if (refreshToken) {
        try {
          if (!refreshTokenPromise) {
            refreshTokenPromise = axios
              .post(`${API_BASE_URL}/auth/refresh`, { refreshToken })
              .then((response) => response.data.data as { accessToken: string; refreshToken: string })
              .finally(() => {
                refreshTokenPromise = null;
              });
          }

          const tokens = await refreshTokenPromise;
          useAuthStore.getState().setTokens(tokens.accessToken, tokens.refreshToken);
          originalRequest.headers = originalRequest.headers ?? {};
          originalRequest.headers.Authorization = `Bearer ${tokens.accessToken}`;
          return apiClient(originalRequest);
        } catch {
          refreshTokenPromise = null;
          useAuthStore.getState().logout();
          window.location.href = '/login';
        }
      } else {
        useAuthStore.getState().logout();
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);
