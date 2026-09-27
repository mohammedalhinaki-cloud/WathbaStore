import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

const nextConfig: NextConfig = {
  // هذا المشروع ليس Static Export حاليًا: صفحات المتاجر، API، المصادقة
  // وSupabase تحتاج تشغيل Next.js على Cloudflare Workers عبر OpenNext.
  // تفعيل output: "export" هنا سيكسر هذه المسارات ويحوّلها إلى 404؛ لذلك
  // إعداد Cloudflare الصحيح هو npm run cf-build و .open-next (موضح في الدليل).
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.supabase.co" },
      { protocol: "https", hostname: "**.supabase.in" },
      { protocol: "http", hostname: "localhost" },
    ],
  },
  // الاسم المطلوب من Google هو /sitemap-0.xml. نستخدم Route Handler ديناميكيًا
  // داخل app/sitemap/[index] لأن Next لا يسمح بقطاع مختلط مثل [index].xml.
  async rewrites() {
    return [{ source: "/sitemap-:index.xml", destination: "/sitemap/:index" }];
  },
};

export default nextConfig;

// تكامل بيئة التطوير المحلية مع Cloudflare (bindings ...) أثناء next dev
initOpenNextCloudflareForDev();
