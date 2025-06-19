/**
 * CORS Configuration for Development and Production
 * Handles cross-origin requests and resolves development warnings
 */

export const DEVELOPMENT_ORIGINS = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'https://localhost:3000',
  'http://0.0.0.0:3000',
  // GitHub Codespaces
  /^https:\/\/.*\.codespaces\.githubusercontent\.com$/,
  // GitHub Dev environments
  /^https:\/\/.*\.github\.dev$/,
  // Local network access
  /^http:\/\/192\.168\.\d+\.\d+:3000$/,
  /^http:\/\/10\.\d+\.\d+\.\d+:3000$/,
] as const;

export const PRODUCTION_ORIGINS = [
  process.env.NEXT_PUBLIC_APP_URL,
  process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null,
].filter(Boolean) as string[];

/**
 * Get allowed origins based on environment
 */
export function getAllowedOrigins(): (string | RegExp)[] {
  if (process.env.NODE_ENV === 'development') {
    return DEVELOPMENT_ORIGINS;
  }
  return PRODUCTION_ORIGINS;
}

/**
 * Check if an origin is allowed
 */
export function isOriginAllowed(origin: string | undefined): boolean {
  if (!origin) return false;
  
  const allowedOrigins = getAllowedOrigins();
  
  return allowedOrigins.some(allowed => {
    if (typeof allowed === 'string') {
      return allowed === origin;
    }
    if (allowed instanceof RegExp) {
      return allowed.test(origin);
    }
    return false;
  });
}

/**
 * Get CORS headers for API responses
 */
export function getCorsHeaders(origin?: string): Record<string, string> {
  const headers: Record<string, string> = {
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
    'Access-Control-Allow-Credentials': 'true',
  };

  if (origin && isOriginAllowed(origin)) {
    headers['Access-Control-Allow-Origin'] = origin;
  } else if (process.env.NODE_ENV === 'development') {
    // In development, be more permissive for local development
    headers['Access-Control-Allow-Origin'] = origin || '*';
  }

  return headers;
}

/**
 * CORS middleware for API routes
 */
export function corsMiddleware(request: Request) {
  const origin = request.headers.get('origin');
  return getCorsHeaders(origin);
}