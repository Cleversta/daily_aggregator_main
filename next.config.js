/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export', // produces flat static HTML in /out, matching the "static build" architecture
  images: { unoptimized: true }, // static export can't use Next's image optimization API
};

module.exports = nextConfig;
