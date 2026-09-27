import { getSitemapEntries, renderUrlSet, sitemapPageSize } from "@/lib/sitemap";

export const revalidate = 3600;

const headers = {
  "Content-Type": "application/xml; charset=utf-8",
  "Cache-Control": "public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400",
  "X-Content-Type-Options": "nosniff",
};

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

  const entries = await getSitemapEntries();
  const start = index * sitemapPageSize;
  if (start >= entries.length) return new Response("Not Found", { status: 404 });

  return new Response(renderUrlSet(entries.slice(start, start + sitemapPageSize)), {
    status: 200,
    headers,
  });
}
