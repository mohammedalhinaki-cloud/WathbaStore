import {
  getSitemapDiagnostics,
  serializeSitemapError,
  sitemapEnvironmentStatus,
} from "@/lib/sitemap";

// Endpoint تشخيصي مؤقت — يُحذف بعد التأكد من إنتاج Cloudflare وسجلاته.
export const dynamic = "force-dynamic";

const headers = {
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "no-store, max-age=0",
  "X-Content-Type-Options": "nosniff",
};

export async function GET() {
  const environment = sitemapEnvironmentStatus();

  try {
    const { counts, accessMode } = await getSitemapDiagnostics();
    return Response.json(
      {
        ...environment,
        access_mode: accessMode,
        stores_count: counts.stores,
        categories_count: counts.categories,
        products_count: counts.products,
        pages_count: counts.pages,
        total_urls: counts.totalUrls,
        error: null,
      },
      { status: 200, headers }
    );
  } catch (error: unknown) {
    const serializedError = serializeSitemapError(error);
    const { stack: _stack, ...publicError } = serializedError;
    console.error("[debug-sitemap] فشل استعلام Supabase", {
      environment,
      error: serializedError,
    });
    return Response.json(
      {
        ...environment,
        access_mode: environment.selected_access_mode,
        stores_count: null,
        categories_count: null,
        products_count: null,
        pages_count: null,
        total_urls: null,
        error: publicError,
      },
      { status: 200, headers }
    );
  }
}
