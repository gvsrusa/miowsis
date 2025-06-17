import { api } from './api/apiClient';
import { API_CONFIG, buildUrl } from '@/config/api.config';
import { mockAuthService } from './mockAuthService';
import type {
  LoginCredentials,
  RegisterData,
  AuthResponse
} from './api/types';

// Re-export types for backward compatibility
export type { LoginCredentials, RegisterData, AuthResponse } from './api/types';

class AuthService {
  async login(credentials: LoginCredentials): Promise<{ data: AuthResponse }> {
    if (API_CONFIG.useMock) {
      return mockAuthService.login(credentials) as Promise<{ data: AuthResponse }>;
    }
    const data = await api.post<AuthResponse>(
      API_CONFIG.endpoints.auth.login,
      credentials
    );
    return { data };
  }

  async register(userData: RegisterData): Promise<{ data: AuthResponse }> {
    if (API_CONFIG.useMock) {
      return mockAuthService.register(userData) as Promise<{ data: AuthResponse }>;
    }
    const data = await api.post<AuthResponse>(
      API_CONFIG.endpoints.auth.register,
      userData
    );
    return { data };
  }

  async logout(): Promise<void> {
    if (API_CONFIG.useMock) {
      return mockAuthService.logout();
    }
    await api.post(API_CONFIG.endpoints.auth.logout);
  }

  async refreshToken(refreshToken: string): Promise<{ data: AuthResponse }> {
    if (API_CONFIG.useMock) {
      return mockAuthService.refreshToken(refreshToken) as Promise<{ data: AuthResponse }>;
    }
    const data = await api.post<AuthResponse>(
      API_CONFIG.endpoints.auth.refresh,
      { refreshToken }
    );
    return { data };
  }

  async verifyToken(): Promise<{ data: AuthResponse }> {
    if (API_CONFIG.useMock) {
      return mockAuthService.verifyToken() as Promise<{ data: AuthResponse }>;
    }
    const data = await api.get<AuthResponse>(
      API_CONFIG.endpoints.auth.verify
    );
    return { data };
  }

  async verifyEmail(token: string): Promise<string> {
    if (API_CONFIG.useMock) {
      return 'Email verified successfully';
    }
    return api.post(
      buildUrl(API_CONFIG.endpoints.auth.verifyEmail, { token })
    );
  }

  async forgotPassword(email: string): Promise<string> {
    if (API_CONFIG.useMock) {
      return 'Password reset link sent to email';
    }
    return api.post(
      API_CONFIG.endpoints.auth.forgotPassword,
      null,
      { params: { email } }
    );
  }

  async resetPassword(token: string, newPassword: string): Promise<string> {
    if (API_CONFIG.useMock) {
      return 'Password reset successfully';
    }
    return api.post(
      API_CONFIG.endpoints.auth.resetPassword,
      null,
      { params: { token, newPassword } }
    );
  }
}

export const authService = new AuthService();