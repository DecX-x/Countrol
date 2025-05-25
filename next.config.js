/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: { 
    unoptimized: true,
    domains: ['www.alxosphere.studio', 'images.unsplash.com']
  },
  experimental: {
    appDir: true,
  },
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      "encoding": false,
    };
    return config;
  },
}

module.exports = nextConfig