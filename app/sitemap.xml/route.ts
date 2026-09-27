import {
  getSitemapEntries,
  renderSitemapIndex,
  renderUrlSet,
  sitemapOrigin,
  sitemapPageSize,
} from "@/lib/sitemap";

// إعادة التحقق كل ساعة أفضل من توليد الخريطة عند كل زحف.
// وفي Cloudflare نضيف Cache-Control أيضًا لأن الاستجابة تمر عبر Worker.
export const revalidate = 3600;

const headers = {
  "Content-Type": "application/xml; charset=utf-8",
  "Cache-Control": "public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400",
  "X-Content-Type-Options": "nosniff",
};

export async function GET() {
  const entries = await getSitemapEntries();
  const xml =
    entries.length > sitemapPageSize
      ? renderSitemapIndex(entries.length, sitemapOrigin)
      : renderUrlSet(entries);

  return new Response(xml, { status: 200, headers });
}
