// ============================================================
// معون — كشف المستأجر (الموقع العام أم متجر عميل)
// middleware يضبط الترويسات: x-tenant / x-store-slug
// ============================================================

import { headers } from "next/headers";
import { platformHostOf } from "./constants";
import { services } from "./services";
import { getCurrentUser } from "./session";
import type { StoreBundle } from "./types";

export interface TenantCtx {
  tenant: "main" | "store";
  slug: string | null;
  host: string;
  /** في وضع المعاينة (ليس الدومين الحقيقي) تُضاف ?store= للروابط */
  isPreview: boolean;
}

export async function getTenant(): Promise<TenantCtx> {
  const h = await headers();
  // يُفضَّل x-forwarded-host إن وُجد: عند النشر خلف بروكسي (Cloudflare Worker
  // يعيد توجيه *.maaoun.com إلى الموقع) يحمل الترويسة النطاق الأصلي الذي
  // طلبه الزائر بينما تُستبدل قيمة host إلى نطاق الموقع الداخلي.
  const rawHost =
    (h.get("x-forwarded-host") || "").split(",")[0].trim() ||
    h.get("host") ||
    "";
  const host = rawHost.replace(/:\d+$/, "").toLowerCase();
  const tenantHeader = (h.get("x-tenant") as "main" | "store") || "main";
  const slugHeader = h.get("x-store-slug");
  const platform = platformHostOf(host);

  // على النطاق الحقيقي (الحالي أو السابق) تُشتق جهة الطلب من النطاق الفرعي
  // (مثل rshaf.maaoun.com) — حتى لو لم يصلنا ترويسة x-tenant لسببٍ ما.
  let tenant = tenantHeader;
  let slug = slugHeader;
  if (platform?.subdomain) {
    tenant = "store";
    slug = platform.subdomain;
  } else if (platform) {
    tenant = "main";
    slug = null;
  }

  const isPreview = !platform?.subdomain;
  return { tenant, slug, host, isPreview };
}

/**
 * سياق المتجر الكامل (لصفحات المتاجر):
 * - إن كان المتجر غير موجود أو غير ظاهر للزائر → null
 */
export async function getStoreCtx(): Promise<{ tenant: TenantCtx; bundle: StoreBundle | null } | null> {
  const tenant = await getTenant();
  if (tenant.tenant !== "store" || !tenant.slug) return null;
  const actor = await getCurrentUser();
  const bundle = await services().getVisibleStoreBySubdomain(tenant.slug, actor);
  return { tenant, bundle };
}
