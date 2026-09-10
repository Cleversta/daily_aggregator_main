/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export', // produces flat static HTML in /out, matching the "static build" architecture
  images: { unoptimized: true }, // static export can't use Next's image optimization API
  // Bound static-export concurrency: the default 15-worker build has
  // intermittently crashed with SIGSEGV on the local Node 24 environment.
  experimental: { cpus: 2 },
};

module.exports = nextConfig;
