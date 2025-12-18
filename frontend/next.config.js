/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['localhost', 'pps.whatsapp.net'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.vercel.app',
      },
      {
        protocol: 'https',
        hostname: '**.railway.app',
      },
      {
        protocol: 'https',
        hostname: '**.render.com',
      },
      {
        protocol: 'https',
        hostname: '**.herokuapp.com',
      },
    ],
  },
  // Otimizações para produção
  swcMinify: true,
}

module.exports = nextConfig

