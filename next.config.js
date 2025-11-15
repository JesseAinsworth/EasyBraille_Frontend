/** @type {import('next').NextConfig} */
// Default backend URL - Railway primary, can be overridden with NEXT_PUBLIC_API_URL env var
const API_URL = process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || 'https://easybraillebackend-production.up.railway.app'

const nextConfig = {
  // Vercel deployment optimizations
  poweredByHeader: false,
  
  // Image optimization
  images: {
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60,
  },
  
  // Security headers for production
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
    ]
  },
  
  // API rewrites disabled for static hosting compatibility
  // async rewrites() {
  //   return [
  //     {
  //       source: '/api/:path*',
  //       destination: `${API_URL}/api/:path*`,
  //     },
  //   ]
  // },
  
  // Compression for production
  compress: true,
  
  // Disable source maps in production
  productionBrowserSourceMaps: false,
}

module.exports = nextConfig