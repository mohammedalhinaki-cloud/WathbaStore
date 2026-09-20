// ============================================================
// واجهة الخدمات — تنفذها طبقة Supabase (إنتاج) والطبقة المحلية (تجريبي)
// ============================================================

import type {
  ActivityLog,
  AppUser,
  Category,
  Offer,
  PortfolioItem,
  PricingPlan,
  Product,
  SiteSettings,
  Store,
  StoreBundle,
  StorePage,
  StoreSettings,
  StoreStatus,
} from "../types";

export interface StoreInput {
  name: string;
  subdomain: string;
  ownerName: string;
  ownerPhone: string;
  ownerEmail: string;
  whatsapp: string;
  description: string;
  logoUrl?: string | null;
  coverUrl?: string | null;
  status?: StoreStatus;
}

export interface CreateStoreInput extends StoreInput {
  template?: string;
  font?: string;
  primaryColor?: string;
  secondaryColor?: string;
}

export interface ClientRow {
  store: Store;
  memberUser: { id: string; email: string; name: string } | null;
  productCount: number;
  categoryCount: number;
}

export interface ProductInput {
  name: string;
  description: string;
  price: number;
  oldPrice: number | null;
  stock: number | null;
  isVisible: boolean;
  categoryId: string | null;
  images: string[];
}

export interface CategoryInput {
  name: string;
  slug?: string;
  isVisible?: boolean;
}

export interface PageInput {
  title: string;
  slug?: string;
  content: string;
  isVisible?: boolean;
}

export interface Services {
  readonly mode: "supabase" | "local";

  // ----- المصادقة -----
  login(email: string, password: string): Promise<AppUser | null>;
  userById(id: string): Promise<AppUser | null>;
  /** إنشاء مستخدم جديد (يُستخدم عند تسليم المتجر) */
  createUser(input: { email: string; password: string; name: string }): Promise<AppUser>;
  updateUserPassword(userId: string, password: string): Promise<void>;
  addMembership(userId: string, storeId: string, role: "owner" | "admin" | "staff"): Promise<void>;

  // ----- المتاجر -----
  listStores(): Promise<Store[]>;
  getStore(id: string): Promise<Store | null>;
  getStoreBySubdomain(subdomain: string): Promise<Store | null>;
  /** المتاجر الظاهرة للزوار: المسلّمة فقط (أو المالك/الأعضاء) */
  getVisibleStoreBySubdomain(
    subdomain: string,
    actor: AppUser | null
  ): Promise<StoreBundle | null>;
  createStore(input: CreateStoreInput): Promise<Store>;
  updateStore(id: string, patch: Partial<StoreInput>): Promise<Store>;
  setStoreStatus(id: string, status: StoreStatus): Promise<Store>;
  changeSubdomain(id: string, subdomain: string): Promise<{ ok: boolean; error?: string }>;
  isSubdomainAvailable(subdomain: string, exceptStoreId?: string): Promise<boolean>;
  /** تسليم المتجر: تغيير الحالة + إنشاء حساب العميل */
  deliverStore(id: string, actorEmail: string): Promise<{ ok: boolean; credentials?: { email: string; password: string }; error?: string }>;

  // ----- إعدادات المتجر -----
  getStoreSettings(storeId: string): Promise<StoreSettings>;
  updateStoreSettings(storeId: string, patch: Partial<StoreSettings>): Promise<StoreSettings>;

  // ----- الأقسام -----
  listCategories(storeId: string, includeHidden?: boolean): Promise<Category[]>;
  createCategory(storeId: string, input: CategoryInput): Promise<Category>;
  updateCategory(id: string, patch: Partial<CategoryInput> & { sortOrder?: number }): Promise<Category>;
  deleteCategory(id: string): Promise<void>;
  moveCategory(id: string, dir: "up" | "down"): Promise<void>;

  // ----- المنتجات -----
  listProducts(storeId: string, opts?: { includeHidden?: boolean; categoryId?: string }): Promise<Product[]>;
  getProduct(storeId: string, idOrSlug: string): Promise<Product | null>;
  createProduct(storeId: string, input: ProductInput): Promise<Product>;
  updateProduct(id: string, input: Partial<ProductInput>): Promise<Product>;
  deleteProduct(id: string): Promise<void>;
  moveProduct(id: string, dir: "up" | "down"): Promise<void>;

  // ----- الصفحات -----
  listPages(storeId: string): Promise<StorePage[]>;
  getPageBySlug(storeId: string, slug: string): Promise<StorePage | null>;
  createPage(storeId: string, input: PageInput): Promise<StorePage>;
  updatePage(id: string, patch: Partial<PageInput>): Promise<StorePage>;
  deletePage(id: string): Promise<void>;

  // ----- النشاطات -----
  logActivity(actor: { id: string | null; email: string }, storeId: string | null, action: string, details?: Record<string, unknown>): Promise<void>;
  listActivity(opts: { storeId?: string | null; limit?: number }): Promise<ActivityLog[]>;

  // ----- الموقع العام -----
  getSiteSettings(): Promise<SiteSettings>;
  updateSiteSettings(patch: Partial<SiteSettings>): Promise<SiteSettings>;
  listPlans(visibleOnly?: boolean): Promise<PricingPlan[]>;
  createPlan(input: Omit<PricingPlan, "id" | "updatedAt">): Promise<PricingPlan>;
  updatePlan(id: string, patch: Partial<Omit<PricingPlan, "id" | "updatedAt">>): Promise<PricingPlan>;
  deletePlan(id: string): Promise<void>;
  listOffers(): Promise<Offer[]>;
  createOffer(input: Omit<Offer, "id" | "createdAt">): Promise<Offer>;
  updateOffer(id: string, patch: Partial<Omit<Offer, "id" | "createdAt">>): Promise<Offer>;
  deleteOffer(id: string): Promise<void>;
  listPortfolio(visibleOnly?: boolean): Promise<PortfolioItem[]>;
  createPortfolio(input: Omit<PortfolioItem, "id" | "createdAt">): Promise<PortfolioItem>;
  updatePortfolio(id: string, patch: Partial<Omit<PortfolioItem, "id" | "createdAt">>): Promise<PortfolioItem>;
  deletePortfolio(id: string): Promise<void>;

  // ----- العملاء -----
  listClients(): Promise<ClientRow[]>;
  getClient(storeId: string): Promise<ClientRow | null>;

  // ----- الملفات -----
  uploadImage(storeId: string, folder: "logo" | "cover" | "products" | "pages", buffer: Buffer, filename: string): Promise<string>;
}
