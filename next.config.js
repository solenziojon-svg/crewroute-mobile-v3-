/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ["@anthropic-ai/sdk"],
  eslint: {
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig;