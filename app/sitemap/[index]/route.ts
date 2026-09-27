import { getSitemapResult, renderUrlSet, sitemapPageSize } from "@/lib/sitemap";

// منع التوليد وقت البناء للسبب نفسه الموضح في /sitemap.xml.
export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ index: string }> };

/**
 * لا يُستخدم هذا المسار إلا إذا تجاوزت الخريطة 50,000 رابط، وهو الحد الذي
 * تفرضه Google. يبقى /sitemap.xml هو المدخل الرئيسي في الحالتين.
 */
export async function GET(_request: Request, { params }: RouteContext) {
  const { index: rawIndex } = await params;
  const index = Number(rawIndex);
  if (!Number.isInteger(index) || index < 0) {
    return new Response("Not Found", { status: 404 });
  }

  const result = await getSitemapResult();
  const start = index * sitemapPageSize;
  if (start >= result.entries.length) return new Response("Not Found", { status: 404 });

  const failedWithoutData = result.source === "fallback";
  return new Response(renderUrlSet(result.entries.slice(start, start + sitemapPageSize)), {
    status: 200,
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": failedWithoutData
        ? "no-store, max-age=0"
        : "public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400",
      "X-Content-Type-Options": "nosniff",
      "X-Sitemap-Source": result.source,
      "X-Sitemap-Urls": String(Math.min(sitemapPageSize, result.entries.length - start)),
    },
  });
}
