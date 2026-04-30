/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Logs détaillés en dev
  ...(process.env.NODE_ENV === 'development' && {
    onDemandEntries: { maxInactiveAge: 60 * 1000, pagesBufferLength: 5 },
  }),
}
module.exports = nextConfig
