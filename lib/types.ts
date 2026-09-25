// ============================================================
// معون maaoun.com — أنواع مشتركة
// ============================================================

export type StoreStatus =
  | "draft"
  | "preparing"
  | "testing"
  | "ready"
  | "delivered"
  | "suspended";

export const STORE_STATUS_LABELS: Record<StoreStatus, string> = {
  draft: "مسودة",
  preparing: "قيد التجهيز",
  testing: "جاهز للاختبار",
  ready: "جاهز للتسليم",
  delivered: "مسلّم",
  suspended: "متوقف",
};

export const STORE_STATUSES = Object.keys(STORE_STATUS_LABELS) as StoreStatus[];

export type TemplateKey = "modern" | "classic" | "minimal";
export const TEMPLATES: { key: TemplateKey; label: string; desc: string }[] = [
  { key: "modern", label: "عصري", desc: "واجهة واسعة، بطاقات بارزة، وبطل صورة غلاف" },
  { key: "classic", label: "كلاسيكي", desc: "تخطيط مرتب بأسطر، بهدوء وبساطة" },
  { key: "minimal", label: "بسيط", desc: "شبكة مدمجة، تركيز على المنتجات" },
];

export type FontKey = "cairo" | "tajawal" | "almarai" | "ibm-plex";
export const FONTS: { key: FontKey; label: string; family: string }[] = [
  { key: "cairo", label: "القاهرة", family: "Cairo" },
  { key: "tajawal", label: "تجوال", family: "Tajawal" },
  { key: "almarai", label: "المراعي", family: "Almarai" },
  { key: "ibm-plex", label: "IBM Plex", family: "IBM Plex Sans Arabic" },
];

/**
 * أقسام الصفحة الرئيسية للمتجر.
 *
 * ملاحظة: "categories" (تبويبات الأقسام) أُزيلت من الصفحة الرئيسية — كانت
 * تظهر كشريط تبويبات (قهوة / مشروبات باردة / حلويات) تحت صورة الغلاف.
 * بقيت القيمة في النوع وفي ALL_SECTION_KEYS للتوافق مع البيانات القديمة المخزّنة
 * في section_order، لكنها لم تعد قسمًا قابلًا للعرض ولا تظهر في لوحة التصميم.
 * الأقسام نفسها ما زالت تعمل: روابط القائمة العلوية، صفحات /categories/[slug]،
 * وأزرار فلترة المنتجات.
 */
export type SectionKey = "hero" | "categories" | "products" | "pages" | "footer";

/** كل المفاتيح المعروفة (بما فيها المُهمَلة) — تُستخدم لتطبيع البيانات القديمة */
const ALL_SECTION_KEYS: SectionKey[] = [
  "hero",
  "categories",
  "products",
  "pages",
  "footer",
];

/** الأقسام الظاهرة فعليًا في الصفحة الرئيسية (بدون تبويبات الأقسام) */
export const ACTIVE_SECTION_KEYS: SectionKey[] = [
  "hero",
  "products",
  "pages",
  "footer",
];

export const SECTIONS: { key: SectionKey; label: string }[] = [
  { key: "hero", label: "صورة الغلاف (البطل)" },
  { key: "products", label: "المنتجات" },
  { key: "pages", label: "روابط الصفحات" },
  { key: "footer", label: "الفوتر" },
];

/** الترتيب الافتراضي لأقسام الرئيسية */
export const DEFAULT_SECTION_ORDER: SectionKey[] = [...ACTIVE_SECTION_KEYS];

/**
 * تطبيع ترتيب الأقسام القادم من قاعدة البيانات:
 * يحذف القيم المجهولة والمُهمَلة ("categories") ويمنع التكرار،
 * ويُرجع الترتيب الافتراضي إن كانت القائمة فارغة — حتى لا تختفي
 * صورة الغلاف بسبب بيانات قديمة أو ناقصة.
 */
export function normalizeSectionOrder(value: unknown): SectionKey[] {
  if (!Array.isArray(value)) return [...DEFAULT_SECTION_ORDER];
  const seen = new Set<SectionKey>();
  const out: SectionKey[] = [];
  for (const raw of value) {
    if (typeof raw !== "string") continue;
    const key = raw as SectionKey;
    if (!ALL_SECTION_KEYS.includes(key)) continue; // قيمة مجهولة
    if (!ACTIVE_SECTION_KEYS.includes(key)) continue; // قسم مُهمَل (تبويبات الأقسام)
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(key);
  }
  if (out.length === 0) return [...DEFAULT_SECTION_ORDER];
  // صورة الغلاف قسم أساسي: إن سقطت من ترتيب قديم نُعيدها في المقدمة
  if (!out.includes("hero")) out.unshift("hero");
  return out;
}

/**
 * هل يظهر قسم الغلاف (البطل) في الصفحة الرئيسية؟
 *
 * دالة واحدة مشتركة يستخدمها كل من:
 * - app/page.tsx        → لتفعيل الهيدر الشفاف المتراكب فوق الغلاف
 * - components/store/store-home.tsx → لعرض قسم الغلاف نفسه
 * حتى لا يختلف القرار بينهما (هيدر شفاف بلا غلاف = محتوى مخفي).
 *
 * القاعدة: القائمة الفارغة تعني «الترتيب الافتراضي» (الغلاف ظاهر)،
 * ونفس المنطق مطبّق داخل normalizeSectionOrder.
 */
export function isHeroEnabled(sectionOrder: SectionKey[] | null | undefined): boolean {
  const order = Array.isArray(sectionOrder) ? sectionOrder : [];
  return order.length === 0 || order.includes("hero");
}

export interface Store {
  id: string;
  name: string;
  subdomain: string;
  status: StoreStatus;
  ownerName: string;
  ownerPhone: string;
  ownerEmail: string;
  whatsapp: string;
  description: string;
  logoUrl: string | null;
  coverUrl: string | null;
  deliveredAt: string | null;
  createdAt: string;
  updatedAt: string;
  /** بيانات دخول العميل (تُحدَّث عند التسليم) */
  clientCredentials: { email: string; password: string } | null;
}

export interface StoreSettings {
  storeId: string;
  template: TemplateKey;
  font: FontKey;
  primaryColor: string;
  secondaryColor: string;
  sectionOrder: SectionKey[];
  aboutText: string;
  socialInstagram: string;
  socialSnapchat: string;
  socialTiktok: string;
  socialWhatsApp: string;
  developerUrl: string;
  seoTitle: string;
  seoDescription: string;
  seoKeywords: string;
  seoOgImage: string;
  seoFavicon: string;
  seoCanonical: string;
  footerBgColor: string;
  ibanRajhi: string;
  ibanAlinmaa: string;
  ibanAlahli: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  storeId: string;
  name: string;
  slug: string;
  sortOrder: number;
  isVisible: boolean;
  createdAt: string;
}

export interface ProductImage {
  id: string;
  productId: string;
  storeId: string;
  url: string;
  sortOrder: number;
}

export interface Product {
  id: string;
  storeId: string;
  slug: string;
  categoryId: string | null;
  name: string;
  description: string;
  price: number;
  oldPrice: number | null;
  stock: number | null;
  isVisible: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  images: ProductImage[];
}

export interface StorePage {
  id: string;
  storeId: string;
  title: string;
  slug: string;
  content: string;
  isVisible: boolean;
  sortOrder: number;
  updatedAt: string;
}

export interface StoreMember {
  id: string;
  storeId: string;
  userId: string;
  role: "owner" | "admin" | "staff";
  createdAt: string;
}

export interface ActivityLog {
  id: number;
  storeId: string | null;
  userId: string | null;
  actorEmail: string;
  action: string;
  details: Record<string, unknown>;
  createdAt: string;
}

export const ACTIVITY_LABELS: Record<string, string> = {
  "store.created": "إنشاء متجر",
  "store.updated": "تعديل بيانات متجر",
  "store.status_changed": "تغيير حالة متجر",
  "store.subdomain_changed": "تغيير النطاق الفرعي",
  "store.delivered": "تسليم متجر",
  "design.updated": "تعديل التصميم",
  "settings.updated": "تعديل إعدادات المتجر",
  "seo.updated": "تحديث SEO",
  "product.created": "إضافة منتج",
  "product.updated": "تعديل منتج",
  "product.deleted": "حذف منتج",
  "category.created": "إضافة قسم",
  "category.updated": "تعديل قسم",
  "category.deleted": "حذف قسم",
  "page.created": "إضافة صفحة",
  "page.updated": "تعديل صفحة",
  "page.deleted": "حذف صفحة",
  "image.uploaded": "رفع صورة",
  "image.deleted": "حذف صورة",
  "owner.login": "دخول المالك",
  "member.login": "دخول صاحب متجر",
};

export interface SiteSettings {
  whatsappNumber: string;
  developerUrl: string;
  aboutText: string;
  heroTitle: string;
  heroSubtitle: string;
  features: { title: string; desc: string }[];
  faq: { q: string; a: string }[];
  socialInstagram: string;
  socialSnapchat: string;
  socialTiktok: string;
  /** محتوى الموقع العام القابل للتحرير من لوحة المالك (يُدمج دائمًا مع الافتراضي) */
  landing: LandingContent;
  updatedAt: string;
}

// ============================================================
// محتوى الموقع العام (Landing) — يتحكم به المالك من /admin/content
// ============================================================

/** عنوان + وصف (خدمة / بطاقة / ميزة) */
export interface LandingTitleDesc {
  title: string;
  desc: string;
}

/** إحصائية الغلاف: رقم متحرك + لاحقة/وحدة + وصف */
export interface LandingStat {
  value: number;
  suffix: string;
  unit: string;
  label: string;
}

/** ترويسة قسم: شارة + عنوان + سطر فرعي */
export interface LandingSectionHead {
  badge: string;
  title: string;
  sub: string;
}

/** رابط تنقل علوي */
export interface LandingNavLink {
  href: string;
  label: string;
}

/** الأقسام القابلة للإخفاء وإعادة الترتيب أسفل الغلاف */
export const LANDING_SECTION_KEYS = [
  "about",
  "services",
  "portfolio",
  "pricing",
  "offers",
  "features",
  "faq",
  "cta",
] as const;
export type LandingSectionKey = (typeof LANDING_SECTION_KEYS)[number];

export const LANDING_SECTION_LABELS: Record<LandingSectionKey, string> = {
  about: "عن معون",
  services: "الخدمات",
  portfolio: "الأعمال",
  pricing: "الأسعار",
  offers: "العروض",
  features: "المميزات",
  faq: "الأسئلة الشائعة",
  cta: "الدعوة الأخيرة (الصندوق البرتقالي)",
};

/** مفاتيح إظهار/إخفاء عناصر فرعية في الصفحة */
export interface LandingToggles {
  heroStats: boolean;
  heroImage: boolean;
  heroBadge: boolean;
  heroPrimaryBtn: boolean;
  heroSecondaryBtn: boolean;
  aboutBullets: boolean;
  aboutCards: boolean;
  navCta: boolean;
  footer: boolean;
  footerLinks: boolean;
  footerContact: boolean;
  footerSocial: boolean;
}

export const LANDING_TOGGLE_LABELS: Record<keyof LandingToggles, string> = {
  heroStats: "الغلاف — كروت الإحصائيات",
  heroImage: "الغلاف — الصورة",
  heroBadge: "الغلاف — بطاقة التسليم العائمة",
  heroPrimaryBtn: "الغلاف — زر الواتساب",
  heroSecondaryBtn: "الغلاف — الزر الثاني",
  aboutBullets: "عن معون — النقاط",
  aboutCards: "عن معون — البطاقات",
  navCta: "التنقل — زر «ابدأ مشروعك»",
  footer: "التذييل بالكامل",
  footerLinks: "التذييل — روابط سريعة",
  footerContact: "التذييل — تواصل",
  footerSocial: "التذييل — أيقونات التواصل الاجتماعي",
};

export interface LandingContent {
  /** ترتيب الأقسام أسفل الغلاف + الأقسام المخفية */
  sections: { order: LandingSectionKey[]; hidden: LandingSectionKey[] };
  toggles: LandingToggles;
  hero: {
    title: string;
    accent: string;
    subtitle: string;
    primaryBtn: string;
    secondaryBtn: string;
    imageUrl: string;
    badgeTitle: string;
    badgeDesc: string;
  };
  stats: LandingStat[];
  about: {
    badge: string;
    title: string;
    bullets: string[];
    cards: LandingTitleDesc[];
  };
  services: LandingTitleDesc[];
  heads: {
    services: LandingSectionHead;
    portfolio: LandingSectionHead;
    pricing: LandingSectionHead;
    offers: LandingSectionHead;
    features: LandingSectionHead;
    faq: LandingSectionHead;
  };
  nav: {
    links: LandingNavLink[];
    cta: string;
    ctaMobile: string;
  };
  cta: { title: string; desc: string; button: string };
  footer: { tagline: string };
}

/**
 * المحتوى الافتراضي — يطابق النصوص الأصلية للموقع حرفيًا.
 * `{domain}` في نقاط قسم «عن معون» تُستبدل بالنطاق الفعلي عند العرض.
 */
export const DEFAULT_LANDING_CONTENT: LandingContent = {
  sections: { order: [...LANDING_SECTION_KEYS], hidden: [] },
  toggles: {
    heroStats: true,
    heroImage: true,
    heroBadge: true,
    heroPrimaryBtn: true,
    heroSecondaryBtn: true,
    aboutBullets: true,
    aboutCards: true,
    navCta: true,
    footer: true,
    footerLinks: true,
    footerContact: true,
    footerSocial: true,
  },
  hero: {
    title: "متجرك الإلكتروني الاحترافي...",
    accent: "بكل بساطة",
    subtitle: "نساعدك في تحويل فكرتك إلى متجر إلكتروني متكامل يعكس هوية تجارتك ويجذب عملاءك.",
    primaryBtn: "تواصل عبر واتساب",
    secondaryBtn: "شاهد أعمالي",
    imageUrl: "/seed/hero.jpg",
    badgeTitle: "تسليم جاهز للعمل",
    badgeDesc: "نطاق فرعي + لوحة تحكم العميل",
  },
  stats: [
    { value: 100, suffix: "+", unit: "", label: "فكرة متجر بدأت معنا" },
    { value: 499, suffix: "", unit: "ريال", label: "سعر يبدأ منه متجرك" },
    { value: 7, suffix: "", unit: "أيام", label: "لتجهيز متجرك" },
    { value: 100, suffix: "%", unit: "", label: "تحكمك في متجرك" },
  ],
  about: {
    badge: "ما هو معون؟",
    title: "منصة أدير بها متاجر أعمالي… وأسلّمها جاهزة",
    bullets: [
      "كل متجر على نطاق فرعي مستقل: name.{domain}",
      "تصميم ومنتجات وSEO أجهزها أنا قبل التسليم",
      "لوحة تحكم مستقلة لكل عميل بعد التسليم",
    ],
    cards: [
      { title: "سريع", desc: "تصميم خفيف محسّن للأداء على الجوال والكمبيوتر." },
      { title: "تسليم جاهز", desc: "متجر كامل: منتجات، أقسام، صفحات، واتساب." },
      { title: "إدارة ذاتية", desc: "العميل يدير متجره من لوحته بعد التسليم." },
      { title: "بأسعار واضحة", desc: "باقات بسيطة بدون رسوم خفية أو مفاجآت." },
    ],
  },
  services: [
    { title: "تأسيس متجر كامل", desc: "من الفكرة إلى الإطلاق: أنشئ متجرك على نطاق فرعي خاص، بهيكله ومنتجاته وصفحاته." },
    { title: "تصميم بهوية متجرك", desc: "قوالب جاهزة قابلة للتخصيص: قوالب، خطوط عربية، وألوان تعكس هوية نشاطك." },
    { title: "الطلب عبر واتساب", desc: "زر «اطلب عبر واتساب» برسالة جاهزة تتضمن المنتج والسعر — بدون تعقيد ودون بوابات دفع." },
    { title: "SEO محلي بالعربي", desc: "عناوين ووصف وكلمات مفتاحية مخصصة لكل متجر حتى يظهر في نتائج البحث." },
    { title: "أمان وعزل كامل", desc: "عزل حقيقي لبيانات كل متجر على مستوى قاعدة البيانات وصلاحيات صارمة لكل حساب." },
    { title: "لوحة تحكم للعميل", desc: "بعد التسليم يدير العميل متجره بنفسه: منتجات، أسعار، صور، وأقسام — من لوحة مستقلة." },
  ],
  heads: {
    services: { badge: "الخدمات", title: "كل ما يحتاجه متجرك… في مكان واحد", sub: "من الإنشاء إلى التسليم، وكل خطوة بين المراحل" },
    portfolio: { badge: "أعمالي", title: "متاجر بُنيت على معون", sub: "عينات من المتاجر التي أنشأتها وجاهزتها" },
    pricing: { badge: "الأسعار", title: "باقات واضحة… بدون مفاجآت", sub: "اختر ما يناسب نشاطك، وابدأ عبر واتساب" },
    offers: { badge: "عروض حصرية", title: "العروض الحالية", sub: "فرص محدودة — لا تفوتها" },
    features: { badge: "لماذا معون؟", title: "مميزات تجعل الفرق", sub: "بُنية مبنية لتتحمل نمو عدد المتاجر" },
    faq: { badge: "الأسئلة الشائعة", title: "كل ما تريد معرفته", sub: "إن كان لديك سؤال آخر، تواصل عبر واتساب" },
  },
  nav: {
    links: [
      { href: "#services", label: "الخدمات" },
      { href: "#portfolio", label: "أعمالي" },
      { href: "#pricing", label: "الأسعار" },
      { href: "#offers", label: "العروض" },
      { href: "#faq", label: "الأسئلة" },
    ],
    cta: "ابدأ مشروعك",
    ctaMobile: "ابدأ مشروعك عبر واتساب",
  },
  cta: {
    title: "جاهز تنطلق بثقتك؟",
    desc: "أرسل لي رسالة عبر واتساب وأخبرني عن نشاطك — وسأجهز لك متجرًا جاهزًا خلال أيام.",
    button: "ابدأ الآن عبر واتساب",
  },
  footer: { tagline: "متجرك يبدأ من هنا" },
};

/** حدود عناصر المحتوى — تحفظ التصميم من الكسر */
export const LANDING_LIMITS = {
  stats: 4,
  aboutBullets: 6,
  aboutCards: 4,
  services: 6,
  navLinks: 6,
} as const;

// ----- دمج دفاعي: أي قيمة مخزّنة تُدمج فوق الافتراضي -----

function landingStr(v: unknown, fb: string): string {
  return typeof v === "string" && v.trim() ? v : fb;
}

function landingNum(v: unknown, fb: number): number {
  const n = typeof v === "number" ? v : Number(v);
  if (!Number.isFinite(n)) return fb;
  return Math.max(0, Math.min(9999999, Math.round(n)));
}

function landingArr<T>(v: unknown, fb: T[], map: (x: unknown, d: T) => T, max: number): T[] {
  if (!Array.isArray(v) || v.length === 0) return fb;
  return v.slice(0, max).map((x, i) => map(x, fb[i % fb.length] as T));
}

function asObj(v: unknown): Record<string, unknown> {
  return typeof v === "object" && v !== null ? (v as Record<string, unknown>) : {};
}

function mergeTitleDesc(v: unknown, d: LandingTitleDesc): LandingTitleDesc {
  const o = asObj(v);
  return { title: landingStr(o.title, d.title), desc: landingStr(o.desc, d.desc) };
}

function mergeHead(v: unknown, d: LandingSectionHead): LandingSectionHead {
  const o = asObj(v);
  return {
    badge: landingStr(o.badge, d.badge),
    title: landingStr(o.title, d.title),
    sub: landingStr(o.sub, d.sub),
  };
}

/**
 * يدمج المحتوى المخزّن (قد يكون ناقصًا أو قديمًا) مع الافتراضي —
 * فلا يظهر الموقع فارغًا أبدًا مهما كانت البيانات.
 */
export function mergeLandingContent(stored: unknown): LandingContent {
  const d = DEFAULT_LANDING_CONTENT;
  const o = asObj(stored);
  const hero = asObj(o.hero);
  const about = asObj(o.about);
  const heads = asObj(o.heads);
  const nav = asObj(o.nav);
  const cta = asObj(o.cta);
  const footer = asObj(o.footer);
  const sections = asObj(o.sections);
  const toggles = asObj(o.toggles);
  const isKey = (k: unknown): k is LandingSectionKey =>
    typeof k === "string" && (LANDING_SECTION_KEYS as readonly string[]).includes(k);
  const order = Array.isArray(sections.order)
    ? Array.from(new Set(sections.order.filter(isKey)))
    : [];
  // أي قسم جديد غير موجود في الترتيب المخزّن يُضاف في النهاية
  for (const k of LANDING_SECTION_KEYS) if (!order.includes(k)) order.push(k);
  const hidden = Array.isArray(sections.hidden)
    ? Array.from(new Set(sections.hidden.filter(isKey)))
    : [];
  const toggleOut = { ...d.toggles };
  for (const k of Object.keys(toggleOut) as (keyof LandingToggles)[]) {
    if (typeof toggles[k] === "boolean") toggleOut[k] = toggles[k] as boolean;
  }
  return {
    sections: { order, hidden },
    toggles: toggleOut,
    hero: {
      title: landingStr(hero.title, d.hero.title),
      accent: landingStr(hero.accent, d.hero.accent),
      subtitle: landingStr(hero.subtitle, d.hero.subtitle),
      primaryBtn: landingStr(hero.primaryBtn, d.hero.primaryBtn),
      secondaryBtn: landingStr(hero.secondaryBtn, d.hero.secondaryBtn),
      imageUrl: landingStr(hero.imageUrl, d.hero.imageUrl),
      badgeTitle: landingStr(hero.badgeTitle, d.hero.badgeTitle),
      badgeDesc: landingStr(hero.badgeDesc, d.hero.badgeDesc),
    },
    stats: landingArr(
      o.stats,
      d.stats,
      (x, dd) => {
        const s = asObj(x);
        return {
          value: landingNum(s.value, dd.value),
          suffix: typeof s.suffix === "string" ? s.suffix.slice(0, 8) : dd.suffix,
          unit: typeof s.unit === "string" ? s.unit.slice(0, 20) : dd.unit,
          label: landingStr(s.label, dd.label),
        };
      },
      LANDING_LIMITS.stats
    ),
    about: {
      badge: landingStr(about.badge, d.about.badge),
      title: landingStr(about.title, d.about.title),
      bullets: landingArr(about.bullets, d.about.bullets, (x, dd) => landingStr(x, dd), LANDING_LIMITS.aboutBullets),
      cards: landingArr(about.cards, d.about.cards, mergeTitleDesc, LANDING_LIMITS.aboutCards),
    },
    services: landingArr(o.services, d.services, mergeTitleDesc, LANDING_LIMITS.services),
    heads: {
      services: mergeHead(heads.services, d.heads.services),
      portfolio: mergeHead(heads.portfolio, d.heads.portfolio),
      pricing: mergeHead(heads.pricing, d.heads.pricing),
      offers: mergeHead(heads.offers, d.heads.offers),
      features: mergeHead(heads.features, d.heads.features),
      faq: mergeHead(heads.faq, d.heads.faq),
    },
    nav: {
      links: landingArr(
        nav.links,
        d.nav.links,
        (x, dd) => {
          const l = asObj(x);
          const href = typeof l.href === "string" && /^#[a-zA-Z-]+$/.test(l.href) ? l.href : dd.href;
          return { href, label: landingStr(l.label, dd.label) };
        },
        LANDING_LIMITS.navLinks
      ),
      cta: landingStr(nav.cta, d.nav.cta),
      ctaMobile: landingStr(nav.ctaMobile, d.nav.ctaMobile),
    },
    cta: {
      title: landingStr(cta.title, d.cta.title),
      desc: landingStr(cta.desc, d.cta.desc),
      button: landingStr(cta.button, d.cta.button),
    },
    footer: { tagline: landingStr(footer.tagline, d.footer.tagline) },
  };
}

export interface PricingPlan {
  id: string;
  name: string;
  price: number;
  oldPrice: number | null;
  currency: string;
  features: string[];
  isFeatured: boolean;
  isVisible: boolean;
  sortOrder: number;
  updatedAt: string;
}

export interface Offer {
  id: string;
  title: string;
  description: string;
  price: number;
  oldPrice: number | null;
  currency: string;
  startsAt: string | null;
  endsAt: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface PortfolioItem {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  storeUrl: string;
  tags: string;
  isVisible: boolean;
  sortOrder: number;
  createdAt: string;
}

export interface AppUser {
  id: string;
  email: string;
  name: string;
  role: "owner" | "member";
  memberships: { storeId: string; role: string }[];
}

export interface StoreBundle {
  store: Store;
  settings: StoreSettings;
}
