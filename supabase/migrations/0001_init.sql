-- ============================================================
-- معون maaoun.com — مخطط قاعدة البيانات + RLS
-- Supabase / PostgreSQL
--
-- البنية: Multi-Tenant حقيقية
-- كل جدول متعلق بمتجر يحوي store_id
-- العزل: Row Level Security + دوال صلاحيات
-- ============================================================

-- ---------- دوال الصلاحيات (security definer لتجنب ثغرات الاستدعاء) ----------

-- تُستخدم PL/pgSQL هنا لأن الجدولين profiles وstore_members يُنشآن لاحقًا
-- في هذا الملف. يؤجل PostgreSQL تخطيط الاستعلام حتى أول استدعاء للدالة.
create or replace function public.is_platform_owner()
returns boolean
language plpgsql stable security definer set search_path = public
as $$
begin
  return exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'owner'
  );
end;
$$;

create or replace function public.is_store_member(p_store uuid)
returns boolean
language plpgsql stable security definer set search_path = public
as $$
begin
  return exists (
    select 1 from public.store_members
    where store_id = p_store and user_id = auth.uid()
  );
end;
$$;

-- ---------- profiles (امتداد auth.users) ----------

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  role text not null default 'store_member' check (role in ('owner', 'store_member')),
  full_name text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles_select_own" on public.profiles
  for select using (id = auth.uid() or public.is_platform_owner());

create policy "profiles_update_own" on public.profiles
  for update using (id = auth.uid())
  with check (id = auth.uid());

-- لا يجوز لعضو متجر ترقية نفسه إلى مالك منصة أو تغيير بريد Auth
create or replace function public.protect_profile_fields()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  if auth.uid() is not null and not public.is_platform_owner() then
    if new.role is distinct from old.role or new.email is distinct from old.email then
      raise exception 'لا تملك صلاحية تعديل دور الحساب أو بريده'
        using errcode = '42501';
    end if;
  end if;
  return new;
end;
$$;

create trigger protect_profile_fields
  before update on public.profiles
  for each row execute function public.protect_profile_fields();

-- إنشاء البروفايل تلقائيًا عند التسجيل
create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    'store_member'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- stores ----------

create table public.stores (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  subdomain text not null unique,
  status text not null default 'draft'
    check (status in ('draft','preparing','testing','ready','delivered','suspended')),
  owner_name text,
  owner_phone text,
  owner_email text unique,
  whatsapp text,
  description text,
  logo_url text,
  cover_url text,
  -- للتوافق مع النسخ المحلية فقط؛ يظل null في Supabase.
  -- بيانات التسليم الفعلية محفوظة في store_credentials المحمي أدناه.
  client_credentials jsonb,
  delivered_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.stores enable row level security;

-- القراءة: المسلّم للزوار + المالك + أعضاء المتجر
create policy "stores_select" on public.stores
  for select using (
    status = 'delivered'
    or public.is_platform_owner()
    or public.is_store_member(id)
  );

-- الكتابة: المالك فقط
create policy "stores_insert" on public.stores for insert with check (public.is_platform_owner());
create policy "stores_update" on public.stores
  for update using (public.is_platform_owner() or public.is_store_member(id));
create policy "stores_delete" on public.stores for delete using (public.is_platform_owner());

-- منع أعضاء المتجر من تعديل الحقول الحساسة (نطاق، بريد المالك، الحالة…)
create or replace function public.protect_store_fields()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  -- auth.uid() يكون null لعمليات SQL Editor وservice/secret key الموثوقة.
  -- نقيّد فقط عضو المتجر المصادق عليه، بينما تسمح RLS للمالك أو الخدمة.
  if auth.uid() is not null and not public.is_platform_owner() then
    new.subdomain := old.subdomain;
    new.status := old.status;
    new.owner_name := old.owner_name;
    new.owner_phone := old.owner_phone;
    new.owner_email := old.owner_email;
    new.client_credentials := old.client_credentials;
    new.delivered_at := old.delivered_at;
  end if;
  new.updated_at := now();
  return new;
end;
$$;

create trigger protect_store_fields
  before update on public.stores
  for each row execute function public.protect_store_fields();

-- ---------- store_credentials (خاص بمالك المنصة) ----------
-- لا تُحفظ كلمات مرور التسليم في stores لأن صفوف المتاجر المسلّمة عامة القراءة.

create table public.store_credentials (
  store_id uuid primary key references public.stores(id) on delete cascade,
  email text not null,
  password text not null,
  updated_at timestamptz not null default now()
);

alter table public.store_credentials enable row level security;

create policy "credentials_owner_select" on public.store_credentials
  for select using (public.is_platform_owner());

create policy "credentials_owner_insert" on public.store_credentials
  for insert with check (public.is_platform_owner());

create policy "credentials_owner_update" on public.store_credentials
  for update using (public.is_platform_owner())
  with check (public.is_platform_owner());

create policy "credentials_owner_delete" on public.store_credentials
  for delete using (public.is_platform_owner());

-- ---------- store_settings ----------

create table public.store_settings (
  store_id uuid primary key references public.stores(id) on delete cascade,
  template text not null default 'modern' check (template in ('modern','classic','minimal')),
  font text not null default 'cairo' check (font in ('cairo','tajawal','almarai','ibm-plex')),
  primary_color text not null default '#4F46E5',
  secondary_color text not null default '#F59E0B',
  section_order jsonb not null default '["hero","categories","products","pages","footer"]',
  about_text text,
  social_instagram text,
  social_snapchat text,
  social_tiktok text,
  social_whatsapp text,
  developer_url text,
  footer_bg_color text,
  iban_rajhi text,
  iban_alinmaa text,
  iban_alahli text,
  seo_title text,
  seo_description text,
  seo_keywords text,
  seo_og_image text,
  seo_favicon text,
  seo_canonical text,
  updated_at timestamptz not null default now()
);

alter table public.store_settings enable row level security;

create policy "settings_select" on public.store_settings
  for select using (
    exists (select 1 from public.stores s where s.id = store_id and s.status = 'delivered')
    or public.is_platform_owner()
    or public.is_store_member(store_id)
  );

create policy "settings_insert" on public.store_settings
  for insert with check (public.is_platform_owner());

create policy "settings_update" on public.store_settings
  for update using (public.is_platform_owner() or public.is_store_member(store_id));

-- ---------- categories ----------

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  name text not null,
  slug text not null,
  sort_order integer not null default 0,
  is_visible boolean not null default true,
  created_at timestamptz not null default now(),
  unique (store_id, slug)
);

alter table public.categories enable row level security;

create policy "categories_select" on public.categories
  for select using (
    exists (select 1 from public.stores s where s.id = store_id and s.status = 'delivered')
    or public.is_platform_owner()
    or public.is_store_member(store_id)
  );

create policy "categories_write" on public.categories
  for all using (public.is_platform_owner() or public.is_store_member(store_id))
  with check (public.is_platform_owner() or public.is_store_member(store_id));

-- ---------- products ----------

create table public.products (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  slug text not null,
  category_id uuid references public.categories(id) on delete set null,
  name text not null,
  description text,
  price numeric(12,2) not null default 0,
  old_price numeric(12,2),
  stock integer,
  is_visible boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (store_id, slug)
);

alter table public.products enable row level security;

create policy "products_select" on public.products
  for select using (
    exists (select 1 from public.stores s where s.id = store_id and s.status = 'delivered')
    or public.is_platform_owner()
    or public.is_store_member(store_id)
  );

create policy "products_write" on public.products
  for all using (public.is_platform_owner() or public.is_store_member(store_id))
  with check (public.is_platform_owner() or public.is_store_member(store_id));

create or replace function public.touch_product()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger touch_product
  before update on public.products
  for each row execute function public.touch_product();

-- ---------- product_images ----------

create table public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  store_id uuid not null references public.stores(id) on delete cascade,
  url text not null,
  sort_order integer not null default 0
);

alter table public.product_images enable row level security;

create policy "images_select" on public.product_images
  for select using (
    exists (select 1 from public.stores s where s.id = store_id and s.status = 'delivered')
    or public.is_platform_owner()
    or public.is_store_member(store_id)
  );

create policy "images_write" on public.product_images
  for all using (public.is_platform_owner() or public.is_store_member(store_id))
  with check (public.is_platform_owner() or public.is_store_member(store_id));

-- ---------- pages ----------

create table public.pages (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  title text not null,
  slug text not null,
  content text,
  is_visible boolean not null default true,
  sort_order integer not null default 0,
  updated_at timestamptz not null default now(),
  unique (store_id, slug)
);

alter table public.pages enable row level security;

create policy "pages_select" on public.pages
  for select using (
    exists (select 1 from public.stores s where s.id = store_id and s.status = 'delivered')
    or public.is_platform_owner()
    or public.is_store_member(store_id)
  );

create policy "pages_write" on public.pages
  for all using (public.is_platform_owner() or public.is_store_member(store_id))
  with check (public.is_platform_owner() or public.is_store_member(store_id));

-- ---------- store_members ----------

create table public.store_members (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'owner' check (role in ('owner','admin','staff')),
  created_at timestamptz not null default now(),
  unique (store_id, user_id)
);

alter table public.store_members enable row level security;

-- المالك يرى كل الأعضاء (لإدارة التسليم)
create policy "members_select" on public.store_members
  for select using (
    public.is_platform_owner()
    or user_id = auth.uid()
  );

-- إدارة الأعضاء: المالك فقط (إنشاء عضوية العميل عند التسليم)
create policy "members_write" on public.store_members
  for all using (public.is_platform_owner())
  with check (public.is_platform_owner());

-- ---------- activity_logs ----------

create table public.activity_logs (
  id bigint generated always as identity primary key,
  store_id uuid references public.stores(id) on delete cascade,
  user_id uuid,
  actor_email text,
  action text not null,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.activity_logs enable row level security;

create policy "logs_select" on public.activity_logs
  for select using (
    public.is_platform_owner()
    or store_id is not null and public.is_store_member(store_id)
  );

create policy "logs_insert" on public.activity_logs
  for insert with check (auth.uid() is not null);

-- ---------- site_settings (صفحة واحدة) ----------

create table public.site_settings (
  id integer primary key default 1 check (id = 1),
  whatsapp_number text,
  developer_url text,
  about_text text,
  hero_title text,
  hero_subtitle text,
  features jsonb not null default '[]'::jsonb,
  faq jsonb not null default '[]'::jsonb,
  social_instagram text,
  social_snapchat text,
  social_tiktok text,
  updated_at timestamptz not null default now()
);

alter table public.site_settings enable row level security;

create policy "site_read" on public.site_settings for select using (true);
create policy "site_write" on public.site_settings
  for all using (public.is_platform_owner())
  with check (public.is_platform_owner());

insert into public.site_settings (id, whatsapp_number, developer_url, hero_title, hero_subtitle)
values (1, '', 'https://maaoun.com', 'متجرك الإلكتروني…', 'مع معون');

-- ---------- pricing_plans ----------

create table public.pricing_plans (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  price numeric(12,2) not null default 0,
  old_price numeric(12,2),
  currency text not null default 'ر.س',
  features jsonb not null default '[]'::jsonb,
  is_featured boolean not null default false,
  is_visible boolean not null default true,
  sort_order integer not null default 0,
  updated_at timestamptz not null default now()
);

alter table public.pricing_plans enable row level security;

create policy "plans_read" on public.pricing_plans
  for select using (is_visible or public.is_platform_owner());
create policy "plans_write" on public.pricing_plans
  for all using (public.is_platform_owner())
  with check (public.is_platform_owner());

-- ---------- offers ----------

create table public.offers (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  price numeric(12,2) not null default 0,
  old_price numeric(12,2),
  currency text not null default 'ر.س',
  starts_at timestamptz,
  ends_at timestamptz,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.offers enable row level security;

create policy "offers_read" on public.offers
  for select using (is_active or public.is_platform_owner());
create policy "offers_write" on public.offers
  for all using (public.is_platform_owner())
  with check (public.is_platform_owner());

-- ---------- portfolio_items ----------

create table public.portfolio_items (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  image_url text not null default '',
  store_url text,
  tags text,
  is_visible boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.portfolio_items enable row level security;

create policy "portfolio_read" on public.portfolio_items
  for select using (is_visible or public.is_platform_owner());
create policy "portfolio_write" on public.portfolio_items
  for all using (public.is_platform_owner())
  with check (public.is_platform_owner());

-- ---------- Supabase Storage ----------
-- bucket عام للقراءة، والكتابة للمالك وأعضاء المتجر (ضمن مسار متجرهم)

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('store-assets', 'store-assets', true, 5242880,
  array['image/jpeg','image/png','image/webp','image/gif','image/svg+xml'])
on conflict (id) do nothing;

create policy "store_assets_public_read" on storage.objects
  for select using (bucket_id = 'store-assets');

-- الكتابة: المالك فقط (يرفع نيابة عن المتاجر)
create policy "store_assets_owner_write" on storage.objects
  for insert with check (
    bucket_id = 'store-assets' and public.is_platform_owner()
  );

create policy "store_assets_owner_update" on storage.objects
  for update using (bucket_id = 'store-assets' and public.is_platform_owner());

create policy "store_assets_owner_delete" on storage.objects
  for delete using (bucket_id = 'store-assets' and public.is_platform_owner());

-- ملاحظة: المالك يُهيّئ حساب «مالك المنصة» يدويًا مرة واحدة:
--   1) أنشئ المستخدم من Supabase Dashboard (Authentication → Users)
--   2) نفّذ:
--      update public.profiles set role = 'owner' where email = 'you@maaoun.com';
--
-- المسارات داخل bucket:
--   stores/{store_id}/logo/...
--   stores/{store_id}/cover/...
--   stores/{store_id}/products/...
--   stores/{store_id}/pages/...
--   site/pages/...
