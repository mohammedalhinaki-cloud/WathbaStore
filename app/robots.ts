// ============================================================
// معون — robots.txt ثابت وخفيف
// ============================================================

import type { MetadataRoute } from "next";
import { mainDomain } from "@/lib/constants";

/**
 * لا نضع Host هنا: هذا الحقل غير مدعوم من Google ويجعل بعض أدوات الفحص
 * تعتبر robots.txt غير قياسي. الروابط العامة للصور المرفوعة تبدأ بـ /uploads
 * لذلك لا نحجبها، بينما تبقى مسارات الإدارة والـ API والشراء خاصة.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/api", "/checkout", "/cart", "/seed"],
    },
    sitemap: `https://${mainDomain()}/sitemap.xml`,
  };
}
