// ============================================================
// معين — مساعدات SEO الديناميكية لكل متجر
// كل القيم تُشتق من Supabase حسب النطاق الفرعي (hostname)،
// دون أي اسم متجر ثابت في الكود — يعمل تلقائيًا لأي متجر جديد.
// ============================================================

import type { Metadata } from "next";
import type { StoreBundle } from "./types";
import { mainDomain, APP_NAME, replaceLegacyPlatformDomain } from "./constants";
import { services } from "./services";

/** الرابط الأساسي للمتجر: يفضّل seoCanonical المضبوط، وإلا يُبنى من النطاق الفرعي */
export function storeBaseUrl(bundle: StoreBundle): string {
  const { store, settings } = bundle;
  return settings.seoCanonical?.trim() || `https://${store.subdomain}.${mainDomain()}`;
}

/** الرابط الكنسي (نفس الأساس للمتجر الرئيسي) */
export function storeCanonicalUrl(bundle: StoreBundle): string {
  return storeBaseUrl(bundle);
}

/** اسم العرض في <title>: نحترم عنوان SEO الصريح إن وُجد، وإلا «اسم المتجر | معين» */
export function storeTitle(bundle: StoreBundle): string {
  const { store, settings } = bundle;
  const seo = settings.seoTitle?.trim();
  if (seo) return seo;
  return `${store.name} | ${APP_NAME}`;
}

/** الوصف الوصفي: يفضّل seoDescription ثم وصف المتجر */
export function storeDescription(bundle: StoreBundle): string {
  const { store, settings } = bundle;
  return (settings.seoDescription?.trim() || store.description?.trim() || "").slice(0, 300);
}

/** يجلب صورة الـ favicon الخاصة بالمتجر (seoFavicon ثم شعار المتجر) أو null */
export async function getStoreFavicon(subdomain: string): Promise<string | null> {
  try {
    const store = await services().getStoreBySubdomain(subdomain.trim().toLowerCase());
    if (!store) return null;
    const settings = await services().getStoreSettings(store.id);
    return settings.seoFavicon?.trim() || store.logoUrl || null;
  } catch {
    return null;
  }
}

function joinUrl(base: string, path: string): string {
  const b = base.replace(/\/+$/, "");
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${b}${p}`;
}

/**
 * يبني بيانات Structured Data (schema.org) لمتجر واحد:
 * - WebSite    → ليفهم Google أن hostname معيّن = اسم المتجر
 * - LocalBusiness → اسم النشاط التجاري وبياناته (النوع العام الأنسب بلا تصنيف مخزّن)
 */
export function buildStoreJsonLd(bundle: StoreBundle): Record<string, unknown> {
  const { store, settings } = bundle;
  const url = storeBaseUrl(bundle);
  const name = store.name;
  const description = storeDescription(bundle);
  const logo = settings.seoFavicon?.trim() || store.logoUrl || null;
  const image = store.coverUrl || settings.seoOgImage || logo || null;
  const telephone = (store.whatsapp || store.ownerPhone || "").replace(/[^\d+]/g, "");

  const business: Record<string, unknown> = {
    "@type": "LocalBusiness",
    "@id": `${url}#business`,
    name,
    url,
  };
  if (description) business.description = description;
  if (image) {
    business.image = [image];
    if (logo) business.logo = logo;
  } else if (logo) {
    business.logo = logo;
  }
  if (telephone) business.telephone = telephone;

  const website = {
    "@type": "WebSite",
    "@id": `${url}#website`,
    url,
    name,
    inLanguage: "ar",
    publisher: { "@id": `${url}#business` },
  };

  return {
    "@context": "https://schema.org",
    "@graph": [website, business],
  };
}

/**
 * يبني كائن Metadata لمتجر بناءً على بياناته الديناميكية.
 * - العنوان يُضبط كـ absolute لمنع تكرار لاحقة العلامة (تجنّب «اسم | متجر | معين»).
 * - الرابط الكنسي والـ Open Graph يُشتقّان من النطاق/ seoCanonical.
 */
export function storePageMetadata(
  bundle: StoreBundle,
  opts?: {
    title?: string;
    description?: string;
    path?: string;
    images?: string[];
    keywords?: string[];
  }
): Metadata {
  const { settings } = bundle;
  const base = storeBaseUrl(bundle);
  const canonical = opts?.path ? joinUrl(base, opts.path) : base;

  const title = opts?.title ?? storeTitle(bundle);
  const description = (opts?.description ?? storeDescription(bundle)) || undefined;
  const images = opts?.images?.length
    ? opts.images.map((u) => ({ url: u }))
    : undefined;

  const keywords = opts?.keywords?.length
    ? opts.keywords
    : settings.seoKeywords
      ?.split(",")
      .map((k) => k.trim())
      .filter(Boolean);

  return {
    title: { absolute: title },
    description,
    keywords: keywords?.length ? keywords : undefined,
    alternates: { canonical },
    openGraph: {
      title,
      description: description || undefined,
      url: canonical,
      images,
      locale: "ar_SA",
      type: "website",
    },
  };
}
