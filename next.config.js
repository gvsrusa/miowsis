/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  experimental: {
    // Enable any experimental features if needed
  },
  images: {
    domains: [],
  },
}

module.exports = nextConfig