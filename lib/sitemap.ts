// ============================================================
// معون — مولّد خريطة الموقع
//
// لا نعتمد على MetadataRoute هنا: على Cloudflare Workers كان توليد
// app/sitemap.ts ينتظر قاعدة البيانات بلا حدّ زمني، فيتحول طلب Google إلى
// 524. هذا المولّد يملك قائمة احتياطية ثابتة، ومهلة قصيرة، وذاكرة مؤقتة
// داخل العامل. لذلك يبقى /sitemap.xml صالحًا وسريعًا حتى لو تعذّر Supabase.
// ============================================================

import { services } from "@/lib/services";
import { mainDomain, replaceLegacyPlatformDomain, storeUrl } from "@/lib/constants";
import type { Category, Product, Store, StorePage } from "@/lib/types";

export interface SitemapEntry {
  url: string;
  lastModified?: string;
  changeFrequency?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: number;
}

const MAX_URLS_PER_SITEMAP = 50_000;
const BUILD_TIMEOUT_MS = 4_000;
const CACHE_TTL_MS = 60 * 60 * 1_000;

let cachedEntries: { expiresAt: number; entries: SitemapEntry[] } | null = null;
let inFlight: Promise<SitemapEntry[]> | null = null;

function publicUrl(url: string): string {
  return replaceLegacyPlatformDomain(url);
}

function baseUrl(): string {
  return publicUrl(`https://${mainDomain()}`);
}

function isoDate(value: string | null | undefined): string | undefined {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

function uniqueEntries(entries: SitemapEntry[]): SitemapEntry[] {
  const seen = new Set<string>();
  return entries.filter((entry) => {
    if (seen.has(entry.url)) return false;
    seen.add(entry.url);
    return true;
  });
}

function addStoreEntries(
  entries: SitemapEntry[],
  store: Store,
  categories: Category[],
  pages: StorePage[],
  products: Product[]
): void {
  const home = publicUrl(storeUrl(store.subdomain));
  entries.push({
    url: home,
    lastModified: isoDate(store.updatedAt),
    changeFrequency: "weekly",
    priority: 0.8,
  });

  for (const category of categories) {
    if (!category.isVisible) continue;
    entries.push({
      url: publicUrl(storeUrl(store.subdomain, `/categories/${category.slug}`)),
      lastModified: isoDate(category.createdAt),
      changeFrequency: "weekly",
      priority: 0.6,
    });
  }

  for (const page of pages) {
    if (!page.isVisible) continue;
    entries.push({
      url: publicUrl(storeUrl(store.subdomain, `/pages/${page.slug}`)),
      lastModified: isoDate(page.updatedAt),
      changeFrequency: "monthly",
      priority: 0.5,
    });
  }

  for (const product of products) {
    if (!product.isVisible) continue;
    entries.push({
      url: publicUrl(storeUrl(store.subdomain, `/products/${product.slug}`)),
      lastModified: isoDate(product.updatedAt),
      changeFrequency: "weekly",
      priority: 0.7,
    });
  }
}

/** قائمة صغيرة صالحة دائمًا، ولا تحتاج إلى قاعدة بيانات أو Edge fetch. */
export function fallbackSitemapEntries(): SitemapEntry[] {
  return [
    {
      url: baseUrl(),
      changeFrequency: "weekly",
      priority: 1,
    },
  ];
}

async function queryEntries(): Promise<SitemapEntry[]> {
  const entries: SitemapEntry[] = [
    {
      url: baseUrl(),
      changeFrequency: "weekly",
      priority: 1,
    },
  ];

  const stores = (await services().listStores()).filter((store) => store.status === "delivered");

  // تُقرأ بيانات كل متجر بالتوازي بدل إجراء ثلاث رحلات متتابعة لكل متجر.
  // صفحات المتاجر غير المسلّمة لا تُنشر للزوار ولا تدخل الخريطة.
  const storeEntries = await Promise.all(
    stores.map(async (store) => {
      try {
        const [categories, pages, products] = await Promise.all([
          services().listCategories(store.id, false),
          services().listPages(store.id),
          services().listProducts(store.id, { includeHidden: false }),
        ]);
        return { store, categories, pages, products };
      } catch {
        // لا نخسر رابط المتجر كله بسبب جدول محتوى ناقص أو سجل واحد تالف.
        return { store, categories: [], pages: [], products: [] };
      }
    })
  );

  for (const item of storeEntries) {
    addStoreEntries(entries, item.store, item.categories, item.pages, item.products);
  }

  // لا نسمح لخطأ تكرار رابط قديم أو متجر مخزّن مرتين بإفساد الخريطة.
  return uniqueEntries(entries);
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("sitemap generation timeout")), timeoutMs);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error: unknown) => {
        clearTimeout(timer);
        reject(error);
      }
    );
  });
}

/**
 * يعيد أحدث نسخة خلال أربع ثوانٍ كحد أقصى.
 * إذا فشل الاستعلام، نعيد نسخة الصفحة الرئيسية بدل 500/524.
 * الـ promise الجاري لا يُلغى عند انتهاء المهلة، فيستفيد منه الطلب التالي
 * إذا كانت المنصة أبقت العامل حيًا بين الطلبات.
 */
export async function getSitemapEntries(): Promise<SitemapEntry[]> {
  const now = Date.now();
  if (cachedEntries && cachedEntries.expiresAt > now) return cachedEntries.entries;

  if (!inFlight) {
    inFlight = queryEntries().finally(() => {
      inFlight = null;
    });
  }

  try {
    const entries = await withTimeout(inFlight, BUILD_TIMEOUT_MS);
    const safeEntries = uniqueEntries(entries);
    cachedEntries = { entries: safeEntries, expiresAt: Date.now() + CACHE_TTL_MS };
    return safeEntries;
  } catch {
    return cachedEntries?.entries ?? fallbackSitemapEntries();
  }
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function renderUrlSet(entries: SitemapEntry[]): string {
  const body = entries
    .slice(0, MAX_URLS_PER_SITEMAP)
    .map((entry) => {
      const parts = [`    <loc>${escapeXml(entry.url)}</loc>`];
      if (entry.lastModified) parts.push(`    <lastmod>${escapeXml(entry.lastModified)}</lastmod>`);
      if (entry.changeFrequency) parts.push(`    <changefreq>${entry.changeFrequency}</changefreq>`);
      if (entry.priority !== undefined) parts.push(`    <priority>${entry.priority.toFixed(1)}</priority>`);
      return `  <url>\n${parts.join("\n")}\n  </url>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`;
}

export function renderSitemapIndex(totalEntries: number, origin: string): string {
  const count = Math.max(1, Math.ceil(totalEntries / MAX_URLS_PER_SITEMAP));
  const children = Array.from({ length: count }, (_, index) => {
    return `  <sitemap>\n    <loc>${escapeXml(`${origin}/sitemap-${index}.xml`)}</loc>\n  </sitemap>`;
  }).join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${children}\n</sitemapindex>\n`;
}

export const sitemapPageSize = MAX_URLS_PER_SITEMAP;
export const sitemapOrigin = baseUrl();
