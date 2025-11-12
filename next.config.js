/** @type {import('next').NextConfig} */
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

const nextConfig = {
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