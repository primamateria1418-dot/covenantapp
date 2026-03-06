/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['supabase.co', 'storage.supabase.co'],
  },
}

module.exports = nextConfig
