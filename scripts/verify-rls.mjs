#!/usr/bin/env node
/**
 * ============================================================
 * معين — اختبار RLS الحقيقي (PostgreSQL عبر PGlite/WASM)
 * ============================================================
 *
 * ينفّذ ترحيلات المشروع فعليًا على قاعدة PostgreSQL حقيقية:
 *   supabase/migrations/0001_init.sql
 *   supabase/migrations/0003_master_owner_permissions.sql
 *   supabase/migrations/0004_store_settings_columns.sql
 * ثم يحاكي ثلاثة أنواع من الحسابات (كما تفعل Supabase بالضبط عبر
 * auth.uid() و request.jwt.claims) ويتحقق من كل سياسة:
 *
 *   • المالك الرئيسي  → كل شيء، في كل متجر، وفي كل حالة.
 *   • صاحب المتجر     → متجره فقط، وبلا حقول حساسة (نطاق/حالة/بيانات عميل).
 *   • زائر (anon)     → المتاجر المسلّمة فقط، بلا كتابة.
 *
 * ويفحص كذلك مسارات التخزين: stores/<store_id>/… وصور الموقع العامة.
 *
 * الاستخدام:  node scripts/verify-rls.mjs
 * ============================================================
 */

import { PGlite } from "@electric-sql/pglite";
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname ?? process.cwd(), "..");
const ADMIN = fs.readFileSync(path.join(ROOT, "supabase/migrations/0001_init.sql"), "utf8");
const MASTER = fs.readFileSync(path.join(ROOT, "supabase/migrations/0003_master_owner_permissions.sql"), "utf8");
const SETTINGS_COLS = fs.readFileSync(path.join(ROOT, "supabase/migrations/0004_store_settings_columns.sql"), "utf8");

const OWNER_UID = "00000000-0000-4000-8000-000000000001";
const MEMBER_A_UID = "00000000-0000-4000-8000-000000000002";
const MEMBER_B_UID = "00000000-0000-4000-8000-000000000003";
const ANON_UID = "00000000-0000-4000-8000-000000000009"; // حساب بلا دور مالك ولا عضوية
const S_A = "aaaaaaaa-0000-4000-8000-00000000000a";
const S_B = "bbbbbbbb-0000-4000-8000-00000000000b";

const results = [];
function record(name, ok, info = "") {
  results.push({ name, ok, info });
  console.log(`  ${ok ? "✓" : "✗"} ${name}${info ? ` — ${info}` : ""}`);
}

/** محاكاة Supabase: تشغيل جملة بهوية مستخدم معيّن (auth.uid) */
async function asActor(db, uid, role, sql, params = []) {
  await db.exec("begin");
  try {
    await db.exec(`set local role ${role}`);
    await db.query(`select set_config('request.jwt.claims', $1, true)`, [
      uid ? JSON.stringify({ sub: uid, role }) : "",
    ]);
    const res = await db.query(sql, params);
    await db.exec("commit");
    return { ok: true, rows: res.rows ?? [], affected: res.affectedRows ?? 0 };
  } catch (e) {
    await db.exec("rollback").catch(() => {});
    return { ok: false, error: String(e.message ?? e) };
  }
}

const FIXTURES = `
-- أدوار Supabase (تُنشأ في مشروع Supabase تلقائيًا)
do $$ begin
  if not exists (select 1 from pg_roles where rolname = 'anon') then
    create role anon nologin noinherit;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then
    create role authenticated nologin noinherit;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'service_role') then
    create role service_role nologin noinherit bypassrls;
  end if;
end $$;

create schema if not exists auth;
create schema if not exists storage;

create table if not exists auth.users (
  id uuid primary key,
  email text unique,
  raw_user_meta_data jsonb default '{}'::jsonb
);

-- auth.uid() كما في Supabase (من رمز الجلسة)
create or replace function auth.uid() returns uuid
language sql stable as $$
  select coalesce(
    nullif(current_setting('request.jwt.claim.sub', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub')
  )::uuid
$$;

create table if not exists storage.buckets (
  id text primary key,
  name text not null,
  public boolean default false,
  file_size_limit bigint,
  allowed_mime_types text[],
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists storage.objects (
  id uuid primary key default gen_random_uuid(),
  bucket_id text references storage.buckets(id),
  name text,
  owner uuid default auth.uid(),
  created_at timestamptz default now()
);
alter table storage.objects enable row level security;
revoke all on storage.objects from public;

create or replace function storage.foldername(name text) returns text[]
language plpgsql immutable as $$
declare parts text[];
begin
  parts := string_to_array(name, '/');
  if array_length(parts, 1) is null or array_length(parts, 1) < 1 then
    return array[]::text[];
  end if;
  return parts[1:array_length(parts, 1) - 1];
end $$;
`;

const GRANTS = `
grant usage on schema public, auth, storage to anon, authenticated;
grant select on all tables in schema public to anon;
grant all on all tables in schema public to authenticated;
grant all on all sequences in schema public to authenticated;
grant select on storage.objects to anon, authenticated;
grant all on storage.objects to authenticated;
grant usage on schema storage to anon, authenticated;
`;

const SEED = `
insert into auth.users (id, email) values
  ('${OWNER_UID}', 'owner@maaoun.com'),
  ('${MEMBER_A_UID}', 'rshaf@demo.com'),
  ('${MEMBER_B_UID}', 'oud@demo.com'),
  ('${ANON_UID}', 'guest@demo.com')
on conflict do nothing;

update public.profiles set role = 'owner' where id = '${OWNER_UID}';

insert into public.stores (id, name, subdomain, status, owner_name, owner_email)
values
  ('${S_A}', 'كافيه رشف', 'rshaf', 'delivered', 'محمد', 'rshaf@demo.com'),
  ('${S_B}', 'عود وروائح', 'oud', 'preparing', 'أحمد', 'oud@demo.com')
on conflict (id) do nothing;

insert into public.store_members (store_id, user_id, role) values
  ('${S_A}', '${MEMBER_A_UID}', 'owner'),
  ('${S_B}', '${MEMBER_B_UID}', 'owner')
on conflict do nothing;

insert into public.store_settings (store_id, template, seo_title) values
  ('${S_A}', 'modern', 'رشف'), ('${S_B}', 'classic', 'عود')
on conflict (store_id) do nothing;

insert into public.categories (store_id, name, slug) values
  ('${S_A}', 'قهوة', 'coffee'), ('${S_B}', 'عود', 'oud')
on conflict do nothing;

insert into public.products (store_id, slug, name, price) values
  ('${S_A}', 'latte', 'لاتيه', 22), ('${S_B}', 'royal-oud', 'عود ملكي', 250)
on conflict do nothing;

insert into public.pages (store_id, title, slug) values
  ('${S_A}', 'سياسة', 'policy-a'), ('${S_B}', 'شروط', 'policy-b')
on conflict do nothing;
`;

async function main() {
  console.log("\n══════ اختبار RLS على PostgreSQL حقيقي (PGlite) ══════");
  const db = await PGlite.create();

  await db.exec(FIXTURES);
  await db.exec(ADMIN);
  await db.exec(MASTER);
  await db.exec(SETTINGS_COLS);
  await db.exec(GRANTS);
  await db.exec(SEED);
  console.log("  · نُفِّذت الترحيلات 0001 + 0003 + 0004 على قاعدة نظيفة\n");

  // ---------- التحقق من تهيئة الخزنة ----------
  const bucket = await db.query("select id, public, file_size_limit, allowed_mime_types from storage.buckets where id = 'store-assets'");
  record(
    "خزنة store-assets مُنشأة وعامة بحد 5MB",
    bucket.rows.length === 1 && bucket.rows[0].public === true && Number(bucket.rows[0].file_size_limit) === 5242880,
    `public=${bucket.rows[0]?.public}`
  );

  console.log("\n  ── المالك الرئيسي (Master Owner) ──");
  const owner = (sql, params) => asActor(db, OWNER_UID, "authenticated", sql, params);

  let r = await owner("select count(*)::int as n from public.stores");
  record("يرى كل المتاجر (منها غير المسلّم)", r.rows[0]?.n === 2, `${r.rows[0]?.n} متجر`);

  r = await owner("update public.stores set subdomain = 'rashaf' where id = $1 returning subdomain", [S_A]);
  record("يغيّر النطاق الفرعي لمتجر مسلّم", r.ok && r.rows[0]?.subdomain === "rashaf", r.error ?? "");
  await db.query(`update public.stores set subdomain = 'rshaf' where id = $1`, [S_A]);

  r = await owner("update public.stores set status = 'delivered', owner_name = 'محدّث' where id = $1 returning status", [S_B]);
  record("يغيّر حالة أي متجر (بلا قيود حقلية)", r.ok && r.rows[0]?.status === "delivered", r.error ?? "");
  // نُعيد الحالة كما كانت حتى تبقى اختبارات «غير المسلّم» صحيحة
  await db.query("update public.stores set status = 'preparing', owner_name = 'أحمد' where id = $1", [S_B]);

  r = await owner("insert into public.products (store_id, slug, name, price) values ($1,'p-owner','منتج مالك',10) returning id", [S_B]);
  record("يضيف منتجًا في أي متجر", r.ok && r.rows.length === 1, r.error ?? "");

  r = await owner("insert into public.categories (store_id, name, slug) values ($1,'قسم مالك','cat-owner') returning id", [S_B]);
  record("يضيف قسمًا في أي متجر", r.ok, r.error ?? "");

  r = await owner("insert into public.product_images (product_id, store_id, url) select id, $1, '/uploads/x.png' from public.products where store_id = $1 limit 1 returning id", [S_A]);
  record("يضيف صور منتجات", r.ok, r.error ?? "");

  r = await owner("insert into public.pages (store_id, title, slug) values ($1,'صفحة مالك','page-owner') returning id", [S_A]);
  record("يضيف/يعدّل الصفحات", r.ok, r.error ?? "");

  r = await owner(
    "insert into public.store_settings (store_id, about_text, seo_title) values ($1,'نص','عنوان') on conflict (store_id) do update set about_text = excluded.about_text returning store_id",
    [S_B]
  );
  record("يعدّل إعدادات أي متجر", r.ok, r.error ?? "");

  r = await owner("insert into public.activity_logs (store_id, action) values ($1,'test.owner') returning id", [S_B]);
  record("يسجّل النشاط (بجلسة المستخدم)", r.ok, r.error ?? "");

  r = await owner("select count(*)::int as n from public.store_credentials");
  record("يقرأ بيانات تسليم العملاء", r.ok, `صفوف: ${r.rows[0]?.n ?? "-"}`);

  r = await owner("insert into storage.objects (bucket_id, name) values ('store-assets', $1) returning name", [`stores/${S_A}/logo/a.png`]);
  record("يرفع صورة داخل مسار أي متجر", r.ok, r.error ?? "");

  r = await owner("insert into storage.objects (bucket_id, name) values ('store-assets', 'stores/site/pages/portfolio.png') returning name");
  record("يرفع أصول الموقع العامة (stores/site/…)", r.ok, r.error ?? "");

  r = await owner("delete from storage.objects where name = $1 returning id", [`stores/${S_A}/logo/a.png`]);
  record("يحذف الصور (استبدال/تنظيف)", r.ok && r.rows.length === 1, r.error ?? "");

  r = await owner("insert into public.stores (name, subdomain, status) values ('متجر جديد','newstore','preparing') returning id");
  record("ينشئ متاجر جديدة", r.ok, r.error ?? "");

  console.log("\n  ── صاحب المتجر (عضو متجر رشف) ──");
  const memberA = (sql, params) => asActor(db, MEMBER_A_UID, "authenticated", sql, params);

  r = await memberA("update public.stores set name = 'رشف المحدّث' where id = $1 returning name", [S_A]);
  record("يعدّل بيانات متجره", r.ok && r.rows[0]?.name === "رشف المحدّث", r.error ?? "");

  r = await memberA("update public.stores set subdomain = 'hacked' where id = $1 returning subdomain", [S_A]);
  const stillRshaf = await db.query("select subdomain from public.stores where id = $1", [S_A]);
  record("لا يغيّر النطاق الفرعي (حقل محمي)", stillRshaf.rows[0].subdomain === "rshaf", `النتيجة: ${stillRshaf.rows[0].subdomain}`);

  const statusBefore = (await db.query("select status from public.stores where id = $1", [S_A])).rows[0].status;
  await memberA("update public.stores set status = 'suspended' where id = $1 returning status", [S_A]);
  const statusAfter = (await db.query("select status from public.stores where id = $1", [S_A])).rows[0].status;
  record("لا يغيّر حالة المتجر", statusBefore === statusAfter, `${statusBefore} → ${statusAfter}`);

  r = await memberA("update public.stores set name = 'اختراق' where id = $1 returning name", [S_B]);
  const otherName = (await db.query("select name from public.stores where id = $1", [S_B])).rows[0].name;
  record("لا يعدّل متجرًا آخر", otherName === "عود وروائح", `اسم متجر عود: ${otherName}`);

  const visibleOthers = await memberA("select count(*)::int as n from public.products where store_id = $1", [S_B]);
  record("لا يرى منتجات متجر غير مسلّم ليس له", visibleOthers.rows[0]?.n === 0, `صفوف: ${visibleOthers.rows[0]?.n}`);

  r = await memberA("insert into public.products (store_id, slug, name, price) values ($1,'p-a','منتج رشف',5) returning id", [S_A]);
  record("يضيف منتجًا في متجره", r.ok, r.error ?? "");

  r = await memberA("insert into public.products (store_id, slug, name, price) values ($1,'p-b','منتج عود',5) returning id", [S_B]);
  record("لا يضيف منتجًا في متجر آخر (RLS)", !r.ok, r.error ? "منعته السياسة ✓" : "نجح! خطأ أمني");

  r = await memberA("delete from public.categories where store_id = $1 returning id", [S_B]);
  record("لا يحذف أقسام متجر آخر", !r.ok || r.rows.length === 0, r.error ?? `حُذف ${r.rows.length}`);

  r = await memberA("insert into public.activity_logs (store_id, action) values ($1,'test.member') returning id", [S_A]);
  record("يسجّل نشاط متجره", r.ok, r.error ?? "");

  r = await memberA("insert into public.activity_logs (store_id, action) values ($1,'test.hack') returning id", [S_B]);
  record("لا يسجّل نشاط متجر آخر", !r.ok, r.error ? "منعته السياسة ✓" : "نجح! خطأ أمني");

  r = await memberA("select count(*)::int as n from public.store_credentials");
  record("لا يقرأ بيانات تسليم العملاء", r.ok && r.rows[0]?.n === 0, `صفوف: ${r.rows[0]?.n}`);

  r = await memberA("update public.profiles set role = 'owner' where id = $1 returning role", [MEMBER_A_UID]);
  const roleAfter = (await db.query("select role from public.profiles where id = $1", [MEMBER_A_UID])).rows[0].role;
  record("لا يرقّي نفسه إلى مالك رئيسي", roleAfter === "store_member", `الدور: ${roleAfter}${r.error ? " (منعته الحماية)" : ""}`);

  r = await memberA("insert into public.stores (name, subdomain, status) values ('متجر عضو','member-store','preparing') returning id");
  record("لا ينشئ متاجر", !r.ok, r.error ? "منعته السياسة ✓" : "نجح! خطأ أمني");

  r = await memberA("insert into storage.objects (bucket_id, name) values ('store-assets', $1) returning name", [`stores/${S_A}/logo/own.png`]);
  record("يرفع صورة داخل مسار متجره", r.ok, r.error ?? "");

  r = await memberA("insert into storage.objects (bucket_id, name) values ('store-assets', $1) returning name", [`stores/${S_B}/logo/hack.png`]);
  record("لا يرفع صورًا في مسار متجر آخر", !r.ok, r.error ? "منعته السياسة ✓" : "نجح! خطأ أمني");

  r = await memberA("insert into storage.objects (bucket_id, name) values ('store-assets', 'site/pages/hack.png') returning name");
  record("لا يرفع أصول الموقع العامة", !r.ok, r.error ? "منعته السياسة ✓" : "نجح! خطأ أمني");

  r = await memberA("select count(*)::int as n from storage.objects");
  record("يقرأ الصور العامة", r.ok, `${r.rows[0]?.n ?? 0} كائن`);

  console.log("\n  ── حساب مصادق عليه بلا عضوية ولا دور مالك ──");
  const guestUser = (sql, params) => asActor(db, ANON_UID, "authenticated", sql, params);
  r = await guestUser("select count(*)::int as n from public.stores");
  record("يرى المتاجر المسلّمة فقط", r.rows[0]?.n === 1, `${r.rows[0]?.n} متجر`);
  r = await guestUser("insert into public.products (store_id, slug, name, price) values ($1,'x','x',1) returning id", [S_A]);
  record("لا يكتب في أي متجر", !r.ok, r.error ? "منعته السياسة ✓" : "نجح! خطأ أمني");
  r = await guestUser("insert into storage.objects (bucket_id, name) values ('store-assets', $1) returning name", [`stores/${S_A}/logo/x.png`]);
  record("لا يرفع صورًا", !r.ok, r.error ? "منعته السياسة ✓" : "نجح! خطأ أمني");

  console.log("\n  ── الزائر غير المسجَّل (anon) ──");
  const anon = (sql, params) => asActor(db, null, "anon", sql, params);
  r = await anon("select count(*)::int as n from public.stores");
  record("يرى المتاجر المسلّمة فقط", r.rows[0]?.n === 1, `${r.rows[0]?.n} متجر`);
  r = await anon("select count(*)::int as n from storage.objects");
  record("يقرأ صور المتاجر العامة", r.ok, `${r.rows[0]?.n ?? 0} كائن`);
  r = await anon("insert into public.products (store_id, slug, name, price) values ($1,'anon','أنون',1) returning id", [S_A]);
  record("لا يكتب أي بيانات", !r.ok, r.error ? "منعته السياسة ✓" : "نجح! خطأ أمني");

  // ---------- مطابقة المخطط لما يكتبه التطبيق فعلًا ----------
  // أعمدة store_settings التي يكتبها lib/services/supabase.ts → updateStoreSettings
  console.log("\n  ── مطابقة المخطط لما يكتبه التطبيق (سبق أن فشل في الإنتاج: PGRST204) ──");
  const needed = ["footer_bg_color", "iban_rajhi", "iban_alinmaa", "iban_alahli"];
  const cols = await db.query(
    "select column_name from information_schema.columns where table_schema = 'public' and table_name = 'store_settings'"
  );
  const have = new Set(cols.rows.map((r) => r.column_name));
  const missing = needed.filter((c) => !have.has(c));
  record("أعمدة لون التذييل والآيبانات موجودة في store_settings", missing.length === 0, missing.length ? `ناقص: ${missing.join(", ")}` : needed.join(", "));

  // ننفّذ **نفس** الحمولة التي يرسلها التطبيق (نفس الأعمدة) بجلسة المالك الرئيسي
  const APP_UPSERT = `insert into public.store_settings (
      store_id, template, font, primary_color, secondary_color, section_order, about_text,
      social_instagram, social_snapchat, social_tiktok, social_whatsapp, developer_url,
      footer_bg_color, iban_rajhi, iban_alinmaa, iban_alahli,
      seo_title, seo_description, seo_keywords, seo_og_image, seo_favicon, seo_canonical
    ) values ($1,'modern','cairo','#4F46E5','#F59E0B','[\"hero\",\"categories\",\"products\",\"pages\",\"footer\"]'::jsonb,
      'نص','i','s','t','w','d','#0f172a','SA01','SA02','SA03','t','d','k','og','fav','canon'
    ) on conflict (store_id) do update set
      footer_bg_color = excluded.footer_bg_color, iban_rajhi = excluded.iban_rajhi,
      iban_alinmaa = excluded.iban_alinmaa, iban_alahli = excluded.iban_alahli,
      seo_title = excluded.seo_title, updated_at = now()
    returning store_id, footer_bg_color, iban_rajhi`;

  r = await owner(APP_UPSERT, [S_B]);
  record("المالك يحفظ إعدادات المتجر بنفس حمولة التطبيق", r.ok && r.rows[0]?.iban_rajhi === "SA01", r.error ?? `footer=${r.rows[0]?.footer_bg_color}`);

  r = await memberA(APP_UPSERT, [S_A]);
  record("صاحب المتجر يحفظ إعدادات متجره بنفس حمولة التطبيق", r.ok, r.error ?? "");

  r = await memberA(APP_UPSERT, [S_B]);
  record("صاحب المتجر لا يحفظ إعدادات متجر آخر", !r.ok, r.error ? "منعته السياسة ✓" : "نجح! خطأ أمني");

  console.log("\n  ── دوال الصلاحيات ──");
  const fnOwner = await asActor(db, OWNER_UID, "authenticated", "select public.is_master_owner() as m, public.is_platform_owner() as p, public.can_manage_store($1) as c", [S_B]);
  record(
    "الدوال تعرف المالك الرئيسي على أي متجر",
    fnOwner.rows[0]?.m === true && fnOwner.rows[0]?.p === true && fnOwner.rows[0]?.c === true
  );
  const fnMember = await asActor(db, MEMBER_A_UID, "authenticated", "select public.is_master_owner() as m, public.can_manage_store($1) as own, public.can_manage_store($2) as other", [S_A, S_B]);
  record(
    "الدوال تميّز عضو المتجر عن غيره",
    fnMember.rows[0]?.m === false && fnMember.rows[0]?.own === true && fnMember.rows[0]?.other === false
  );

  console.log("\n  ── ترحيل إعادة التسمية 0006 (بلا حذف ودون تغيير الحسابات) ──");
  const REBRAND = fs.readFileSync(path.join(ROOT, "supabase/migrations/0006_rebrand_maaoun.sql"), "utf8");
  await db.exec(`
    update public.site_settings set
      developer_url = 'https://waathba.com',
      about_text = 'منصة وثبة على waathba.com',
      hero_title = 'متجرك الإلكتروني… بوثبة واحدة',
      hero_subtitle = 'مثل rshaf.waathba.com',
      features = '[{"title":"لماذا وثبة؟","desc":"name.wathbastore.com"}]'::jsonb,
      faq = '[{"q":"ما هي وثبة؟","a":"نطاق waathba.com"}]'::jsonb,
      social_instagram = 'https://instagram.com/waathba',
      social_snapchat = 'waathba',
      social_tiktok = 'https://tiktok.com/@waathba'
    where id = 1;
    update public.store_settings
      set developer_url = 'https://waathba.com', seo_canonical = 'https://rshaf.waathba.com'
      where store_id = '${S_A}';
    insert into public.portfolio_items (title, image_url, store_url)
      values ('قديم', '/seed/x.jpg', 'https://rahaf.waathba.com');
  `);
  const storesBefore = (await db.query("select count(*)::int as n from public.stores")).rows[0].n;
  const emailBefore = (await db.query("select email from public.profiles where id = $1", [OWNER_UID])).rows[0].email;
  await db.exec(REBRAND);
  const site = (await db.query(`select developer_url, about_text, hero_title, features::text as features, faq::text as faq,
      social_instagram, social_snapchat, social_tiktok from public.site_settings where id = 1`)).rows[0];
  record(
    "0006 يستبدل نطاق ونص الموقع العام",
    site.developer_url === "https://maaoun.com" &&
      !String(site.about_text).includes("waathba") &&
      !String(site.about_text).includes("وثبة"),
    `${site.developer_url} / ${site.about_text}`
  );
  record(
    "0006 يحوّل «بوثبة واحدة» قبل الاستبدال العام",
    String(site.hero_title).includes("مع معين") && !String(site.hero_title).includes("وثبة"),
    site.hero_title
  );
  record(
    "0006 يحدّث حسابات المنصة الاجتماعية فقط",
    site.social_instagram === "https://instagram.com/maaoun" &&
      site.social_snapchat === "maaoun" &&
      site.social_tiktok === "https://tiktok.com/@maaoun" &&
      String(site.faq).includes("ما هو معين") &&
      String(site.features).includes("maaoun.com")
  );
  const settingsRow = (await db.query("select developer_url, seo_canonical from public.store_settings where store_id = $1", [S_A])).rows[0];
  record(
    "0006 يحدّث روابط المتجر المخزّنة",
    settingsRow.developer_url === "https://maaoun.com" && settingsRow.seo_canonical === "https://rshaf.maaoun.com",
    settingsRow.seo_canonical
  );
  const slug = (await db.query("select subdomain from public.stores where id = $1", [S_A])).rows[0].subdomain;
  const storesAfter = (await db.query("select count(*)::int as n from public.stores")).rows[0].n;
  const emailAfter = (await db.query("select email from public.profiles where id = $1", [OWNER_UID])).rows[0].email;
  record("0006 لا يحذف متاجر ولا يغيّر النطاق الفرعي أو بريد الدخول", storesAfter === storesBefore && slug === "rshaf" && emailAfter === emailBefore, `${slug} / ${emailAfter}`);
  const portfolio = (await db.query("select store_url from public.portfolio_items where title = 'قديم'")).rows[0];
  record("0006 يحدّث رابط المعرض على النطاق القديم دون تغيير الاسم الفرعي", portfolio?.store_url === "https://rahaf.maaoun.com", portfolio?.store_url ?? "");

  await db.close();

  const failed = results.filter((x) => !x.ok);
  console.log(`\n══════ النتيجة: ${results.length - failed.length}/${results.length} ناجح ══════`);
  if (failed.length) {
    for (const f of failed) console.log(`  ✗ ${f.name} ${f.info ?? ""}`);
    process.exit(1);
  }
  console.log("✅ سياسات RLS تعطي المالك الرئيسي كل الصلاحيات وتحفظ عزل أصحاب المتاجر\n");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
