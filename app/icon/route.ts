// ============================================================
// معون — أيقونة المفضلة (favicon) الديناميكية حسب النطاق
// ------------------------------------------------------------
// يطلب المتصفح /icon لكل صفحة. نقرأ النطاق (Host / x-forwarded-host)
// ونجلب صورة المتجر (seoFavicon ← شعار المتجر) من Supabase، فنعيدها
// كما هي. إن لم يوجد متجر أو لم تُضبط صورة → نحوّل إلى الأيقونة
// الافتراضية للمنصة (/icon.svg). يعمل تلقائيًا لأي متجر جديد.
//
// تُربط هذه الوسيلة عبر metadata.icons في app/layout.tsx (رابط واحد
// بلا نوع مفترض) فنبقى مصدرًا واحدًا ديناميكيًا بلا تكرار وسوم.
// ============================================================

import { headers } from "next/headers";
import { mainDomain } from "@/lib/constants";
import { getStoreFavicon } from "@/lib/seo";

export const dynamic = "force-dynamic";

const DEFAULT_ICON = "/icon.svg";

function subdomainFromHost(host: string): string | null {
  const domain = mainDomain();
  const clean = host.replace(/:\d+$/, "").toLowerCase();
  if (!clean.endsWith(`.${domain}`) || clean === domain || clean.startsWith("www.")) {
    return null;
  }
  const sub = clean.slice(0, -(domain.length + 1));
  return /^[a-z0-9](?:[a-z0-9-]{0,60}[a-z0-9])?$/.test(sub) ? sub : null;
}

export async function GET(request: Request) {
  const reqUrl = new URL(request.url);
  let store: string | null = reqUrl.searchParams.get("store");

  const h = await headers();
  const host = (h.get("x-forwarded-host") || h.get("host") || "")
    .split(",")[0]
    .trim();

  // 1) النطاق الفرعي الفعلي (الإنتاج: rshaf.maaoun.com)
  if (!store) store = subdomainFromHost(host);

  // 2) وضع المعاينة أحادي النطاق: ?store=rshaf في الرابط أو في Referer
  if (!store) {
    const referer = request.headers.get("referer");
    if (referer) {
      try {
        store = new URL(referer).searchParams.get("store");
      } catch {
        store = null;
      }
    }
  }

  const favicon = store ? await getStoreFavicon(store) : null;
  if (favicon) {
    try {
      // نحلّ المسارات النسبية (مثل /uploads/...) مقابل أصل الطلب الفعلي
      // (إنتاجًا: نطاق المتجر الحقيقي؛ تطويرًا: المضيف المحلي).
      const faviconUrl = favicon.startsWith("/")
        ? new URL(favicon, request.url).toString()
        : favicon;
      const upstream = await fetch(faviconUrl, { cache: "no-store" });
      if (upstream.ok && upstream.body) {
        const headersOut = new Headers(upstream.headers);
        // نخزّنها قليلًا لتقليل ضغط قاعدة البيانات/التخزين
        headersOut.set("cache-control", "public, max-age=3600");
        return new Response(upstream.body, { status: 200, headers: headersOut });
      }
    } catch {
      // نهبط إلى الأيقونة الافتراضية عند أي خطأ في الجلب
    }
  }

  return new Response(null, {
    status: 307,
    headers: { Location: DEFAULT_ICON },
  });
}
