/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  images: {
    domains: ['localhost'],
  },
  env: {
    // Mismo-origen: el proxy de abajo reenvía /api a la API de SIGEB en dev.
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || '/api',
    // Server Components no admiten URLs relativas en fetch; usar destino absoluto.
    API_INTERNAL_URL:
      process.env.API_INTERNAL_URL ||
      process.env.NEXT_PUBLIC_API_PROXY ||
      'http://localhost:3000/api',
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_PROXY || 'http://localhost:3000/api'}/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;