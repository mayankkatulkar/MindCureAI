import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone', // Required for Docker production builds
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
};

export default nextConfig;

