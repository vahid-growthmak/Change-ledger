import path from 'path';
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@growthmak/core', '@growthmak/ui', '@growthmak/db'],
  outputFileTracingRoot: path.join(__dirname, '../../'),
  serverExternalPackages: ['@electric-sql/pglite', 'postgres'],
};

export default nextConfig;
