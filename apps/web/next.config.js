/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  images: {
    // El portal solo usa imagenes propias (los SVG de la marca), que no
    // necesitan optimizacion. Desactivar el Image Optimizer evita exponerlo
    // a la vulnerabilidad de denegacion de servicio reportada en Next.js
    // (GHSA-9g9p-9gw9-jx7f) sin perdida alguna para el usuario.
    unoptimized: true,
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