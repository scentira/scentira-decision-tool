import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  devIndicators: false,
  // The shared build loads its own scripts only: no injected deployment toolbar.
  async headers() {
    const development = process.env.NODE_ENV === 'development';
    return [{ source: '/:path*', headers: [{
      key: 'Content-Security-Policy',
      value: `script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval' blob: https://eu-assets.i.posthog.com${development ? " 'unsafe-eval'" : ''}; worker-src 'self' blob:; connect-src 'self' https://huggingface.co https://*.huggingface.co https://*.hf.co https://eu.i.posthog.com https://eu-assets.i.posthog.com; frame-src 'self'; object-src 'none'; base-uri 'self'`,
    }] }];
  },
};

export default nextConfig;
