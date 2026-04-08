import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'etltrhzejyidbeudkinj.supabase.co',
      },
      {
        protocol: 'https',
        hostname: 'vmgmqzkhsubzxwdtbrgn.supabase.co',
      },
    ],
  },
};

export default nextConfig;
