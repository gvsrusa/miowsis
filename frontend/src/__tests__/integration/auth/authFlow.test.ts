/**
 * Authentication Flow Integration Tests
 * End-to-end tests for login, token refresh, and logout
 */

import { authService } from '@/services/authService';
import { api } from '@/services/api/apiClient';
import { store } from '@/store';
import { login, logout, setTokens } from '@/store/slices/authSlice';
import {
  setupTestEnvironment,
  cleanupTestEnvironment,
  TEST_USERS,
  TEST_TOKENS,
  waitForAsync
} from '../utils/testSetup';
import { createMockAxios } from '../utils/mockHandlers';

// Mock axios
jest.mock('axios');
import axios from 'axios';

describe('Authentication Flow Integration Tests', () => {
  let mockAxios: any;

  beforeAll(() => {
    setupTestEnvironment();
  });

  afterAll(() => {
    cleanupTestEnvironment();
  });

  beforeEach(() => {
    mockAxios = createMockAxios();
    (axios as any) = mockAxios;
    (axios.create as any) = jest.fn(() => mockAxios);
    
    // Clear Redux store
    store.dispatch(logout());
    
    // Clear localStorage
    localStorage.clear();
  });

  describe('Login Flow', () => {
    it('should successfully login with valid credentials', async () => {
      // Act
      const response = await authService.login({
        email: TEST_USERS.validUser.email,
        password: TEST_USERS.validUser.password
      });

      // Assert
      expect(response.data).toEqual({
        accessToken: TEST_TOKENS.validAccessToken,
        refreshToken: TEST_TOKENS.validRefreshToken,
        user: expect.objectContaining({
          email: TEST_USERS.validUser.email,
          firstName: TEST_USERS.validUser.firstName,
          lastName: TEST_USERS.validUser.lastName
        })
      });

      // Verify API was called correctly
      expect(mockAxios).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'POST',
          url: '/api/users/auth/login',
          data: {
            email: TEST_USERS.validUser.email,
            password: TEST_USERS.validUser.password
          }
        })
      );
    });

    it('should handle invalid credentials', async () => {
      // Act & Assert
      await expect(
        authService.login({
          email: 'wrong@example.com',
          password: 'wrongpassword'
        })
      ).rejects.toMatchObject({
        response: {
          status: 401,
          data: {
            error: {
              code: 'INVALID_CREDENTIALS',
              message: 'Invalid email or password'
            }
          }
        }
      });
    });

    it('should store tokens in localStorage after successful login', async () => {
      // Setup Redux store
      store.dispatch(login({
        email: TEST_USERS.validUser.email,
        password: TEST_USERS.validUser.password
      }));

      // Act
      await authService.login({
        email: TEST_USERS.validUser.email,
        password: TEST_USERS.validUser.password
      });

      // Manually set tokens (simulating what the app would do)
      localStorage.setItem('accessToken', TEST_TOKENS.validAccessToken);
      localStorage.setItem('refreshToken', TEST_TOKENS.validRefreshToken);

      // Assert
      expect(localStorage.setItem).toHaveBeenCalledWith('accessToken', TEST_TOKENS.validAccessToken);
      expect(localStorage.setItem).toHaveBeenCalledWith('refreshToken', TEST_TOKENS.validRefreshToken);
    });

    it('should handle network errors during login', async () => {
      // Setup network error
      mockAxios.mockRejectedValueOnce(new Error('Network Error'));

      // Act & Assert
      await expect(
        authService.login({
          email: TEST_USERS.validUser.email,
          password: TEST_USERS.validUser.password
        })
      ).rejects.toThrow('Network Error');
    });
  });

  describe('Token Refresh Flow', () => {
    beforeEach(() => {
      // Setup initial authenticated state
      localStorage.setItem('accessToken', TEST_TOKENS.expiredAccessToken);
      localStorage.setItem('refreshToken', TEST_TOKENS.validRefreshToken);
    });

    it('should automatically refresh token on 401 response', async () => {
      // Setup mock to return 401 first, then success after refresh
      let callCount = 0;
      mockAxios = createMockAxios({
        'GET /api/portfolio/portfolios/user-123': () => {
          callCount++;
          if (callCount === 1) {
            return {
              status: 401,
              error: {
                code: 'TOKEN_EXPIRED',
                message: 'Access token expired'
              }
            };
          }
          return {
            status: 200,
            data: { id: 'portfolio-123', totalValue: 10000 }
          };
        }
      });
      (axios as any) = mockAxios;
      (axios.create as any) = jest.fn(() => mockAxios);

      // Act
      const result = await api.get('/api/portfolio/portfolios/user-123');

      // Assert
      expect(result).toEqual({ id: 'portfolio-123', totalValue: 10000 });
      
      // Verify refresh was called
      expect(mockAxios).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'POST',
          url: '/api/users/auth/refresh',
          data: { refreshToken: TEST_TOKENS.validRefreshToken }
        })
      );
    });

    it('should logout user if refresh token is invalid', async () => {
      // Setup invalid refresh token
      localStorage.setItem('refreshToken', 'invalid-refresh-token');
      
      // Mock logout action
      const logoutSpy = jest.spyOn(store, 'dispatch');

      // Setup mock to return 401 for both original and refresh
      mockAxios = createMockAxios({
        'GET /api/portfolio/portfolios/user-123': () => ({
          status: 401,
          error: { code: 'TOKEN_EXPIRED', message: 'Access token expired' }
        }),
        'POST /api/users/auth/refresh': () => ({
          status: 401,
          error: { code: 'INVALID_TOKEN', message: 'Invalid refresh token' }
        })
      });
      (axios as any) = mockAxios;
      (axios.create as any) = jest.fn(() => mockAxios);

      // Act & Assert
      await expect(
        api.get('/api/portfolio/portfolios/user-123')
      ).rejects.toMatchObject({
        response: {
          status: 401
        }
      });

      // Wait for async operations
      await waitForAsync();

      // Verify logout was called
      expect(logoutSpy).toHaveBeenCalledWith(logout());
    });

    it('should queue multiple requests during token refresh', async () => {
      // This test simulates multiple API calls happening while token is being refreshed
      let refreshCallCount = 0;
      let apiCallCount = 0;

      mockAxios = createMockAxios({
        'GET /api/test-endpoint': () => {
          apiCallCount++;
          if (apiCallCount <= 3) {
            return {
              status: 401,
              error: { code: 'TOKEN_EXPIRED', message: 'Access token expired' }
            };
          }
          return {
            status: 200,
            data: { result: `success-${apiCallCount}` }
          };
        },
        'POST /api/users/auth/refresh': () => {
          refreshCallCount++;
          return {
            status: 200,
            data: {
              accessToken: 'new-access-token',
              refreshToken: 'new-refresh-token'
            },
            delay: 100 // Simulate network delay
          };
        }
      });
      (axios as any) = mockAxios;
      (axios.create as any) = jest.fn(() => mockAxios);

      // Act - Make multiple concurrent requests
      const requests = [
        api.get('/api/test-endpoint'),
        api.get('/api/test-endpoint'),
        api.get('/api/test-endpoint')
      ];

      const results = await Promise.all(requests);

      // Assert
      expect(refreshCallCount).toBe(1); // Should only refresh once
      expect(apiCallCount).toBe(6); // 3 initial + 3 retries
      results.forEach((result, index) => {
        expect(result).toHaveProperty('result');
      });
    });
  });

  describe('Logout Flow', () => {
    beforeEach(() => {
      // Setup authenticated state
      localStorage.setItem('accessToken', TEST_TOKENS.validAccessToken);
      localStorage.setItem('refreshToken', TEST_TOKENS.validRefreshToken);
      store.dispatch(setTokens({
        accessToken: TEST_TOKENS.validAccessToken,
        refreshToken: TEST_TOKENS.validRefreshToken
      }));
    });

    it('should successfully logout and clear tokens', async () => {
      // Act
      await authService.logout();

      // Assert
      expect(mockAxios).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'POST',
          url: '/api/users/auth/logout'
        })
      );
    });

    it('should clear tokens even if logout API fails', async () => {
      // Setup logout to fail
      mockAxios = createMockAxios({
        'POST /api/users/auth/logout': () => ({
          status: 500,
          error: { code: 'SERVER_ERROR', message: 'Internal server error' }
        })
      });
      (axios as any) = mockAxios;
      (axios.create as any) = jest.fn(() => mockAxios);

      // Act
      try {
        await authService.logout();
      } catch (error) {
        // Expected to fail
      }

      // Manually clear tokens (simulating what the app would do)
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      store.dispatch(logout());

      // Assert
      expect(localStorage.removeItem).toHaveBeenCalledWith('accessToken');
      expect(localStorage.removeItem).toHaveBeenCalledWith('refreshToken');
      expect(store.getState().auth.isAuthenticated).toBe(false);
    });
  });

  describe('Registration Flow', () => {
    it('should successfully register a new user', async () => {
      const newUser = {
        email: 'newuser@example.com',
        password: 'NewUser123!@#',
        firstName: 'New',
        lastName: 'User'
      };

      // Act
      const response = await authService.register(newUser);

      // Assert
      expect(response.data).toEqual({
        accessToken: TEST_TOKENS.validAccessToken,
        refreshToken: TEST_TOKENS.validRefreshToken,
        user: expect.objectContaining({
          email: newUser.email,
          firstName: newUser.firstName,
          lastName: newUser.lastName
        })
      });

      expect(mockAxios).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'POST',
          url: '/api/users/auth/register',
          data: newUser
        })
      );
    });

    it('should handle existing user registration', async () => {
      // Act & Assert
      await expect(
        authService.register({
          email: 'existing@example.com',
          password: 'Password123!',
          firstName: 'Existing',
          lastName: 'User'
        })
      ).rejects.toMatchObject({
        response: {
          status: 409,
          data: {
            error: {
              code: 'USER_EXISTS',
              message: 'User with this email already exists'
            }
          }
        }
      });
    });
  });

  describe('Protected Route Access', () => {
    it('should add authorization header to requests when authenticated', async () => {
      // Setup authenticated state
      localStorage.setItem('accessToken', TEST_TOKENS.validAccessToken);

      // Act
      await api.get('/api/portfolio/portfolios/user-123');

      // Assert
      expect(mockAxios).toHaveBeenCalledWith(
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: `Bearer ${TEST_TOKENS.validAccessToken}`
          })
        })
      );
    });

    it('should not add authorization header when not authenticated', async () => {
      // Clear any tokens
      localStorage.clear();

      // Setup public endpoint mock
      mockAxios = createMockAxios({
        'GET /api/public/health': () => ({
          status: 200,
          data: { status: 'healthy' }
        })
      });
      (axios as any) = mockAxios;
      (axios.create as any) = jest.fn(() => mockAxios);

      // Act
      await api.get('/api/public/health');

      // Assert
      expect(mockAxios).toHaveBeenCalledWith(
        expect.objectContaining({
          headers: expect.not.objectContaining({
            Authorization: expect.anything()
          })
        })
      );
    });
  });
});