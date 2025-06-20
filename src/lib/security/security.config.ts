/**
 * Unified Security Configuration for MIOwSIS
 * 
 * This file consolidates all security configurations and ensures
 * proper integration between authentication, CSRF protection, RBAC,
 * and other security features.
 */

import type { UserRole } from '@/lib/rbac'

// Security feature flags
export const SECURITY_FEATURES = {
  CSRF_PROTECTION: true,
  RBAC_ENABLED: true,
  CORS_ENABLED: true,
  SECURITY_HEADERS: true,
  JWT_ENCRYPTION: true,
  RATE_LIMITING: process.env.NODE_ENV === 'production',
  AUDIT_LOGGING: process.env.NODE_ENV === 'production',
} as const

// JWT Configuration
export const JWT_CONFIG = {
  // JWT secret is automatically handled by NextAuth via NEXTAUTH_SECRET
  algorithm: 'HS512' as const,
  maxAge: 30 * 24 * 60 * 60, // 30 days
  updateAge: 24 * 60 * 60, // 24 hours
} as const

// Session Configuration
export const SESSION_CONFIG = {
  strategy: 'jwt' as const,
  maxAge: 30 * 24 * 60 * 60, // 30 days
  updateAge: 24 * 60 * 60, // 24 hours
} as const

// CSRF Configuration
export const CSRF_CONFIG = {
  enabled: SECURITY_FEATURES.CSRF_PROTECTION,
  tokenLength: 32,
  headerName: 'X-CSRF-Token',
  cookieName: 'csrf-token',
  tokenExpiry: 60 * 60 * 1000, // 1 hour
  refreshThreshold: 5 * 60 * 1000, // 5 minutes before expiry
} as const

// CORS Configuration
export const CORS_CONFIG = {
  enabled: SECURITY_FEATURES.CORS_ENABLED,
  credentials: true,
  maxAge: 86400, // 24 hours
  allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'] as const,
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'X-CSRF-Token',
  ] as const,
  exposedHeaders: ['X-Request-ID'] as const,
} as const

// Security Headers Configuration
export const SECURITY_HEADERS = {
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'Content-Security-Policy': process.env.NODE_ENV === 'production'
    ? [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com",
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
        "font-src 'self' https://fonts.gstatic.com",
        "img-src 'self' data: https: blob:",
        "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.github.com",
        "frame-ancestors 'none'",
        "base-uri 'self'",
        "form-action 'self'",
      ].join('; ')
    : undefined,
} as const

// Role Hierarchy Configuration
export const ROLE_HIERARCHY: Record<UserRole, number> = {
  user: 1,
  premium: 2,
  moderator: 3,
  admin: 4,
} as const

// API Rate Limiting Configuration
export const RATE_LIMIT_CONFIG = {
  enabled: SECURITY_FEATURES.RATE_LIMITING,
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: {
    authenticated: 1000,
    unauthenticated: 100,
    api: {
      default: 100,
      auth: 5,
      portfolios: 50,
      metrics: 20,
    },
  },
} as const

// Audit Log Configuration
export const AUDIT_CONFIG = {
  enabled: SECURITY_FEATURES.AUDIT_LOGGING,
  events: [
    'auth.login',
    'auth.logout',
    'auth.failed',
    'auth.token.refresh',
    'role.change',
    'data.access',
    'data.modify',
    'data.delete',
    'admin.action',
  ] as const,
  retention: 90 * 24 * 60 * 60 * 1000, // 90 days
} as const

// Authentication Providers Configuration
export const AUTH_PROVIDERS = {
  google: {
    enabled: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
    scope: ['openid', 'email', 'profile'],
  },
  email: {
    enabled: !!(process.env.EMAIL_SERVER_USER && process.env.EMAIL_SERVER_PASSWORD),
    verificationTokenExpiry: 24 * 60 * 60, // 24 hours
    maxAttempts: 3,
    cooldownPeriod: 60 * 60 * 1000, // 1 hour
  },
} as const

// Security Validation Rules
export const VALIDATION_RULES = {
  password: {
    minLength: 8,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: true,
  },
  email: {
    maxLength: 255,
    allowedDomains: [], // Empty array means all domains allowed
    blockedDomains: ['tempmail.com', 'throwaway.email'],
  },
  session: {
    absoluteTimeout: 7 * 24 * 60 * 60 * 1000, // 7 days
    idleTimeout: 30 * 60 * 1000, // 30 minutes
    renewBeforeExpiry: 5 * 60 * 1000, // 5 minutes
  },
} as const

// API Security Configuration
export const API_SECURITY = {
  requireAuth: [
    '/api/portfolios',
    '/api/metrics',
    '/api/user',
    '/api/admin',
  ],
  requireCSRF: [
    'POST',
    'PUT',
    'DELETE',
    'PATCH',
  ],
  publicEndpoints: [
    '/api/health',
    '/api/auth',
  ],
} as const

// Get security headers for a specific route
export function getSecurityHeaders(pathname: string): Record<string, string> {
  const headers = { ...SECURITY_HEADERS }
  
  // Remove CSP for development
  if (process.env.NODE_ENV === 'development') {
    delete headers['Content-Security-Policy']
    delete headers['Strict-Transport-Security']
  }
  
  // Adjust headers for specific routes
  if (pathname.startsWith('/api/')) {
    headers['Cache-Control'] = 'no-store, no-cache, must-revalidate'
  }
  
  return headers
}

// Check if a route requires authentication
export function requiresAuth(pathname: string): boolean {
  return API_SECURITY.requireAuth.some(route => pathname.startsWith(route))
}

// Check if a method requires CSRF protection
export function requiresCSRF(method: string): boolean {
  return SECURITY_FEATURES.CSRF_PROTECTION && 
         API_SECURITY.requireCSRF.includes(method.toUpperCase())
}

// Check if a route is public
export function isPublicEndpoint(pathname: string): boolean {
  return API_SECURITY.publicEndpoints.some(route => pathname.startsWith(route))
}

// Export consolidated security context
export const SecurityContext = {
  features: SECURITY_FEATURES,
  jwt: JWT_CONFIG,
  session: SESSION_CONFIG,
  csrf: CSRF_CONFIG,
  cors: CORS_CONFIG,
  headers: SECURITY_HEADERS,
  roles: ROLE_HIERARCHY,
  rateLimit: RATE_LIMIT_CONFIG,
  audit: AUDIT_CONFIG,
  providers: AUTH_PROVIDERS,
  validation: VALIDATION_RULES,
  api: API_SECURITY,
} as const

export type SecurityConfig = typeof SecurityContext