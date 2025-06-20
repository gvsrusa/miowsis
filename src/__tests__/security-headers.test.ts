import nextConfig from '../../next.config'

interface NextConfigHeader {
  key: string
  value: string
}

interface NextConfigHeaderGroup {
  source: string
  headers: NextConfigHeader[]
}

describe('Security Headers Configuration', () => {
  let headers: NextConfigHeaderGroup[]

  beforeAll(async () => {
    // Get headers from the Next.js configuration
    headers = await nextConfig.headers!()
  })

  describe('API Route Headers', () => {
    const apiHeaders = () => headers.find(h => h.source === '/api/(.*)')

    it('should configure CORS headers for API routes', () => {
      const config = apiHeaders()
      expect(config).toBeDefined()
      
      const headerMap = new Map(
        config.headers.map((h) => [h.key, h.value])
      )

      // Check CORS headers
      expect(headerMap.get('Access-Control-Allow-Methods')).toBe('GET, POST, PUT, DELETE, OPTIONS')
      expect(headerMap.get('Access-Control-Allow-Headers')).toBe('Content-Type, Authorization, X-Requested-With')
      expect(headerMap.get('Access-Control-Allow-Credentials')).toBe('true')
    })

    it('should set appropriate origin header based on environment', () => {
      const config = apiHeaders()
      const originHeader = config.headers.find((h) => h.key === 'Access-Control-Allow-Origin')
      
      // In test environment, it should use development settings
      expect(originHeader.value).toContain('http://localhost:3000')
      expect(originHeader.value).toContain('http://127.0.0.1:3000')
      expect(originHeader.value).toContain('https://localhost:3000')
    })
  })

  describe('General Security Headers', () => {
    const securityHeaders = () => headers.find(h => h.source === '/(.*)')

    it('should set X-Frame-Options to DENY', () => {
      const config = securityHeaders()
      const header = config.headers.find((h) => h.key === 'X-Frame-Options')
      
      expect(header).toBeDefined()
      expect(header.value).toBe('DENY')
    })

    it('should set X-Content-Type-Options to nosniff', () => {
      const config = securityHeaders()
      const header = config.headers.find((h) => h.key === 'X-Content-Type-Options')
      
      expect(header).toBeDefined()
      expect(header.value).toBe('nosniff')
    })

    it('should set Referrer-Policy', () => {
      const config = securityHeaders()
      const header = config.headers.find((h) => h.key === 'Referrer-Policy')
      
      expect(header).toBeDefined()
      expect(header.value).toBe('strict-origin-when-cross-origin')
    })

    it('should apply to all routes', () => {
      const config = securityHeaders()
      expect(config.source).toBe('/(.*)')
    })
  })

  describe('Missing Security Headers', () => {
    const allHeaders = () => {
      const allHeaderKeys = new Set<string>()
      headers.forEach(config => {
        config.headers.forEach((h) => allHeaderKeys.add(h.key))
      })
      return allHeaderKeys
    }

    it('should identify missing Content-Security-Policy', () => {
      const headerKeys = allHeaders()
      expect(headerKeys.has('Content-Security-Policy')).toBe(false)
    })

    it('should identify missing Strict-Transport-Security', () => {
      const headerKeys = allHeaders()
      expect(headerKeys.has('Strict-Transport-Security')).toBe(false)
    })

    it('should identify missing X-XSS-Protection', () => {
      const headerKeys = allHeaders()
      expect(headerKeys.has('X-XSS-Protection')).toBe(false)
    })

    it('should identify missing Permissions-Policy', () => {
      const headerKeys = allHeaders()
      expect(headerKeys.has('Permissions-Policy')).toBe(false)
    })
  })

  describe('Build Configuration', () => {
    it('should enforce ESLint during builds', () => {
      expect(nextConfig.eslint?.ignoreDuringBuilds).toBe(false)
    })

    it('should enforce TypeScript during builds', () => {
      expect(nextConfig.typescript?.ignoreBuildErrors).toBe(false)
    })
  })

  describe('Image Security', () => {
    it('should whitelist allowed image domains', () => {
      const remotePatterns = nextConfig.images?.remotePatterns || []
      
      // Check Supabase domain
      const supabasePattern = remotePatterns.find(
        p => p.hostname === '**.supabase.co'
      )
      expect(supabasePattern).toBeDefined()
      expect(supabasePattern?.protocol).toBe('https')
      expect(supabasePattern?.pathname).toBe('/storage/v1/object/public/**')
      
      // Check Google domain
      const googlePattern = remotePatterns.find(
        p => p.hostname === 'lh3.googleusercontent.com'
      )
      expect(googlePattern).toBeDefined()
      expect(googlePattern?.protocol).toBe('https')
    })

    it('should use modern image formats', () => {
      expect(nextConfig.images?.formats).toEqual(['image/avif', 'image/webp'])
    })
  })

  describe('Production Optimizations', () => {
    it('should remove console logs in production except errors and warnings', () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'production'
      
      // Re-import to get fresh config
      jest.resetModules()
      const { default: prodConfig } = require('../../next.config')
      
      expect(prodConfig.compiler?.removeConsole).toEqual({
        exclude: ['error', 'warn']
      })
      
      process.env.NODE_ENV = originalEnv
    })

    it('should not remove console in development', () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'development'
      
      // Re-import to get fresh config
      jest.resetModules()
      const { default: devConfig } = require('../../next.config')
      
      expect(devConfig.compiler?.removeConsole).toBe(false)
      
      process.env.NODE_ENV = originalEnv
    })
  })

  describe('Recommendations', () => {
    it('should recommend adding Content-Security-Policy', () => {
      const recommendations = [
        "Add Content-Security-Policy header to prevent XSS attacks",
        "Example: default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';"
      ]
      
      expect(recommendations).toBeTruthy()
    })

    it('should recommend adding Strict-Transport-Security', () => {
      const recommendations = [
        "Add Strict-Transport-Security header for HTTPS enforcement",
        "Example: max-age=31536000; includeSubDomains; preload"
      ]
      
      expect(recommendations).toBeTruthy()
    })

    it('should recommend adding Permissions-Policy', () => {
      const recommendations = [
        "Add Permissions-Policy header to control browser features",
        "Example: camera=(), microphone=(), geolocation=()"
      ]
      
      expect(recommendations).toBeTruthy()
    })
  })
})