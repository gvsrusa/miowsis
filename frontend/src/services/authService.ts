import { supabaseAuthService } from './supabaseAuthService';
import type { User, AuthResponse as SupabaseAuthResponse } from './supabaseAuthService';

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
  user: User;
}

class AuthService {
  async login(credentials: LoginCredentials): Promise<{ data: AuthResponse }> {
    try {
      const response = await supabaseAuthService.login(credentials);
      return {
        data: {
          accessToken: response.session.access_token,
          refreshToken: response.session.refresh_token,
          user: response.user,
        },
      };
    } catch (error) {
      console.error('Auth service login error:', error);
      throw error;
    }
  }

  async register(userData: RegisterData): Promise<{ data: AuthResponse }> {
    try {
      const response = await supabaseAuthService.register(userData);
      return {
        data: {
          accessToken: response.session.access_token,
          refreshToken: response.session.refresh_token,
          user: response.user,
        },
      };
    } catch (error) {
      console.error('Auth service register error:', error);
      throw error;
    }
  }

  async logout(): Promise<void> {
    try {
      await supabaseAuthService.logout();
    } catch (error) {
      console.error('Auth service logout error:', error);
      throw error;
    }
  }

  async refreshToken(refreshToken: string): Promise<{ data: AuthResponse }> {
    try {
      const response = await supabaseAuthService.refreshSession();
      if (!response) {
        throw new Error('Failed to refresh token');
      }
      return {
        data: {
          accessToken: response.session.access_token,
          refreshToken: response.session.refresh_token,
          user: response.user,
        },
      };
    } catch (error) {
      console.error('Auth service refresh token error:', error);
      throw error;
    }
  }

  async verifyToken(): Promise<{ data: AuthResponse }> {
    try {
      const response = await supabaseAuthService.getCurrentSession();
      if (!response) {
        throw new Error('No valid session found');
      }
      return {
        data: {
          accessToken: response.session.access_token,
          refreshToken: response.session.refresh_token,
          user: response.user,
        },
      };
    } catch (error) {
      console.error('Auth service verify token error:', error);
      throw error;
    }
  }

  async signInWithGoogle(): Promise<void> {
    try {
      await supabaseAuthService.signInWithGoogle();
    } catch (error) {
      console.error('Auth service Google sign-in error:', error);
      throw error;
    }
  }

  async resetPassword(email: string): Promise<void> {
    try {
      await supabaseAuthService.resetPassword(email);
    } catch (error) {
      console.error('Auth service reset password error:', error);
      throw error;
    }
  }

  async updateProfile(updates: Partial<User>): Promise<User> {
    try {
      return await supabaseAuthService.updateUserProfile(updates);
    } catch (error) {
      console.error('Auth service update profile error:', error);
      throw error;
    }
  }
}

export const authService = new AuthService();