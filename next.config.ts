import type { NextConfig } from "next";

// PWA Configuration (if using next-pwa)
const withPWA = (() => {
  try {
    const pwa = require('@ducanh2912/next-pwa').default;
    return pwa({
      dest: 'public',
      register: true,
      skipWaiting: true,
      disable: process.env.NODE_ENV === 'development',
      // CRITICAL: Exclude auth routes from service worker
      runtimeCaching: [
        {
          urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/i,
          handler: 'CacheFirst',
          options: {
            cacheName: 'google-fonts',
            expiration: {
              maxEntries: 10,
              maxAgeSeconds: 365 * 24 * 60 * 60 // 365 days
            }
          }
        },
        {
          urlPattern: /\.(?:jpg|jpeg|gif|png|svg|ico|webp)$/i,
          handler: 'StaleWhileRevalidate',
          options: {
            cacheName: 'static-images',
            expiration: {
              maxEntries: 64,
              maxAgeSeconds: 30 * 24 * 60 * 60 // 30 days
            }
          }
        },
        {
          urlPattern: /\.(?:js|css)$/i,
          handler: 'StaleWhileRevalidate',
          options: {
            cacheName: 'static-js-css',
            expiration: {
              maxEntries: 64,
              maxAgeSeconds: 30 * 24 * 60 * 60 // 30 days
            }
          }
        }
      ],
      // IMPORTANT: Exclude all auth-related routes from service worker
      navigateFallbackDenylist: [
        /\/api\/auth\/.*/,  // NextAuth API routes
        /\/auth\/.*/,        // Auth pages
        /\/api\/.*/,         // All API routes
        /\/_next\/.*/,       // Next.js internals
      ],
      buildExcludes: [
        /middleware-manifest\.json$/,
        /middleware-runtime\.js$/,
        /_middleware\.js$/,
        /^.+\/middleware\.js$/
      ]
    });
  } catch (e) {
    // PWA package not installed, return identity function
    return (config: NextConfig) => config;
  }
})();

const nextConfig: NextConfig = {
  // Build optimizations
  eslint: {
    // ESLint will run during builds to ensure code quality
    ignoreDuringBuilds: false,
  },
  typescript: {
    // TypeScript errors will fail the build to ensure type safety
    ignoreBuildErrors: false,
  },

  // Cross-origin and security configurations
  async headers() {
    return [
      {
        // Apply CORS headers to API routes
        source: "/api/(.*)",
        headers: [
          {
            key: "Access-Control-Allow-Origin",
            value: process.env.NODE_ENV === "development" 
              ? "http://localhost:3000"
              : process.env.NEXT_PUBLIC_APP_URL || "*"
          },
          {
            key: "Access-Control-Allow-Methods",
            value: "GET, POST, PUT, DELETE, OPTIONS"
          },
          {
            key: "Access-Control-Allow-Headers",
            value: "Content-Type, Authorization, X-Requested-With"
          },
          {
            key: "Access-Control-Allow-Credentials",
            value: "true"
          }
        ]
      },
      {
        // Security headers for all routes
        source: "/(.*)",
        headers: [
          {
            key: "X-Frame-Options",
            value: "DENY"
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff"
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin"
          }
        ]
      }
    ];
  },


  // Image optimization
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.supabase.co",
        port: "",
        pathname: "/storage/v1/object/public/**"
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        port: "",
        pathname: "/**"
      }
    ],
    formats: ["image/avif", "image/webp"]
  },

  // Performance optimizations
  compiler: {
    removeConsole: process.env.NODE_ENV === "production" ? {
      exclude: ["error", "warn"]
    } : false
  },

  // Webpack configuration for better module resolution
  webpack: (config, { dev, isServer }) => {
    if (dev) {
      // Improve hot reload performance
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 300,
        ignored: ["**/node_modules", "**/.git", "**/.next"]
      };
    }

    // Handle Node.js modules in client-side code
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false
      };
    }

    return config;
  },

  // Redirect configurations for auth and app routing
  async redirects() {
    return [
      {
        source: "/signin",
        destination: "/auth/signin",
        permanent: false
      },
      {
        source: "/signup",
        destination: "/auth/signin",
        permanent: false
      }
    ];
  },

  // Environment variable configuration
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY || "default-value"
  },

  // Output configuration for deployment
  output: process.env.BUILD_STANDALONE === "true" ? "standalone" : undefined,

  // Server external packages (moved from experimental)
  serverExternalPackages: [
    "winston",
    "prom-client"
  ],

  // Experimental features for Next.js 15
  experimental: {
    optimizePackageImports: [
      "@radix-ui/react-icons",
      "@radix-ui/themes", 
      "lucide-react",
      "framer-motion"
    ]
  },
  
  // Allow development origins to prevent cross-origin warnings
  allowedDevOrigins: [
    "http://localhost:3000",
    "http://localhost:3001", 
    "http://127.0.0.1:3000",
    "http://127.0.0.1:3001",
    "https://localhost:3000",
    "https://localhost:3001"
  ]
};

// Export with PWA wrapper if available
export default withPWA(nextConfig);
