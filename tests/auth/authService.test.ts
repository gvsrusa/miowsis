import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import { authService } from '../../frontend/src/services/authService';

// Mock Supabase client
vi.mock('@supabase/supabase-js');

const mockSupabase = {
  auth: {
    signUp: vi.fn(),
    signInWithPassword: vi.fn(),
    signOut: vi.fn(),
    getSession: vi.fn(),
    refreshSession: vi.fn(),
    resetPasswordForEmail: vi.fn(),
    onAuthStateChange: vi.fn(() => ({
      data: { subscription: { unsubscribe: vi.fn() } }
    }))
  }
};

vi.mocked(createClient).mockReturnValue(mockSupabase as any);

describe('AuthService with Supabase', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('User Registration', () => {
    it('should successfully register a new user', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        user_metadata: {
          firstName: 'John',
          lastName: 'Doe'
        }
      };

      const mockSession = {
        access_token: 'access-token-123',
        refresh_token: 'refresh-token-123',
        user: mockUser
      };

      mockSupabase.auth.signUp.mockResolvedValue({
        data: { user: mockUser, session: mockSession },
        error: null
      });

      const userData = {
        email: 'test@example.com',
        password: 'Password123!',
        firstName: 'John',
        lastName: 'Doe'
      };

      const result = await authService.register(userData);

      expect(mockSupabase.auth.signUp).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'Password123!',
        options: {
          data: {
            firstName: 'John',
            lastName: 'Doe'
          }
        }
      });

      expect(result.data.accessToken).toBe('access-token-123');
      expect(result.data.user.email).toBe('test@example.com');
    });

    it('should handle registration errors', async () => {
      mockSupabase.auth.signUp.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Email already registered' }
      });

      const userData = {
        email: 'existing@example.com',
        password: 'Password123!',
        firstName: 'John',
        lastName: 'Doe'
      };

      await expect(authService.register(userData)).rejects.toThrow('Email already registered');
    });

    it('should validate password strength', async () => {
      const userData = {
        email: 'test@example.com',
        password: '123', // Weak password
        firstName: 'John',
        lastName: 'Doe'
      };

      await expect(authService.register(userData)).rejects.toThrow('Password does not meet requirements');
    });

    it('should validate email format', async () => {
      const userData = {
        email: 'invalid-email',
        password: 'Password123!',
        firstName: 'John',
        lastName: 'Doe'
      };

      await expect(authService.register(userData)).rejects.toThrow('Invalid email format');
    });
  });

  describe('User Login', () => {
    it('should successfully login with valid credentials', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        user_metadata: {
          firstName: 'John',
          lastName: 'Doe'
        }
      };

      const mockSession = {
        access_token: 'access-token-123',
        refresh_token: 'refresh-token-123',
        user: mockUser
      };

      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: mockUser, session: mockSession },
        error: null
      });

      const credentials = {
        email: 'test@example.com',
        password: 'Password123!'
      };

      const result = await authService.login(credentials);

      expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'Password123!'
      });

      expect(result.data.accessToken).toBe('access-token-123');
      expect(result.data.user.email).toBe('test@example.com');
    });

    it('should handle invalid credentials', async () => {
      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Invalid login credentials' }
      });

      const credentials = {
        email: 'test@example.com',
        password: 'wrongpassword'
      };

      await expect(authService.login(credentials)).rejects.toThrow('Invalid login credentials');
    });

    it('should handle network errors during login', async () => {
      mockSupabase.auth.signInWithPassword.mockRejectedValue(new Error('Network error'));

      const credentials = {
        email: 'test@example.com',
        password: 'Password123!'
      };

      await expect(authService.login(credentials)).rejects.toThrow('Network error');
    });
  });

  describe('User Logout', () => {
    it('should successfully logout user', async () => {
      mockSupabase.auth.signOut.mockResolvedValue({
        error: null
      });

      await authService.logout();

      expect(mockSupabase.auth.signOut).toHaveBeenCalled();
    });

    it('should handle logout errors gracefully', async () => {
      mockSupabase.auth.signOut.mockResolvedValue({
        error: { message: 'Logout failed' }
      });

      // Should not throw, just log the error
      await expect(authService.logout()).resolves.not.toThrow();
    });
  });

  describe('Token Management', () => {
    it('should refresh token successfully', async () => {
      const mockSession = {
        access_token: 'new-access-token',
        refresh_token: 'new-refresh-token',
        user: { id: 'user-123', email: 'test@example.com' }
      };

      mockSupabase.auth.refreshSession.mockResolvedValue({
        data: { session: mockSession, user: mockSession.user },
        error: null
      });

      const result = await authService.refreshToken('old-refresh-token');

      expect(mockSupabase.auth.refreshSession).toHaveBeenCalledWith({
        refresh_token: 'old-refresh-token'
      });

      expect(result.data.accessToken).toBe('new-access-token');
    });

    it('should handle invalid refresh token', async () => {
      mockSupabase.auth.refreshSession.mockResolvedValue({
        data: { session: null, user: null },
        error: { message: 'Invalid refresh token' }
      });

      await expect(authService.refreshToken('invalid-token')).rejects.toThrow('Invalid refresh token');
    });

    it('should verify valid token', async () => {
      const mockSession = {
        access_token: 'valid-token',
        user: { id: 'user-123', email: 'test@example.com' }
      };

      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null
      });

      const result = await authService.verifyToken();

      expect(result.data.user.email).toBe('test@example.com');
    });

    it('should handle expired token verification', async () => {
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: { message: 'Token expired' }
      });

      await expect(authService.verifyToken()).rejects.toThrow('Token expired');
    });
  });

  describe('Password Reset', () => {
    it('should send password reset email', async () => {
      mockSupabase.auth.resetPasswordForEmail.mockResolvedValue({
        data: {},
        error: null
      });

      await authService.resetPassword('test@example.com');

      expect(mockSupabase.auth.resetPasswordForEmail).toHaveBeenCalledWith('test@example.com');
    });

    it('should handle password reset errors', async () => {
      mockSupabase.auth.resetPasswordForEmail.mockResolvedValue({
        data: {},
        error: { message: 'Email not found' }
      });

      await expect(authService.resetPassword('nonexistent@example.com')).rejects.toThrow('Email not found');
    });
  });

  describe('Session Persistence', () => {
    it('should persist session in localStorage', async () => {
      const mockSession = {
        access_token: 'access-token-123',
        refresh_token: 'refresh-token-123',
        user: { id: 'user-123', email: 'test@example.com' }
      };

      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: mockSession.user, session: mockSession },
        error: null
      });

      const credentials = {
        email: 'test@example.com',
        password: 'Password123!'
      };

      await authService.login(credentials);

      expect(localStorage.getItem('supabase.auth.token')).toBeTruthy();
    });

    it('should clear session from localStorage on logout', async () => {
      localStorage.setItem('supabase.auth.token', 'some-token');

      mockSupabase.auth.signOut.mockResolvedValue({
        error: null
      });

      await authService.logout();

      expect(localStorage.getItem('supabase.auth.token')).toBeNull();
    });
  });

  describe('Auth State Changes', () => {
    it('should set up auth state listener', () => {
      authService.onAuthStateChange(vi.fn());

      expect(mockSupabase.auth.onAuthStateChange).toHaveBeenCalled();
    });

    it('should handle auth state change events', () => {
      const callback = vi.fn();
      const mockStateChange = vi.fn((event, callback) => {
        callback('SIGNED_IN', { access_token: 'token', user: { id: '123' } });
        return { data: { subscription: { unsubscribe: vi.fn() } } };
      });

      mockSupabase.auth.onAuthStateChange.mockImplementation(mockStateChange);

      authService.onAuthStateChange(callback);

      expect(callback).toHaveBeenCalledWith('SIGNED_IN', expect.any(Object));
    });
  });

  describe('Error Handling', () => {
    it('should handle network connectivity issues', async () => {
      mockSupabase.auth.signInWithPassword.mockRejectedValue(new Error('Network error'));

      const credentials = {
        email: 'test@example.com',
        password: 'Password123!'
      };

      await expect(authService.login(credentials)).rejects.toThrow('Network error');
    });

    it('should handle Supabase service errors', async () => {
      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Service temporarily unavailable', status: 503 }
      });

      const credentials = {
        email: 'test@example.com',
        password: 'Password123!'
      };

      await expect(authService.login(credentials)).rejects.toThrow('Service temporarily unavailable');
    });
  });

  describe('Input Validation', () => {
    it('should sanitize email input', async () => {
      const credentials = {
        email: '  TEST@EXAMPLE.COM  ',
        password: 'Password123!'
      };

      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: { id: '123', email: 'test@example.com' }, session: {} },
        error: null
      });

      await authService.login(credentials);

      expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com', // Should be trimmed and lowercased
        password: 'Password123!'
      });
    });

    it('should prevent XSS in user metadata', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'Password123!',
        firstName: '<script>alert("xss")</script>',
        lastName: 'Doe'
      };

      await expect(authService.register(userData)).rejects.toThrow('Invalid characters in name');
    });
  });
});