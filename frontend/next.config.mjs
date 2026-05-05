/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
};

export default nextConfig;

/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },

  // 🔒 PERMANENT BLOCK – No more "wants access to other apps" popup
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Permissions-Policy',
            value: 'interest-cohort=(), browsing-topics=(), join-ad-interest-group=(), run-ad-auction=(), local-fonts=(), get-installed-related-apps=()',
          },
        ],
      },
    ];
  },
};

export default nextConfig;