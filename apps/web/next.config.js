/**
 * GitHub Pages serves the app from /bladebound/. NEXT_PUBLIC_BASE_PATH is
 * set by the deploy workflow only; local dev/build leave it empty so the
 * app stays at the origin root and is fully usable on http://localhost:3000.
 */
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';

/** @type {import('next').NextConfig} */
const nextConfig = {
  basePath,
  output: 'export',
  trailingSlash: true,
  images: { unoptimized: true },
  reactStrictMode: true,
  transpilePackages: [
    '@premium-rpg/game-data',
    '@premium-rpg/shared-types',
    '@premium-rpg/ui-tokens',
    '@premium-rpg/validation',
    '@premium-rpg/game-engine',
    '@premium-rpg/utilities',
  ],
};

module.exports = nextConfig;
