// CSRF configuration constants
export const CSRF_HEADER_NAME = 'X-CSRF-Token'
export const CSRF_COOKIE_NAME = 'csrf-token'
export const CSRF_TOKEN_LENGTH = 32
export const CSRF_TOKEN_EXPIRY = 60 * 60 * 1000 // 1 hour

// Export configuration for client-side use
export const CSRF_CONFIG = {
  headerName: CSRF_HEADER_NAME,
  cookieName: CSRF_COOKIE_NAME,
} as const