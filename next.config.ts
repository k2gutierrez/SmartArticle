import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'https://mtwhuxhtfyahspfwbbzn.supabase.co', // Reemplaza con el hostname de tu URL de Supabase
        port: '',
        pathname: '/storage/v1/object/public/**',
      }
    ]
  }
};

export default nextConfig;
