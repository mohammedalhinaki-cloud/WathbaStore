// ============================================================
// معون — مولّد خريطة الموقع
//
// تُقرأ بيانات الخريطة مباشرة من Supabase بأربع استعلامات صغيرة فقط
// (stores/categories/products/pages). نفضّل مفتاح الخادم لتجاوز RLS، مع
// فلاتر صريحة تمنع إدراج متجر غير مسلّم أو محتوى مخفي. عند غياب المفتاح
// السري يمكن لمفتاح anon/publishable القراءة عبر سياسات RLS العامة.
// ============================================================

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { mainDomain, replaceLegacyPlatformDomain, storeUrl } from "@/lib/constants";
import { isWorkersRuntime, services } from "@/lib/services";
import { normalizeSupabaseUrl, supabasePublicKey, supabaseSecretKey, supabaseUrl } from "@/lib/supabase/env";
import type { Category, Product, Store, StorePage } from "@/lib/types";

export interface SitemapEntry {
  url: string;
  lastModified?: string;
  changeFrequency?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: number;
}

export interface SitemapCounts {
  stores: number;
  categories: number;
  products: number;
  pages: number;
  totalUrls: number;
}

export type SitemapAccessMode = "service_role" | "anon" | "local" | "none";
export type SitemapResultSource = "supabase" | "local" | "memory-cache" | "stale-cache" | "fallback";

export interface SitemapBuildResult {
  entries: SitemapEntry[];
  counts: SitemapCounts;
  accessMode: SitemapAccessMode;
  source: SitemapResultSource;
  error: unknown | null;
}

export interface SitemapEnvironmentStatus {
  supabase_url_configured: boolean;
  supabase_publishable_key_configured: boolean;
  supabase_anon_key_configured: boolean;
  supabase_secret_key_configured: boolean;
  supabase_service_role_key_configured: boolean;
  supabase_public_key_configured: boolean;
  supabase_service_key_configured: boolean;
  selected_access_mode: Exclude<SitemapAccessMode, "local">;
}

interface StoreRow {
  id: string;
  subdomain: string;
  updated_at: string | null;
}

interface CategoryRow {
  store_id: string;
  slug: string;
  created_at: string | null;
}

interface ProductRow {
  store_id: string;
  slug: string;
  updated_at: string | null;
}

interface PageRow {
  store_id: string;
  slug: string;
  updated_at: string | null;
}

interface SitemapSnapshot {
  stores: StoreRow[];
  categories: CategoryRow[];
  products: ProductRow[];
  pages: PageRow[];
  accessMode: SitemapAccessMode;
  source: "supabase" | "local";
}

interface CachedSitemap {
  expiresAt: number;
  entries: SitemapEntry[];
  counts: SitemapCounts;
  accessMode: SitemapAccessMode;
}

interface SupabaseErrorLike {
  message: string;
  code?: string;
  details?: string;
  hint?: string;
  status?: number;
}

interface SupabaseRowsResult<T> {
  data: T[] | null;
  error: SupabaseErrorLike | null;
}

const MAX_URLS_PER_SITEMAP = 50_000;
// مؤقتًا 10 ثوانٍ لاستبعاد بطء الشبكة. الاستعلامات نفسها أُزيل منها N+1.
const BUILD_TIMEOUT_MS = 10_000;
const CACHE_TTL_MS = 60 * 60 * 1_000;

let cachedSitemap: CachedSitemap | null = null;
let inFlight: Promise<SitemapBuildResult> | null = null;

function envHasValue(value: string | undefined): boolean {
  return Boolean(value?.trim());
}

/** حالة المتغيرات فقط، من دون إرجاع رابط المشروع أو أي جزء من المفاتيح. */
export function sitemapEnvironmentStatus(): SitemapEnvironmentStatus {
  const publicKeyConfigured = Boolean(supabasePublicKey());
  const serviceKeyConfigured = Boolean(supabaseSecretKey());
  return {
    supabase_url_configured: Boolean(normalizeSupabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL)),
    supabase_publishable_key_configured: envHasValue(process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY),
    supabase_anon_key_configured: envHasValue(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
    supabase_secret_key_configured: envHasValue(process.env.SUPABASE_SECRET_KEY),
    supabase_service_role_key_configured: envHasValue(process.env.SUPABASE_SERVICE_ROLE_KEY),
    supabase_public_key_configured: publicKeyConfigured,
    supabase_service_key_configured: serviceKeyConfigured,
    selected_access_mode: serviceKeyConfigured ? "service_role" : publicKeyConfigured ? "anon" : "none",
  };
}

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

function createSitemapClient(): { client: SupabaseClient; accessMode: "service_role" | "anon" } {
  const secretKey = supabaseSecretKey();
  const publicKey = supabasePublicKey();
  const key = secretKey ?? publicKey;
  if (!key) {
    throw new Error(
      "لا يوجد مفتاح Supabase للخريطة: اضبط SUPABASE_SERVICE_ROLE_KEY (المفضّل) أو " +
        "SUPABASE_SECRET_KEY، ومعه مفتاح anon/publishable لبقية التطبيق."
    );
  }

  // supabaseUrl يرمي رسالة تشخيصية واضحة إذا كان الرابط غائبًا أو غير صالح.
  const client = createClient(supabaseUrl(), key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  return { client, accessMode: secretKey ? "service_role" : "anon" };
}

class SitemapQueryError extends Error {
  readonly table: string;
  readonly code?: string;
  readonly details?: string;
  readonly hint?: string;
  readonly status?: number;

  constructor(table: string, error: SupabaseErrorLike) {
    super(`فشل استعلام جدول ${table}: ${error.message}`);
    this.name = "SitemapQueryError";
    this.table = table;
    this.code = error.code;
    this.details = error.details;
    this.hint = error.hint;
    this.status = error.status;
  }
}

function rowsOrThrow<T>(table: string, result: SupabaseRowsResult<T>): T[] {
  if (result.error) throw new SitemapQueryError(table, result.error);
  return result.data ?? [];
}

/**
 * لا يوجد tenant_id مستقل في المخطط؛ stores.id هو مفتاح المستأجر وتربطه
 * الجداول عبر store_id. نقرأ المتاجر المسلّمة أولًا ثم نحصر المحتوى فيها.
 */
async function querySupabaseSnapshot(): Promise<SitemapSnapshot> {
  const { client, accessMode } = createSitemapClient();

  const storesResult = (await client
    .from("stores")
    .select("id, subdomain, updated_at")
    .eq("status", "delivered")
    .order("subdomain")) as SupabaseRowsResult<StoreRow>;
  const stores = rowsOrThrow("stores", storesResult);
  if (stores.length === 0) {
    return { stores, categories: [], products: [], pages: [], accessMode, source: "supabase" };
  }

  const storeIds = stores.map((store) => store.id);
  // ثلاثة استعلامات متوازية لكل المحتوى بدل 3 + N استعلامًا لكل متجر، ولا
  // نحمّل product_images لأنها لا تولّد روابط في الخريطة.
  const [categoriesResult, productsResult, pagesResult] = (await Promise.all([
    client
      .from("categories")
      .select("store_id, slug, created_at")
      .in("store_id", storeIds)
      .eq("is_visible", true)
      .order("store_id")
      .order("sort_order"),
    client
      .from("products")
      .select("store_id, slug, updated_at")
      .in("store_id", storeIds)
      .eq("is_visible", true)
      .order("store_id")
      .order("sort_order"),
    client
      .from("pages")
      .select("store_id, slug, updated_at")
      .in("store_id", storeIds)
      .eq("is_visible", true)
      .order("store_id")
      .order("sort_order"),
  ])) as [
    SupabaseRowsResult<CategoryRow>,
    SupabaseRowsResult<ProductRow>,
    SupabaseRowsResult<PageRow>,
  ];

  return {
    stores,
    categories: rowsOrThrow("categories", categoriesResult),
    products: rowsOrThrow("products", productsResult),
    pages: rowsOrThrow("pages", pagesResult),
    accessMode,
    source: "supabase",
  };
}

function mapLocalStore(store: Store): StoreRow {
  return { id: store.id, subdomain: store.subdomain, updated_at: store.updatedAt };
}

function mapLocalCategory(category: Category): CategoryRow {
  return { store_id: category.storeId, slug: category.slug, created_at: category.createdAt };
}

function mapLocalProduct(product: Product): ProductRow {
  return { store_id: product.storeId, slug: product.slug, updated_at: product.updatedAt };
}

function mapLocalPage(page: StorePage): PageRow {
  return { store_id: page.storeId, slug: page.slug, updated_at: page.updatedAt };
}

/** يبقي sitemap مفيدًا في npm run dev من دون Supabase؛ لا يُستخدم على Worker. */
async function queryLocalSnapshot(): Promise<SitemapSnapshot> {
  const stores = (await services().listStores()).filter((store) => store.status === "delivered");
  const content = await Promise.all(
    stores.map(async (store) => {
      const [categories, pages, products] = await Promise.all([
        services().listCategories(store.id, false),
        services().listPages(store.id),
        services().listProducts(store.id, { includeHidden: false }),
      ]);
      return {
        categories: categories.filter((item) => item.isVisible).map(mapLocalCategory),
        pages: pages.filter((item) => item.isVisible).map(mapLocalPage),
        products: products.filter((item) => item.isVisible).map(mapLocalProduct),
      };
    })
  );

  return {
    stores: stores.map(mapLocalStore),
    categories: content.flatMap((item) => item.categories),
    products: content.flatMap((item) => item.products),
    pages: content.flatMap((item) => item.pages),
    accessMode: "local",
    source: "local",
  };
}

async function querySnapshot(): Promise<SitemapSnapshot> {
  const hasAnySupabaseSetting = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL || supabasePublicKey() || supabaseSecretKey()
  );
  if (hasAnySupabaseSetting) return querySupabaseSnapshot();
  if (isWorkersRuntime()) {
    throw new Error(
      "متغيرات Supabase غير مضبوطة في Cloudflare Production: يلزم NEXT_PUBLIC_SUPABASE_URL " +
        "ومفتاح عام للتطبيق ومفتاح SUPABASE_SERVICE_ROLE_KEY للخريطة."
    );
  }
  return queryLocalSnapshot();
}

function entriesFromSnapshot(snapshot: SitemapSnapshot): SitemapEntry[] {
  const entries: SitemapEntry[] = [
    {
      url: baseUrl(),
      changeFrequency: "weekly",
      priority: 1,
    },
  ];
  const storesById = new Map(snapshot.stores.map((store) => [store.id, store]));

  for (const store of snapshot.stores) {
    entries.push({
      url: publicUrl(storeUrl(store.subdomain)),
      lastModified: isoDate(store.updated_at),
      changeFrequency: "weekly",
      priority: 0.8,
    });
  }

  for (const category of snapshot.categories) {
    const store = storesById.get(category.store_id);
    if (!store) continue;
    entries.push({
      url: publicUrl(storeUrl(store.subdomain, `/categories/${category.slug}`)),
      lastModified: isoDate(category.created_at),
      changeFrequency: "weekly",
      priority: 0.6,
    });
  }

  for (const product of snapshot.products) {
    const store = storesById.get(product.store_id);
    if (!store) continue;
    entries.push({
      url: publicUrl(storeUrl(store.subdomain, `/products/${product.slug}`)),
      lastModified: isoDate(product.updated_at),
      changeFrequency: "weekly",
      priority: 0.7,
    });
  }

  for (const page of snapshot.pages) {
    const store = storesById.get(page.store_id);
    if (!store) continue;
    entries.push({
      url: publicUrl(storeUrl(store.subdomain, `/pages/${page.slug}`)),
      lastModified: isoDate(page.updated_at),
      changeFrequency: "monthly",
      priority: 0.5,
    });
  }

  return uniqueEntries(entries);
}

function countsFromSnapshot(snapshot: SitemapSnapshot, totalUrls: number): SitemapCounts {
  return {
    stores: snapshot.stores.length,
    categories: snapshot.categories.length,
    products: snapshot.products.length,
    pages: snapshot.pages.length,
    totalUrls,
  };
}

async function buildSitemap(): Promise<SitemapBuildResult> {
  const snapshot = await querySnapshot();
  const entries = entriesFromSnapshot(snapshot);
  return {
    entries,
    counts: countsFromSnapshot(snapshot, entries.length),
    accessMode: snapshot.accessMode,
    source: snapshot.source,
    error: null,
  };
}

/** قائمة أخيرة صالحة دائمًا، ولا تُخزّن في cache كي نحاول Supabase مجددًا. */
export function fallbackSitemapEntries(): SitemapEntry[] {
  return [
    {
      url: baseUrl(),
      changeFrequency: "weekly",
      priority: 1,
    },
  ];
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error(`انتهت مهلة توليد sitemap بعد ${timeoutMs}ms`)),
      timeoutMs
    );
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
 * يعيد النتيجة ومصدرها والخطأ الفعلي كي يستطيع Route Handler تسجيله. لا
 * نخزّن fallback: الخطأ التالي يحاول Supabase من جديد، والاستجابة نفسها
 * تحصل على no-store من Route Handler.
 */
export async function getSitemapResult(): Promise<SitemapBuildResult> {
  const now = Date.now();
  if (cachedSitemap && cachedSitemap.expiresAt > now) {
    return {
      entries: cachedSitemap.entries,
      counts: cachedSitemap.counts,
      accessMode: cachedSitemap.accessMode,
      source: "memory-cache",
      error: null,
    };
  }

  if (!inFlight) {
    inFlight = buildSitemap().finally(() => {
      inFlight = null;
    });
  }

  try {
    const result = await withTimeout(inFlight, BUILD_TIMEOUT_MS);
    cachedSitemap = {
      entries: result.entries,
      counts: result.counts,
      accessMode: result.accessMode,
      expiresAt: Date.now() + CACHE_TTL_MS,
    };
    return result;
  } catch (error: unknown) {
    if (cachedSitemap) {
      return {
        entries: cachedSitemap.entries,
        counts: cachedSitemap.counts,
        accessMode: cachedSitemap.accessMode,
        source: "stale-cache",
        error,
      };
    }
    const entries = fallbackSitemapEntries();
    return {
      entries,
      counts: { stores: 0, categories: 0, products: 0, pages: 0, totalUrls: entries.length },
      accessMode: sitemapEnvironmentStatus().selected_access_mode,
      source: "fallback",
      error,
    };
  }
}

/** للتوافق مع مسارات sitemap المقسمة. */
export async function getSitemapEntries(): Promise<SitemapEntry[]> {
  return (await getSitemapResult()).entries;
}

/** استعلام غير مخزّن يستخدمه endpoint التشخيصي المؤقت. */
export async function getSitemapDiagnostics(): Promise<{
  counts: SitemapCounts;
  accessMode: SitemapAccessMode;
}> {
  const snapshot = await querySupabaseSnapshot();
  const entries = entriesFromSnapshot(snapshot);
  return {
    counts: countsFromSnapshot(snapshot, entries.length),
    accessMode: snapshot.accessMode,
  };
}

/** يحوّل الخطأ إلى حقول آمنة للسجلات/التشخيص من دون أي مفاتيح سرية. */
export function serializeSitemapError(error: unknown): Record<string, unknown> {
  if (error instanceof SitemapQueryError) {
    return {
      name: error.name,
      message: error.message,
      table: error.table,
      code: error.code,
      details: error.details,
      hint: error.hint,
      status: error.status,
      stack: error.stack,
    };
  }
  if (error instanceof Error) {
    return { name: error.name, message: error.message, stack: error.stack };
  }
  return { name: "UnknownError", message: String(error) };
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
export const sitemapBuildTimeoutMs = BUILD_TIMEOUT_MS;
