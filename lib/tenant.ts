// ============================================================
// وثبة — كشف المستأجر (الموقع العام أم متجر عميل)
// middleware يضبط الترويسات: x-tenant / x-store-slug
// ============================================================

import { headers } from "next/headers";
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
  const isPreview = !(host.endsWith("wathbastore.com") && tenant === "store");
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
