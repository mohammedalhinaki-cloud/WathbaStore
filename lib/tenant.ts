// ============================================================
// وثبة — كشف المستأجر (الموقع العام أم متجر عميل)
// middleware يضبط الترويسات: x-tenant / x-store-slug
// ============================================================

import { headers } from "next/headers";
import { isPreviewHost, mainDomain } from "./constants";
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
  const host = (h.get("host") || "").replace(/:\d+$/, "").toLowerCase();
  const tenant = (h.get("x-tenant") as "main" | "store") || "main";
  const slug = h.get("x-store-slug");
  const domain = mainDomain();
  const onMainDomain = host === domain || host.endsWith(`.${domain}`);
  // نطاقات المعاينة (vercel.app …) تبقى «معاينة» دائمًا: روابط ?store= نسبية،
  // حتى لو أشار NEXT_PUBLIC_MAIN_DOMAIN إلى نطاق المعاينة نفسه.
  const isPreview = isPreviewHost(host) || !(onMainDomain && tenant === "store");
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
