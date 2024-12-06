/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins: ['resend.com'],
    },
  },
  env: {
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  },
  images: {
    domains: ['sabwkhxyalhmconggqkn.supabase.co'], // Supabase-Domain für Bilder
  },
};

export default nextConfig;

