import axios from 'axios';
import { mockAuthService } from './mockAuthService';

const API_URL = '/api/users/auth';
const USE_MOCK = true; // Set to false when backend is available

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    profileImage?: string;
    emailVerified: boolean;
    kycStatus: 'pending' | 'verified' | 'rejected';
    onboardingComplete: boolean;
    biometricEnabled: boolean;
  };
}

class AuthService {
  async login(credentials: LoginCredentials): Promise<{ data: AuthResponse }> {
    if (USE_MOCK) {
      return mockAuthService.login(credentials) as Promise<{ data: AuthResponse }>;
    }
    const response = await axios.post(`${API_URL}/login`, credentials);
    return response;
  }

  async register(userData: RegisterData): Promise<{ data: AuthResponse }> {
    if (USE_MOCK) {
      return mockAuthService.register(userData) as Promise<{ data: AuthResponse }>;
    }
    const response = await axios.post(`${API_URL}/register`, userData);
    return response;
  }

  async logout(): Promise<void> {
    if (USE_MOCK) {
      return mockAuthService.logout();
    }
    const token = localStorage.getItem('accessToken');
    if (token) {
      await axios.post(`${API_URL}/logout`, null, {
        headers: { Authorization: `Bearer ${token}` }
      });
    }
  }

  async refreshToken(refreshToken: string): Promise<{ data: AuthResponse }> {
    if (USE_MOCK) {
      return mockAuthService.refreshToken(refreshToken) as Promise<{ data: AuthResponse }>;
    }
    const response = await axios.post(`${API_URL}/refresh`, { refreshToken });
    return response;
  }

  async verifyToken(): Promise<{ data: AuthResponse }> {
    if (USE_MOCK) {
      return mockAuthService.verifyToken() as Promise<{ data: AuthResponse }>;
    }
    const token = localStorage.getItem('accessToken');
    const response = await axios.get(`${API_URL}/verify`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response;
  }
}

export const authService = new AuthService();