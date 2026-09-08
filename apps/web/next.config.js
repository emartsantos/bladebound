/** @type {import('next').NextConfig} */
const nextConfig = {
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
