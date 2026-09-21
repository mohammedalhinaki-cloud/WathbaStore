import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.supabase.co" },
      { protocol: "https", hostname: "**.supabase.in" },
      { protocol: "http", hostname: "localhost" },
    ],
  },
};

export default nextConfig;

// تكامل بيئة التطوير المحلية مع Cloudflare (bindings ...) أثناء next dev
initOpenNextCloudflareForDev();
