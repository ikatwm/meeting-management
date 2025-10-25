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
};

const plugins = [
  // Add more Next.js plugins to this list if needed.
  withNx,
];

// Enable standalone output for Docker deployments
const productionConfig = {
  ...nextConfig,
  output: process.env.NODE_ENV === 'production' ? 'standalone' : undefined,
};

module.exports = composePlugins(...plugins)(productionConfig);
