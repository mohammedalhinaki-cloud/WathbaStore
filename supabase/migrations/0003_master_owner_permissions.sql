-- ============================================================
-- معون maaoun.com — الترحيل 0003
-- «المالك الرئيسي» Master Owner: صلاحيات كاملة على كل المتاجر
-- + إصلاح صلاحيات كتابة التخزين (Supabase Storage) لأعضاء المتاجر
-- + إصلاح/إنشاء خزنة الصور store-assets إن كانت ناقصة
-- ============================================================
--
-- لماذا هذا الملف؟
--
-- 1) العقد الأساسي في المنصة: المالك الرئيسي (profiles.role = 'owner')
--    يملك **كل** صلاحيات صاحب المتجر على **كل** متجر — وأعلى منها
--    (إنشاء/تسليم/تغيير النطاق/تغيير الحالة/حذف). لا توجد أي وظيفة
--    يستطيع صاحب المتجر تنفيذها في متجره ولا يستطيع المالك تنفيذها.
--
--    هذا الملف يعيد تأكيد السياسات (policies) كتابةً صريحةً لتفادي أي
--    نسخة قديمة من قاعدة البيانات كانت تمنع المالك من الكتابة، وليكون
--    المرجع الموثوق للصلاحيات في مكان واحد.
--
-- 2) رفع الصور: كانت الكتابة في التخزين محصورة بالمالك فقط من جهة RLS
--    (store_assets_owner_write)، بينما كان مسار الرفع في الخادم يستخدم
--    المفتاح السري (service key) — وهو مفتاح غير مطلوب منطقيًا لرفع
--    صاحب المتجر لصور متجره. الآن: كل رفع يمر بجلسة المستخدم نفسه،
--    وRLS تحدده بدقة:
--      • المالك الرئيسي → يكتب في أي مسار داخل الخزنة.
--      • صاحب المتجر   → يكتب فقط داخل stores/<معرّف متجره>/...
--    فيعمل رفع الصور حتى لو لم يُضبط SUPABASE_SECRET_KEY على الخادم.
--
-- 3) خزنة store-assets: نضمن وجودها وإعدادها (عامة القراءة، 5MB، أنواع
--    الصور المسموحة) — لأن غيابها هو أحد أسباب رسالة «فشل الرفع».
--
-- الملف آمن للتكرار (idempotent) ولا يحذف أي بيانات: DDL + تهيئة الخزنة فقط.
-- نفّذه من Supabase → SQL Editor مرة واحدة.
-- ============================================================

-- ------------------------------------------------------------
-- 1) دوال الصلاحيات
-- ------------------------------------------------------------

-- هل المستخدم الحالي هو المالك الرئيسي للمنصة؟
-- security definer: لقراءة profiles دون كشفها للجداول الأخرى،
-- مع تثبيت search_path (حماية من اختطاف المسار).
create or replace function public.is_master_owner()
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

-- توافق: الاسم القديم المستخدم في سياسات 0001 يشير إلى نفس المعنى الآن.
create or replace function public.is_platform_owner()
returns boolean
language plpgsql stable security definer set search_path = public
as $$
begin
  return public.is_master_owner();
end;
$$;

-- عضو المتجر (القاعدة: المالك الرئيسي عضو في كل المتاجر منطقيًا،
-- لكننا لا نخلط المفهومين: العضوية صفوف حقيقية في store_members،
-- والمالك يكفيه is_master_owner في كل السياسات).
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

-- هل يملك المستخدم الحالي صلاحية إدارة هذا المتجر؟
-- (المالك الرئيسي: نعم دائمًا — أي متجر، أي حالة. العضو: متجره فقط)
create or replace function public.can_manage_store(p_store uuid)
returns boolean
language plpgsql stable security definer set search_path = public
as $$
begin
  return public.is_master_owner() or public.is_store_member(p_store);
end;
$$;

-- معرّف المتجر من مسار ملف في التخزين: stores/<store_id>/<folder>/<file>
-- يُرجع null إن لم يكن المسار على الشكل الصحيح (مثل stores/site/... للأصول العامة).
create or replace function public.storage_store_id(object_name text)
returns uuid
language plpgsql stable
as $$
declare
  parts text[];
  candidate text;
begin
  if object_name is null then
    return null;
  end if;
  parts := storage.foldername(object_name);
  if parts is null or array_length(parts, 1) is null or parts[1] <> 'stores' then
    return null;
  end if;
  candidate := parts[2];
  if candidate is null or candidate !~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$' then
    return null;
  end if;
  return candidate::uuid;
exception
  when others then
    return null;
end;
$$;

-- ------------------------------------------------------------
-- 2) stores — الكتابة للمالك الرئيسي دائمًا (أي حالة: preparing/delivered/…)
-- ------------------------------------------------------------

drop policy if exists "stores_select" on public.stores;
create policy "stores_select" on public.stores
  for select using (
    status = 'delivered'
    or public.is_master_owner()
    or public.is_store_member(id)
  );

drop policy if exists "stores_insert" on public.stores;
create policy "stores_insert" on public.stores
  for insert with check (public.is_master_owner());

drop policy if exists "stores_update" on public.stores;
create policy "stores_update" on public.stores
  for update using (public.can_manage_store(id))
  with check (public.can_manage_store(id));

drop policy if exists "stores_delete" on public.stores;
create policy "stores_delete" on public.stores
  for delete using (public.is_master_owner());

-- حماية الحقول الحساسة: تُقيّد **عضو المتجر** فقط، ولا تُقيّد المالك الرئيسي
-- إطلاقًا — فيستطيع تغيير النطاق الفرعي والحالة وبيانات العميل حتى بعد التسليم.
create or replace function public.protect_store_fields()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  if auth.uid() is not null and not public.is_master_owner() then
    -- إعفاءات حقلية لصاحب المتجر (لا تمسّ المالك الرئيسي)
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

drop trigger if exists protect_store_fields on public.stores;
create trigger protect_store_fields
  before update on public.stores
  for each row execute function public.protect_store_fields();

-- ------------------------------------------------------------
-- 3) store_settings / categories / products / product_images / pages
--    قراءة وكتابة للمالك الرئيسي ولعضو المتجر (عزله في متجره فقط)
-- ------------------------------------------------------------

drop policy if exists "settings_select" on public.store_settings;
create policy "settings_select" on public.store_settings
  for select using (
    exists (select 1 from public.stores s where s.id = store_id and s.status = 'delivered')
    or public.is_master_owner()
    or public.is_store_member(store_id)
  );

drop policy if exists "settings_insert" on public.store_settings;
create policy "settings_insert" on public.store_settings
  for insert with check (public.can_manage_store(store_id));

drop policy if exists "settings_update" on public.store_settings;
create policy "settings_update" on public.store_settings
  for update using (public.can_manage_store(store_id))
  with check (public.can_manage_store(store_id));

drop policy if exists "categories_select" on public.categories;
create policy "categories_select" on public.categories
  for select using (
    exists (select 1 from public.stores s where s.id = store_id and s.status = 'delivered')
    or public.is_master_owner()
    or public.is_store_member(store_id)
  );

drop policy if exists "categories_write" on public.categories;
create policy "categories_write" on public.categories
  for all using (public.can_manage_store(store_id))
  with check (public.can_manage_store(store_id));

drop policy if exists "products_select" on public.products;
create policy "products_select" on public.products
  for select using (
    exists (select 1 from public.stores s where s.id = store_id and s.status = 'delivered')
    or public.is_master_owner()
    or public.is_store_member(store_id)
  );

drop policy if exists "products_write" on public.products;
create policy "products_write" on public.products
  for all using (public.can_manage_store(store_id))
  with check (public.can_manage_store(store_id));

drop policy if exists "images_select" on public.product_images;
create policy "images_select" on public.product_images
  for select using (
    exists (select 1 from public.stores s where s.id = store_id and s.status = 'delivered')
    or public.is_master_owner()
    or public.is_store_member(store_id)
  );

drop policy if exists "images_write" on public.product_images;
create policy "images_write" on public.product_images
  for all using (public.can_manage_store(store_id))
  with check (public.can_manage_store(store_id));

drop policy if exists "pages_select" on public.pages;
create policy "pages_select" on public.pages
  for select using (
    exists (select 1 from public.stores s where s.id = store_id and s.status = 'delivered')
    or public.is_master_owner()
    or public.is_store_member(store_id)
  );

drop policy if exists "pages_write" on public.pages;
create policy "pages_write" on public.pages
  for all using (public.can_manage_store(store_id))
  with check (public.can_manage_store(store_id));

-- ------------------------------------------------------------
-- 4) activity_logs — الكتابة بجلسة المستخدم (لا مفتاح سري)
--    المالك: أي متجر | العضو: متجره فقط
-- ------------------------------------------------------------

drop policy if exists "logs_select" on public.activity_logs;
create policy "logs_select" on public.activity_logs
  for select using (
    public.is_master_owner()
    or (store_id is not null and public.is_store_member(store_id))
  );

drop policy if exists "logs_insert" on public.activity_logs;
create policy "logs_insert" on public.activity_logs
  for insert with check (
    auth.uid() is not null
    and (
      store_id is null
      or public.can_manage_store(store_id)
    )
  );

-- ------------------------------------------------------------
-- 5) store_members — المالك الرئيسي يدير العضوية (تسليم/إصلاح)
-- ------------------------------------------------------------

drop policy if exists "members_select" on public.store_members;
create policy "members_select" on public.store_members
  for select using (
    public.is_master_owner()
    or user_id = auth.uid()
  );

drop policy if exists "members_write" on public.store_members;
create policy "members_write" on public.store_members
  for all using (public.is_master_owner())
  with check (public.is_master_owner());

-- ------------------------------------------------------------
-- 6) Supabase Storage — خزنة store-assets
-- ------------------------------------------------------------

-- نضمن وجود الخزنة وإعدادها الصحيح (غيابها/كونها خاصة = «فشل الرفع»)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'store-assets',
  'store-assets',
  true,
  5242880,
  array['image/jpeg','image/png','image/webp','image/gif','image/svg+xml']
)
on conflict (id) do update set
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = excluded.allowed_mime_types;

-- قراءة عامة (الخزنة عامة أصلًا، وهذه السياسة تحفظ التوافق للقراءة المباشرة)
drop policy if exists "store_assets_public_read" on storage.objects;
create policy "store_assets_public_read" on storage.objects
  for select using (bucket_id = 'store-assets');

-- الكتابة: المالك الرئيسي في أي مسار داخل الخزنة
drop policy if exists "store_assets_owner_write" on storage.objects;
drop policy if exists "store_assets_master_write" on storage.objects;
create policy "store_assets_master_write" on storage.objects
  for insert with check (
    bucket_id = 'store-assets' and public.is_master_owner()
  );

drop policy if exists "store_assets_owner_update" on storage.objects;
drop policy if exists "store_assets_master_update" on storage.objects;
create policy "store_assets_master_update" on storage.objects
  for update using (bucket_id = 'store-assets' and public.is_master_owner())
  with check (bucket_id = 'store-assets' and public.is_master_owner());

drop policy if exists "store_assets_owner_delete" on storage.objects;
drop policy if exists "store_assets_master_delete" on storage.objects;
create policy "store_assets_master_delete" on storage.objects
  for delete using (bucket_id = 'store-assets' and public.is_master_owner());

-- الكتابة: صاحب المتجر — داخل مسار متجره فقط stores/<store_id>/...
drop policy if exists "store_assets_member_write" on storage.objects;
create policy "store_assets_member_write" on storage.objects
  for insert with check (
    bucket_id = 'store-assets'
    and public.storage_store_id(name) is not null
    and public.is_store_member(public.storage_store_id(name))
  );

drop policy if exists "store_assets_member_update" on storage.objects;
create policy "store_assets_member_update" on storage.objects
  for update using (
    bucket_id = 'store-assets'
    and public.storage_store_id(name) is not null
    and public.is_store_member(public.storage_store_id(name))
  )
  with check (
    bucket_id = 'store-assets'
    and public.storage_store_id(name) is not null
    and public.is_store_member(public.storage_store_id(name))
  );

drop policy if exists "store_assets_member_delete" on storage.objects;
create policy "store_assets_member_delete" on storage.objects
  for delete using (
    bucket_id = 'store-assets'
    and public.storage_store_id(name) is not null
    and public.is_store_member(public.storage_store_id(name))
  );

-- ملاحظة ختامية عن النطاق:
--   stores/{store_id}/logo|cover|products|pages/... → المالك + صاحب المتجر المعني
--   stores/site/pages/...                          → المالك الرئيسي فقط (صور الموقع العام)
--   site/pages/...                                 → المالك الرئيسي فقط
