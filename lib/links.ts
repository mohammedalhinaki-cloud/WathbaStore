// ============================================================
// معون — توليد الروابط (يُعامل النطاق الفرعي الحقيقي ومعاينة ?store=)
// ============================================================

import { mainDomain, storeUrl } from "./constants";
import { getTenant } from "./tenant";

/**
 * رابط متجه لمتجر:
 * - على الدومين الحقيقي: rshaf.maaoun.com/path
 * - في المعاينة/التطوير: /path?store=rshaf
 */
export async function storeHref(subdomain: string, path = "/"): Promise<string> {
  const tenant = await getTenant();
  if (tenant.host.endsWith(mainDomain()) || !tenant.isPreview) {
    return storeUrl(subdomain, path);
  }
  const p = path === "/" ? "/" : path.startsWith("/") ? path : `/${path}`;
  return `${p}?store=${subdomain}`;
}

/**
 * رابط داخل المتجر الحالي (يُحافظ على ?store= في وضع المعاينة)
 */
export async function storePath(path = "/"): Promise<string> {
  const tenant = await getTenant();
  if (!tenant.isPreview) return path;
  const p = path === "/" ? "/" : path.startsWith("/") ? path : `/${path}`;
  if (!tenant.slug) return p;
  const sep = p.includes("?") ? "&" : "?";
  return `${p}${sep}store=${tenant.slug}`;
}
