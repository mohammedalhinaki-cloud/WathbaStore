// ============================================================
// معين maaoun.com — أنواع مشتركة
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
  updatedAt: string;
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
