// ============================================================
// وثبة — robots.txt الديناميكي
// يسمح بفهرسة الصفحات العامة، ويمنع لوحات الإدارة والدخول
// والـ API وسلّة/الدفع والملفات الخاصة. يُحال إلى خريطة الموقع.
// يُولَّد لكل hostname ليكون توجيه host دقيقًا لكل نطاق فرعي.
// ============================================================

import type { MetadataRoute } from "next";
import { headers } from "next/headers";
import { mainDomain } from "@/lib/constants";

export const dynamic = "force-dynamic";

export default async function robots(): Promise<MetadataRoute.Robots> {
  const h = await headers();
  const rawHost = (h.get("x-forwarded-host") || h.get("host") || "")
    .split(",")[0]
    .trim();
  const host = rawHost.replace(/:\d+$/, "").toLowerCase();
  const origin = host ? `https://${host}` : `https://${mainDomain()}`;

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/api", "/checkout", "/cart", "/uploads", "/seed"],
      },
    ],
    sitemap: `https://${mainDomain()}/sitemap.xml`,
    host: origin,
  };
}
