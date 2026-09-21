// ============================================================
// وثبة — تنفيذ الخدمات على Supabase (الوضع الإنتاجي)
// يعتمد على Supabase Auth + Row Level Security للعزل الكامل
// ============================================================

import { supabaseAdmin, supabaseServer, STORAGE_BUCKET } from "../supabase/client";
import { mainDomain } from "../constants";
import type {
  ActivityLog,
  AppUser,
  Category,
  Offer,
  PortfolioItem,
  PricingPlan,
  Product,
  ProductImage,
  SiteSettings,
  Store,
  StoreBundle,
  StorePage,
  StoreSettings,
  StoreStatus,
} from "../types";
import type {
  CategoryInput,
  ClientRow,
  CreateStoreInput,
  PageInput,
  ProductInput,
  Services,
  StoreInput,
} from "./types";

const DEFAULT_SECTION_ORDER: StoreSettings["sectionOrder"] = [
  "hero",
  "categories",
  "products",
  "pages",
  "footer",
];

function slugify(name: string): string {
  const s = (name || "")
    .normalize("NFKD")
    .replace(/[\u200b\u200c\u200d\u200e\u200f]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\p{L}\p{N}-]/gu, "")
    .toLowerCase()
    .slice(0, 60);
  return s || "product";
}

export class SupabaseServices implements Services {
  readonly mode = "supabase" as const;

  // ---------------- المصادقة ----------------

  private async buildUser(id: string, email: string, name: string, role: string): Promise<AppUser> {
    const sb = await supabaseServer();
    const { data } = await sb.from("store_members").select("store_id, role").eq("user_id", id);
    return {
      id,
      email,
      name,
      role: role === "owner" ? "owner" : "member",
      memberships: (data ?? []).map((m) => ({ storeId: m.store_id, role: m.role })),
    };
  }

  async login(email: string, password: string): Promise<AppUser | null> {
    const sb = await supabaseServer();
    const { data, error } = await sb.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });
    if (error || !data.user) return null;
    const { data: profile } = await sb
      .from("profiles")
      .select("role, full_name")
      .eq("id", data.user.id)
      .maybeSingle();
    return this.buildUser(
      data.user.id,
      data.user.email ?? email,
      (profile?.full_name as string) ?? (data.user.user_metadata?.full_name as string) ?? "",
      (profile?.role as string) ?? "member"
    );
  }

  async userById(id: string): Promise<AppUser | null> {
    const sb = await supabaseServer();
    // عميل الجلسة لا يملك صلاحية auth.admin. نتحقق من المستخدم الحالي
    // بدل إرسال طلب Admin كان يؤدي إلى فقدان الجلسة بعد تسجيل الدخول.
    const {
      data: { user },
      error,
    } = await sb.auth.getUser();
    if (error || !user || user.id !== id) return null;

    const { data: profile } = await sb
      .from("profiles")
      .select("role, full_name")
      .eq("id", id)
      .maybeSingle();
    return this.buildUser(
      id,
      user.email ?? "",
      (profile?.full_name as string) ?? (user.user_metadata?.full_name as string) ?? "",
      (profile?.role as string) ?? "member"
    );
  }

  async createUser(input: { email: string; password: string; name: string }): Promise<AppUser> {
    const admin = supabaseAdmin();
    const { data, error } = await admin.auth.admin.createUser({
      email: input.email.trim().toLowerCase(),
      password: input.password,
      email_confirm: true,
      user_metadata: { full_name: input.name },
    });
    if (error || !data.user) throw new Error(error?.message ?? "فشل إنشاء المستخدم");
    return {
      id: data.user.id,
      email: input.email,
      name: input.name,
      role: "member",
      memberships: [],
    };
  }

  async updateUserPassword(userId: string, password: string): Promise<void> {
    const { error } = await supabaseAdmin().auth.admin.updateUserById(userId, {
      password,
    });
    if (error) throw new Error(error.message);
  }

  async addMembership(userId: string, storeId: string, role: "owner" | "admin" | "staff"): Promise<void> {
    const { error } = await supabaseAdmin()
      .from("store_members")
      .upsert({ store_id: storeId, user_id: userId, role }, { onConflict: "store_id,user_id" });
    if (error) throw new Error(error.message);
  }

  // ---------------- المتاجر ----------------

  private mapStore(r: Record<string, unknown>): Store {
    return {
      id: r.id as string,
      name: r.name as string,
      subdomain: r.subdomain as string,
      status: r.status as StoreStatus,
      ownerName: (r.owner_name as string) ?? "",
      ownerPhone: (r.owner_phone as string) ?? "",
      ownerEmail: (r.owner_email as string) ?? "",
      whatsapp: (r.whatsapp as string) ?? "",
      description: (r.description as string) ?? "",
      logoUrl: (r.logo_url as string) ?? null,
      coverUrl: (r.cover_url as string) ?? null,
      clientCredentials: (r.client_credentials as Store["clientCredentials"]) ?? null,
      deliveredAt: (r.delivered_at as string) ?? null,
      createdAt: r.created_at as string,
      updatedAt: r.updated_at as string,
    };
  }

  /**
   * يرفق بيانات التسليم من الجدول الخاص. RLS يعيد صفوفًا لمالك المنصة فقط،
   * ولذلك تبقى كلمة المرور غائبة تمامًا عن الزائر وصاحب المتجر.
   */
  private async attachCredentials(stores: Store[]): Promise<Store[]> {
    if (stores.length === 0) return stores;
    const { data } = await (await supabaseServer())
      .from("store_credentials")
      .select("store_id, email, password")
      .in(
        "store_id",
        stores.map((store) => store.id)
      );
    if (!data?.length) return stores;

    const byStore = new Map(
      data.map((row) => [
        row.store_id as string,
        { email: row.email as string, password: row.password as string },
      ])
    );
    return stores.map((store) => ({
      ...store,
      clientCredentials: byStore.get(store.id) ?? store.clientCredentials,
    }));
  }

  async listStores(): Promise<Store[]> {
    const { data, error } = await (await supabaseServer())
      .from("stores")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    const stores = (data ?? []).map((r) => this.mapStore(r as Record<string, unknown>));
    return this.attachCredentials(stores);
  }

  async getStore(id: string): Promise<Store | null> {
    const { data } = await (await supabaseServer())
      .from("stores")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (!data) return null;
    const [store] = await this.attachCredentials([
      this.mapStore(data as Record<string, unknown>),
    ]);
    return store;
  }

  async getStoreBySubdomain(subdomain: string): Promise<Store | null> {
    const { data } = await (await supabaseServer())
      .from("stores")
      .select("*")
      .eq("subdomain", subdomain.trim().toLowerCase())
      .maybeSingle();
    if (!data) return null;
    const [store] = await this.attachCredentials([
      this.mapStore(data as Record<string, unknown>),
    ]);
    return store;
  }

  async getVisibleStoreBySubdomain(subdomain: string, actor: AppUser | null): Promise<StoreBundle | null> {
    // RLS يسمح للقراءة: المسلّم للجميع + المالك + الأعضاء لمتاجرهم
    const store = await this.getStoreBySubdomain(subdomain);
    if (!store) return null;
    const settings = await this.getStoreSettings(store.id);
    return { store, settings };
  }

  async createStore(input: CreateStoreInput): Promise<Store> {
    const sb = await supabaseServer();
    const { data, error } = await sb
      .from("stores")
      .insert({
        name: input.name,
        subdomain: input.subdomain,
        status: input.status ?? "preparing",
        owner_name: input.ownerName,
        owner_phone: input.ownerPhone,
        owner_email: input.ownerEmail,
        whatsapp: input.whatsapp,
        description: input.description,
        logo_url: input.logoUrl ?? null,
        cover_url: input.coverUrl ?? null,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    await sb.from("store_settings").upsert({
      store_id: data.id,
      template: input.template ?? "modern",
      font: input.font ?? "cairo",
      primary_color: input.primaryColor ?? "#4F46E5",
      secondary_color: input.secondaryColor ?? "#F59E0B",
      section_order: DEFAULT_SECTION_ORDER,
      seo_title: input.name,
    });
    return this.mapStore(data as Record<string, unknown>);
  }

  async updateStore(id: string, patch: Partial<StoreInput>): Promise<Store> {
    const sb = await supabaseServer();
    const up: Record<string, unknown> = {};
    if (patch.name !== undefined) up.name = patch.name;
    if (patch.subdomain !== undefined) up.subdomain = patch.subdomain;
    if (patch.status !== undefined) up.status = patch.status;
    if (patch.ownerName !== undefined) up.owner_name = patch.ownerName;
    if (patch.ownerPhone !== undefined) up.owner_phone = patch.ownerPhone;
    if (patch.ownerEmail !== undefined) up.owner_email = patch.ownerEmail;
    if (patch.whatsapp !== undefined) up.whatsapp = patch.whatsapp;
    if (patch.description !== undefined) up.description = patch.description;
    if (patch.logoUrl !== undefined) up.logo_url = patch.logoUrl;
    if (patch.coverUrl !== undefined) up.cover_url = patch.coverUrl;
    const { data, error } = await sb.from("stores").update(up).eq("id", id).select().single();
    if (error) throw new Error(error.message);
    return this.mapStore(data as Record<string, unknown>);
  }

  async setStoreStatus(id: string, status: StoreStatus): Promise<Store> {
    const sb = await supabaseServer();
    const patch: Record<string, unknown> = { status };
    if (status === "delivered") patch.delivered_at = new Date().toISOString();
    const { data, error } = await sb.from("stores").update(patch).eq("id", id).select().single();
    if (error) throw new Error(error.message);
    return this.mapStore(data as Record<string, unknown>);
  }

  async changeSubdomain(id: string, subdomain: string): Promise<{ ok: boolean; error?: string }> {
    const conflict = `النطاق الفرعي "${subdomain}" مستخدم بالفعل في متجر آخر`;
    try {
      const sb = await supabaseServer();
      const { data: row } = await sb
        .from("stores")
        .select("id, subdomain")
        .eq("id", id)
        .maybeSingle();
      if (!row) return { ok: false, error: "المتجر غير موجود" };
      const oldSubdomain = String((row as Record<string, unknown>).subdomain ?? "").toLowerCase();
      if (oldSubdomain === subdomain) return { ok: true };

      const available = await this.isSubdomainAvailable(subdomain, id);
      if (!available) return { ok: false, error: conflict };

      const { error } = await sb.from("stores").update({ subdomain }).eq("id", id);
      if (error) {
        // 23505 = duplicate key value violates unique constraint
        // (قد يحدث سباقًا بين الفحص أعلاه والحفظ)
        if (error.code === "23505" || /duplicate key|unique/i.test(error.message)) {
          return { ok: false, error: conflict };
        }
        return { ok: false, error: `تعذر حفظ التغيير في قاعدة البيانات: ${error.message}` };
      }

      // مواضع تعتمد على النطاق الفرعي المحفوظ كنص ثابت (معرض الأعمال)
      // نحدّثها على نحو احتفالي: فشلها لا يُسقط نجاح التغيير.
      await this.rewritePortfolioStoreUrls(oldSubdomain, subdomain);
      return { ok: true };
    } catch (e) {
      return {
        ok: false,
        error: e instanceof Error ? e.message : "حدث خطأ غير متوقع في الخادم",
      };
    }
  }

  /**
   * يحديث روابط معرض الأعمال (portfolio_items.store_url) التي تشير إلى
   * النطاق الفرعي القديم نحو الجديد. يُنفَّذ بالمحاولة الواحدة
   * ولا يُرجع خطأً أبدًا حتى لا يخرب العملية الأصلية.
   */
  private async rewritePortfolioStoreUrls(oldSub: string, newSub: string): Promise<void> {
    try {
      const domain = mainDomain();
      const oldHost = `${oldSub}.${domain}`;
      const newHost = `${newSub}.${domain}`;
      const sb = await supabaseServer();
      const { data: items } = await sb
        .from("portfolio_items")
        .select("id, store_url");
      for (const item of items ?? []) {
        const r = item as Record<string, unknown>;
        const url = typeof r.store_url === "string" ? r.store_url : "";
        if (!url) continue;
        let host = "";
        try {
          host = new URL(/^https?:\/\//i.test(url) ? url : `https://${url}`).hostname;
        } catch {
          continue;
        }
        if (host !== oldHost) continue;
        await sb
          .from("portfolio_items")
          .update({ store_url: url.replace(oldHost, newHost) })
          .eq("id", r.id as string);
      }
    } catch (e) {
      console.warn("تعذر تحديث روابط معرض الأعمال بعد تغيير النطاق الفرعي", e);
    }
  }

  async isSubdomainAvailable(subdomain: string, exceptStoreId?: string): Promise<boolean> {
    let q = (await supabaseServer())
      .from("stores")
      .select("id", { count: "exact", head: true })
      .eq("subdomain", subdomain.trim().toLowerCase());
    if (exceptStoreId) q = q.neq("id", exceptStoreId);
    const { count } = await q;
    return (count ?? 0) === 0;
  }

  async deliverStore(
    id: string,
    actorEmail: string
  ): Promise<{ ok: boolean; credentials?: { email: string; password: string }; error?: string }> {
    const store = await this.getStore(id);
    if (!store) return { ok: false, error: "المتجر غير موجود" };
    if (!store.ownerEmail) return { ok: false, error: "أدخل بريد العميل أولاً" };
    if (!store.ownerName) return { ok: false, error: "أدخل اسم العميل أولاً" };

    const email = store.ownerEmail.trim().toLowerCase();
    const password = "Wathba@" + Math.random().toString(36).slice(2, 6) + Math.floor(Math.random() * 90 + 10);

    try {
      const user = await this.createUser({ email, password, name: store.ownerName });
      await this.addMembership(user.id, id, "owner");
      const admin = supabaseAdmin();
      const deliveredAt = new Date().toISOString();
      const { error: credentialsError } = await admin
        .from("store_credentials")
        .upsert(
          { store_id: id, email, password, updated_at: deliveredAt },
          { onConflict: "store_id" }
        );
      if (credentialsError) return { ok: false, error: credentialsError.message };

      const { error } = await admin
        .from("stores")
        .update({
          status: "delivered",
          delivered_at: deliveredAt,
          // لا تُحفظ كلمة المرور في صف stores العام القراءة.
          client_credentials: null,
        })
        .eq("id", id);
      if (error) return { ok: false, error: error.message };

      await this.logActivity({ id: null, email: actorEmail }, id, "store.delivered", { subdomain: store.subdomain });
      return { ok: true, credentials: { email, password } };
    } catch (e) {
      return { ok: false, error: e instanceof Error ? e.message : "فشل التسليم" };
    }
  }

  // ---------------- إعدادات المتجر ----------------

  private mapSettings(r: Record<string, unknown>): StoreSettings {
    let sectionOrder: StoreSettings["sectionOrder"] = [...DEFAULT_SECTION_ORDER];
    try {
      const parsed = r.section_order;
      if (Array.isArray(parsed)) sectionOrder = parsed as StoreSettings["sectionOrder"];
    } catch {
      /* ignore */
    }
    return {
      storeId: r.store_id as string,
      template: (r.template as StoreSettings["template"]) ?? "modern",
      font: (r.font as StoreSettings["font"]) ?? "cairo",
      primaryColor: (r.primary_color as string) ?? "#4F46E5",
      secondaryColor: (r.secondary_color as string) ?? "#F59E0B",
      sectionOrder,
      aboutText: (r.about_text as string) ?? "",
      socialInstagram: (r.social_instagram as string) ?? "",
      socialSnapchat: (r.social_snapchat as string) ?? "",
      socialTiktok: (r.social_tiktok as string) ?? "",
      socialWhatsApp: (r.social_whatsapp as string) ?? "",
      developerUrl: (r.developer_url as string) ?? "",
      footerBgColor: (r.footer_bg_color as string) ?? "",
      ibanRajhi: (r.iban_rajhi as string) ?? "",
      ibanAlinmaa: (r.iban_alinmaa as string) ?? "",
      ibanAlahli: (r.iban_alahli as string) ?? "",
      seoTitle: (r.seo_title as string) ?? "",
      seoDescription: (r.seo_description as string) ?? "",
      seoKeywords: (r.seo_keywords as string) ?? "",
      seoOgImage: (r.seo_og_image as string) ?? "",
      seoFavicon: (r.seo_favicon as string) ?? "",
      seoCanonical: (r.seo_canonical as string) ?? "",
      updatedAt: (r.updated_at as string) ?? new Date().toISOString(),
    };
  }

  async getStoreSettings(storeId: string): Promise<StoreSettings> {
    const { data } = await (await supabaseServer())
      .from("store_settings")
      .select("*")
      .eq("store_id", storeId)
      .maybeSingle();
    if (!data) {
      return {
        storeId,
        template: "modern",
        font: "cairo",
        primaryColor: "#4F46E5",
        secondaryColor: "#F59E0B",
        sectionOrder: [...DEFAULT_SECTION_ORDER],
        aboutText: "",
        socialInstagram: "",
        socialSnapchat: "",
        socialTiktok: "",
        socialWhatsApp: "",
        developerUrl: "",
        footerBgColor: "",
        ibanRajhi: "",
        ibanAlinmaa: "",
        ibanAlahli: "",
        seoTitle: "",
        seoDescription: "",
        seoKeywords: "",
        seoOgImage: "",
        seoFavicon: "",
        seoCanonical: "",
        updatedAt: new Date().toISOString(),
      };
    }
    return this.mapSettings(data as Record<string, unknown>);
  }

  async updateStoreSettings(storeId: string, patch: Partial<StoreSettings>): Promise<StoreSettings> {
    const cur = await this.getStoreSettings(storeId);
    const clean = Object.fromEntries(
      Object.entries(patch).filter(([, v]) => v !== undefined)
    ) as Partial<StoreSettings>;
    const next = { ...cur, ...clean, storeId };
    const { error } = await (await supabaseServer()).from("store_settings").upsert({
      store_id: storeId,
      template: next.template,
      font: next.font,
      primary_color: next.primaryColor,
      secondary_color: next.secondaryColor,
      section_order: next.sectionOrder,
      about_text: next.aboutText,
      social_instagram: next.socialInstagram,
      social_snapchat: next.socialSnapchat,
      social_tiktok: next.socialTiktok,
      social_whatsapp: next.socialWhatsApp,
      developer_url: next.developerUrl,
      footer_bg_color: next.footerBgColor,
      iban_rajhi: next.ibanRajhi,
      iban_alinmaa: next.ibanAlinmaa,
      iban_alahli: next.ibanAlahli,
      seo_title: next.seoTitle,
      seo_description: next.seoDescription,
      seo_keywords: next.seoKeywords,
      seo_og_image: next.seoOgImage,
      seo_favicon: next.seoFavicon,
      seo_canonical: next.seoCanonical,
    });
    if (error) throw new Error(error.message);
    return this.getStoreSettings(storeId);
  }

  // ---------------- الأقسام ----------------

  private mapCat(r: Record<string, unknown>): Category {
    return {
      id: r.id as string,
      storeId: r.store_id as string,
      name: r.name as string,
      slug: r.slug as string,
      sortOrder: r.sort_order as number,
      isVisible: Boolean(r.is_visible),
      createdAt: (r.created_at as string) ?? new Date().toISOString(),
    };
  }

  async listCategories(storeId: string, includeHidden = false): Promise<Category[]> {
    let q = (await supabaseServer())
      .from("categories")
      .select("*")
      .eq("store_id", storeId)
      .order("sort_order");
    if (!includeHidden) q = q.eq("is_visible", true);
    const { data, error } = await q;
    if (error) throw new Error(error.message);
    return (data ?? []).map((r) => this.mapCat(r as Record<string, unknown>));
  }

  async createCategory(storeId: string, input: CategoryInput): Promise<Category> {
    const { data: existing } = await (await supabaseServer())
      .from("categories")
      .select("sort_order")
      .eq("store_id", storeId);
    const count = existing?.length ?? 0;
    const { data, error } = await (await supabaseServer())
      .from("categories")
      .insert({
        store_id: storeId,
        name: input.name,
        slug: input.slug?.trim().toLowerCase() || slugify(input.name),
        sort_order: count,
        is_visible: input.isVisible ?? true,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return this.mapCat(data as Record<string, unknown>);
  }

  async updateCategory(id: string, patch: Partial<CategoryInput> & { sortOrder?: number }): Promise<Category> {
    const up: Record<string, unknown> = {};
    if (patch.name !== undefined) up.name = patch.name;
    if (patch.slug !== undefined) up.slug = patch.slug.trim().toLowerCase();
    if (patch.isVisible !== undefined) up.is_visible = patch.isVisible;
    if (patch.sortOrder !== undefined) up.sort_order = patch.sortOrder;
    const { data, error } = await (await supabaseServer()).from("categories").update(up).eq("id", id).select().single();
    if (error) throw new Error(error.message);
    return this.mapCat(data as Record<string, unknown>);
  }

  async deleteCategory(id: string): Promise<void> {
    const { error } = await (await supabaseServer()).from("categories").delete().eq("id", id);
    if (error) throw new Error(error.message);
  }

  async moveCategory(id: string, dir: "up" | "down"): Promise<void> {
    const sb = await supabaseServer();
    const { data: row } = await sb.from("categories").select("*").eq("id", id).maybeSingle();
    if (!row) return;
    const { data: all } = await sb
      .from("categories")
      .select("id, sort_order")
      .eq("store_id", (row as Record<string, unknown>).store_id)
      .order("sort_order");
    const list = all ?? [];
    const idx = list.findIndex((x) => x.id === id);
    const swap = dir === "up" ? list[idx - 1] : list[idx + 1];
    if (!swap) return;
    await sb.from("categories").update({ sort_order: swap.sort_order }).eq("id", id);
    await sb.from("categories").update({ sort_order: (row as Record<string, unknown>).sort_order }).eq("id", swap.id);
  }

  // ---------------- المنتجات ----------------

  private async loadImages(productId: string): Promise<ProductImage[]> {
    const { data } = await (await supabaseServer())
      .from("product_images")
      .select("*")
      .eq("product_id", productId)
      .order("sort_order");
    return (data ?? []).map((r) => ({
      id: r.id as string,
      productId: r.product_id as string,
      storeId: r.store_id as string,
      url: r.url as string,
      sortOrder: r.sort_order as number,
    }));
  }

  private mapProd(r: Record<string, unknown>, images: ProductImage[]): Product {
    return {
      id: r.id as string,
      storeId: r.store_id as string,
      slug: r.slug as string,
      categoryId: (r.category_id as string) ?? null,
      name: r.name as string,
      description: (r.description as string) ?? "",
      price: Number(r.price),
      oldPrice: r.old_price != null ? Number(r.old_price) : null,
      stock: r.stock != null ? Number(r.stock) : null,
      isVisible: Boolean(r.is_visible),
      sortOrder: r.sort_order as number,
      createdAt: (r.created_at as string) ?? new Date().toISOString(),
      updatedAt: (r.updated_at as string) ?? new Date().toISOString(),
      images,
    };
  }

  async listProducts(storeId: string, opts?: { includeHidden?: boolean; categoryId?: string }): Promise<Product[]> {
    let q = (await supabaseServer()).from("products").select("*").eq("store_id", storeId);
    if (!opts?.includeHidden) q = q.eq("is_visible", true);
    if (opts?.categoryId) q = q.eq("category_id", opts.categoryId);
    q = q.order("sort_order", { ascending: false }).order("created_at", { ascending: false });
    const { data, error } = await q;
    if (error) throw new Error(error.message);
    const out: Product[] = [];
    for (const r of data ?? []) {
      const p = this.mapProd(r as Record<string, unknown>, await this.loadImages((r as Record<string, unknown>).id as string));
      out.push(p);
    }
    return out;
  }

  async getProduct(storeId: string, idOrSlug: string): Promise<Product | null> {
    const { data } = await (await supabaseServer())
      .from("products")
      .select("*")
      .eq("store_id", storeId)
      .or(`id.eq.${idOrSlug},slug.eq.${idOrSlug}`)
      .maybeSingle();
    if (!data) return null;
    return this.mapProd(data as Record<string, unknown>, await this.loadImages((data as Record<string, unknown>).id as string));
  }

  async createProduct(storeId: string, input: ProductInput): Promise<Product> {
    const sb = await supabaseServer();
    const { data: existing } = await sb.from("products").select("sort_order").eq("store_id", storeId);
    const count = existing?.length ?? 0;
    let slug = slugify(input.name);
    const { data: exists } = await sb.from("products").select("id").eq("store_id", storeId).eq("slug", slug).maybeSingle();
    if (exists) slug = `${slug}-${Date.now().toString(36)}`;
    const { data, error } = await sb
      .from("products")
      .insert({
        store_id: storeId,
        slug,
        category_id: input.categoryId ?? null,
        name: input.name,
        description: input.description,
        price: input.price,
        old_price: input.oldPrice,
        stock: input.stock,
        is_visible: input.isVisible,
        sort_order: count,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    const pid = (data as Record<string, unknown>).id as string;
    if (input.images.length) {
      await sb.from("product_images").insert(
        input.images.map((url, i) => ({ product_id: pid, store_id: storeId, url, sort_order: i }))
      );
    }
    return this.mapProd(data as Record<string, unknown>, await this.loadImages(pid));
  }

  async updateProduct(id: string, input: Partial<ProductInput>): Promise<Product> {
    const sb = await supabaseServer();
    const up: Record<string, unknown> = {};
    if (input.name !== undefined) {
      up.name = input.name;
      up.slug = slugify(input.name);
    }
    if (input.categoryId !== undefined) up.category_id = input.categoryId;
    if (input.description !== undefined) up.description = input.description;
    if (input.price !== undefined) up.price = input.price;
    if (input.oldPrice !== undefined) up.old_price = input.oldPrice;
    if (input.stock !== undefined) up.stock = input.stock;
    if (input.isVisible !== undefined) up.is_visible = input.isVisible;
    const { data, error } = await sb.from("products").update(up).eq("id", id).select().single();
    if (error) throw new Error(error.message);
    if (input.images) {
      await sb.from("product_images").delete().eq("product_id", id);
      if (input.images.length) {
        const sid = (data as Record<string, unknown>).store_id as string;
        await sb.from("product_images").insert(
          input.images.map((url, i) => ({ product_id: id, store_id: sid, url, sort_order: i }))
        );
      }
    }
    return this.mapProd(data as Record<string, unknown>, await this.loadImages(id));
  }

  async deleteProduct(id: string): Promise<void> {
    const sb = await supabaseServer();
    await sb.from("product_images").delete().eq("product_id", id);
    const { error } = await sb.from("products").delete().eq("id", id);
    if (error) throw new Error(error.message);
  }

  async moveProduct(id: string, dir: "up" | "down"): Promise<void> {
    const sb = await supabaseServer();
    const { data: row } = await sb.from("products").select("*").eq("id", id).maybeSingle();
    if (!row) return;
    const { data: all } = await sb
      .from("products")
      .select("id, sort_order")
      .eq("store_id", (row as Record<string, unknown>).store_id)
      .order("sort_order", { ascending: false });
    const list = all ?? [];
    const idx = list.findIndex((x) => x.id === id);
    const swap = dir === "up" ? list[idx - 1] : list[idx + 1];
    if (!swap) return;
    await sb.from("products").update({ sort_order: swap.sort_order }).eq("id", id);
    await sb.from("products").update({ sort_order: (row as Record<string, unknown>).sort_order }).eq("id", swap.id);
  }

  // ---------------- الصفحات ----------------

  private mapPage(r: Record<string, unknown>): StorePage {
    return {
      id: r.id as string,
      storeId: r.store_id as string,
      title: r.title as string,
      slug: r.slug as string,
      content: (r.content as string) ?? "",
      isVisible: Boolean(r.is_visible),
      sortOrder: r.sort_order as number,
      updatedAt: (r.updated_at as string) ?? new Date().toISOString(),
    };
  }

  async listPages(storeId: string): Promise<StorePage[]> {
    const { data } = await (await supabaseServer())
      .from("pages")
      .select("*")
      .eq("store_id", storeId)
      .order("sort_order");
    return (data ?? []).map((r) => this.mapPage(r as Record<string, unknown>));
  }

  async getPageBySlug(storeId: string, slug: string): Promise<StorePage | null> {
    const { data } = await (await supabaseServer())
      .from("pages")
      .select("*")
      .eq("store_id", storeId)
      .eq("slug", slug)
      .maybeSingle();
    return data ? this.mapPage(data as Record<string, unknown>) : null;
  }

  async createPage(storeId: string, input: PageInput): Promise<StorePage> {
    const { data: existing } = await (await supabaseServer()).from("pages").select("sort_order").eq("store_id", storeId);
    const count = existing?.length ?? 0;
    const { data, error } = await (await supabaseServer())
      .from("pages")
      .insert({
        store_id: storeId,
        title: input.title,
        slug: input.slug?.trim().toLowerCase() || slugify(input.title),
        content: input.content,
        is_visible: input.isVisible ?? true,
        sort_order: count,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return this.mapPage(data as Record<string, unknown>);
  }

  async updatePage(id: string, patch: Partial<PageInput>): Promise<StorePage> {
    const up: Record<string, unknown> = {};
    if (patch.title !== undefined) up.title = patch.title;
    if (patch.slug !== undefined) up.slug = patch.slug.trim().toLowerCase();
    if (patch.content !== undefined) up.content = patch.content;
    if (patch.isVisible !== undefined) up.is_visible = patch.isVisible;
    const { data, error } = await (await supabaseServer()).from("pages").update(up).eq("id", id).select().single();
    if (error) throw new Error(error.message);
    return this.mapPage(data as Record<string, unknown>);
  }

  async deletePage(id: string): Promise<void> {
    const { error } = await (await supabaseServer()).from("pages").delete().eq("id", id);
    if (error) throw new Error(error.message);
  }

  // ---------------- النشاطات ----------------

  async logActivity(
    actor: { id: string | null; email: string },
    storeId: string | null,
    action: string,
    details?: Record<string, unknown>
  ): Promise<void> {
    await supabaseAdmin()
      .from("activity_logs")
      .insert({ store_id: storeId, user_id: actor.id, actor_email: actor.email, action, details: details ?? {} });
  }

  async listActivity(opts: { storeId?: string | null; limit?: number }): Promise<ActivityLog[]> {
    let q = (await supabaseServer()).from("activity_logs").select("*").order("created_at", { ascending: false }).limit(opts.limit ?? 100);
    if (opts.storeId != null) q = q.eq("store_id", opts.storeId);
    const { data, error } = await q;
    if (error) throw new Error(error.message);
    return (data ?? []).map((r) => ({
      id: r.id as number,
      storeId: (r.store_id as string) ?? null,
      userId: (r.user_id as string) ?? null,
      actorEmail: (r.actor_email as string) ?? "",
      action: r.action as string,
      details: (r.details as Record<string, unknown>) ?? {},
      createdAt: r.created_at as string,
    }));
  }

  // ---------------- الموقع العام ----------------

  private mapSite(r: Record<string, unknown>): SiteSettings {
    return {
      whatsappNumber: (r.whatsapp_number as string) ?? "",
      developerUrl: (r.developer_url as string) ?? "",
      aboutText: (r.about_text as string) ?? "",
      heroTitle: (r.hero_title as string) ?? "",
      heroSubtitle: (r.hero_subtitle as string) ?? "",
      features: (r.features as SiteSettings["features"]) ?? [],
      faq: (r.faq as SiteSettings["faq"]) ?? [],
      socialInstagram: (r.social_instagram as string) ?? "",
      socialSnapchat: (r.social_snapchat as string) ?? "",
      socialTiktok: (r.social_tiktok as string) ?? "",
      updatedAt: (r.updated_at as string) ?? new Date().toISOString(),
    };
  }

  async getSiteSettings(): Promise<SiteSettings> {
    const { data } = await (await supabaseServer())
      .from("site_settings")
      .select("*")
      .eq("id", 1)
      .maybeSingle();
    if (!data) {
      return {
        whatsappNumber: "", developerUrl: "", aboutText: "", heroTitle: "", heroSubtitle: "",
        features: [], faq: [], socialInstagram: "", socialSnapchat: "", socialTiktok: "",
        updatedAt: new Date().toISOString(),
      };
    }
    return this.mapSite(data as Record<string, unknown>);
  }

  async updateSiteSettings(patch: Partial<SiteSettings>): Promise<SiteSettings> {
    const cur = await this.getSiteSettings();
    const next = { ...cur, ...patch };
    const { error } = await (await supabaseServer()).from("site_settings").upsert({
      id: 1,
      whatsapp_number: next.whatsappNumber,
      developer_url: next.developerUrl,
      about_text: next.aboutText,
      hero_title: next.heroTitle,
      hero_subtitle: next.heroSubtitle,
      features: next.features,
      faq: next.faq,
      social_instagram: next.socialInstagram,
      social_snapchat: next.socialSnapchat,
      social_tiktok: next.socialTiktok,
    });
    if (error) throw new Error(error.message);
    return next;
  }

  private mapPlan(r: Record<string, unknown>): PricingPlan {
    return {
      id: r.id as string,
      name: r.name as string,
      price: Number(r.price),
      oldPrice: r.old_price != null ? Number(r.old_price) : null,
      currency: (r.currency as string) ?? "ر.س",
      features: (r.features as string[]) ?? [],
      isFeatured: Boolean(r.is_featured),
      isVisible: Boolean(r.is_visible),
      sortOrder: r.sort_order as number,
      updatedAt: (r.updated_at as string) ?? new Date().toISOString(),
    };
  }

  async listPlans(visibleOnly = false): Promise<PricingPlan[]> {
    let q = (await supabaseServer()).from("pricing_plans").select("*").order("sort_order");
    if (visibleOnly) q = q.eq("is_visible", true);
    const { data, error } = await q;
    if (error) throw new Error(error.message);
    return (data ?? []).map((r) => this.mapPlan(r as Record<string, unknown>));
  }

  async createPlan(input: Omit<PricingPlan, "id" | "updatedAt">): Promise<PricingPlan> {
    const { data, error } = await (await supabaseServer())
      .from("pricing_plans")
      .insert({
        name: input.name, price: input.price, old_price: input.oldPrice, currency: input.currency,
        features: input.features, is_featured: input.isFeatured, is_visible: input.isVisible,
        sort_order: input.sortOrder,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return this.mapPlan(data as Record<string, unknown>);
  }

  async updatePlan(id: string, patch: Partial<Omit<PricingPlan, "id" | "updatedAt">>): Promise<PricingPlan> {
    const up: Record<string, unknown> = {};
    if (patch.name !== undefined) up.name = patch.name;
    if (patch.price !== undefined) up.price = patch.price;
    if (patch.oldPrice !== undefined) up.old_price = patch.oldPrice;
    if (patch.currency !== undefined) up.currency = patch.currency;
    if (patch.features !== undefined) up.features = patch.features;
    if (patch.isFeatured !== undefined) up.is_featured = patch.isFeatured;
    if (patch.isVisible !== undefined) up.is_visible = patch.isVisible;
    if (patch.sortOrder !== undefined) up.sort_order = patch.sortOrder;
    const { data, error } = await (await supabaseServer()).from("pricing_plans").update(up).eq("id", id).select().single();
    if (error) throw new Error(error.message);
    return this.mapPlan(data as Record<string, unknown>);
  }

  async deletePlan(id: string): Promise<void> {
    const { error } = await (await supabaseServer()).from("pricing_plans").delete().eq("id", id);
    if (error) throw new Error(error.message);
  }

  private mapOffer(r: Record<string, unknown>): Offer {
    return {
      id: r.id as string,
      title: r.title as string,
      description: (r.description as string) ?? "",
      price: Number(r.price),
      oldPrice: r.old_price != null ? Number(r.old_price) : null,
      currency: (r.currency as string) ?? "ر.س",
      startsAt: (r.starts_at as string) ?? null,
      endsAt: (r.ends_at as string) ?? null,
      isActive: Boolean(r.is_active),
      createdAt: (r.created_at as string) ?? new Date().toISOString(),
    };
  }

  async listOffers(): Promise<Offer[]> {
    const { data, error } = await (await supabaseServer())
      .from("offers")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []).map((r) => this.mapOffer(r as Record<string, unknown>));
  }

  async createOffer(input: Omit<Offer, "id" | "createdAt">): Promise<Offer> {
    const { data, error } = await (await supabaseServer())
      .from("offers")
      .insert({
        title: input.title, description: input.description, price: input.price,
        old_price: input.oldPrice, currency: input.currency, starts_at: input.startsAt,
        ends_at: input.endsAt, is_active: input.isActive,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return this.mapOffer(data as Record<string, unknown>);
  }

  async updateOffer(id: string, patch: Partial<Omit<Offer, "id" | "createdAt">>): Promise<Offer> {
    const up: Record<string, unknown> = {};
    if (patch.title !== undefined) up.title = patch.title;
    if (patch.description !== undefined) up.description = patch.description;
    if (patch.price !== undefined) up.price = patch.price;
    if (patch.oldPrice !== undefined) up.old_price = patch.oldPrice;
    if (patch.currency !== undefined) up.currency = patch.currency;
    if (patch.startsAt !== undefined) up.starts_at = patch.startsAt;
    if (patch.endsAt !== undefined) up.ends_at = patch.endsAt;
    if (patch.isActive !== undefined) up.is_active = patch.isActive;
    const { data, error } = await (await supabaseServer()).from("offers").update(up).eq("id", id).select().single();
    if (error) throw new Error(error.message);
    return this.mapOffer(data as Record<string, unknown>);
  }

  async deleteOffer(id: string): Promise<void> {
    const { error } = await (await supabaseServer()).from("offers").delete().eq("id", id);
    if (error) throw new Error(error.message);
  }

  private mapPortfolio(r: Record<string, unknown>): PortfolioItem {
    return {
      id: r.id as string,
      title: r.title as string,
      description: (r.description as string) ?? "",
      imageUrl: r.image_url as string,
      storeUrl: (r.store_url as string) ?? "",
      tags: (r.tags as string) ?? "",
      isVisible: Boolean(r.is_visible),
      sortOrder: r.sort_order as number,
      createdAt: (r.created_at as string) ?? new Date().toISOString(),
    };
  }

  async listPortfolio(visibleOnly = false): Promise<PortfolioItem[]> {
    let q = (await supabaseServer()).from("portfolio_items").select("*").order("sort_order");
    if (visibleOnly) q = q.eq("is_visible", true);
    const { data, error } = await q;
    if (error) throw new Error(error.message);
    return (data ?? []).map((r) => this.mapPortfolio(r as Record<string, unknown>));
  }

  async createPortfolio(input: Omit<PortfolioItem, "id" | "createdAt">): Promise<PortfolioItem> {
    const { data, error } = await (await supabaseServer())
      .from("portfolio_items")
      .insert({
        title: input.title, description: input.description, image_url: input.imageUrl,
        store_url: input.storeUrl, tags: input.tags, is_visible: input.isVisible, sort_order: input.sortOrder,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return this.mapPortfolio(data as Record<string, unknown>);
  }

  async updatePortfolio(id: string, patch: Partial<Omit<PortfolioItem, "id" | "createdAt">>): Promise<PortfolioItem> {
    const up: Record<string, unknown> = {};
    if (patch.title !== undefined) up.title = patch.title;
    if (patch.description !== undefined) up.description = patch.description;
    if (patch.imageUrl !== undefined) up.image_url = patch.imageUrl;
    if (patch.storeUrl !== undefined) up.store_url = patch.storeUrl;
    if (patch.tags !== undefined) up.tags = patch.tags;
    if (patch.isVisible !== undefined) up.is_visible = patch.isVisible;
    if (patch.sortOrder !== undefined) up.sort_order = patch.sortOrder;
    const { data, error } = await (await supabaseServer()).from("portfolio_items").update(up).eq("id", id).select().single();
    if (error) throw new Error(error.message);
    return this.mapPortfolio(data as Record<string, unknown>);
  }

  async deletePortfolio(id: string): Promise<void> {
    const { error } = await (await supabaseServer()).from("portfolio_items").delete().eq("id", id);
    if (error) throw new Error(error.message);
  }

  // ---------------- العملاء ----------------

  async listClients(): Promise<ClientRow[]> {
    const stores = await this.listStores();
    const sb = await supabaseServer();
    const out: ClientRow[] = [];
    for (const store of stores) {
      const { data: mem } = await sb.from("store_members").select("user_id").eq("store_id", store.id).limit(1);
      let memberUser: ClientRow["memberUser"] = null;
      if (mem?.[0]) {
        const adminUser = await supabaseAdmin().auth.admin.getUserById(mem[0].user_id as string);
        if (adminUser.data.user) {
          memberUser = {
            id: adminUser.data.user.id,
            email: adminUser.data.user.email ?? "",
            name: (adminUser.data.user.user_metadata?.full_name as string) ?? "",
          };
        }
      }
      const { count: pc } = await sb.from("products").select("*", { count: "exact", head: true }).eq("store_id", store.id);
      const { count: cc } = await sb.from("categories").select("*", { count: "exact", head: true }).eq("store_id", store.id);
      out.push({ store, memberUser, productCount: pc ?? 0, categoryCount: cc ?? 0 });
    }
    return out;
  }

  async getClient(storeId: string): Promise<ClientRow | null> {
    const all = await this.listClients();
    return all.find((c) => c.store.id === storeId) ?? null;
  }

  // ---------------- الملفات ----------------

  async uploadImage(
    storeId: string,
    folder: "logo" | "cover" | "products" | "pages",
    buffer: Buffer,
    filename: string
  ): Promise<string> {
    const safe =
      filename
        .toLowerCase()
        .replace(/[^a-z0-9._-]/g, "-")
        .slice(0, 80) || "image";
    const objectPath = `stores/${storeId}/${folder}/${Date.now()}-${safe}`;
    const ext = safe.split(".").pop() ?? "";
    const contentType =
      ext === "png" ? "image/png" : ext === "webp" ? "image/webp" : ext === "gif" ? "image/gif" : "image/jpeg";
    const { error } = await supabaseAdmin()
      .storage.from(STORAGE_BUCKET)
      .upload(objectPath, buffer, { contentType, upsert: false });
    if (error) throw new Error(error.message);
    const { data } = supabaseAdmin().storage.from(STORAGE_BUCKET).getPublicUrl(objectPath);
    return data.publicUrl;
  }
}

let _instance: SupabaseServices | null = null;
export function getSupabaseServices(): Services {
  if (!_instance) _instance = new SupabaseServices();
  return _instance;
}
