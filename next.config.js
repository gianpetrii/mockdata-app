/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Ignore optional knex dependencies we don't use
      config.externals.push({
        'better-sqlite3': 'commonjs better-sqlite3',
        'mysql': 'commonjs mysql',
        'oracledb': 'commonjs oracledb',
        'pg-query-stream': 'commonjs pg-query-stream',
        'sqlite3': 'commonjs sqlite3',
        'tedious': 'commonjs tedious',
      });
    }
    return config;
  },
};

module.exports = nextConfig;
