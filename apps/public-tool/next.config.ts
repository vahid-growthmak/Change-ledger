import type { NextConfig } from 'next';

import path from 'path';

const nextConfig: NextConfig = {
  transpilePackages: ['@growthmak/core', '@growthmak/ui'],
  outputFileTracingRoot: path.join(__dirname, '../../'),
};

export default nextConfig;
