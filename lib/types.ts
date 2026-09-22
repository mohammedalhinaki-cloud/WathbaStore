// ============================================================
// وثبة waathba.com — أنواع مشتركة
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
  { key: "minimal", label: "بسيط", desc: "شبكة مدمجة بدون بطل، تركيز على المنتجات" },
];

export type FontKey = "cairo" | "tajawal" | "almarai" | "ibm-plex";
export const FONTS: { key: FontKey; label: string; family: string }[] = [
  { key: "cairo", label: "القاهرة", family: "Cairo" },
  { key: "tajawal", label: "تجوال", family: "Tajawal" },
  { key: "almarai", label: "المراعي", family: "Almarai" },
  { key: "ibm-plex", label: "IBM Plex", family: "IBM Plex Sans Arabic" },
];

export type SectionKey = "hero" | "categories" | "products" | "pages" | "footer";
export const SECTIONS: { key: SectionKey; label: string }[] = [
  { key: "hero", label: "صورة الغلاف (البطل)" },
  { key: "categories", label: "الأقسام" },
  { key: "products", label: "المنتجات" },
  { key: "pages", label: "روابط الصفحات" },
  { key: "footer", label: "الفوتر" },
];

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
