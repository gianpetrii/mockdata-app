/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: [
    'knex',
    'pg',
    'mysql2',
    'better-sqlite3',
    'sqlite3',
    'oracledb',
    'tedious',
    'pg-query-stream',
  ],
};

module.exports = nextConfig;
