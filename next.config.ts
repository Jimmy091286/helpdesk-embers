/** @type {import('next').NextConfig} */
const nextConfig = {
  // Force rebuild - timestamp: ${new Date().toISOString()}
  // Erzwinge Neubau - Zeitstempel: ${new Date().toISOString()}
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
    domains: ['sabwkhxyalhmconggqkn.supabase.co'],
  },
  eslint: {
    // Completely disable ESLint during builds
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    ignoreBuildErrors: true,
  },
};

export default nextConfig;

