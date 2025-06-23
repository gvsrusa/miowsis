import { describe, it, expect, vi, beforeEach } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';
import authReducer, {
  login,
  register,
  logout,
  refreshAccessToken,
  verifyToken,
  clearError,
  updateUser,
  User
} from '../../frontend/src/store/slices/authSlice';

// Mock the auth service
vi.mock('../../frontend/src/services/authService', () => ({
  authService: {
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    refreshToken: vi.fn(),
    verifyToken: vi.fn()
  }
}));

describe('Auth Slice', () => {
  let store: ReturnType<typeof configureStore>;

  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    
    // Create a fresh store for each test
    store = configureStore({
      reducer: {
        auth: authReducer
      }
    });
  });

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      const state = store.getState().auth;
      
      expect(state.user).toBeNull();
      expect(state.token).toBeNull();
      expect(state.refreshToken).toBeNull();
      expect(state.isAuthenticated).toBe(false);
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
    });

    it('should load tokens from localStorage on initialization', () => {
      localStorage.setItem('accessToken', 'stored-access-token');
      localStorage.setItem('refreshToken', 'stored-refresh-token');

      const storeWithTokens = configureStore({
        reducer: {
          auth: authReducer
        }
      });

      const state = storeWithTokens.getState().auth;
      expect(state.token).toBe('stored-access-token');
      expect(state.refreshToken).toBe('stored-refresh-token');
    });
  });

  describe('Synchronous Actions', () => {
    it('should clear error', () => {
      // First set an error
      store.dispatch({ type: 'auth/login/rejected', error: { message: 'Test error' } });
      
      // Then clear it
      store.dispatch(clearError());
      
      const state = store.getState().auth;
      expect(state.error).toBeNull();
    });

    it('should update user data', () => {
      const initialUser: User = {
        id: 'user-123',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        emailVerified: false,
        kycStatus: 'pending',
        onboardingComplete: false,
        biometricEnabled: false
      };

      // Set initial user
      store.dispatch({
        type: 'auth/login/fulfilled',
        payload: {
          user: initialUser,
          accessToken: 'token',
          refreshToken: 'refresh'
        }
      });

      const updateData = {
        firstName: 'Jane',
        emailVerified: true,
        onboardingComplete: true
      };

      store.dispatch(updateUser(updateData));

      const state = store.getState().auth;
      expect(state.user?.firstName).toBe('Jane');
      expect(state.user?.emailVerified).toBe(true);
      expect(state.user?.onboardingComplete).toBe(true);
      // Other fields should remain unchanged
      expect(state.user?.lastName).toBe('Doe');
      expect(state.user?.email).toBe('test@example.com');
    });

    it('should not update user when user is null', () => {
      store.dispatch(updateUser({ firstName: 'Jane' }));
      
      const state = store.getState().auth;
      expect(state.user).toBeNull();
    });
  });

  describe('Login Async Action', () => {
    it('should handle login pending state', () => {
      store.dispatch({ type: login.pending.type });
      
      const state = store.getState().auth;
      expect(state.isLoading).toBe(true);
      expect(state.error).toBeNull();
    });

    it('should handle successful login', () => {
      const mockAuthResponse = {
        user: {
          id: 'user-123',
          email: 'test@example.com',
          firstName: 'John',
          lastName: 'Doe',
          emailVerified: true,
          kycStatus: 'pending' as const,
          onboardingComplete: false,
          biometricEnabled: false
        },
        accessToken: 'access-token-123',
        refreshToken: 'refresh-token-123'
      };

      store.dispatch({
        type: login.fulfilled.type,
        payload: mockAuthResponse
      });

      const state = store.getState().auth;
      expect(state.isLoading).toBe(false);
      expect(state.isAuthenticated).toBe(true);
      expect(state.user).toEqual(mockAuthResponse.user);
      expect(state.token).toBe('access-token-123');
      expect(state.refreshToken).toBe('refresh-token-123');
      
      // Check localStorage
      expect(localStorage.getItem('accessToken')).toBe('access-token-123');
      expect(localStorage.getItem('refreshToken')).toBe('refresh-token-123');
    });

    it('should handle login failure', () => {
      const errorMessage = 'Invalid credentials';
      
      store.dispatch({
        type: login.rejected.type,
        error: { message: errorMessage }
      });

      const state = store.getState().auth;
      expect(state.isLoading).toBe(false);
      expect(state.error).toBe(errorMessage);
      expect(state.isAuthenticated).toBe(false);
    });

    it('should handle login failure with default message', () => {
      store.dispatch({
        type: login.rejected.type,
        error: {}
      });

      const state = store.getState().auth;
      expect(state.error).toBe('Login failed');
    });
  });

  describe('Register Async Action', () => {
    it('should handle register pending state', () => {
      store.dispatch({ type: register.pending.type });
      
      const state = store.getState().auth;
      expect(state.isLoading).toBe(true);
      expect(state.error).toBeNull();
    });

    it('should handle successful registration', () => {
      const mockAuthResponse = {
        user: {
          id: 'user-123',
          email: 'new@example.com',
          firstName: 'Jane',
          lastName: 'Smith',
          emailVerified: false,
          kycStatus: 'pending' as const,
          onboardingComplete: false,
          biometricEnabled: false
        },
        accessToken: 'access-token-456',
        refreshToken: 'refresh-token-456'
      };

      store.dispatch({
        type: register.fulfilled.type,
        payload: mockAuthResponse
      });

      const state = store.getState().auth;
      expect(state.isLoading).toBe(false);
      expect(state.isAuthenticated).toBe(true);
      expect(state.user).toEqual(mockAuthResponse.user);
      expect(state.token).toBe('access-token-456');
      expect(state.refreshToken).toBe('refresh-token-456');
      
      // Check localStorage
      expect(localStorage.getItem('accessToken')).toBe('access-token-456');
      expect(localStorage.getItem('refreshToken')).toBe('refresh-token-456');
    });

    it('should handle registration failure', () => {
      const errorMessage = 'Email already exists';
      
      store.dispatch({
        type: register.rejected.type,
        error: { message: errorMessage }
      });

      const state = store.getState().auth;
      expect(state.isLoading).toBe(false);
      expect(state.error).toBe(errorMessage);
      expect(state.isAuthenticated).toBe(false);
    });
  });

  describe('Logout Async Action', () => {
    it('should handle successful logout', () => {
      // First login
      const mockAuthResponse = {
        user: {
          id: 'user-123',
          email: 'test@example.com',
          firstName: 'John',
          lastName: 'Doe',
          emailVerified: true,
          kycStatus: 'pending' as const,
          onboardingComplete: false,
          biometricEnabled: false
        },
        accessToken: 'access-token-123',
        refreshToken: 'refresh-token-123'
      };

      store.dispatch({
        type: login.fulfilled.type,
        payload: mockAuthResponse
      });

      // Then logout
      store.dispatch({ type: logout.fulfilled.type });

      const state = store.getState().auth;
      expect(state.user).toBeNull();
      expect(state.token).toBeNull();
      expect(state.refreshToken).toBeNull();
      expect(state.isAuthenticated).toBe(false);
      
      // Check localStorage is cleared
      expect(localStorage.getItem('accessToken')).toBeNull();
      expect(localStorage.getItem('refreshToken')).toBeNull();
    });
  });

  describe('Token Verification Async Action', () => {
    it('should handle token verification pending state', () => {
      store.dispatch({ type: verifyToken.pending.type });
      
      const state = store.getState().auth;
      expect(state.isLoading).toBe(true);
    });

    it('should handle successful token verification', () => {
      const mockAuthResponse = {
        user: {
          id: 'user-123',
          email: 'test@example.com',
          firstName: 'John',
          lastName: 'Doe',
          emailVerified: true,
          kycStatus: 'verified' as const,
          onboardingComplete: true,
          biometricEnabled: true
        },
        accessToken: 'verified-token',
        refreshToken: 'verified-refresh'
      };

      store.dispatch({
        type: verifyToken.fulfilled.type,
        payload: mockAuthResponse
      });

      const state = store.getState().auth;
      expect(state.isLoading).toBe(false);
      expect(state.isAuthenticated).toBe(true);
      expect(state.user).toEqual(mockAuthResponse.user);
    });

    it('should handle failed token verification', () => {
      // Set initial authenticated state
      localStorage.setItem('accessToken', 'invalid-token');
      localStorage.setItem('refreshToken', 'invalid-refresh');

      store.dispatch({
        type: login.fulfilled.type,
        payload: {
          user: { id: '123' },
          accessToken: 'invalid-token',
          refreshToken: 'invalid-refresh'
        }
      });

      // Verify token fails
      store.dispatch({ type: verifyToken.rejected.type });

      const state = store.getState().auth;
      expect(state.isLoading).toBe(false);
      expect(state.isAuthenticated).toBe(false);
      expect(state.token).toBeNull();
      expect(state.refreshToken).toBeNull();
      
      // Check localStorage is cleared
      expect(localStorage.getItem('accessToken')).toBeNull();
      expect(localStorage.getItem('refreshToken')).toBeNull();
    });
  });

  describe('Token Refresh Async Action', () => {
    it('should handle successful token refresh', () => {
      const mockRefreshResponse = {
        user: {
          id: 'user-123',
          email: 'test@example.com',
          firstName: 'John',
          lastName: 'Doe',
          emailVerified: true,
          kycStatus: 'verified' as const,
          onboardingComplete: true,
          biometricEnabled: false
        },
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token'
      };

      store.dispatch({
        type: refreshAccessToken.fulfilled.type,
        payload: mockRefreshResponse
      });

      const state = store.getState().auth;
      expect(state.isAuthenticated).toBe(true);
      expect(state.token).toBe('new-access-token');
      expect(state.refreshToken).toBe('new-refresh-token');
      expect(state.user).toEqual(mockRefreshResponse.user);
      
      // Check localStorage is updated
      expect(localStorage.getItem('accessToken')).toBe('new-access-token');
      expect(localStorage.getItem('refreshToken')).toBe('new-refresh-token');
    });

    it('should handle failed token refresh', () => {
      // Set initial state with tokens
      store.dispatch({
        type: login.fulfilled.type,
        payload: {
          user: { id: '123' },
          accessToken: 'old-token',
          refreshToken: 'old-refresh'
        }
      });

      // Refresh fails
      store.dispatch({ type: refreshAccessToken.rejected.type });

      const state = store.getState().auth;
      expect(state.isAuthenticated).toBe(false);
      expect(state.token).toBeNull();
      expect(state.refreshToken).toBeNull();
      expect(state.user).toBeNull();
      
      // Check localStorage is cleared
      expect(localStorage.getItem('accessToken')).toBeNull();
      expect(localStorage.getItem('refreshToken')).toBeNull();
    });
  });

  describe('Error State Management', () => {
    it('should clear error on successful actions', () => {
      // Set an error first
      store.dispatch({
        type: login.rejected.type,
        error: { message: 'Previous error' }
      });

      expect(store.getState().auth.error).toBe('Previous error');

      // Successful action should clear error
      store.dispatch({ type: login.pending.type });

      expect(store.getState().auth.error).toBeNull();
    });

    it('should maintain error state until cleared or new action', () => {
      const errorMessage = 'Test error';
      
      store.dispatch({
        type: login.rejected.type,
        error: { message: errorMessage }
      });

      const state1 = store.getState().auth;
      expect(state1.error).toBe(errorMessage);

      // Error should persist
      const state2 = store.getState().auth;
      expect(state2.error).toBe(errorMessage);

      // Clear error
      store.dispatch(clearError());
      
      const state3 = store.getState().auth;
      expect(state3.error).toBeNull();
    });
  });

  describe('Loading State Management', () => {
    it('should set loading true on pending actions', () => {
      const actions = [
        login.pending.type,
        register.pending.type,
        verifyToken.pending.type
      ];

      actions.forEach(actionType => {
        store.dispatch({ type: actionType });
        expect(store.getState().auth.isLoading).toBe(true);
      });
    });

    it('should set loading false on fulfilled actions', () => {
      const mockPayload = {
        user: { id: '123' },
        accessToken: 'token',
        refreshToken: 'refresh'
      };

      // Test login
      store.dispatch({ type: login.pending.type });
      expect(store.getState().auth.isLoading).toBe(true);
      
      store.dispatch({ type: login.fulfilled.type, payload: mockPayload });
      expect(store.getState().auth.isLoading).toBe(false);

      // Test register
      store.dispatch({ type: register.pending.type });
      expect(store.getState().auth.isLoading).toBe(true);
      
      store.dispatch({ type: register.fulfilled.type, payload: mockPayload });
      expect(store.getState().auth.isLoading).toBe(false);
    });

    it('should set loading false on rejected actions', () => {
      store.dispatch({ type: login.pending.type });
      expect(store.getState().auth.isLoading).toBe(true);
      
      store.dispatch({ type: login.rejected.type, error: { message: 'Error' } });
      expect(store.getState().auth.isLoading).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    it('should handle undefined localStorage values', () => {
      // Simulate environment where localStorage might return undefined
      const originalGetItem = localStorage.getItem;
      localStorage.getItem = vi.fn(() => undefined);

      const storeWithUndefined = configureStore({
        reducer: {
          auth: authReducer
        }
      });

      const state = storeWithUndefined.getState().auth;
      expect(state.token).toBeNull();
      expect(state.refreshToken).toBeNull();

      // Restore original method
      localStorage.getItem = originalGetItem;
    });

    it('should handle malformed user data', () => {
      const malformedPayload = {
        user: null, // User is null but we have tokens
        accessToken: 'token',
        refreshToken: 'refresh'
      };

      store.dispatch({
        type: login.fulfilled.type,
        payload: malformedPayload
      });

      const state = store.getState().auth;
      expect(state.user).toBeNull();
      expect(state.token).toBe('token');
      expect(state.isAuthenticated).toBe(true); // Still authenticated with tokens
    });
  });
});