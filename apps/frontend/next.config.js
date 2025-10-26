//@ts-check

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { composePlugins, withNx } = require('@nx/next');

/**
 * @type {import('@nx/next/plugins/with-nx').WithNxOptions}
 **/
const nextConfig = {
  // Use this to set Nx-specific options
  // See: https://nx.dev/recipes/next/next-config-setup
  nx: {},
  // Enable standalone output for optimized production builds
  output: 'standalone',
  // Optimize for smaller bundle size
  experimental: {
    outputFileTracingRoot: require('path').join(__dirname, '../..'),
  },
  // Reduce bundle size by excluding source maps in production
  productionBrowserSourceMaps: false,
};

const plugins = [
  // Add more Next.js plugins to this list if needed.
  withNx,
];

module.exports = composePlugins(...plugins)(nextConfig);
