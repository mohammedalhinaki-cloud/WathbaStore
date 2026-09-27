import {
  getSitemapResult,
  renderSitemapIndex,
  renderUrlSet,
  serializeSitemapError,
  sitemapBuildTimeoutMs,
  sitemapEnvironmentStatus,
  sitemapOrigin,
  sitemapPageSize,
  type SitemapBuildResult,
} from "@/lib/sitemap";

// مهم: لا نسمح لـ Next بتوليد fallback وقت البناء ثم تثبيته كصفحة ISR.
// التخزين المؤقت موجود داخل lib/sitemap.ts وفي Cache-Control بعد نجاح Supabase.
export const dynamic = "force-dynamic";

function responseHeaders(result: SitemapBuildResult): HeadersInit {
  const failedWithoutData = result.source === "fallback";
  const usingStaleData = result.source === "stale-cache";
  return {
    "Content-Type": "application/xml; charset=utf-8",
    "Cache-Control": failedWithoutData
      ? "no-store, max-age=0"
      : usingStaleData
        ? "public, max-age=60, s-maxage=300, stale-while-revalidate=3600"
        : "public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400",
    "X-Content-Type-Options": "nosniff",
    "X-Sitemap-Source": result.source,
    "X-Sitemap-Urls": String(result.entries.length),
  };
}

export async function GET() {
  const result = await getSitemapResult();

  // Logging تشخيصي مؤقت: الخطأ لم يعد يُبتلع بصمت. لا نسجل قيم المتغيرات
  // أو المفاتيح؛ فقط حالة وجودها وتفاصيل PostgREST الآمنة.
  if (result.error) {
    console.error("[sitemap] تعذّر جلب بيانات Supabase", {
      served_source: result.source,
      served_urls: result.entries.length,
      timeout_ms: sitemapBuildTimeoutMs,
      environment: sitemapEnvironmentStatus(),
      error: serializeSitemapError(result.error),
    });
  } else if (result.source === "supabase") {
    console.info("[sitemap] تم توليد الخريطة من Supabase", {
      access_mode: result.accessMode,
      counts: result.counts,
    });
  }

  const xml =
    result.entries.length > sitemapPageSize
      ? renderSitemapIndex(result.entries.length, sitemapOrigin)
      : renderUrlSet(result.entries);

  return new Response(xml, { status: 200, headers: responseHeaders(result) });
}
