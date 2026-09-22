// ============================================================
// وثبة — تنفيذ الخدمات على SQLite (الوضع التجريبي المحلي)
// ============================================================

import fs from "node:fs";
import path from "node:path";
import { db, DEFAULT_SETTINGS, newId, rowToStore, type RawStoreRow } from "../local/db";
import { mainDomain } from "../constants";
import { hashPassword, verifyPassword } from "../local/auth";
import { StorageError, type StorageHealth } from "./types";
import { normalizeSectionOrder } from "../types";
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

const UPLOAD_ROOT = "uploads";

function now(): string {
  return new Date().toISOString();
}

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

interface SettingsRow {
  store_id: string;
  template: string;
  font: string;
  primary_color: string;
  secondary_color: string;
  section_order: string;
  about_text: string | null;
  social_instagram: string | null;
  social_snapchat: string | null;
  social_tiktok: string | null;
  social_whatsapp: string | null;
  developer_url: string | null;
  footer_bg_color: string | null;
  iban_rajhi: string | null;
  iban_alinmaa: string | null;
  iban_alahli: string | null;
  seo_title: string | null;
  seo_description: string | null;
  seo_keywords: string | null;
  seo_og_image: string | null;
  seo_favicon: string | null;
  seo_canonical: string | null;
  updated_at: string;
}

function rowToSettings(r: SettingsRow): StoreSettings {
  // نُطبِّع ترتيب الأقسام دائمًا: يحذف تبويبات الأقسام المُهمَلة والقيم
  // المجهولة، ويضمن وجود صورة الغلاف (البطل) حتى مع بيانات قديمة.
  let sectionOrder: StoreSettings["sectionOrder"] = [...DEFAULT_SETTINGS.sectionOrder];
  try {
    sectionOrder = normalizeSectionOrder(JSON.parse(r.section_order));
  } catch {
    /* ignore */
  }
  return {
    storeId: r.store_id,
    template: r.template as StoreSettings["template"],
    font: r.font as StoreSettings["font"],
    primaryColor: r.primary_color,
    secondaryColor: r.secondary_color,
    sectionOrder,
    aboutText: r.about_text ?? "",
    socialInstagram: r.social_instagram ?? "",
    socialSnapchat: r.social_snapchat ?? "",
    socialTiktok: r.social_tiktok ?? "",
    socialWhatsApp: r.social_whatsapp ?? "",
    developerUrl: r.developer_url ?? "",
    footerBgColor: r.footer_bg_color ?? "",
    ibanRajhi: r.iban_rajhi ?? "",
    ibanAlinmaa: r.iban_alinmaa ?? "",
    ibanAlahli: r.iban_alahli ?? "",
    seoTitle: r.seo_title ?? "",
    seoDescription: r.seo_description ?? "",
    seoKeywords: r.seo_keywords ?? "",
    seoOgImage: r.seo_og_image ?? "",
    seoFavicon: r.seo_favicon ?? "",
    seoCanonical: r.seo_canonical ?? "",
    updatedAt: r.updated_at,
  };
}

export class LocalServices implements Services {
  readonly mode = "local" as const;

  // ---------------- المصادقة ----------------

  async login(email: string, password: string): Promise<AppUser | null> {
    const d = db();
    const row = d
      .prepare("SELECT * FROM local_users WHERE lower(email) = lower(?)")
      .get(email.trim()) as
      | { id: string; email: string; password_hash: string; name: string | null; role: string }
      | undefined;
    if (!row || !verifyPassword(password, row.password_hash)) return null;
    return this.buildUser(row.id, row.email, row.name ?? "", row.role);
  }

  async userById(id: string): Promise<AppUser | null> {
    const row = db().prepare("SELECT * FROM local_users WHERE id = ?").get(id) as
      | { id: string; email: string; name: string | null; role: string }
      | undefined;
    if (!row) return null;
    return this.buildUser(row.id, row.email, row.name ?? "", row.role);
  }

  private buildUser(id: string, email: string, name: string, role: string): AppUser {
    const d = db();
    const memberships = d
      .prepare("SELECT store_id, role FROM store_members WHERE user_id = ?")
      .all(id) as { store_id: string; role: string }[];
    return {
      id,
      email,
      name,
      role: role === "owner" ? "owner" : "member",
      memberships: memberships.map((m) => ({ storeId: m.store_id, role: m.role })),
    };
  }

  async createUser(input: { email: string; password: string; name: string }): Promise<AppUser> {
    const d = db();
    const id = newId("user");
    d.prepare(
      "INSERT INTO local_users (id, email, password_hash, name, role, created_at) VALUES (?,?,?,?,?,?)"
    ).run(id, input.email.trim().toLowerCase(), hashPassword(input.password), input.name, "member", now());
    return this.buildUser(id, input.email, input.name, "member");
  }

  async updateUserPassword(userId: string, password: string): Promise<void> {
    db().prepare("UPDATE local_users SET password_hash = ? WHERE id = ?").run(hashPassword(password), userId);
  }

  async addMembership(userId: string, storeId: string, role: "owner" | "admin" | "staff"): Promise<void> {
    db().prepare(
      "INSERT OR IGNORE INTO store_members (id, store_id, user_id, role, created_at) VALUES (?,?,?,?,?)"
    ).run(newId("mem"), storeId, userId, role, now());
  }

  // ---------------- المتاجر ----------------

  async listStores(): Promise<Store[]> {
    const rows = db().prepare("SELECT * FROM stores ORDER BY created_at DESC").all() as unknown as RawStoreRow[];
    return rows.map(rowToStore);
  }

  async getStore(id: string): Promise<Store | null> {
    const row = db().prepare("SELECT * FROM stores WHERE id = ?").get(id) as unknown as RawStoreRow | undefined;
    return row ? rowToStore(row) : null;
  }

  async getStoreBySubdomain(subdomain: string): Promise<Store | null> {
    const row = db()
      .prepare("SELECT * FROM stores WHERE subdomain = ?")
      .get(subdomain.trim().toLowerCase()) as unknown as RawStoreRow | undefined;
    return row ? rowToStore(row) : null;
  }

  async getVisibleStoreBySubdomain(subdomain: string, actor: AppUser | null): Promise<StoreBundle | null> {
    const store = await this.getStoreBySubdomain(subdomain);
    if (!store) return null;
    const settings = await this.getStoreSettings(store.id);
    const isStaff =
      actor?.role === "owner" || (actor?.memberships ?? []).some((m) => m.storeId === store.id);
    if (store.status === "delivered" || isStaff) return { store, settings };
    // محمول وغير مسلّم: المالك والأعضاء فقط
    if (store.status === "suspended" || store.status === "testing") return { store, settings };
    return null;
  }

  async createStore(input: CreateStoreInput): Promise<Store> {
    const d = db();
    const id = newId("store");
    const t = now();
    d.prepare(`INSERT INTO stores
      (id, name, subdomain, status, owner_name, owner_phone, owner_email, whatsapp, description, logo_url, cover_url, delivered_at, created_at, updated_at)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(
      id, input.name, input.subdomain, input.status ?? "preparing",
      input.ownerName, input.ownerPhone, input.ownerEmail, input.whatsapp,
      input.description, input.logoUrl ?? null, input.coverUrl ?? null, null, t, t
    );
    d.prepare(`INSERT INTO store_settings
      (store_id, template, font, primary_color, secondary_color, section_order, about_text,
       social_instagram, social_snapchat, social_tiktok, social_whatsapp, developer_url,
       seo_title, seo_description, seo_keywords, seo_og_image, seo_favicon, seo_canonical, updated_at)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(
      id, input.template ?? "modern", input.font ?? "cairo",
      input.primaryColor ?? "#4F46E5", input.secondaryColor ?? "#F59E0B",
      JSON.stringify(DEFAULT_SETTINGS.sectionOrder), "",
      "", "", "", "", "",
      input.name, "", "", "", "", "", t
    );
    return (await this.getStore(id))!;
  }

  async updateStore(id: string, patch: Partial<StoreInput>): Promise<Store> {
    const d = db();
    const cur = (await this.getStore(id))!;
    const next = {
      name: patch.name ?? cur.name,
      subdomain: patch.subdomain ?? cur.subdomain,
      status: patch.status ?? cur.status,
      ownerName: patch.ownerName ?? cur.ownerName,
      ownerPhone: patch.ownerPhone ?? cur.ownerPhone,
      ownerEmail: patch.ownerEmail ?? cur.ownerEmail,
      whatsapp: patch.whatsapp ?? cur.whatsapp,
      description: patch.description ?? cur.description,
      logoUrl: patch.logoUrl !== undefined ? patch.logoUrl : cur.logoUrl,
      coverUrl: patch.coverUrl !== undefined ? patch.coverUrl : cur.coverUrl,
    };
    d.prepare(`UPDATE stores SET name=?, subdomain=?, status=?, owner_name=?, owner_phone=?,
      owner_email=?, whatsapp=?, description=?, logo_url=?, cover_url=?, updated_at=? WHERE id=?`).run(
      next.name, next.subdomain, next.status, next.ownerName, next.ownerPhone,
      next.ownerEmail, next.whatsapp, next.description, next.logoUrl, next.coverUrl, now(), id
    );
    return (await this.getStore(id))!;
  }

  async setStoreStatus(id: string, status: StoreStatus): Promise<Store> {
    const d = db();
    const cur = (await this.getStore(id))!;
    const deliveredAt = status === "delivered" ? cur.deliveredAt ?? now() : cur.deliveredAt;
    d.prepare("UPDATE stores SET status = ?, delivered_at = ?, updated_at = ? WHERE id = ?").run(status, deliveredAt, now(), id);
    return (await this.getStore(id))!;
  }

  async changeSubdomain(id: string, subdomain: string): Promise<{ ok: boolean; error?: string }> {
    const conflict = `النطاق الفرعي "${subdomain}" مستخدم بالفعل في متجر آخر`;
    try {
      const d = db();
      const row = d
        .prepare("SELECT id, subdomain FROM stores WHERE id = ?")
        .get(id) as { id: string; subdomain: string } | undefined;
      if (!row) return { ok: false, error: "المتجر غير موجود" };
      const oldSubdomain = row.subdomain.trim().toLowerCase();
      if (oldSubdomain === subdomain) return { ok: true };

      const available = await this.isSubdomainAvailable(subdomain, id);
      if (!available) return { ok: false, error: conflict };

      try {
        d.prepare("UPDATE stores SET subdomain = ?, updated_at = ? WHERE id = ?").run(subdomain, now(), id);
      } catch {
        // قيد UNIQUE على subdomain (سباق نادر بين الفحص والحفظ)
        return { ok: false, error: conflict };
      }

      // مواضع تعتمد على النطاق الفرعي المحفوظ كنص ثابت (معرض الأعمال)
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
   * يحدّث روابط معرض الأعمال التي تشير إلى النطاق الفرعي القديم
   * نحو الجديد. احتفالي: لا يُرجع خطأً حتى لا يخرب العملية الأصلية.
   */
  private rewritePortfolioStoreUrls(oldSub: string, newSub: string): void {
    try {
      const domain = mainDomain();
      const oldHost = `${oldSub}.${domain}`;
      const newHost = `${newSub}.${domain}`;
      const d = db();
      const rows = d
        .prepare("SELECT id, store_url FROM portfolio_items WHERE store_url IS NOT NULL AND store_url != ''")
        .all() as { id: string; store_url: string }[];
      for (const item of rows) {
        let host = "";
        try {
          host = new URL(/^https?:\/\//i.test(item.store_url) ? item.store_url : `https://${item.store_url}`).hostname;
        } catch {
          continue;
        }
        if (host !== oldHost) continue;
        d.prepare("UPDATE portfolio_items SET store_url = ? WHERE id = ?")
          .run(item.store_url.replace(oldHost, newHost), item.id);
      }
    } catch (e) {
      console.warn("تعذر تحديث روابط معرض الأعمال بعد تغيير النطاق الفرعي", e);
    }
  }

  async isSubdomainAvailable(subdomain: string, exceptStoreId?: string): Promise<boolean> {
    const row = db()
      .prepare("SELECT COUNT(*) AS c FROM stores WHERE subdomain = ? AND id != ?")
      .get(subdomain.trim().toLowerCase(), exceptStoreId ?? "") as { c: number };
    return row.c === 0;
  }

  async deliverStore(
    id: string,
    actorEmail: string
  ): Promise<{ ok: boolean; credentials?: { email: string; password: string }; error?: string }> {
    const store = await this.getStore(id);
    if (!store) return { ok: false, error: "المتجر غير موجود" };
    if (!store.ownerEmail) return { ok: false, error: "أدخل بريد العميل أولاً من بيانات المتجر" };
    if (!store.ownerName) return { ok: false, error: "أدخل اسم العميل أولاً من بيانات المتجر" };

    const email = store.ownerEmail.trim().toLowerCase();
    const password = "Wathba@" + Math.random().toString(36).slice(2, 6) + Math.floor(Math.random() * 90 + 10);

    const d = db();
    const existing = d
      .prepare("SELECT id FROM local_users WHERE lower(email) = lower(?)")
      .get(email) as { id: string } | undefined;
    if (existing) {
      await this.updateUserPassword(existing.id, password);
      await this.addMembership(existing.id, id, "owner");
    } else {
      const user = await this.createUser({ email, password, name: store.ownerName });
      await this.addMembership(user.id, id, "owner");
    }

    d.prepare("UPDATE stores SET status = 'delivered', delivered_at = ?, client_credentials = ?, updated_at = ? WHERE id = ?").run(
      now(), JSON.stringify({ email, password }), now(), id
    );
    await this.logActivity({ id: null, email: actorEmail }, id, "store.delivered", { subdomain: store.subdomain, clientEmail: email });
    return { ok: true, credentials: { email, password } };
  }

  // ---------------- إعدادات المتجر ----------------

  async getStoreSettings(storeId: string): Promise<StoreSettings> {
    const row = db().prepare("SELECT * FROM store_settings WHERE store_id = ?").get(storeId) as
      | SettingsRow
      | undefined;
    if (!row) {
      return { ...DEFAULT_SETTINGS, storeId, updatedAt: now() };
    }
    return rowToSettings(row);
  }

  async updateStoreSettings(storeId: string, patch: Partial<StoreSettings>): Promise<StoreSettings> {
    const d = db();
    const cur = await this.getStoreSettings(storeId);
    // استبعاد القيم undefined حتى لا تُربط في SQLite
    const clean = Object.fromEntries(
      Object.entries(patch).filter(([, v]) => v !== undefined)
    ) as Partial<StoreSettings>;
    const next = { ...cur, ...clean, storeId, updatedAt: now() };
    // تنظيف ترتيب الأقسام قبل الكتابة (إزالة تبويبات الأقسام المُهمَلة)
    next.sectionOrder = normalizeSectionOrder(next.sectionOrder);
    d.prepare(`INSERT INTO store_settings
      (store_id, template, font, primary_color, secondary_color, section_order, about_text,
       social_instagram, social_snapchat, social_tiktok, social_whatsapp, developer_url,
       footer_bg_color, iban_rajhi, iban_alinmaa, iban_alahli,
       seo_title, seo_description, seo_keywords, seo_og_image, seo_favicon, seo_canonical, updated_at)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
      ON CONFLICT(store_id) DO UPDATE SET
        template=excluded.template, font=excluded.font, primary_color=excluded.primary_color,
        secondary_color=excluded.secondary_color, section_order=excluded.section_order,
        about_text=excluded.about_text, social_instagram=excluded.social_instagram,
        social_snapchat=excluded.social_snapchat, social_tiktok=excluded.social_tiktok,
       social_whatsapp=excluded.social_whatsapp, developer_url=excluded.developer_url,
       footer_bg_color=excluded.footer_bg_color, iban_rajhi=excluded.iban_rajhi,
       iban_alinmaa=excluded.iban_alinmaa, iban_alahli=excluded.iban_alahli,
       seo_title=excluded.seo_title, seo_description=excluded.seo_description,
        seo_keywords=excluded.seo_keywords, seo_og_image=excluded.seo_og_image,
        seo_favicon=excluded.seo_favicon, seo_canonical=excluded.seo_canonical,
        updated_at=excluded.updated_at`).run(
      storeId, next.template, next.font, next.primaryColor, next.secondaryColor,
      JSON.stringify(next.sectionOrder), next.aboutText,
      next.socialInstagram, next.socialSnapchat, next.socialTiktok, next.socialWhatsApp,
      next.developerUrl, next.footerBgColor, next.ibanRajhi, next.ibanAlinmaa, next.ibanAlahli,
      next.seoTitle, next.seoDescription, next.seoKeywords,
      next.seoOgImage, next.seoFavicon, next.seoCanonical, next.updatedAt
    );
    return next;
  }

  // ---------------- الأقسام ----------------

  async listCategories(storeId: string, includeHidden = false): Promise<Category[]> {
    const rows = db()
      .prepare("SELECT * FROM categories WHERE store_id = ? AND (? = 1 OR is_visible = 1) ORDER BY sort_order, id")
      .all(storeId, includeHidden ? 1 : 0) as Record<string, unknown>[];
    return rows.map((r) => this.cat(r));
  }

  private cat(r: Record<string, unknown>): Category {
    return {
      id: r.id as string,
      storeId: r.store_id as string,
      name: r.name as string,
      slug: r.slug as string,
      sortOrder: r.sort_order as number,
      isVisible: Boolean(r.is_visible),
      createdAt: r.created_at as string,
    };
  }

  async createCategory(storeId: string, input: CategoryInput): Promise<Category> {
    const d = db();
    const id = newId("cat");
    let slug = input.slug?.trim().toLowerCase() || slugify(input.name);
    const count = (d.prepare("SELECT COUNT(*) AS c FROM categories WHERE store_id = ?").get(storeId) as { c: number }).c;
    d.prepare("INSERT INTO categories (id, store_id, name, slug, sort_order, is_visible, created_at) VALUES (?,?,?,?,?,?,?)").run(
      id, storeId, input.name, slug, count, (input.isVisible ?? true) ? 1 : 0, now()
    );
    return (d.prepare("SELECT * FROM categories WHERE id = ?").get(id) as Record<string, unknown>) && this.cat(d.prepare("SELECT * FROM categories WHERE id = ?").get(id) as Record<string, unknown>);
  }

  async updateCategory(id: string, patch: Partial<CategoryInput> & { sortOrder?: number }): Promise<Category> {
    const d = db();
    const row = d.prepare("SELECT * FROM categories WHERE id = ?").get(id) as Record<string, unknown>;
    if (!row) throw new Error("القسم غير موجود");
    d.prepare("UPDATE categories SET name = ?, slug = ?, is_visible = ?, sort_order = ? WHERE id = ?").run(
      patch.name ?? (row.name as string),
      patch.slug ? patch.slug.trim().toLowerCase() : (row.slug as string),
      patch.isVisible === undefined ? Number(Boolean(row.is_visible)) : (patch.isVisible ? 1 : 0),
      patch.sortOrder ?? (row.sort_order as number),
      id
    );
    return this.cat(d.prepare("SELECT * FROM categories WHERE id = ?").get(id) as Record<string, unknown>);
  }

  async deleteCategory(id: string): Promise<void> {
    db().prepare("DELETE FROM categories WHERE id = ?").run(id);
  }

  async moveCategory(id: string, dir: "up" | "down"): Promise<void> {
    const d = db();
    const row = d.prepare("SELECT * FROM categories WHERE id = ?").get(id) as Record<string, unknown>;
    if (!row) return;
    const storeId = row.store_id as string;
    const all = d.prepare("SELECT id, sort_order FROM categories WHERE store_id = ? ORDER BY sort_order").all(storeId) as { id: string; sort_order: number }[];
    const idx = all.findIndex((c) => c.id === id);
    const swap = dir === "up" ? all[idx - 1] : all[idx + 1];
    if (!swap) return;
    d.prepare("UPDATE categories SET sort_order = ? WHERE id = ?").run(swap.sort_order, id);
    d.prepare("UPDATE categories SET sort_order = ? WHERE id = ?").run(row.sort_order as number, swap.id);
  }

  // ---------------- المنتجات ----------------

  private prod(r: Record<string, unknown>, images: ProductImage[]): Product {
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
      createdAt: r.created_at as string,
      updatedAt: r.updated_at as string,
      images,
    };
  }

  private imgs(productId: string): ProductImage[] {
    return (
      (db()
        .prepare("SELECT * FROM product_images WHERE product_id = ? ORDER BY sort_order, id")
        .all(productId) as Record<string, unknown>[])
        .map((r) => ({
          id: r.id as string,
          productId: r.product_id as string,
          storeId: r.store_id as string,
          url: r.url as string,
          sortOrder: r.sort_order as number,
        }))
    );
  }

  async listProducts(storeId: string, opts?: { includeHidden?: boolean; categoryId?: string }): Promise<Product[]> {
    const d = db();
    let sql = "SELECT * FROM products WHERE store_id = ?";
    const params: (string | number | null)[] = [storeId];
    if (!opts?.includeHidden) sql += " AND is_visible = 1";
    if (opts?.categoryId) {
      sql += " AND category_id = ?";
      params.push(opts.categoryId);
    }
    sql += " ORDER BY sort_order, created_at DESC";
    const rows = d.prepare(sql).all(...params) as Record<string, unknown>[];
    return rows.map((r) => this.prod(r, this.imgs(r.id as string)));
  }

  async getProduct(storeId: string, idOrSlug: string): Promise<Product | null> {
    const row = db()
      .prepare("SELECT * FROM products WHERE store_id = ? AND (id = ? OR slug = ?)")
      .get(storeId, idOrSlug, idOrSlug) as Record<string, unknown> | undefined;
    if (!row) return null;
    return this.prod(row, this.imgs(row.id as string));
  }

  private uniqueSlug(storeId: string, base: string, exceptId?: string): string {
    const d = db();
    let slug = base;
    let i = 2;
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const row = d
        .prepare("SELECT COUNT(*) AS c FROM products WHERE store_id = ? AND slug = ? AND id != ?")
        .get(storeId, slug, exceptId ?? "") as { c: number };
      if (row.c === 0) return slug;
      slug = `${base}-${i++}`;
    }
  }

  async createProduct(storeId: string, input: ProductInput): Promise<Product> {
    const d = db();
    const id = newId("prod");
    const slug = this.uniqueSlug(storeId, slugify(input.name));
    const t = now();
    const max = (d.prepare("SELECT COALESCE(MAX(sort_order), -1) AS m FROM products WHERE store_id = ?").get(storeId) as { m: number }).m;
    d.prepare(`INSERT INTO products
      (id, store_id, slug, category_id, name, description, price, old_price, stock, is_visible, sort_order, created_at, updated_at)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(
      id, storeId, slug, input.categoryId ?? null, input.name, input.description,
      input.price, input.oldPrice, input.stock, input.isVisible ? 1 : 0, max + 1, t, t
    );
    input.images.forEach((url, i) => {
      d.prepare("INSERT INTO product_images (id, product_id, store_id, url, sort_order) VALUES (?,?,?,?,?)").run(
        newId("img"), id, storeId, url, i
      );
    });
    return (await this.getProduct(storeId, id))!;
  }

  async updateProduct(id: string, input: Partial<ProductInput>): Promise<Product> {
    const d = db();
    const row = d.prepare("SELECT * FROM products WHERE id = ?").get(id) as Record<string, unknown>;
    if (!row) throw new Error("المنتج غير موجود");
    const storeId = row.store_id as string;
    const name = input.name ?? (row.name as string);
    const slug = input.name ? this.uniqueSlug(storeId, slugify(input.name), id) : (row.slug as string);
    d.prepare(`UPDATE products SET slug=?, category_id=?, name=?, description=?, price=?, old_price=?,
      stock=?, is_visible=?, updated_at=? WHERE id=?`).run(
      slug,
      input.categoryId !== undefined ? input.categoryId : (row.category_id as string | null),
      name,
      input.description ?? (row.description as string),
      input.price ?? Number(row.price),
      input.oldPrice !== undefined ? input.oldPrice : (row.old_price as number | null),
      input.stock !== undefined ? input.stock : (row.stock as number | null),
      input.isVisible !== undefined ? (input.isVisible ? 1 : 0) : Number(Boolean(row.is_visible)),
      now(),
      id
    );
    if (input.images) {
      d.prepare("DELETE FROM product_images WHERE product_id = ?").run(id);
      input.images.forEach((url, i) => {
        d.prepare("INSERT INTO product_images (id, product_id, store_id, url, sort_order) VALUES (?,?,?,?,?)").run(
          newId("img"), id, storeId, url, i
        );
      });
    }
    return (await this.getProduct(storeId, id))!;
  }

  async deleteProduct(id: string): Promise<void> {
    const d = db();
    const row = d.prepare("SELECT * FROM products WHERE id = ?").get(id) as Record<string, unknown>;
    if (row) {
      d.prepare("DELETE FROM product_images WHERE product_id = ?").run(id);
      d.prepare("DELETE FROM products WHERE id = ?").run(id);
    }
  }

  async moveProduct(id: string, dir: "up" | "down"): Promise<void> {
    const d = db();
    const row = d.prepare("SELECT * FROM products WHERE id = ?").get(id) as Record<string, unknown>;
    if (!row) return;
    const storeId = row.store_id as string;
    const all = d
      .prepare("SELECT id, sort_order FROM products WHERE store_id = ? ORDER BY sort_order DESC, created_at DESC")
      .all(storeId) as { id: string; sort_order: number }[];
    const idx = all.findIndex((c) => c.id === id);
    const swap = dir === "up" ? all[idx - 1] : all[idx + 1];
    if (!swap) return;
    d.prepare("UPDATE products SET sort_order = ? WHERE id = ?").run(swap.sort_order, id);
    d.prepare("UPDATE products SET sort_order = ? WHERE id = ?").run(row.sort_order as number, swap.id);
  }

  // ---------------- الصفحات ----------------

  private page(r: Record<string, unknown>): StorePage {
    return {
      id: r.id as string,
      storeId: r.store_id as string,
      title: r.title as string,
      slug: r.slug as string,
      content: (r.content as string) ?? "",
      isVisible: Boolean(r.is_visible),
      sortOrder: r.sort_order as number,
      updatedAt: r.updated_at as string,
    };
  }

  async listPages(storeId: string): Promise<StorePage[]> {
    const rows = db()
      .prepare("SELECT * FROM pages WHERE store_id = ? ORDER BY sort_order, id")
      .all(storeId) as Record<string, unknown>[];
    return rows.map((r) => this.page(r));
  }

  async getPageBySlug(storeId: string, slug: string): Promise<StorePage | null> {
    const row = db().prepare("SELECT * FROM pages WHERE store_id = ? AND slug = ?").get(storeId, slug) as
      | Record<string, unknown>
      | undefined;
    return row ? this.page(row) : null;
  }

  async createPage(storeId: string, input: PageInput): Promise<StorePage> {
    const d = db();
    const id = newId("page");
    const count = (d.prepare("SELECT COUNT(*) AS c FROM pages WHERE store_id = ?").get(storeId) as { c: number }).c;
    d.prepare("INSERT INTO pages (id, store_id, title, slug, content, is_visible, sort_order, updated_at) VALUES (?,?,?,?,?,?,?,?)").run(
      id, storeId, input.title, input.slug?.trim().toLowerCase() || slugify(input.title),
      input.content, (input.isVisible ?? true) ? 1 : 0, count, now()
    );
    return this.page(d.prepare("SELECT * FROM pages WHERE id = ?").get(id) as Record<string, unknown>);
  }

  async updatePage(id: string, patch: Partial<PageInput>): Promise<StorePage> {
    const d = db();
    const row = d.prepare("SELECT * FROM pages WHERE id = ?").get(id) as Record<string, unknown>;
    if (!row) throw new Error("الصفحة غير موجودة");
    d.prepare("UPDATE pages SET title=?, slug=?, content=?, is_visible=?, updated_at=? WHERE id=?").run(
      patch.title ?? (row.title as string),
      patch.slug ? patch.slug.trim().toLowerCase() : (row.slug as string),
      patch.content ?? (row.content as string),
      patch.isVisible === undefined ? Number(Boolean(row.is_visible)) : (patch.isVisible ? 1 : 0),
      now(),
      id
    );
    return this.page(d.prepare("SELECT * FROM pages WHERE id = ?").get(id) as Record<string, unknown>);
  }

  async deletePage(id: string): Promise<void> {
    db().prepare("DELETE FROM pages WHERE id = ?").run(id);
  }

  // ---------------- النشاطات ----------------

  async logActivity(
    actor: { id: string | null; email: string },
    storeId: string | null,
    action: string,
    details?: Record<string, unknown>
  ): Promise<void> {
    // فشل تسجيل النشاط لا يُسقط العملية الأصلية (نفس سلوك طبقة Supabase)
    try {
      db().prepare(
        "INSERT INTO activity_logs (store_id, user_id, actor_email, action, details, created_at) VALUES (?,?,?,?,?,?)"
      ).run(storeId, actor.id, actor.email, action, details ? JSON.stringify(details) : null, now());
    } catch (e) {
      console.warn("[activity] تعذر تسجيل النشاط:", e instanceof Error ? e.message : e);
    }
  }

  async listActivity(opts: { storeId?: string | null; limit?: number }): Promise<ActivityLog[]> {
    const d = db();
    let sql = "SELECT * FROM activity_logs";
    const params: (string | number | null)[] = [];
    if (opts.storeId != null) {
      sql += " WHERE store_id = ?";
      params.push(opts.storeId);
    }
    sql += " ORDER BY created_at DESC, id DESC LIMIT ?";
    params.push(opts.limit ?? 100);
    return (d.prepare(sql).all(...params) as Record<string, unknown>[]).map((r) => ({
      id: r.id as number,
      storeId: (r.store_id as string) ?? null,
      userId: (r.user_id as string) ?? null,
      actorEmail: (r.actor_email as string) ?? "",
      action: r.action as string,
      details: r.details ? JSON.parse(r.details as string) : {},
      createdAt: r.created_at as string,
    }));
  }

  // ---------------- الموقع العام ----------------

  private siteRowToSettings(r: Record<string, unknown>): SiteSettings {
    let features: SiteSettings["features"] = [];
    let faq: SiteSettings["faq"] = [];
    try {
      features = JSON.parse((r.features as string) || "[]");
    } catch { /* ignore */ }
    try {
      faq = JSON.parse((r.faq as string) || "[]");
    } catch { /* ignore */ }
    return {
      whatsappNumber: (r.whatsapp_number as string) ?? "",
      developerUrl: (r.developer_url as string) ?? "",
      aboutText: (r.about_text as string) ?? "",
      heroTitle: (r.hero_title as string) ?? "",
      heroSubtitle: (r.hero_subtitle as string) ?? "",
      features,
      faq,
      socialInstagram: (r.social_instagram as string) ?? "",
      socialSnapchat: (r.social_snapchat as string) ?? "",
      socialTiktok: (r.social_tiktok as string) ?? "",
      updatedAt: (r.updated_at as string) ?? now(),
    };
  }

  async getSiteSettings(): Promise<SiteSettings> {
    const row = db().prepare("SELECT * FROM site_settings WHERE id = 1").get() as Record<string, unknown> | undefined;
    if (!row) {
      return {
        whatsappNumber: "", developerUrl: "", aboutText: "", heroTitle: "", heroSubtitle: "",
        features: [], faq: [], socialInstagram: "", socialSnapchat: "", socialTiktok: "", updatedAt: now(),
      };
    }
    return this.siteRowToSettings(row);
  }

  async updateSiteSettings(patch: Partial<SiteSettings>): Promise<SiteSettings> {
    const cur = await this.getSiteSettings();
    const clean = Object.fromEntries(Object.entries(patch).filter(([, v]) => v !== undefined));
    const next = { ...cur, ...(clean as Partial<SiteSettings>), updatedAt: now() };
    db().prepare(`INSERT INTO site_settings
      (id, whatsapp_number, developer_url, about_text, hero_title, hero_subtitle, features, faq,
       social_instagram, social_snapchat, social_tiktok, updated_at)
      VALUES (1,?,?,?,?,?,?,?,?,?,?,?)
      ON CONFLICT(id) DO UPDATE SET
        whatsapp_number=excluded.whatsapp_number, developer_url=excluded.developer_url,
        about_text=excluded.about_text, hero_title=excluded.hero_title, hero_subtitle=excluded.hero_subtitle,
        features=excluded.features, faq=excluded.faq, social_instagram=excluded.social_instagram,
        social_snapchat=excluded.social_snapchat, social_tiktok=excluded.social_tiktok,
        updated_at=excluded.updated_at`).run(
      next.whatsappNumber, next.developerUrl, next.aboutText, next.heroTitle, next.heroSubtitle,
      JSON.stringify(next.features), JSON.stringify(next.faq),
      next.socialInstagram, next.socialSnapchat, next.socialTiktok, next.updatedAt
    );
    return next;
  }

  private plan(r: Record<string, unknown>): PricingPlan {
    let features: string[] = [];
    try {
      features = JSON.parse((r.features as string) || "[]");
    } catch { /* ignore */ }
    return {
      id: r.id as string,
      name: r.name as string,
      price: Number(r.price),
      oldPrice: r.old_price != null ? Number(r.old_price) : null,
      currency: (r.currency as string) ?? "ر.س",
      features,
      isFeatured: Boolean(r.is_featured),
      isVisible: Boolean(r.is_visible),
      sortOrder: r.sort_order as number,
      updatedAt: (r.updated_at as string) ?? now(),
    };
  }

  async listPlans(visibleOnly = false): Promise<PricingPlan[]> {
    const rows = db()
      .prepare("SELECT * FROM pricing_plans ORDER BY sort_order, id")
      .all() as Record<string, unknown>[];
    return rows.filter((r) => !visibleOnly || Boolean(r.is_visible)).map((r) => this.plan(r));
  }

  async createPlan(input: Omit<PricingPlan, "id" | "updatedAt">): Promise<PricingPlan> {
    const d = db();
    const id = newId("plan");
    d.prepare(`INSERT INTO pricing_plans (id, name, price, old_price, currency, features, is_featured, is_visible, sort_order, updated_at)
      VALUES (?,?,?,?,?,?,?,?,?,?)`).run(
      id, input.name, input.price, input.oldPrice, input.currency,
      JSON.stringify(input.features), input.isFeatured ? 1 : 0, input.isVisible ? 1 : 0, input.sortOrder, now()
    );
    return this.plan(d.prepare("SELECT * FROM pricing_plans WHERE id = ?").get(id) as Record<string, unknown>);
  }

  async updatePlan(id: string, patch: Partial<Omit<PricingPlan, "id" | "updatedAt">>): Promise<PricingPlan> {
    const d = db();
    const row = d.prepare("SELECT * FROM pricing_plans WHERE id = ?").get(id) as Record<string, unknown>;
    if (!row) throw new Error("الباقة غير موجودة");
    const cur = this.plan(row);
    const clean = Object.fromEntries(Object.entries(patch).filter(([, v]) => v !== undefined));
    const next = { ...cur, ...(clean as Partial<PricingPlan>), updatedAt: now() };
    d.prepare(`UPDATE pricing_plans SET name=?, price=?, old_price=?, currency=?, features=?,
      is_featured=?, is_visible=?, sort_order=?, updated_at=? WHERE id=?`).run(
      next.name, next.price, next.oldPrice, next.currency, JSON.stringify(next.features),
      next.isFeatured ? 1 : 0, next.isVisible ? 1 : 0, next.sortOrder, next.updatedAt, id
    );
    return this.plan(d.prepare("SELECT * FROM pricing_plans WHERE id = ?").get(id) as Record<string, unknown>);
  }

  async deletePlan(id: string): Promise<void> {
    db().prepare("DELETE FROM pricing_plans WHERE id = ?").run(id);
  }

  private offer(r: Record<string, unknown>): Offer {
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
      createdAt: (r.created_at as string) ?? now(),
    };
  }

  async listOffers(): Promise<Offer[]> {
    const rows = db().prepare("SELECT * FROM offers ORDER BY created_at DESC").all() as Record<string, unknown>[];
    return rows.map((r) => this.offer(r));
  }

  async createOffer(input: Omit<Offer, "id" | "createdAt">): Promise<Offer> {
    const d = db();
    const id = newId("offer");
    d.prepare(`INSERT INTO offers (id, title, description, price, old_price, currency, starts_at, ends_at, is_active, created_at)
      VALUES (?,?,?,?,?,?,?,?,?,?)`).run(
      id, input.title, input.description, input.price, input.oldPrice, input.currency,
      input.startsAt, input.endsAt, input.isActive ? 1 : 0, now()
    );
    return this.offer(d.prepare("SELECT * FROM offers WHERE id = ?").get(id) as Record<string, unknown>);
  }

  async updateOffer(id: string, patch: Partial<Omit<Offer, "id" | "createdAt">>): Promise<Offer> {
    const d = db();
    const row = d.prepare("SELECT * FROM offers WHERE id = ?").get(id) as Record<string, unknown>;
    if (!row) throw new Error("العرض غير موجود");
    const cur = this.offer(row);
    const clean = Object.fromEntries(Object.entries(patch).filter(([, v]) => v !== undefined));
    const next = { ...cur, ...(clean as Partial<Offer>) };
    d.prepare(`UPDATE offers SET title=?, description=?, price=?, old_price=?, currency=?, starts_at=?, ends_at=?, is_active=? WHERE id=?`).run(
      next.title, next.description, next.price, next.oldPrice, next.currency,
      next.startsAt, next.endsAt, next.isActive ? 1 : 0, id
    );
    return this.offer(d.prepare("SELECT * FROM offers WHERE id = ?").get(id) as Record<string, unknown>);
  }

  async deleteOffer(id: string): Promise<void> {
    db().prepare("DELETE FROM offers WHERE id = ?").run(id);
  }

  private portfolio(r: Record<string, unknown>): PortfolioItem {
    return {
      id: r.id as string,
      title: r.title as string,
      description: (r.description as string) ?? "",
      imageUrl: r.image_url as string,
      storeUrl: (r.store_url as string) ?? "",
      tags: (r.tags as string) ?? "",
      isVisible: Boolean(r.is_visible),
      sortOrder: r.sort_order as number,
      createdAt: (r.created_at as string) ?? now(),
    };
  }

  async listPortfolio(visibleOnly = false): Promise<PortfolioItem[]> {
    const rows = db().prepare("SELECT * FROM portfolio_items ORDER BY sort_order, id").all() as Record<string, unknown>[];
    return rows.filter((r) => !visibleOnly || Boolean(r.is_visible)).map((r) => this.portfolio(r));
  }

  async createPortfolio(input: Omit<PortfolioItem, "id" | "createdAt">): Promise<PortfolioItem> {
    const d = db();
    const id = newId("pf");
    d.prepare(`INSERT INTO portfolio_items (id, title, description, image_url, store_url, tags, is_visible, sort_order, created_at)
      VALUES (?,?,?,?,?,?,?,?,?)`).run(
      id, input.title, input.description, input.imageUrl, input.storeUrl, input.tags,
      input.isVisible ? 1 : 0, input.sortOrder, now()
    );
    return this.portfolio(d.prepare("SELECT * FROM portfolio_items WHERE id = ?").get(id) as Record<string, unknown>);
  }

  async updatePortfolio(id: string, patch: Partial<Omit<PortfolioItem, "id" | "createdAt">>): Promise<PortfolioItem> {
    const d = db();
    const row = d.prepare("SELECT * FROM portfolio_items WHERE id = ?").get(id) as Record<string, unknown>;
    if (!row) throw new Error("العنصر غير موجود");
    const cur = this.portfolio(row);
    const clean = Object.fromEntries(Object.entries(patch).filter(([, v]) => v !== undefined));
    const next = { ...cur, ...(clean as Partial<PortfolioItem>) };
    d.prepare(`UPDATE portfolio_items SET title=?, description=?, image_url=?, store_url=?, tags=?, is_visible=?, sort_order=? WHERE id=?`).run(
      next.title, next.description, next.imageUrl, next.storeUrl, next.tags,
      next.isVisible ? 1 : 0, next.sortOrder, id
    );
    return this.portfolio(d.prepare("SELECT * FROM portfolio_items WHERE id = ?").get(id) as Record<string, unknown>);
  }

  async deletePortfolio(id: string): Promise<void> {
    db().prepare("DELETE FROM portfolio_items WHERE id = ?").run(id);
  }

  // ---------------- العملاء ----------------

  async listClients(): Promise<ClientRow[]> {
    const stores = await this.listStores();
    const d = db();
    const out: ClientRow[] = [];
    for (const store of stores) {
      const mem = d
        .prepare("SELECT m.user_id FROM store_members m WHERE m.store_id = ? LIMIT 1")
        .get(store.id) as { user_id: string } | undefined;
      let memberUser: ClientRow["memberUser"] = null;
      if (mem) {
        const u = d
          .prepare("SELECT id, email, name FROM local_users WHERE id = ?")
          .get(mem.user_id) as { id: string; email: string; name: string | null } | undefined;
        if (u) memberUser = { id: u.id, email: u.email, name: u.name ?? "" };
      }
      const productCount = (d.prepare("SELECT COUNT(*) AS c FROM products WHERE store_id = ?").get(store.id) as { c: number }).c;
      const categoryCount = (d.prepare("SELECT COUNT(*) AS c FROM categories WHERE store_id = ?").get(store.id) as { c: number }).c;
      out.push({ store, memberUser, productCount, categoryCount });
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
    const safe = filename
      .toLowerCase()
      .replace(/[^a-z0-9._-]/g, "-")
      .slice(0, 80) || "image";
    const dir = path.join(uploadRoot(), storeId, folder);
    try {
      fs.mkdirSync(dir, { recursive: true });
      const name = `${Date.now()}-${safe}`;
      fs.writeFileSync(path.join(dir, name), buffer);
      return `/${UPLOAD_ROOT}/${storeId}/${folder}/${name}`;
    } catch (e) {
      throw new StorageError(
        "unexpected",
        `فشل حفظ الصورة على القرص: ${e instanceof Error ? e.message : String(e)}`,
        { status: 500 }
      );
    }
  }

  /** حذف صورة مرفوعة من .data/uploads (استبدال/حذف نهائي) */
  async deleteImage(url: string): Promise<boolean> {
    const objectPath = localUploadPath(url);
    if (!objectPath) return false;
    const root = uploadRoot();
    const full = path.resolve(path.join(root, ...objectPath.split("/")));
    if (!full.startsWith(path.resolve(root))) return false;
    try {
      if (!fs.existsSync(full)) return false;
      fs.unlinkSync(full);
      return true;
    } catch (e) {
      console.warn("[storage] تعذر حذف الصورة:", e instanceof Error ? e.message : e);
      return false;
    }
  }

  /** فحص التخزين في الوضع المحلي (نفس شكل فحص Supabase) */
  async storageHealth(storeId?: string): Promise<StorageHealth> {
    const notes = [
      "الوضع التجريبي المحلي: الصور تُحفظ في .data/uploads وتُخدَم من /uploads/...",
    ];
    const root = uploadRoot();
    const health: StorageHealth = {
      mode: "local",
      bucket: UPLOAD_ROOT,
      serverKeyPresent: false,
      bucketExists: fs.existsSync(root),
      bucketPublic: true,
      fileSizeLimit: 5 * 1024 * 1024,
      allowedMimeTypes: ["image/jpeg", "image/png", "image/webp", "image/gif", "image/svg+xml"],
      sessionUploadOk: null,
      sessionUploadError: null,
      sessionDeleteOk: null,
      notes,
    };
    try {
      fs.mkdirSync(root, { recursive: true });
      health.bucketExists = true;
      const probeDir = path.join(root, storeId ?? "site", ".health");
      fs.mkdirSync(probeDir, { recursive: true });
      const probe = path.join(probeDir, `probe-${Date.now()}.tmp`);
      fs.writeFileSync(probe, "ok");
      health.sessionUploadOk = true;
      fs.unlinkSync(probe);
      health.sessionDeleteOk = true;
    } catch (e) {
      health.sessionUploadOk = false;
      health.sessionUploadError = e instanceof Error ? e.message : String(e);
      notes.push(`اختبار الكتابة فشل: ${health.sessionUploadError}`);
    }
    return health;
  }
}

/** مسار تخزين الصور في الوضع المحلي */
function uploadRoot(): string {
  return path.join(process.cwd(), ".data", UPLOAD_ROOT);
}

/** /uploads/{storeId}/{folder}/{file} → {storeId}/{folder}/{file} */
function localUploadPath(url: string): string | null {
  if (!url || !url.startsWith(`/${UPLOAD_ROOT}/`)) return null;
  const rest = url.slice(UPLOAD_ROOT.length + 2).split("?")[0];
  if (!rest || rest.includes("..")) return null;
  return rest;
}

export const localServices = new LocalServices();
