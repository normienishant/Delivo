/** @type {import('next').NextConfig} */
const nextConfig = {
  // keep your existing settings
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },

  // 🔒 PERMANENT BLOCK – MUST be sent on every response
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Permissions-Policy',
            value: 'get-installed-related-apps=()',
          },
        ],
      },
    ];
  },
};

export default nextConfig;