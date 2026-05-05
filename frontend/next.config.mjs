/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },

  // 🔒 PERMANENT BLOCK – "wants access to other apps" popup
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Permissions-Policy",
            value: "get-installed-related-apps=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;