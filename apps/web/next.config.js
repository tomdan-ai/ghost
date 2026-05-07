/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@ghost/shared-types'],
};

module.exports = nextConfig;
