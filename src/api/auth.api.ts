import { apiClient } from './client';

export interface LoginPayload { email: string; password: string; }
export interface LoginResponse { accessToken: string; refreshToken: string; user: any; }

export const authApi = {
  login: (data: LoginPayload) => apiClient.post<{ data: LoginResponse }>('/auth/login', data),
  logout: (refreshToken?: string) => apiClient.post('/auth/logout', { refreshToken }),
  refresh: (refreshToken: string) => apiClient.post('/auth/refresh', { refreshToken }),
  forgotPassword: (email: string) => apiClient.post('/auth/forgot-password', { email }),
  resetPassword: (token: string, password: string, confirmPassword: string) => apiClient.post('/auth/reset-password', { token, password, confirmPassword }),
  changePassword: (currentPassword: string, newPassword: string, confirmPassword: string) => apiClient.post('/auth/change-password', { currentPassword, newPassword, confirmPassword }),
  getProfile: () => apiClient.get('/auth/me'),
  updateProfile: (data: any) => apiClient.put('/auth/me', data),
};
