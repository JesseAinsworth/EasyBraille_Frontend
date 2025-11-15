/** @type {import('next').NextConfig} */
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://easybraillebackend-production.up.railway.app'

const nextConfig = {
  // Disable cache to save disk space
  webpack: (config, { dev }) => {
    if (dev) {
      config.cache = false
    }
    return config
  },
  async rewrites() {
    // Use NEXT_PUBLIC_API_URL at build/runtime to point /api calls to backend service
    return [
      {
        source: '/api/:path*',
        destination: `${API_URL}/api/:path*`,
      },
    ]
  },
}

module.exports = nextConfig