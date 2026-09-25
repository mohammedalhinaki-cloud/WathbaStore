// ============================================================
// معون — ثوابت عامة
// ============================================================

import type { SiteSettings, StoreStatus } from "./types";
import { STORE_STATUS_LABELS } from "./types";

export const APP_NAME = "معون";
export const APP_EN = "maaoun.com";
/** الشعار/الوصف التسويقي المصاحب لاسم العلامة (يظهر مع الشعار وفي الـ SEO) */
export const APP_TAGLINE = "متجرك يبدأ من هنا";

/** النص الافتراضي لعنوان قسم الغلاف في الصفحة العامة (عند غياب قيمة من site_settings) */
export const HERO_TITLE = "متجرك الإلكتروني الاحترافي…";
/** الشطر الملوّن بتدرّج العلامة من عنوان الغلاف */
export const HERO_TITLE_ACCENT = "بكل بساطة";
/** النص الافتراضي للوصف أسفل عنوان الغلاف */
export const HERO_SUBTITLE =
  "نساعدك في تحويل فكرتك إلى متجر إلكتروني متكامل يعكس هوية تجارتك ويجذب عملاءك.";

/** النطاق الافتراضي للمنصة إن لم يُضبط NEXT_PUBLIC_MAIN_DOMAIN */
export const DEFAULT_MAIN_DOMAIN = "maaoun.com";

/**
 * نطاقات سابقة ما زالت تُعاد كتابتها في الروابط والنصوص المخزّنة
 * حتى لا تبقى روابط waathba.com / wathbastore.com بعد إعادة التسمية.
 * الإبقاء عليها هنا مقصود: هي مفاتيح بحث، لا الاسم الحالي.
 */
export const LEGACY_MAIN_DOMAINS = ["waathba.com", "wathbastore.com"] as const;

/**
 * الدومين الرئيسي للمنصة، مقروءًا من NEXT_PUBLIC_MAIN_DOMAIN.
 * يُنظَّف من البروتوكول والمسار والمنفذ والنقاط الزائدة حتى يعمل
 * حتى لو كتب المستخدم القيمة بصيغة مثل "https://maaoun.com/".
 */
export function mainDomain(): string {
  const raw = (process.env.NEXT_PUBLIC_MAIN_DOMAIN || "").trim().toLowerCase();
  const cleaned = raw
    .replace(/^https?:\/\//, "")
    .replace(/\/.*$/, "")
    .replace(/:\d+$/, "")
    .replace(/^\.+|\.+$/g, "");

  // لا تسمح قيمة بيئة قديمة بإعادة الدومين السابق إلى الروابط المولّدة.
  // يمكن إبقاء المتغير في بيئة النشر أثناء الانتقال، لكن الناتج العام
  // (sitemap، canonical، Open Graph وروابط المتاجر) يجب أن يبقى maaoun.com.
  const withoutWww = cleaned.replace(/^www\./, "");
  if (LEGACY_MAIN_DOMAINS.includes(withoutWww as (typeof LEGACY_MAIN_DOMAINS)[number])) {
    return DEFAULT_MAIN_DOMAIN;
  }
  return cleaned || DEFAULT_MAIN_DOMAIN;
}

/** النطاق الحالي ثم النطاقات السابقة (بلا تكرار) */
export function knownPlatformDomains(): string[] {
  const current = mainDomain();
  return [current, ...LEGACY_MAIN_DOMAINS.filter((d) => d !== current)];
}

/** يستبدل أي نطاق منصة قديم بالنطاق الحالي داخل نص أو رابط */
export function replaceLegacyPlatformDomain(value: string): string {
  if (!value) return value;
  const current = mainDomain();
  let out = value;
  for (const legacy of LEGACY_MAIN_DOMAINS) {
    if (legacy === current) continue;
    // البيانات القديمة قد تحتوي على أحرف كبيرة؛ لا نريد أن يتسرّب أي
    // اختلاف في حالة الأحرف إلى canonical أو Open Graph أو sitemap.
    out = out.replace(new RegExp(legacy.replace(/\./g, "\\."), "gi"), current);
  }
  return out;
}

/**
 * يعيد صياغة نصوص المنصة المخزّنة (الموقع العام) بعد تغيير الاسم التجاري.
 * لا يُستخدم على أوصاف متاجر العملاء حتى لا يُمسّ محتوى ليس اسم المنصة.
 */
export function rewritePlatformMarketing(value: string): string {
  if (!value) return value;
  let out = replaceLegacyPlatformDomain(value);
  out = out.split("بثُبة واحدة").join("مع معون");
  out = out.split("بوثبة واحدة").join("مع معون");
  out = out.split("بثبة واحدة").join("مع معون");
  out = out.split("ما هي وثبة").join("ما هو معون");
  out = out.split("لماذا وثبة").join("لماذا معون");
  out = out.split("وثبة").join("معون");
  // إعادة تسمية سابقة للعلامة داخل النصوص المخزّنة: «معين» → «معون».
  // تُطبَّق أخيرًا حتى تُوحَّد أي بيانات قديمة ما زالت تحمل الاسم السابق.
  out = out.split("معين").join("معون");
  out = out.split("instagram.com/waathba").join("instagram.com/maaoun");
  out = out.split("tiktok.com/@waathba").join("tiktok.com/@maaoun");
  const handle = out.trim().toLowerCase();
  if (handle === "waathba" || handle === "@waathba") return "maaoun";
  return out;
}

/** مضيفات متجر معروفة (الحالي + القديمة) لمطابقة الروابط المخزّنة */
export function storeHostVariants(subdomain: string): string[] {
  const sub = subdomain.trim().toLowerCase();
  return knownPlatformDomains().map((domain) => `${sub}.${domain}`);
}

/**
 * يحدّث رابط متجر مخزّنًا من نطاق فرعي قديم إلى الجديد على الدومين الحالي.
 * يطابق أيضًا الروابط التي ما زالت على نطاق منصة سابق.
 */
export function rewriteStoredStoreUrl(url: string, oldSub: string, newSub: string): string | null {
  if (!url || !oldSub || !newSub || oldSub === newSub) return null;
  let host = "";
  try {
    host = new URL(/^https?:\/\//i.test(url) ? url : `https://${url}`).hostname.toLowerCase();
  } catch {
    return null;
  }
  if (!storeHostVariants(oldSub).includes(host)) return null;
  return url.replace(host, `${newSub}.${mainDomain()}`);
}

const PLATFORM_SUB_RE = /^[a-z0-9](?:[a-z0-9-]{0,60}[a-z0-9])?$/;

/**
 * يتعرف على مضيف المنصة الحالي أو أي نطاق سابق.
 * أثناء النقل تبقى المتاجر تعمل على النطاق القديم إلى أن يُحدَّث DNS،
 * بينما الروابط المولَّدة تبقى على النطاق الحالي.
 */
export function platformHostOf(host: string | null | undefined): {
  domain: string;
  subdomain: string | null;
} | null {
  const h = (host || "").trim().toLowerCase().replace(/:\d+$/, "");
  if (!h) return null;
  for (const domain of knownPlatformDomains()) {
    if (h === domain || h === `www.${domain}`) return { domain, subdomain: null };
    const suffix = `.${domain}`;
    if (!h.endsWith(suffix)) continue;
    const sub = h.slice(0, -suffix.length);
    if (PLATFORM_SUB_RE.test(sub) && sub !== "www") return { domain, subdomain: sub };
  }
  return null;
}

/** يزيل لاحقة الشعار لأن الصفحة الرئيسية تعرضها في سطر مستقل */
function stripLandingAccent(title: string): string {
  return title.replace(/\s*(?:مع معون|بثُبة واحدة|بوثبة واحدة|بثبة واحدة)\s*$/u, "").trim();
}

/** عرض إعدادات الموقع العام بعد إعادة التسمية، دون كتابة فوق محتوى المتاجر */
export function presentSiteSettings(settings: SiteSettings): SiteSettings {
  return {
    ...settings,
    developerUrl: replaceLegacyPlatformDomain(settings.developerUrl),
    aboutText: rewritePlatformMarketing(settings.aboutText),
    heroTitle: stripLandingAccent(rewritePlatformMarketing(settings.heroTitle)),
    heroSubtitle: rewritePlatformMarketing(settings.heroSubtitle),
    features: (settings.features ?? []).map((item) => ({
      title: rewritePlatformMarketing(item.title ?? ""),
      desc: rewritePlatformMarketing(item.desc ?? ""),
    })),
    faq: (settings.faq ?? []).map((item) => ({
      q: rewritePlatformMarketing(item.q ?? ""),
      a: rewritePlatformMarketing(item.a ?? ""),
    })),
    socialInstagram: rewritePlatformMarketing(settings.socialInstagram),
    socialSnapchat: rewritePlatformMarketing(settings.socialSnapchat),
    socialTiktok: rewritePlatformMarketing(settings.socialTiktok),
  };
}

/**
 * نطاق الكوكي المشترك بين نطاقات المنصة الفرعية.
 *
 * لماذا؟ المالك الرئيسي يُسجّل الدخول مرة واحدة في `maaoun.com/admin`، ثم
 * يفتح `rshaf.maaoun.com/admin` ليدير المتجر بنفس واجهة صاحبه. الكوكي
 * الافتراضية تُكتب للمضيف الذي سجّل الدخول فقط، فلا تُرسَل إلى النطاق الفرعي
 * ويظهر للمالك أنه غير مسجَّل (أو تُطلب منه بيانات الدخول مرة أخرى).
 * لذلك نكتب كوكي الجلسة على النطاق الأب `.maaoun.com` فتُرسل لكل النطاقات
 * الفرعية — وتبقى فحوص الصلاحيات (RLS + الدور) هي الحاجز الحقيقي.
 *
 * يُرجع undefined لأي مضيف آخر (المعاينة على نطاق واحد، أو تطوير محلي)
 * حتى لا يتأثر وضع المعاينة أو الاختبارات المحلية بأي تغيير.
 */
export function sharedCookieDomain(host?: string | null): string | undefined {
  const info = platformHostOf(host);
  if (!info) return undefined;
  // على النطاق السابق تُكتب الكوكي لأبيه حتى لا يرفضها المتصفح أثناء النقل.
  return `.${info.domain}`;
}

export function developerUrl(fallback?: string | null): string {
  const raw = process.env.DEVELOPER_URL || fallback || "https://" + mainDomain();
  return replaceLegacyPlatformDomain(raw);
}

/** كلمة مرور التسليم الجديدة — لا تُعيد كتابة كلمات المرور المخزّنة سابقًا */
export function generateDeliveryPassword(): string {
  return "Maaoun@" + Math.random().toString(36).slice(2, 6) + Math.floor(Math.random() * 90 + 10);
}

/** نطاقات فرعية محجوزة — لا يمكن تخصيصها لمتجر */
export const RESERVED_SUBDOMAINS = [
  "www", "web", "admin", "admin2", "administrator", "panel", "panels",
  "app", "apps", "api", "apis", "graphql", "assets", "static", "cdn",
  "mail", "webmail", "ftp", "smtp", "imap", "pop",
  "support", "help", "helpdesk", "blog", "docs", "documentation",
  "pay", "payment", "payments", "checkout", "billing",
  "account", "accounts", "login", "signin", "signup", "auth", "sso",
  "store", "stores", "shop", "shops", "cart",
  "new", "create", "add", "test", "testing", "demo", "dev", "development",
  "staging", "preview", "beta", "sandbox",
  "media", "img", "images", "files", "uploads", "storage",
  "maaoun", "maoun", "moeen", "mueen", "ma3in",
  "wathba", "wathbastore", "waathba", "system", "root", "default", "home", "main",
  "portal", "dashboard", "dashboard2", "internal", "private", "secure",
  "status", "monitor", "metrics", "logs", "analytics", "stats",
  "marketing", "sales", "hr", "finance", "legal", "privacy", "terms",
];

export function storeUrl(subdomain: string, path = "/"): string {
  // نقطة توليد روابط المتاجر كلها: المتجر والمنتج والقسم والصفحة.
  // التطبيع الدفاعي يمنع أي اسم نطاق قديم من الوصول إلى sitemap أو SEO.
  return replaceLegacyPlatformDomain(`https://${subdomain}.${mainDomain()}${path}`);
}

export function statusTone(status: StoreStatus): string {
  switch (status) {
    case "draft":
      return "bg-slate-100 text-slate-700 ring-slate-200";
    case "preparing":
      return "bg-blue-50 text-blue-700 ring-blue-200";
    case "testing":
      return "bg-amber-50 text-amber-700 ring-amber-200";
    case "ready":
      return "bg-violet-50 text-violet-700 ring-violet-200";
    case "delivered":
      return "bg-emerald-50 text-emerald-700 ring-emerald-200";
    case "suspended":
      return "bg-rose-50 text-rose-700 ring-rose-200";
  }
}

export function statusLabel(status: StoreStatus): string {
  return STORE_STATUS_LABELS[status] ?? status;
}

export function formatPrice(n: number, currency = "ر.س"): string {
  return `${new Intl.NumberFormat("ar-SA", { maximumFractionDigits: 2 }).format(n)} ${currency}`;
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  try {
    return new Intl.DateTimeFormat("ar-SA", { dateStyle: "medium", timeStyle: "short" }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export function formatDateShort(iso: string | null | undefined): string {
  if (!iso) return "—";
  try {
    return new Intl.DateTimeFormat("ar-SA", { dateStyle: "medium" }).format(new Date(iso));
  } catch {
    return iso;
  }
}
