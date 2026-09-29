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

/** صورة المشاركة (Open Graph) للموقع الرئيسي — القيمة «الخام» كما ضُبطت من اللوحة */
export function siteOgImageUrl(settings: SiteSettings): string {
  const d = siteDefaults();
  const raw = settings.seoOgImage?.trim() || settings.seoLogo?.trim() || d.ogImage;
  return replaceLegacyPlatformDomain(raw);
}

// ------------------------------------------------------------
// شبكة أمان لصورة المشاركة: سبب اختفاء صورة معاينة واتساب سابقًا
// ------------------------------------------------------------
// واتساب (خلافًا لفيسبوك/تويتر) يتجاهل og:image بصمت — بلا أي خطأ
// ظاهر — إن كان حجم الملف أكبر من ~300-600 كيلوبايت تقريبًا. حين
// استُبدل شعار الموقع ورُفعت صورة غلاف جديدة عبر لوحة الإعدادات (بلا
// أي ضغط في مسار الرفع) أصبح seoOgImage يشير إلى ملف بحجم ~1 ميجابايت
// فتوقفت معاينة واتساب رغم أن الرابط صحيح تمامًا ويعمل في المتصفح
// وفي فيسبوك/تويتر (الأكثر تسامحًا مع الحجم).
//
// هذه الدالة تتحقق فعليًا (HEAD) أن الصورة المضبوطة صورة حقيقية وأن
// حجمها ضمن الحد الآمن لمعاينات واتساب؛ فإن فشل أي شرط نستخدم
// الصورة الافتراضية للمنصة (شعار MAAOUN الحالي، 1200×630، مضغوطة)
// بدل أن تختفي المعاينة بالكامل.
const MAX_SHAREABLE_IMAGE_BYTES = 300 * 1024; // 300KB — الحد الآمن المعروف لمعاينات واتساب
const OG_IMAGE_CHECK_TIMEOUT_MS = 4000;

async function isShareableImage(url: string): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), OG_IMAGE_CHECK_TIMEOUT_MS);
    let res: Response;
    try {
      res = await fetch(url, {
        method: "HEAD",
        signal: controller.signal,
        // يُخفّف تكرار الطلب لكل زيارة للصفحة الرئيسية دون تجاهل تغييرات لاحقة
        next: { revalidate: 1800 },
      });
    } finally {
      clearTimeout(timer);
    }
    if (!res.ok) return false;
    const type = (res.headers.get("content-type") || "").toLowerCase();
    // SVG/GIF غير مدعومة عمليًا في بطاقة واتساب — نطلب صورة نقطية حقيقية
    if (!type.startsWith("image/") || type.includes("svg")) return false;
    const len = Number(res.headers.get("content-length") || "");
    if (!Number.isFinite(len) || len <= 0) return false;
    return len <= MAX_SHAREABLE_IMAGE_BYTES;
  } catch {
    return false;
  }
}

/**
 * صورة المشاركة الفعلية للموقع الرئيسي بعد التحقق من قابليتها فعليًا
 * للعرض في معاينات واتساب. تُستخدم هذه بدل siteOgImageUrl مباشرة في
 * بناء الـ Metadata حتى لا تكسر صورة كبيرة أو مسار معطوب معاينة الرابط.
 */
export async function resolveSiteOgImage(settings: SiteSettings): Promise<string> {
  const d = siteDefaults();
  const candidate = siteOgImageUrl(settings);
  if (candidate === d.ogImage) return candidate; // أصلًا الصورة الافتراضية — لا داعي للتحقق
  const safe = await isShareableImage(candidate);
  return safe ? candidate : d.ogImage;
}

/**
 * يبني Metadata للموقع الرئيسي من إعدادات المالك.
 * يُستدعى في generateMetadata للصفحة الرئيسية (حالة الـ Landing فقط)
 * فيتجاوز الافتراضي المكتوب في app/layout.tsx عند وجود قيمة مضبوطة.
 */
export async function siteMainMetadata(settings: SiteSettings): Promise<Metadata> {
  const d = siteDefaults();
  const title = settings.seoTitle?.trim() || d.title;
  const description = settings.seoDescription?.trim() || d.description;
  const keywords = settings.seoKeywords
    ?.split(",")
    .map((k) => k.trim())
    .filter(Boolean);
  const ogImage = await resolveSiteOgImage(settings);
  const isDefaultOgImage = ogImage === d.ogImage;
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
      // الأبعاد معروفة فقط للصورة الافتراضية المضبوطة يدويًا في المشروع؛
      // صورة مخصّصة من المالك قد تكون بأي مقاس فلا نخترع أبعادًا خاطئة.
      images: [
        isDefaultOgImage
          ? { url: ogImage, width: 1200, height: 630, alt: `${APP_NAME} — ${APP_TAGLINE}` }
          : { url: ogImage },
      ],
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
 * يحوّل أي رابط صورة إلى رابط مطلق (https://…).
 * Google ومنصات المشاركة (واتساب/تويتر) تتجاهل الروابط النسبية في
 * البيانات المنظمة (JSON-LD) وتفضّل المطلقة في og:image، بينما
 * صور المتاجر تُخزَّن غالبًا كمسارات نسبية (/uploads/… أو /seed/…).
 * الروابط المطلقة أصلًا تُعاد كما هي.
 */
export function absoluteAssetUrl(raw: string | null | undefined, base: string): string | null {
  const u = raw?.trim();
  if (!u) return null;
  if (/^https?:\/\//i.test(u)) return u;
  return joinUrl(base, u);
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
  // الشعار والصورة في البيانات المنظمة يجب أن تكون روابط مطلقة —
  // Google يتجاهل logo النسبي فلا يظهر الشعار في نتائج البحث.
  const logo = absoluteAssetUrl(
    replaceLegacyPlatformDomain(settings.seoFavicon?.trim() || store.logoUrl || "") || null,
    url
  );
  const image = absoluteAssetUrl(
    replaceLegacyPlatformDomain(store.coverUrl || settings.seoOgImage || logo || "") || null,
    url
  );
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
  // روابط الصور النسبية تُحَل ضد نطاق المتجر نفسه (وليس نطاق المنصة
  // في metadataBase) حتى تشير og:image دائمًا إلى أصل المتجر الصحيح.
  const resolvedImages = opts?.images?.length
    ? opts.images
        .map((u) => absoluteAssetUrl(replaceLegacyPlatformDomain(u), base))
        .filter((u): u is string => Boolean(u))
    : [];
  const images = resolvedImages.length
    ? resolvedImages.map((u) => ({ url: u }))
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
    // أيقونة واحدة ديناميكية واعية بالنطاق (/icon). بدون هذا التجاوز
    // ترث صفحات المتجر أيقونات المنصة الثابتة من layout الجذر
    // (icon.svg، favicon-32x32…) فيظهر شعار «معون» في تبويب المتجر.
    icons: {
      icon: [{ url: "/icon", sizes: "any" }],
      apple: [{ url: "/icon" }],
    },
    alternates: { canonical },
    openGraph: {
      title,
      description: description || undefined,
      url: canonical,
      images,
      locale: "ar_SA",
      type: "website",
    },
    // بلا هذا يرث المتجر بطاقة تويتر الخاصة بالمنصة من layout الجذر.
    twitter: {
      card: "summary_large_image",
      title,
      description: description || undefined,
      images: resolvedImages.length ? resolvedImages : undefined,
    },
  };
}
