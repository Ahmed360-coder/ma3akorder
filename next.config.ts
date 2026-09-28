import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Item photos are uploaded through server actions; photos are capped at 2 MB in storage.
    serverActions: { bodySizeLimit: "3mb" },
  },
  images: {
    remotePatterns: [{ protocol: "https", hostname: "*.supabase.co", pathname: "/storage/v1/object/public/**" }],
  },
};

export default nextConfig;
