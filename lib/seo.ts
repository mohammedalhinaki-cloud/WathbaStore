// ============================================================
// معون — مساعدات SEO الديناميكية لكل متجر
// كل القيم تُشتق من Supabase حسب النطاق الفرعي (hostname)،
// دون أي اسم متجر ثابت في الكود — يعمل تلقائيًا لأي متجر جديد.
// ============================================================

import type { Metadata } from "next";
import type { SiteSettings, StoreBundle } from "./types";
import { mainDomain, APP_NAME, APP_TAGLINE, replaceLegacyPlatformDomain } from "./constants";
import { services } from "./services";

// ============================================================
// SEO الموقع الرئيسي (maaoun.com) — قيم يحررها المالك من لوحة
// الإعدادات، مع رجوع آمن إلى الافتراضي عند غياب أي قيمة.
// ============================================================

/** الروابط/العناوين الافتراضية للموقع الرئيسي عند عدم ضبط قيمة من اللوحة */
function siteDefaults() {
  const url = `https://${mainDomain()}`;
  return {
    url,
    title: `${APP_NAME} ${APP_TAGLINE}`,
    description: `${APP_NAME} ${APP_TAGLINE} في السعودية. ننشئ لك موقعًا أو متجرًا إلكترونيًا احترافيًا مع التصميم والتجهيز والتسليم والدعم.`,
    logo: `${url}/logo.png`,
    ogImage: `${url}/og-image.png`,
  };
}

/** شعار المنصة الذي يظهر في نتائج بحث قوقل (Organization logo) */
export function siteLogoUrl(settings: SiteSettings): string {
  const d = siteDefaults();
  const raw = settings.seoLogo?.trim() || d.logo;
  return replaceLegacyPlatformDomain(raw);
}

/** صورة المشاركة (Open Graph) للموقع الرئيسي */
export function siteOgImageUrl(settings: SiteSettings): string {
  const d = siteDefaults();
  const raw = settings.seoOgImage?.trim() || settings.seoLogo?.trim() || d.ogImage;
  return replaceLegacyPlatformDomain(raw);
}

/**
 * يبني Metadata للموقع الرئيسي من إعدادات المالك.
 * يُستدعى في generateMetadata للصفحة الرئيسية (حالة الـ Landing فقط)
 * فيتجاوز الافتراضي المكتوب في app/layout.tsx عند وجود قيمة مضبوطة.
 */
export function siteMainMetadata(settings: SiteSettings): Metadata {
  const d = siteDefaults();
  const title = settings.seoTitle?.trim() || d.title;
  const description = settings.seoDescription?.trim() || d.description;
  const keywords = settings.seoKeywords
    ?.split(",")
    .map((k) => k.trim())
    .filter(Boolean);
  const ogImage = siteOgImageUrl(settings);
  const favicon = settings.seoFavicon?.trim()
    ? replaceLegacyPlatformDomain(settings.seoFavicon.trim())
    : null;

  const meta: Metadata = {
    title: { absolute: title },
    description,
    keywords: keywords?.length ? keywords : undefined,
    alternates: { canonical: d.url },
    openGraph: {
      title,
      description,
      url: d.url,
      siteName: APP_NAME,
      locale: "ar_SA",
      type: "website",
      images: [{ url: ogImage }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
  };
  // أيقونة مخصّصة من المالك تتجاوز أيقونة layout الافتراضية
  if (favicon) meta.icons = { icon: favicon, apple: favicon };
  return meta;
}

/** الرابط الأساسي للمتجر: يفضّل seoCanonical المضبوط، وإلا يُبنى من النطاق الفرعي */
export function storeBaseUrl(bundle: StoreBundle): string {
  const { store, settings } = bundle;
  const fallback = `https://${store.subdomain}.${mainDomain()}`;
  // seoCanonical قديم محفوظ في قاعدة البيانات لا يُعاد كتابته فيها هنا؛
  // نطبّع الناتج عند التوليد حتى يخرج canonical/OG/JSON-LD بالدومين الجديد.
  return replaceLegacyPlatformDomain(settings.seoCanonical?.trim() || fallback);
}

/** الرابط الكنسي (نفس الأساس للمتجر الرئيسي) */
export function storeCanonicalUrl(bundle: StoreBundle): string {
  return storeBaseUrl(bundle);
}

/** اسم العرض في <title>: نحترم عنوان SEO الصريح إن وُجد، وإلا «اسم المتجر | معون» */
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
    const favicon = settings.seoFavicon?.trim() || store.logoUrl || null;
    return favicon ? replaceLegacyPlatformDomain(favicon) : null;
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
  const logo = replaceLegacyPlatformDomain(settings.seoFavicon?.trim() || store.logoUrl || "") || null;
  const image = replaceLegacyPlatformDomain(store.coverUrl || settings.seoOgImage || logo || "") || null;
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
 * - العنوان يُضبط كـ absolute لمنع تكرار لاحقة العلامة (تجنّب «اسم | متجر | معون»).
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
    ? opts.images.map((u) => ({ url: replaceLegacyPlatformDomain(u) }))
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
