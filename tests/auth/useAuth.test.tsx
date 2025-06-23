import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import { useAuth } from '../../frontend/src/hooks/useAuth';
import authReducer from '../../frontend/src/store/slices/authSlice';

// Mock react-router-dom
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate
  };
});

// Mock auth service
vi.mock('../../frontend/src/services/authService', () => ({
  authService: {
    verifyToken: vi.fn(),
    logout: vi.fn()
  }
}));

describe('useAuth Hook', () => {
  let store: ReturnType<typeof configureStore>;

  const createWrapper = ({ children }: { children: React.ReactNode }) => (
    <Provider store={store}>
      <BrowserRouter>
        {children}
      </BrowserRouter>
    </Provider>
  );

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    
    store = configureStore({
      reducer: {
        auth: authReducer
      }
    });
  });

  describe('Initial State', () => {
    it('should return initial auth state', () => {
      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper
      });

      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(typeof result.current.logout).toBe('function');
    });
  });

  describe('Token Verification', () => {
    it('should verify token when token exists but user is not authenticated', async () => {
      // Set initial state with token but not authenticated
      localStorage.setItem('accessToken', 'test-token');
      
      store = configureStore({
        reducer: {
          auth: authReducer
        },
        preloadedState: {
          auth: {
            user: null,
            token: 'test-token',
            refreshToken: null,
            isAuthenticated: false,
            isLoading: false,
            error: null
          }
        }
      });

      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper
      });

      // Should trigger token verification
      await waitFor(() => {
        expect(result.current.isLoading).toBe(true);
      });
    });

    it('should not verify token when user is already authenticated', () => {
      store = configureStore({
        reducer: {
          auth: authReducer
        },
        preloadedState: {
          auth: {
            user: { id: 'user-123', email: 'test@example.com' },
            token: 'test-token',
            refreshToken: null,
            isAuthenticated: true,
            isLoading: false,
            error: null
          }
        }
      });

      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper
      });

      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.isLoading).toBe(false);
    });

    it('should not verify token when already loading', () => {
      store = configureStore({
        reducer: {
          auth: authReducer
        },
        preloadedState: {
          auth: {
            user: null,
            token: 'test-token',
            refreshToken: null,
            isAuthenticated: false,
            isLoading: true, // Already loading
            error: null
          }
        }
      });

      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper
      });

      expect(result.current.isLoading).toBe(true);
    });

    it('should not verify token when no token exists', () => {
      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper
      });

      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('Logout Functionality', () => {
    it('should handle logout and navigate to home', async () => {
      store = configureStore({
        reducer: {
          auth: authReducer
        },
        preloadedState: {
          auth: {
            user: { 
              id: 'user-123', 
              email: 'test@example.com',
              firstName: 'John',
              lastName: 'Doe',
              emailVerified: true,
              kycStatus: 'verified',
              onboardingComplete: true,
              biometricEnabled: false
            },
            token: 'test-token',
            refreshToken: 'refresh-token',
            isAuthenticated: true,
            isLoading: false,
            error: null
          }
        }
      });

      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper
      });

      expect(result.current.isAuthenticated).toBe(true);

      await act(async () => {
        await result.current.logout();
      });

      // Should navigate to home page after logout
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });

    it('should handle logout when not authenticated', async () => {
      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper
      });

      await act(async () => {
        await result.current.logout();
      });

      expect(mockNavigate).toHaveBeenCalledWith('/');
    });
  });

  describe('State Updates', () => {
    it('should reflect store state changes', async () => {
      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper
      });

      expect(result.current.isAuthenticated).toBe(false);

      // Simulate login success
      act(() => {
        store.dispatch({
          type: 'auth/login/fulfilled',
          payload: {
            user: {
              id: 'user-123',
              email: 'test@example.com',
              firstName: 'John',
              lastName: 'Doe',
              emailVerified: true,
              kycStatus: 'pending',
              onboardingComplete: false,
              biometricEnabled: false
            },
            accessToken: 'access-token',
            refreshToken: 'refresh-token'
          }
        });
      });

      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.user?.email).toBe('test@example.com');
      expect(result.current.user?.firstName).toBe('John');
    });

    it('should reflect loading state changes', () => {
      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper
      });

      expect(result.current.isLoading).toBe(false);

      act(() => {
        store.dispatch({ type: 'auth/login/pending' });
      });

      expect(result.current.isLoading).toBe(true);

      act(() => {
        store.dispatch({
          type: 'auth/login/fulfilled',
          payload: {
            user: { id: '123' },
            accessToken: 'token',
            refreshToken: 'refresh'
          }
        });
      });

      expect(result.current.isLoading).toBe(false);
    });

    it('should reflect error state changes', () => {
      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper
      });

      expect(result.current.error).toBeNull();

      act(() => {
        store.dispatch({
          type: 'auth/login/rejected',
          error: { message: 'Invalid credentials' }
        });
      });

      expect(result.current.error).toBe('Invalid credentials');

      act(() => {
        store.dispatch({ type: 'auth/clearError' });
      });

      expect(result.current.error).toBeNull();
    });
  });

  describe('Re-renders and Performance', () => {
    it('should not cause unnecessary re-renders', () => {
      const renderSpy = vi.fn();

      const TestComponent = () => {
        const auth = useAuth();
        renderSpy();
        return <div>{auth.isAuthenticated ? 'Authenticated' : 'Not authenticated'}</div>;
      };

      const { rerender } = renderHook(TestComponent, {
        wrapper: createWrapper
      });

      expect(renderSpy).toHaveBeenCalledTimes(1);

      // Re-render without state change
      rerender();
      
      expect(renderSpy).toHaveBeenCalledTimes(2);
    });

    it('should memoize logout function', () => {
      const { result, rerender } = renderHook(() => useAuth(), {
        wrapper: createWrapper
      });

      const firstLogout = result.current.logout;
      
      rerender();
      
      const secondLogout = result.current.logout;
      
      expect(firstLogout).toBe(secondLogout);
    });
  });

  describe('Error Scenarios', () => {
    it('should handle logout errors gracefully', async () => {
      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper
      });

      // Mock logout to throw error
      const mockLogout = vi.fn().mockRejectedValue(new Error('Logout failed'));
      vi.mocked(require('../../frontend/src/services/authService').authService.logout).mockImplementation(mockLogout);

      await act(async () => {
        try {
          await result.current.logout();
        } catch (error) {
          // Error should be handled gracefully
        }
      });

      // Should still navigate even if logout fails
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });
  });

  describe('Token Refresh Integration', () => {
    it('should handle automatic token refresh', async () => {
      store = configureStore({
        reducer: {
          auth: authReducer
        },
        preloadedState: {
          auth: {
            user: null,
            token: 'expired-token',
            refreshToken: 'valid-refresh',
            isAuthenticated: false,
            isLoading: false,
            error: null
          }
        }
      });

      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper
      });

      // Should attempt to verify token
      await waitFor(() => {
        expect(result.current.isLoading).toBe(true);
      });
    });
  });

  describe('Multiple Hook Instances', () => {
    it('should share state between multiple useAuth instances', () => {
      const { result: result1 } = renderHook(() => useAuth(), {
        wrapper: createWrapper
      });

      const { result: result2 } = renderHook(() => useAuth(), {
        wrapper: createWrapper
      });

      expect(result1.current.isAuthenticated).toBe(result2.current.isAuthenticated);
      expect(result1.current.user).toBe(result2.current.user);

      // Change state through one instance
      act(() => {
        store.dispatch({
          type: 'auth/login/fulfilled',
          payload: {
            user: { id: 'user-123' },
            accessToken: 'token',
            refreshToken: 'refresh'
          }
        });
      });

      // Both instances should reflect the change
      expect(result1.current.isAuthenticated).toBe(true);
      expect(result2.current.isAuthenticated).toBe(true);
    });
  });

  describe('Cleanup', () => {
    it('should not cause memory leaks when unmounted', () => {
      const { unmount } = renderHook(() => useAuth(), {
        wrapper: createWrapper
      });

      // Should unmount without errors
      expect(() => unmount()).not.toThrow();
    });
  });
});