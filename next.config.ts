import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const nextConfig: NextConfig = {
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Keep svgo and css-tree as runtime dependencies so their JSON payloads remain available
      config.externals = config.externals || [];
      config.externals.push('svgo', 'css-tree');
    }
    return config;
  }
};

export default withNextIntl(nextConfig);
