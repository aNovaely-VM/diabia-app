/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Logs détaillés en dev
  ...(process.env.NODE_ENV === 'development' && {
    onDemandEntries: { maxInactiveAge: 60 * 1000, pagesBufferLength: 5 },
  }),
  // Augmenter la limite de taille pour les API routes
  experimental: {
    serverActions: {
      bodySizeLimit: '50mb',
    },
  },
}
module.exports = nextConfig
