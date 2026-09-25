// ============================================================
// معون — قاعدة البيانات المحلية (SQLite) للوضع التجريبي
// تعكس مخطط Supabase/PostgreSQL في supabase/migrations/0001_init.sql
// ============================================================

import { DatabaseSync } from "node:sqlite";
import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { dataDir, hashPassword, verifyPassword } from "./auth";
import { replaceLegacyPlatformDomain, rewritePlatformMarketing } from "../constants";
import type {
  Category,
  Offer,
  PortfolioItem,
  PricingPlan,
  Product,
  SiteSettings,
  Store,
  StoreSettings,
} from "../types";

let _db: DatabaseSync | null = null;

export function db(): DatabaseSync {
  if (_db) return _db;
  const dir = dataDir();
  const file = path.join(dir, "wathba.db");
  const db = new DatabaseSync(file);
  db.exec("PRAGMA journal_mode = WAL;");
  db.exec("PRAGMA foreign_keys = ON;");
  initSchema(db);
  seedIfEmpty(db);
  migrateLegacyPlatformData(db);
  completeSweetsShowcase(db);
  _db = db;
  return db;
}

function initSchema(db: DatabaseSync): void {
  db.exec(`
  CREATE TABLE IF NOT EXISTS local_users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    name TEXT,
    role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner','member')),
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS stores (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    subdomain TEXT UNIQUE NOT NULL,
    status TEXT NOT NULL DEFAULT 'draft',
    owner_name TEXT,
    owner_phone TEXT,
    owner_email TEXT UNIQUE,
    whatsapp TEXT,
    description TEXT,
    logo_url TEXT,
    cover_url TEXT,
    client_credentials TEXT,
    delivered_at TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS store_settings (
    store_id TEXT PRIMARY KEY REFERENCES stores(id) ON DELETE CASCADE,
    template TEXT NOT NULL DEFAULT 'modern',
    font TEXT NOT NULL DEFAULT 'cairo',
    primary_color TEXT NOT NULL DEFAULT '#4F46E5',
    secondary_color TEXT NOT NULL DEFAULT '#F59E0B',
    section_order TEXT NOT NULL DEFAULT '["hero","products","pages","footer"]',
    about_text TEXT,
    social_instagram TEXT,
    social_snapchat TEXT,
    social_tiktok TEXT,
    social_whatsapp TEXT,
    developer_url TEXT,
    footer_bg_color TEXT,
    iban_rajhi TEXT,
    iban_alinmaa TEXT,
    iban_alahli TEXT,
    seo_title TEXT,
    seo_description TEXT,
    seo_keywords TEXT,
    seo_og_image TEXT,
    seo_favicon TEXT,
    seo_canonical TEXT,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS categories (
    id TEXT PRIMARY KEY,
    store_id TEXT NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_visible INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY,
    store_id TEXT NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    slug TEXT NOT NULL,
    category_id TEXT REFERENCES categories(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    description TEXT,
    price REAL NOT NULL DEFAULT 0,
    old_price REAL,
    stock INTEGER,
    is_visible INTEGER NOT NULL DEFAULT 1,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS product_images (
    id TEXT PRIMARY KEY,
    product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    store_id TEXT NOT NULL,
    url TEXT NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS pages (
    id TEXT PRIMARY KEY,
    store_id TEXT NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    slug TEXT NOT NULL,
    content TEXT,
    is_visible INTEGER NOT NULL DEFAULT 1,
    sort_order INTEGER NOT NULL DEFAULT 0,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS store_members (
    id TEXT PRIMARY KEY,
    store_id TEXT NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'owner',
    created_at TEXT NOT NULL,
    UNIQUE (store_id, user_id)
  );

  CREATE TABLE IF NOT EXISTS activity_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    store_id TEXT,
    user_id TEXT,
    actor_email TEXT,
    action TEXT NOT NULL,
    details TEXT,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS site_settings (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    whatsapp_number TEXT,
    developer_url TEXT,
    about_text TEXT,
    hero_title TEXT,
    hero_subtitle TEXT,
    features TEXT,
    faq TEXT,
    social_instagram TEXT,
    social_snapchat TEXT,
    social_tiktok TEXT,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS pricing_plans (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    price REAL NOT NULL DEFAULT 0,
    old_price REAL,
    currency TEXT NOT NULL DEFAULT 'ر.س',
    features TEXT NOT NULL DEFAULT '[]',
    is_featured INTEGER NOT NULL DEFAULT 0,
    is_visible INTEGER NOT NULL DEFAULT 1,
    sort_order INTEGER NOT NULL DEFAULT 0,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS offers (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    price REAL NOT NULL DEFAULT 0,
    old_price REAL,
    currency TEXT NOT NULL DEFAULT 'ر.س',
    starts_at TEXT,
    ends_at TEXT,
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS portfolio_items (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    image_url TEXT NOT NULL,
    store_url TEXT,
    tags TEXT,
    is_visible INTEGER NOT NULL DEFAULT 1,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL
  );
  `);
}


/**
 * يعيد كتابة روابط ونصوص المنصة القديمة في قاعدة محلية موجودة.
 * لا يحذف صفوفًا ولا يغيّر النطاقات الفرعية. حساب التجربة يُحدَّث فقط
 * إذا بقي البريد وكلمة المرور الافتراضيين القديمين كما هما.
 */
function migrateLegacyPlatformData(database: DatabaseSync): void {
  const site = database.prepare("SELECT * FROM site_settings WHERE id = 1").get() as
    | Record<string, string | null>
    | undefined;
  if (site) {
    const next = {
      developer_url: replaceLegacyPlatformDomain(site.developer_url ?? ""),
      about_text: rewritePlatformMarketing(site.about_text ?? ""),
      hero_title: rewritePlatformMarketing(site.hero_title ?? ""),
      hero_subtitle: rewritePlatformMarketing(site.hero_subtitle ?? ""),
      features: rewritePlatformMarketing(site.features ?? "[]"),
      faq: rewritePlatformMarketing(site.faq ?? "[]"),
      social_instagram: rewritePlatformMarketing(site.social_instagram ?? ""),
      social_snapchat: rewritePlatformMarketing(site.social_snapchat ?? ""),
      social_tiktok: rewritePlatformMarketing(site.social_tiktok ?? ""),
    };
    const changed = (Object.keys(next) as (keyof typeof next)[]).some(
      (key) => (site[key] ?? "") !== next[key]
    );
    if (changed) {
      database.prepare(`UPDATE site_settings SET developer_url=?, about_text=?, hero_title=?, hero_subtitle=?,
        features=?, faq=?, social_instagram=?, social_snapchat=?, social_tiktok=?, updated_at=? WHERE id=1`).run(
        next.developer_url, next.about_text, next.hero_title, next.hero_subtitle,
        next.features, next.faq, next.social_instagram, next.social_snapchat, next.social_tiktok,
        new Date().toISOString()
      );
    }
  }

  const settings = database.prepare("SELECT store_id, developer_url, seo_canonical FROM store_settings").all() as {
    store_id: string;
    developer_url: string | null;
    seo_canonical: string | null;
  }[];
  const updSettings = database.prepare(
    "UPDATE store_settings SET developer_url=?, seo_canonical=?, updated_at=? WHERE store_id=?"
  );
  for (const row of settings) {
    const developer = replaceLegacyPlatformDomain(row.developer_url ?? "");
    const canonical = replaceLegacyPlatformDomain(row.seo_canonical ?? "");
    if (developer === (row.developer_url ?? "") && canonical === (row.seo_canonical ?? "")) continue;
    updSettings.run(developer, canonical, new Date().toISOString(), row.store_id);
  }

  const portfolio = database.prepare("SELECT id, store_url FROM portfolio_items WHERE store_url IS NOT NULL").all() as {
    id: string;
    store_url: string;
  }[];
  const updPortfolio = database.prepare("UPDATE portfolio_items SET store_url=? WHERE id=?");
  for (const row of portfolio) {
    const nextUrl = replaceLegacyPlatformDomain(row.store_url);
    if (nextUrl !== row.store_url) updPortfolio.run(nextUrl, row.id);
  }

  const legacy = database
    .prepare("SELECT id, password_hash FROM local_users WHERE lower(email) = lower(?)")
    .get("owner@waathba.com") as { id: string; password_hash: string } | undefined;
  if (legacy && verifyPassword("Wathba#2026", legacy.password_hash)) {
    const taken = database
      .prepare("SELECT id FROM local_users WHERE lower(email) = lower(?) AND id != ?")
      .get("owner@maaoun.com", legacy.id) as { id: string } | undefined;
    if (!taken) {
      database.prepare("UPDATE local_users SET email=?, password_hash=? WHERE id=?").run(
        "owner@maaoun.com",
        hashPassword("Maaoun#2026"),
        legacy.id
      );
      database.prepare("UPDATE activity_logs SET actor_email=? WHERE lower(actor_email)=lower(?)").run(
        "owner@maaoun.com",
        "owner@waathba.com"
      );
    }
  }
}

// ------------------------------------------------------------
// بيانات متجر العرض المكتمل «دار رشف للحلويات» (sweets.maaoun.com)
// تُستخدم مرة واحدة هنا: في البذر الأولي للقواعد الجديدة، وفي
// completeSweetsShowcase لإكمال القواعد المحلية القديمة التي بُذرت
// قبل اكتمال المتجر — بنفس محتوى supabase/migrations/0007.
// ------------------------------------------------------------

/** [id, name, slug, sortOrder] */
const SWEETS_CATEGORIES: [string, string, string, number][] = [
  ["cat-s-eastern", "حلويات شرقية", "eastern-sweets", 0],
  ["cat-s-cakes", "كيك وتورت", "cakes", 1],
  ["cat-s-bakery", "مخبوزات", "bakery", 2],
  ["cat-s-gifts", "هدايا ومناسبات", "gifts", 3],
];

/** [id, categoryId, slug, name, description, price, oldPrice, stock, image] */
const SWEETS_PRODUCTS: [string, string, string, string, string, number, number | null, number, string][] = [
  ["prod-s-kunafa", "cat-s-eastern", "kunafa-nabulsia", "كنافة نابلسية بالجبن", "كنافة نابلسية أصيلة: عجينة شعيرية مقرمشة، جبن عكاوي مطاطي، قطر خفيف، وفستق حلبي. تُقدَّم دافئة.", 45, 55, 20, "/seed/s-kunafa.jpg"],
  ["prod-s-baklava", "cat-s-eastern", "baklava-pistachio", "بقلاوة بالفستق الحلبي", "طبقات رقيقة من عجينة الفيلو محشوة بالفستق الحلبي، مخبوزة بالسمن البلدي ومسقاة بالقطر.", 60, null, 15, "/seed/s-baklava.jpg"],
  ["prod-s-basbousa", "cat-s-eastern", "basbousa-ashta", "بسبوسة بالقشطة", "بسبوسة سميد طرية مغطاة بالقشطة الطازجة، مزينة باللوز والقطر الخفيف.", 38, null, 25, "/seed/s-basbousa.jpg"],
  ["prod-s-chococake", "cat-s-cakes", "belgian-chocolate-cake", "كيك الشوكولاتة البلجيكية", "طبقات غنية من كيك الكاكاو مع غاناش الشوكولاتة البلجيكية الداكنة وبروش شوكولاتة.", 55, 70, 12, "/seed/s-choco-cake.jpg"],
  ["prod-s-cheesecake", "cat-s-cakes", "berry-cheesecake", "تشيز كيك التوت الأحمر", "تشيز كيك نيويورك كريمي مع صوص التوت الأحمر الطبيعي وحبات توت طازجة.", 48, null, 14, "/seed/s-cheesecake-berry.jpg"],
  ["prod-s-cinnamon", "cat-s-bakery", "cinnamon-roll", "سينابون بالقرفة", "لفائف سينابون هشة بقرفة سيلانية مع تغليفة جبن كريمي ذائبة.", 25, null, 30, "/seed/s-cinnamon.jpg"],
  ["prod-s-cookies", "cat-s-bakery", "oatmeal-cookies", "كوكيز الشوفان والزبيب", "كوكيز مقرمش من الخارج وطري من الداخل، بشوفان كامل وزبيب ومحلّى قليلًا بدبس التمر.", 20, null, 40, "/seed/s-cookies.jpg"],
  ["prod-s-giftbox", "cat-s-gifts", "sweets-gift-box", "صندوق هدايا دار رشف", "علبة هدايا فاخرة بتشكيلة مختارة: بقلاوة، كاسات كنافة، وتمور مغلّفة بالشوكولاتة — بعلبة أنيقة ورباط ذهبي.", 120, 150, 10, "/seed/s-giftbox.jpg"],
];

/** [id, title, slug, content, sortOrder] */
const SWEETS_PAGES: [string, string, string, string, number][] = [
  ["page-sweets-about", "من نحن", "about", "بدأت دار رشف للحلويات من مطبخ منزلي صغير عام 2014، وكبرت بثقة عملائها حتى أصبحت دار حلويات متكاملة.\nنحضّر كل صباح حلوياتنا طازجة: شرقية بالسمن البلدي والفستق الحلبي، وغربية بالشوكولاتة البلجيكية والكريمة الطبيعية.\nوعدنا لكم: جودة ثابتة، حلاوة متوازنة، وتقديم أنيق يليق بمناسباتكم.", 0],
  ["page-sweets-shipping", "التوصيل والشحن", "shipping", "نوصّل يوميًا داخل المدينة من 4 عصرًا حتى 11 مساءً.\nالتوصيل داخل المدينة: 15 ر.س — ومجانًا للطلبات فوق 150 ر.س.\nطلبات الكيك والمناسبات تحتاج تجهيزًا مسبقًا 48 ساعة.\nتصلك الحلويات في علب مبرّدة تحفظ طراوتها حتى الاستلام.", 1],
  ["page-sweets-policies", "سياسة الاستبدال والاسترجاع", "policies", "جودة منتجاتنا مسؤوليتنا: إذا وصلك منتج تالف أو غير مطابق للطلب نستبدله أو نعيد قيمته خلال 24 ساعة.\nلا نقبل الاسترجاع لتغيّر الرأي في المنتجات الطازجة لأنها تُحضَّر حسب الطلب، لكن رضاكم غايتنا دائمًا.\nلديك حساسية غذائية؟ نبّهنا عند الطلب — جميع منتجاتنا قد تحتوي مكسرات أو غلوتين أو ألبان.", 2],
  ["page-sweets-occasions", "مناسبات وأفراح", "occasions", "نستقبل طلبات الأفراح والخطوبات والتخرج وهدايا الشركات بكميات من 50 إلى 2000 قطعة.\nيشمل كل طلب: تذوق مجاني قبل التأكيد، تصميم خاص بألوان مناسبتك، وبطاقات مطبوعة باسمكم.\nللاستفسار وطلب عرض سعر تواصلوا معنا عبر واتساب أو إنستغرام.", 3],
];

const SWEETS_SETTINGS = {
  template: "modern",
  font: "tajawal",
  primaryColor: "#9F1239",
  secondaryColor: "#D4AF37",
  sectionOrder: '["hero","products","pages","footer"]',
  aboutText: "في دار رشف نصنع الحلويات بشغف يتجاوز عشر سنوات: كنافة وبقلاوة وبسبوسة على الطريقة الأصيلة، وكيك وتشيز كيك بأسلوب عصري. نختار السمن البلدي والفستق الحلبي والشوكولاتة البلجيكية، ونخبز يوميًا بكميات محدودة ليصلك كل شيء طازجًا.",
  instagram: "https://instagram.com/rshaf.sweets",
  snapchat: "rshaf_sweets",
  tiktok: "https://tiktok.com/@rshaf.sweets",
  whatsapp: "966507778899",
  footerBgColor: "#450A1A",
  /** آيبانات وهمية للعرض فقط (نمط SA + 22 خانة) — ليست حسابات حقيقية */
  ibanRajhi: "SA0380000000608010167519",
  ibanAlinmaa: "SA9211500000012345678901",
  ibanAlahli: "SA4410000000012345678902",
  seoTitle: "دار رشف للحلويات | حلويات شرقية وغربية فاخرة",
  seoDescription: "كنافة وبقلاوة وبسبوسة طازجة، كيك وتشيز كيك، ومخبوزات يومية من دار رشف للحلويات. اطلب الآن عبر واتساب وتوصيل لجميع الأحياء.",
  seoKeywords: "حلويات, كنافة, بقلاوة, بسبوسة, كيك, تشيز كيك, مخبوزات, دار رشف",
  seoOgImage: "/seed/sweets-cover.jpg",
  seoFavicon: "/seed/sweets-logo.png",
  seoCanonical: "https://sweets.maaoun.com",
};

// ------------------------------------------------------------
// البيانات الأولية (Demo Seed)
// ------------------------------------------------------------

function seedIfEmpty(db: DatabaseSync): void {
  const row = db.prepare("SELECT COUNT(*) AS c FROM stores").get() as { c: number };
  if (row.c > 0) return;

  const now = new Date().toISOString();
  const ago = (days: number) => new Date(Date.now() - days * 86400000).toISOString();

  // ----- المستخدمون -----
  const insUser = db.prepare(
    "INSERT INTO local_users (id, email, password_hash, name, role, created_at) VALUES (?,?,?,?,?,?)"
  );
  insUser.run("user-owner", process.env.LOCAL_OWNER_EMAIL || "owner@maaoun.com", hashPassword(process.env.LOCAL_OWNER_PASSWORD || "Maaoun#2026"), "مالك المنصة", "owner", ago(90));
  insUser.run("user-rshaf", "rshaf@demo.com", hashPassword("Rshaf#2026"), "محمد الرشيف", "member", ago(20));
  insUser.run("user-oud", "oud@demo.com", hashPassword("Oud#2026"), "أحمد العتيبي", "member", ago(12));
  insUser.run("user-sara", "sara@demo.com", hashPassword("Sara#2026"), "سارة القحطاني", "member", ago(2));

  // ----- المتاجر -----
  const insStore = db.prepare(`INSERT INTO stores
    (id, name, subdomain, status, owner_name, owner_phone, owner_email, whatsapp, description, logo_url, cover_url, client_credentials, delivered_at, created_at, updated_at)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`);

  insStore.run(
    "store-rshaf", "كافيه رشف", "rshaf", "delivered",
    "محمد الرشيف", "0551112222", "rshaf@demo.com", "966551112222",
    "قهوة مختصة وحلويات طازجة تُحضَّر بحب وتُوصَّل إلى بابك.",
    "/seed/rshaf-logo.png", "/seed/rshaf-cover.jpg",
    JSON.stringify({ email: "rshaf@demo.com", password: "Rshaf#2026" }),
    ago(18), ago(25), ago(3)
  );
  insStore.run(
    "store-oud", "عود وروائح", "oud", "delivered",
    "أحمد العتيبي", "0563334444", "oud@demo.com", "966563334444",
    "متجر عطور وعود فاخر — تشكيلة مختارة من أرقى الروائح.",
    "/seed/p-oud.jpg", "/seed/portfolio-perfume.jpg",
    JSON.stringify({ email: "oud@demo.com", password: "Oud#2026" }),
    ago(10), ago(14), ago(4)
  );
  insStore.run(
    "store-sweets", "دار رشف للحلويات", "sweets", "delivered",
    "سارة القحطاني", "0507778899", "sara@demo.com", "966507778899",
    "حلويات شرقية وغربية فاخرة تُصنع طازجة يوميًا — كنافة، بقلاوة، كيك، ومخبوزات تصلك إلى بابك ومناسباتك.",
    "/seed/sweets-logo.png", "/seed/sweets-cover.jpg",
    JSON.stringify({ email: "sara@demo.com", password: "Sara#2026" }),
    ago(1), ago(2), ago(1)
  );

  // ----- إعدادات المتاجر -----
  const insSettings = db.prepare(`INSERT INTO store_settings
    (store_id, template, font, primary_color, secondary_color, section_order, about_text,
     social_instagram, social_snapchat, social_tiktok, social_whatsapp, developer_url,
     footer_bg_color, iban_rajhi, iban_alinmaa, iban_alahli,
     seo_title, seo_description, seo_keywords, seo_og_image, seo_favicon, seo_canonical, updated_at)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`);

  insSettings.run(
    "store-rshaf", "modern", "cairo", "#8B5E34", "#D97706",
    '["hero","products","pages","footer"]',
    "كافيه رشف وجهةٌ لعشّاق القهوة المختصة؛ نختاري حبوبنا بعناية ونحضر مشروباتنا أمامك بحب.",
    "https://instagram.com/rshaf.cafe", "rshaf_cafe", "https://tiktok.com/@rshaf.cafe", "",
    "https://maaoun.com", "", "", "", "",
    "كافيه رشف | القهوة والحلويات",
    "قهوة مختصة، مشروبات باردة، وحلويات طازجة في كافيه رشف. اطلب الآن عبر واتساب.",
    "قهوة, لاتيه, حلويات, كافيه رشف, قهوة مختصة",
    "/seed/rshaf-cover.jpg", "/seed/rshaf-logo.png", "", ago(3)
  );
  insSettings.run(
    "store-oud", "classic", "almarai", "#4A2C17", "#C2884E",
    '["hero","products","footer"]',
    "في عود وروائح نختار أجود أنواع العود والعطور من شمول تايلاند والهند وفيتنام، بخلطات عريقة.",
    "https://instagram.com/oud.roua3", "oud_roua3", "", "",
    "https://maaoun.com", "", "", "", "",
    "عود وروائح | عطور وعود فاخر",
    "تشكيلة فاخرة من العود والعطور الأصلية. جودة مضمونة وتسليم سريع.",
    "عود, عطور, عود تايلاند, عطر فاخر",
    "/seed/portfolio-perfume.jpg", "", "", ago(4)
  );
  insSettings.run(
    "store-sweets",
    SWEETS_SETTINGS.template, SWEETS_SETTINGS.font, SWEETS_SETTINGS.primaryColor, SWEETS_SETTINGS.secondaryColor,
    SWEETS_SETTINGS.sectionOrder, SWEETS_SETTINGS.aboutText,
    SWEETS_SETTINGS.instagram, SWEETS_SETTINGS.snapchat, SWEETS_SETTINGS.tiktok, SWEETS_SETTINGS.whatsapp,
    "https://maaoun.com",
    SWEETS_SETTINGS.footerBgColor, SWEETS_SETTINGS.ibanRajhi, SWEETS_SETTINGS.ibanAlinmaa, SWEETS_SETTINGS.ibanAlahli,
    SWEETS_SETTINGS.seoTitle, SWEETS_SETTINGS.seoDescription, SWEETS_SETTINGS.seoKeywords,
    SWEETS_SETTINGS.seoOgImage, SWEETS_SETTINGS.seoFavicon, SWEETS_SETTINGS.seoCanonical,
    ago(1)
  );

  // ----- الأقسام -----
  const insCat = db.prepare(
    "INSERT INTO categories (id, store_id, name, slug, sort_order, is_visible, created_at) VALUES (?,?,?,?,?,?,?)"
  );
  insCat.run("cat-coffee", "store-rshaf", "قهوة", "coffee", 0, 1, ago(25));
  insCat.run("cat-cold", "store-rshaf", "مشروبات باردة", "cold-drinks", 1, 1, ago(25));
  insCat.run("cat-dessert", "store-rshaf", "حلويات", "desserts", 2, 1, ago(25));
  insCat.run("cat-oud", "store-oud", "عود", "oud", 0, 1, ago(14));
  insCat.run("cat-perfume", "store-oud", "عطور", "perfumes", 1, 1, ago(14));
  insCat.run("cat-gift", "store-oud", "هدايا", "gifts", 2, 1, ago(14));
  for (const [id, name, slug, sort] of SWEETS_CATEGORIES) {
    insCat.run(id, "store-sweets", name, slug, sort, 1, ago(2));
  }

  // ----- المنتجات -----
  const insProd = db.prepare(`INSERT INTO products
    (id, store_id, slug, category_id, name, description, price, old_price, stock, is_visible, sort_order, created_at, updated_at)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`);
  const insImg = db.prepare(
    "INSERT INTO product_images (id, product_id, store_id, url, sort_order) VALUES (?,?,?,?,?)"
  );

  const prods: Array<[string, string, string, string, string, string, number, number | null, number, string]> = [
    ["prod-latte", "store-rshaf", "latte", "cat-coffee", "لاتيه", "لاتيه بحليب طازج ورغوة حريرية، محضر بقهوة مختصة نمط إثيوبي.", 22, 28, 50, "/seed/p-latte.jpg"],
    ["prod-cappuccino", "store-rshaf", "cappuccino", "cat-coffee", "كابتشينو", "كابتشينو متوازن بين الشوت والبخار، مع رشة قرفة اختيارية.", 20, null, 40, "/seed/p-cappuccino.jpg"],
    ["prod-cheesecake", "store-rshaf", "cheesecake-strawberry", "cat-dessert", "شيز كيك الفراولة", "شيز كيك نيويورك كريمي مع صوص فراولة طازج.", 35, null, 15, "/seed/p-cheesecake.jpg"],
    ["prod-chococake", "store-rshaf", "chocolate-cake", "cat-dessert", "كيك الشوكولاتة", "كيك شوكولاتة غني بتغليط غاناش داكن، قطعة بالجملة.", 38, 45, 20, "/seed/p-choco.jpg"],
    ["prod-oud-royal", "store-oud", "royal-oud", "cat-oud", "عود ملكي", "لبن عود ملكي من شمول تايلاند بدرجة 15 سنة، برائحة ثابتة وعطرة تدوم.", 250, 320, 12, "/seed/p-oud.jpg"],
    ["prod-oud-set", "store-oud", "luxury-perfume-set", "cat-perfume", "طقم عطور فاخر", "طقم من ثلاث عطور عود مختارة في علبة هدية أنيقة.", 450, 520, 8, "/seed/p-oud.jpg"],
    ["prod-gift-box", "store-oud", "gift-box", "cat-gift", "صندوق هدايا مميز", "صندوق هدايا يحتوي عودًا ومسكًا وطيبًا فاخرًا، مثالي للإهداء.", 180, null, 25, "/seed/p-gift.jpg"],
  ];
  for (const [id, sid, slug, cat, name, desc, price, old, stock, img] of prods) {
    insProd.run(id, sid, slug, cat, name, desc, price, old, stock, 1, 0, ago(20), ago(5));
    insImg.run(`img-${id}`, id, sid, img, 0);
  }
  for (const [i, [id, cat, slug, name, desc, price, old, stock, img]] of SWEETS_PRODUCTS.entries()) {
    insProd.run(id, "store-sweets", slug, cat, name, desc, price, old, stock, 1, i, ago(2), ago(1));
    insImg.run(`img-${id}`, id, "store-sweets", img, 0);
  }

  // ----- الصفحات -----
  const insPage = db.prepare(
    "INSERT INTO pages (id, store_id, title, slug, content, is_visible, sort_order, updated_at) VALUES (?,?,?,?,?,?,?,?)"
  );
  insPage.run(
    "page-rshaf-about", "store-rshaf", "من نحن", "about",
    "بدأ كافيه رشف من شغف بسيط بالقهوة المختصة؛ نحمّص حبوبنا أسبوعيًا، ونختار ملاءاتنا بعناية.\nنفخر بإعداد كل كوب بعينٍ على التفاصيل، ونسعد بأن نكون جزءًا من صباحك.",
    1, 0, ago(20)
  );
  insPage.run(
    "page-rshaf-policy", "store-rshaf", "سياسة الاستبدال", "policies",
    "للحفاظ على جودة منتجاتنا الطازجة، لا نقبل استبدال المشروبات.\nللحلويات: يمكنك التبديل خلال 24 ساعة من الاستلام إذا وصل المنتج غير مطابق.",
    1, 1, ago(20)
  );
  insPage.run(
    "page-oud-about", "store-oud", "من نحن", "about",
    "عشر سنوات في سوق العود والعطور أكسبتنا ثقة عملائنا؛ نختار الخامات من مصادرها الأصلية ونختبر كل دفعة قبل طرحها.",
    1, 0, ago(14)
  );
  for (const [id, title, slug, content, sort] of SWEETS_PAGES) {
    insPage.run(id, "store-sweets", title, slug, content, 1, sort, ago(2));
  }

  // ----- الأعضاء -----
  const insMember = db.prepare(
    "INSERT INTO store_members (id, store_id, user_id, role, created_at) VALUES (?,?,?,?,?)"
  );
  insMember.run("mem-1", "store-rshaf", "user-rshaf", "owner", ago(18));
  insMember.run("mem-2", "store-oud", "user-oud", "owner", ago(10));
  insMember.run("mem-3", "store-sweets", "user-sara", "owner", ago(1));

  // ----- إعدادات الموقع العام -----
  db.prepare(`INSERT INTO site_settings
    (id, whatsapp_number, developer_url, about_text, hero_title, hero_subtitle, features, faq, social_instagram, social_snapchat, social_tiktok, updated_at)
    VALUES (1,?,?,?,?,?,?,?,?,?,?,?)`).run(
    "966500000000",
    "https://maaoun.com",
    "معون منصة متكاملة أنشئ بها متاجر إلكترونية للعملاء: أنشئ، صمّم، جهّز المنتجات، ضبّط SEO، وسلّم المتجر على نطاق فرعي خاص — ثم يدير العميل متجره بنفسه من لوحة تحكم مستقلة.",
    "متجرك الإلكتروني الاحترافي…",
    "نساعدك في تحويل فكرتك إلى متجر إلكتروني متكامل يعكس هوية تجارتك ويجذب عملاءك.",
    JSON.stringify([
      { title: "نطاق فرعي خاص", desc: "كل متجر على نطاق مستقل: name.maaoun.com — بدون شراء دومين." },
      { title: "تصميم بهوية متجرك", desc: "قوالب، خطوط، وألوان قابلة للتخصيص بالكامل." },
      { title: "الطلب عبر واتساب", desc: "زر طلب ذكي برسالة جاهزة تتضمن اسم المنتج وسعره." },
      { title: "SEO محلي", desc: "عناوين ووصف وكلمات مفتاحية عربية محسّنة لكل متجر." },
      { title: "أمان حقيقي", desc: "عزل كامل لبيانات كل متجر بمستوى قاعدة البيانات (RLS)." },
      { title: "لوحة تحكم للعميل", desc: "يعتمد العميل على نفسه: منتجات، أقسام، أسعار، وصور." },
    ]),
    JSON.stringify([
      { q: "هل أحتاج لشراء دومين منفصل لمتجري؟", a: "لا. يحصل متجرك على نطاق فرعي مجاني مثل name.maaoun.com، ويمكنك ربط دومين خاص لاحقًا إذا رغبت." },
      { q: "كيف أطلب المتجر؟", a: "تواصل معي عبر زر الواتساب في أي مكان بالموقع، وسأتولى إنشاء متجرك وتجهيزه بالكامل." },
      { q: "هل أستطيع إدارة متجري بنفسي؟", a: "نعم. بعد التسليم تحصل على لوحة تحكم مستقلة تضيف من خلالها المنتجات وتعديل الأسعار والصور." },
      { q: "كيف يتم التسليم؟", a: "بعد اكتمال التجهيز والاختبار، أُنشئ لك حسابًا وأرسل لك بيانات الدخول ورابط متجرك." },
      { q: "هل الطلبات عبر واتساب؟", a: "نعم. زبونك يضغط «اطلب عبر واتساب» تصلك الرسالة باسم المنتج وسعره مباشرة." },
    ]),
    "https://instagram.com/maaoun", "maaoun", "https://tiktok.com/@maaoun",
    now
  );

  // ----- الباقات -----
  const insPlan = db.prepare(`INSERT INTO pricing_plans
    (id, name, price, old_price, currency, features, is_featured, is_visible, sort_order, updated_at) VALUES (?,?,?,?,?,?,?,?,?,?)`);
  insPlan.run("plan-basic", "الأساسية", 299, 399, "ر.س",
    JSON.stringify(["متجر على نطاق فرعي", "حتى 50 منتج", "لوحة تحكم كاملة", "زر الطلب عبر واتساب", "دعم عبر الواتساب"]),
    0, 1, 0, now);
  insPlan.run("plan-pro", "الاحترافية", 599, 799, "ر.س",
    JSON.stringify(["كل مزايا الباقة الأساسية", "منتجات غير محدودة", "قالب مخصص + هوية الألوان", "SEO محلي كامل", "أولوية في الدعم", "شهر صيانة مجاني"]),
    1, 1, 1, now);
  insPlan.run("plan-premium", "بريميوم", 999, 1299, "ر.س",
    JSON.stringify(["كل مزايا الباقة الاحترافية", "تصميم فريد بالكامل", "صفحات مخصصة إضافية", "متابعة وتحسين شهري", "دعم فوري 7 أيام"]),
    0, 1, 2, now);

  // ----- العروض -----
  const insOffer = db.prepare(`INSERT INTO offers
    (id, title, description, price, old_price, currency, starts_at, ends_at, is_active, created_at) VALUES (?,?,?,?,?,?,?,?,?,?)`);
  insOffer.run("offer-launch", "عرض الإطلاق", "أول 3 متاجر هذا الشهر تحصل على باقة الاحترافية بسعر الباقة الأساسية!", 299, 599, "ر.س", ago(5), new Date(Date.now() + 25 * 86400000).toISOString(), 1, ago(5));
  insOffer.run("offer-referral", "اثر صديقك", "احصل على خصم 100 ر.س عند إحالة عميل يصلنا عبرك.", 0, null, "ر.س", null, null, 1, ago(10));

  // ----- الأعمال -----
  const insPortfolio = db.prepare(`INSERT INTO portfolio_items
    (id, title, description, image_url, store_url, tags, is_visible, sort_order, created_at) VALUES (?,?,?,?,?,?,?,?,?)`);
  insPortfolio.run("pf-rshaf", "كافيه رشف", "متجر قهوة مختصة وحلويات بقالب عصري وألوان دافئة.", "/seed/rshaf-cover.jpg", "https://rshaf.maaoun.com", "قهوة, حلويات, متجر طعام", 1, 0, ago(18));
  insPortfolio.run("pf-oud", "عود وروائح", "متجر عطور وعود فاخر بهوية كلاسيكية راقية.", "/seed/portfolio-perfume.jpg", "https://oud.maaoun.com", "عطور, عود, متجر فاخر", 1, 1, ago(10));
  insPortfolio.run("pf-sweets", "دار رشف للحلويات", "متجر حلويات شرقية وغربية بهوية توتية ذهبية: كتالوج كامل، طلب عبر واتساب، وحسابات تحويل بنكي.", "/seed/sweets-cover.jpg", "https://sweets.maaoun.com", "حلويات, مناسبات, متجر طعام", 1, 2, ago(1));

  // ----- سجل النشاطات -----
  const insLog = db.prepare(
    "INSERT INTO activity_logs (store_id, user_id, actor_email, action, details, created_at) VALUES (?,?,?,?,?,?)"
  );
  const ownerEmail = process.env.LOCAL_OWNER_EMAIL || "owner@maaoun.com";
  insLog.run(null, "user-owner", ownerEmail, "store.created", JSON.stringify({ store: "store-sweets", name: "دار رشف للحلويات" }), ago(2));
  insLog.run("store-rshaf", "user-owner", ownerEmail, "product.created", JSON.stringify({ name: "كيك الشوكولاتة" }), ago(5));
  insLog.run("store-oud", "user-owner", ownerEmail, "store.delivered", JSON.stringify({ subdomain: "oud" }), ago(10));
  insLog.run("store-rshaf", "user-owner", ownerEmail, "store.delivered", JSON.stringify({ subdomain: "rshaf" }), ago(18));
  insLog.run("store-sweets", "user-owner", ownerEmail, "store.delivered", JSON.stringify({ subdomain: "sweets" }), ago(1));
  insLog.run("store-sweets", "user-owner", ownerEmail, "product.created", JSON.stringify({ name: "كنافة نابلسية بالجبن" }), ago(2));
}

// ------------------------------------------------------------
// إكمال متجر «دار رشف للحلويات» في القواعد المحلية القديمة
// ------------------------------------------------------------
//
// القواعد المحلية (‎.data/wathba.db) التي بُذرت قبل اكتمال متجر العرض تبقى
// تحمل المتجر بحالة «preparing» وبلا محتوى. هذه الدالة تُكملها مرة واحدة
// بنفس بيانات البذر (المطابقة لـ supabase/migrations/0007) دون لمس أي تعديل
// أجراه المستخدم: لا تعمل إلا إذا كان المتجر ما يزال بلا نص «عن المتجر»
// وبلا منتجات، وجميع إدراجاتها INSERT OR IGNORE بمعرّفات ثابتة.

function completeSweetsShowcase(database: DatabaseSync): void {
  const store = database
    .prepare("SELECT id FROM stores WHERE subdomain = 'sweets'")
    .get() as { id: string } | undefined;
  if (!store) return;

  const settings = database
    .prepare("SELECT about_text FROM store_settings WHERE store_id = ?")
    .get(store.id) as { about_text: string | null } | undefined;
  const prodRow = database
    .prepare("SELECT COUNT(*) AS c FROM products WHERE store_id = ?")
    .get(store.id) as { c: number };
  const incomplete = (settings?.about_text ?? "") === "" || prodRow.c === 0;
  if (!incomplete) return;

  const nowIso = new Date().toISOString();
  const ago = (days: number) => new Date(Date.now() - days * 86400000).toISOString();

  database.prepare(`UPDATE stores SET
      status = 'delivered',
      delivered_at = COALESCE(delivered_at, ?),
      logo_url = ?, cover_url = ?, description = ?, updated_at = ?
    WHERE id = ?`).run(
    ago(1), "/seed/sweets-logo.png", "/seed/sweets-cover.jpg",
    "حلويات شرقية وغربية فاخرة تُصنع طازجة يوميًا — كنافة، بقلاوة، كيك، ومخبوزات تصلك إلى بابك ومناسباتك.",
    nowIso, store.id
  );

  database.prepare(`INSERT INTO store_settings
      (store_id, template, font, primary_color, secondary_color, section_order, about_text,
       social_instagram, social_snapchat, social_tiktok, social_whatsapp, developer_url,
       footer_bg_color, iban_rajhi, iban_alinmaa, iban_alahli,
       seo_title, seo_description, seo_keywords, seo_og_image, seo_favicon, seo_canonical, updated_at)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
    ON CONFLICT(store_id) DO UPDATE SET
      template = excluded.template, font = excluded.font,
      primary_color = excluded.primary_color, secondary_color = excluded.secondary_color,
      section_order = excluded.section_order, about_text = excluded.about_text,
      social_instagram = excluded.social_instagram, social_snapchat = excluded.social_snapchat,
      social_tiktok = excluded.social_tiktok, social_whatsapp = excluded.social_whatsapp,
      developer_url = excluded.developer_url,
      footer_bg_color = excluded.footer_bg_color, iban_rajhi = excluded.iban_rajhi,
      iban_alinmaa = excluded.iban_alinmaa, iban_alahli = excluded.iban_alahli,
      seo_title = excluded.seo_title, seo_description = excluded.seo_description,
      seo_keywords = excluded.seo_keywords, seo_og_image = excluded.seo_og_image,
      seo_favicon = excluded.seo_favicon, seo_canonical = excluded.seo_canonical,
      updated_at = excluded.updated_at`).run(
    store.id,
    SWEETS_SETTINGS.template, SWEETS_SETTINGS.font, SWEETS_SETTINGS.primaryColor, SWEETS_SETTINGS.secondaryColor,
    SWEETS_SETTINGS.sectionOrder, SWEETS_SETTINGS.aboutText,
    SWEETS_SETTINGS.instagram, SWEETS_SETTINGS.snapchat, SWEETS_SETTINGS.tiktok, SWEETS_SETTINGS.whatsapp,
    "https://maaoun.com",
    SWEETS_SETTINGS.footerBgColor, SWEETS_SETTINGS.ibanRajhi, SWEETS_SETTINGS.ibanAlinmaa, SWEETS_SETTINGS.ibanAlahli,
    SWEETS_SETTINGS.seoTitle, SWEETS_SETTINGS.seoDescription, SWEETS_SETTINGS.seoKeywords,
    SWEETS_SETTINGS.seoOgImage, SWEETS_SETTINGS.seoFavicon, SWEETS_SETTINGS.seoCanonical,
    nowIso
  );

  const insCat = database.prepare(
    "INSERT OR IGNORE INTO categories (id, store_id, name, slug, sort_order, is_visible, created_at) VALUES (?,?,?,?,?,1,?)"
  );
  for (const [id, name, slug, sort] of SWEETS_CATEGORIES) {
    insCat.run(id, store.id, name, slug, sort, ago(2));
  }

  const insProd = database.prepare(`INSERT OR IGNORE INTO products
      (id, store_id, slug, category_id, name, description, price, old_price, stock, is_visible, sort_order, created_at, updated_at)
    VALUES (?,?,?,?,?,?,?,?,?,1,?,?,?)`);
  const insImg = database.prepare(
    "INSERT OR IGNORE INTO product_images (id, product_id, store_id, url, sort_order) VALUES (?,?,?,?,0)"
  );
  for (const [i, [id, cat, slug, name, desc, price, old, stock, img]] of SWEETS_PRODUCTS.entries()) {
    insProd.run(id, store.id, slug, cat, name, desc, price, old, stock, i, ago(2), nowIso);
    insImg.run(`img-${id}`, id, store.id, img);
  }

  const insPage = database.prepare(
    "INSERT OR IGNORE INTO pages (id, store_id, title, slug, content, is_visible, sort_order, updated_at) VALUES (?,?,?,?,?,1,?,?)"
  );
  for (const [id, title, slug, content, sort] of SWEETS_PAGES) {
    insPage.run(id, store.id, title, slug, content, sort, ago(2));
  }

  const sara = database
    .prepare("SELECT id FROM local_users WHERE lower(email) = 'sara@demo.com'")
    .get() as { id: string } | undefined;
  if (sara) {
    database.prepare(
      "INSERT OR IGNORE INTO store_members (id, store_id, user_id, role, created_at) VALUES (?,?,?,?,?)"
    ).run("mem-3", store.id, sara.id, "owner", ago(1));
  }

  database.prepare(`INSERT OR IGNORE INTO portfolio_items
      (id, title, description, image_url, store_url, tags, is_visible, sort_order, created_at)
    VALUES (?,?,?,?,?,?,1,?,?)`).run(
    "pf-sweets", "دار رشف للحلويات",
    "متجر حلويات شرقية وغربية بهوية توتية ذهبية: كتالوج كامل، طلب عبر واتساب، وحسابات تحويل بنكي.",
    "/seed/sweets-cover.jpg", "https://sweets.maaoun.com", "حلويات, مناسبات, متجر طعام", 2, ago(1)
  );

  const hasLog = database.prepare(
    "SELECT 1 AS x FROM activity_logs WHERE store_id = ? AND action = 'store.delivered' LIMIT 1"
  ).get(store.id) as { x: number } | undefined;
  if (!hasLog) {
    const ownerEmail = process.env.LOCAL_OWNER_EMAIL || "owner@maaoun.com";
    database.prepare(
      "INSERT INTO activity_logs (store_id, user_id, actor_email, action, details, created_at) VALUES (?,?,?,?,?,?)"
    ).run(store.id, null, ownerEmail, "store.delivered", JSON.stringify({ subdomain: "sweets" }), ago(1));
  }
}

// ------------------------------------------------------------
// عمليات قراءة بسيطة تُستخدم مباشرة في بعض المواضع
// ------------------------------------------------------------

export interface RawStoreRow {
  id: string;
  name: string;
  subdomain: string;
  status: string;
  owner_name: string | null;
  owner_phone: string | null;
  owner_email: string | null;
  whatsapp: string | null;
  description: string | null;
  logo_url: string | null;
  cover_url: string | null;
  client_credentials: string | null;
  delivered_at: string | null;
  created_at: string;
  updated_at: string;
}

export function rowToStore(r: RawStoreRow): Store {
  return {
    id: r.id,
    name: r.name,
    subdomain: r.subdomain,
    status: r.status as Store["status"],
    ownerName: r.owner_name ?? "",
    ownerPhone: r.owner_phone ?? "",
    ownerEmail: r.owner_email ?? "",
    whatsapp: r.whatsapp ?? "",
    description: r.description ?? "",
    logoUrl: r.logo_url,
    coverUrl: r.cover_url,
    clientCredentials: r.client_credentials ? JSON.parse(r.client_credentials) : null,
    deliveredAt: r.delivered_at,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

export const DEFAULT_SETTINGS: Omit<StoreSettings, "storeId" | "updatedAt"> = {
  template: "modern",
  font: "cairo",
  primaryColor: "#4F46E5",
  secondaryColor: "#F59E0B",
  sectionOrder: ["hero", "products", "pages", "footer"],
  aboutText: "",
  socialInstagram: "",
  socialSnapchat: "",
  socialTiktok: "",
  socialWhatsApp: "",
  developerUrl: "",
  seoTitle: "",
  seoDescription: "",
  seoKeywords: "",
  seoOgImage: "",
  seoFavicon: "",
  seoCanonical: "",
  footerBgColor: "",
  ibanRajhi: "",
  ibanAlinmaa: "",
  ibanAlahli: "",
};

export function newId(prefix = ""): string {
  return prefix ? `${prefix}-${randomUUID().slice(0, 8)}` : randomUUID();
}

export { fs as localFs, path as localPath };
