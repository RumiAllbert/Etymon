/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Disable ESLint during builds
    ignoreDuringBuilds: true,
  },
  // Disable type checking during builds for faster builds
  typescript: {
    ignoreBuildErrors: true,
  },
  // Disable trailing slashes
  trailingSlash: false,
};

export default nextConfig; 