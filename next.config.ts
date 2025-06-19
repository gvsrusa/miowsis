import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Build optimizations
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  typescript: {
    // !! WARN !!
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    ignoreBuildErrors: true,
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
              ? "http://localhost:3000,http://127.0.0.1:3000,https://localhost:3000"
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
  }
};

export default nextConfig;
