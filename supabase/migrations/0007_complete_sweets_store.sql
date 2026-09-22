-- ============================================================
-- معين maaoun.com — الترحيل 0007
-- إكمال متجر «دار رشف للحلويات» (sweets.maaoun.com) نهائيًا لعرضه في معرض الأعمال
-- ============================================================
--
-- لماذا هذا الملف؟
-- متجر النطاق الفرعي sweets كان موجودًا بحالة «preparing» وبلا محتوى (بدون
-- شعار ولا غلاف ولا منتجات ولا صفحات ولا روابط تواصل ولا حسابات بنكية)، فيظهر
-- للزائر شبه فارغ. هذا الملف يُكمِله ليصبح متجر عرض مكتملًا:
--
--   1) حالة المتجر → «مسلّم» + شعار وغلاف ووصف مُنسّق.
--   2) بيانات تسليم العميل في store_credentials: sara@demo.com / Sara#2026
--   3) إعدادات كاملة: قالب وخط وألوان، نص «عن المتجر»، حسابات التواصل
--      (إنستغرام/سناب/تيك توك/واتساب)، لون الفوتر، ثلاثة آيبانات بنوك
--      **وهمية للعرض**، وSEO كامل (عنوان/وصف/كلمات/OG/أيقونة/Canonical).
--   4) أربعة أقسام + ثمانية منتجات بصورها + أربع صفحات.
--   5) إدخال في معرض أعمال المنصة (الصفحة الرئيسية maaoun.com).
--   6) سجل نشاط: تسليم المتجر وإضافة منتجات.
--   7) ربط حساب العميل (إن كان موجودًا في Auth) بعضوية المتجر.
--
-- الصور المشار إليها موجودة داخل public/seed في المستودع وتُنشر مع الموقع
-- (sweets-logo.png · sweets-cover.jpg · s-*.jpg).
--
-- تنبيهات:
--   • الملف آمن للتكرار: كل الإدراجات upsert بمعرّفات ثابتة، والتحديثات
--     مشروطة، ولا يوجد أي DELETE.
--   • نفّذه من Supabase → SQL Editor بعد 0006.
--   • إن أعدت تشغيل 0002_demo_data.sql لأي سبب فأعد تشغيل هذا الملف بعده
--     (0002 يعيد صف المتجر والإعدادات إلى قيم العرض الأولى).
--   • الآيبانات أدناه **وهمية تمامًا** (نمط SA + 22 خانة ليمرّ تحقق صفحة
--     إتمام الطلب) — لا تربطها بأي حساب حقيقي.
-- ============================================================

begin;

-- ------------------------------------------------------------
-- 1) المتجر: تسليم + هوية بصرية
-- ------------------------------------------------------------

update public.stores
set
  status = 'delivered',
  delivered_at = coalesce(delivered_at, now() - interval '1 day'),
  logo_url = '/seed/sweets-logo.png',
  cover_url = '/seed/sweets-cover.jpg',
  description = 'حلويات شرقية وغربية فاخرة تُصنع طازجة يوميًا — كنافة، بقلاوة، كيك، ومخبوزات تصلك إلى بابك ومناسباتك.',
  updated_at = now()
where subdomain = 'sweets';

-- ------------------------------------------------------------
-- 2) بيانات تسليم العميل (تظهر لمالك المنصة في لوحة التسليم)
-- ------------------------------------------------------------

insert into public.store_credentials (store_id, email, password, updated_at)
select id, 'sara@demo.com', 'Sara#2026', now()
from public.stores
where subdomain = 'sweets'
on conflict (store_id) do update set
  email = excluded.email,
  password = excluded.password,
  updated_at = excluded.updated_at;

-- ------------------------------------------------------------
-- 3) إعدادات المتجر: التصميم + التواصل + البنوك + SEO
-- ------------------------------------------------------------
-- الألوان: توتي غامق (#9F1239) + ذهبي (#D4AF37) وفوتر عنّابي (#450A1A).
-- الآيبانات وهمية للعرض فقط (SA + 22 رقمًا).

insert into public.store_settings (
  store_id,
  template,
  font,
  primary_color,
  secondary_color,
  section_order,
  about_text,
  social_instagram,
  social_snapchat,
  social_tiktok,
  social_whatsapp,
  developer_url,
  footer_bg_color,
  iban_rajhi,
  iban_alinmaa,
  iban_alahli,
  seo_title,
  seo_description,
  seo_keywords,
  seo_og_image,
  seo_favicon,
  seo_canonical,
  updated_at
)
select
  id,
  'modern',
  'tajawal',
  '#9F1239',
  '#D4AF37',
  '["hero","products","pages","footer"]'::jsonb,
  'في دار رشف نصنع الحلويات بشغف يتجاوز عشر سنوات: كنافة وبقلاوة وبسبوسة على الطريقة الأصيلة، وكيك وتشيز كيك بأسلوب عصري. نختار السمن البلدي والفستق الحلبي والشوكولاتة البلجيكية، ونخبز يوميًا بكميات محدودة ليصلك كل شيء طازجًا.',
  'https://instagram.com/rshaf.sweets',
  'rshaf_sweets',
  'https://tiktok.com/@rshaf.sweets',
  '966507778899',
  'https://maaoun.com',
  '#450A1A',
  'SA0380000000608010167519',
  'SA9211500000012345678901',
  'SA4410000000012345678902',
  'دار رشف للحلويات | حلويات شرقية وغربية فاخرة',
  'كنافة وبقلاوة وبسبوسة طازجة، كيك وتشيز كيك، ومخبوزات يومية من دار رشف للحلويات. اطلب الآن عبر واتساب وتوصيل لجميع الأحياء.',
  'حلويات, كنافة, بقلاوة, بسبوسة, كيك, تشيز كيك, مخبوزات, دار رشف',
  '/seed/sweets-cover.jpg',
  '/seed/sweets-logo.png',
  'https://sweets.maaoun.com',
  now()
from public.stores
where subdomain = 'sweets'
on conflict (store_id) do update set
  template = excluded.template,
  font = excluded.font,
  primary_color = excluded.primary_color,
  secondary_color = excluded.secondary_color,
  section_order = excluded.section_order,
  about_text = excluded.about_text,
  social_instagram = excluded.social_instagram,
  social_snapchat = excluded.social_snapchat,
  social_tiktok = excluded.social_tiktok,
  social_whatsapp = excluded.social_whatsapp,
  developer_url = excluded.developer_url,
  footer_bg_color = excluded.footer_bg_color,
  iban_rajhi = excluded.iban_rajhi,
  iban_alinmaa = excluded.iban_alinmaa,
  iban_alahli = excluded.iban_alahli,
  seo_title = excluded.seo_title,
  seo_description = excluded.seo_description,
  seo_keywords = excluded.seo_keywords,
  seo_og_image = excluded.seo_og_image,
  seo_favicon = excluded.seo_favicon,
  seo_canonical = excluded.seo_canonical,
  updated_at = excluded.updated_at;

-- ------------------------------------------------------------
-- 4) الأقسام
-- ------------------------------------------------------------

insert into public.categories (id, store_id, name, slug, sort_order, is_visible, created_at)
values
  ('20000000-0000-4000-8000-000000000007', '10000000-0000-4000-8000-000000000003', 'حلويات شرقية', 'eastern-sweets', 0, true, now() - interval '2 days'),
  ('20000000-0000-4000-8000-000000000008', '10000000-0000-4000-8000-000000000003', 'كيك وتورت', 'cakes', 1, true, now() - interval '2 days'),
  ('20000000-0000-4000-8000-000000000009', '10000000-0000-4000-8000-000000000003', 'مخبوزات', 'bakery', 2, true, now() - interval '2 days'),
  ('20000000-0000-4000-8000-000000000010', '10000000-0000-4000-8000-000000000003', 'هدايا ومناسبات', 'gifts', 3, true, now() - interval '2 days')
on conflict (id) do update set
  store_id = excluded.store_id,
  name = excluded.name,
  slug = excluded.slug,
  sort_order = excluded.sort_order,
  is_visible = excluded.is_visible;

-- ------------------------------------------------------------
-- 5) المنتجات
-- ------------------------------------------------------------

insert into public.products (
  id, store_id, slug, category_id, name, description,
  price, old_price, stock, is_visible, sort_order, created_at, updated_at
)
values
  (
    '30000000-0000-4000-8000-000000000008',
    '10000000-0000-4000-8000-000000000003',
    'kunafa-nabulsia',
    '20000000-0000-4000-8000-000000000007',
    'كنافة نابلسية بالجبن',
    'كنافة نابلسية أصيلة: عجينة شعيرية مقرمشة، جبن عكاوي مطاطي، قطر خفيف، وفستق حلبي. تُقدَّم دافئة.',
    45, 55, 20, true, 0,
    now() - interval '2 days', now() - interval '1 day'
  ),
  (
    '30000000-0000-4000-8000-000000000009',
    '10000000-0000-4000-8000-000000000003',
    'baklava-pistachio',
    '20000000-0000-4000-8000-000000000007',
    'بقلاوة بالفستق الحلبي',
    'طبقات رقيقة من عجينة الفيلو محشوة بالفستق الحلبي، مخبوزة بالسمن البلدي ومسقاة بالقطر.',
    60, null, 15, true, 1,
    now() - interval '2 days', now() - interval '1 day'
  ),
  (
    '30000000-0000-4000-8000-000000000010',
    '10000000-0000-4000-8000-000000000003',
    'basbousa-ashta',
    '20000000-0000-4000-8000-000000000007',
    'بسبوسة بالقشطة',
    'بسبوسة سميد طرية مغطاة بالقشطة الطازجة، مزينة باللوز والقطر الخفيف.',
    38, null, 25, true, 2,
    now() - interval '2 days', now() - interval '1 day'
  ),
  (
    '30000000-0000-4000-8000-000000000011',
    '10000000-0000-4000-8000-000000000003',
    'belgian-chocolate-cake',
    '20000000-0000-4000-8000-000000000008',
    'كيك الشوكولاتة البلجيكية',
    'طبقات غنية من كيك الكاكاو مع غاناش الشوكولاتة البلجيكية الداكنة وبروش شوكولاتة.',
    55, 70, 12, true, 3,
    now() - interval '2 days', now() - interval '1 day'
  ),
  (
    '30000000-0000-4000-8000-000000000012',
    '10000000-0000-4000-8000-000000000003',
    'berry-cheesecake',
    '20000000-0000-4000-8000-000000000008',
    'تشيز كيك التوت الأحمر',
    'تشيز كيك نيويورك كريمي مع صوص التوت الأحمر الطبيعي وحبات توت طازجة.',
    48, null, 14, true, 4,
    now() - interval '2 days', now() - interval '1 day'
  ),
  (
    '30000000-0000-4000-8000-000000000013',
    '10000000-0000-4000-8000-000000000003',
    'cinnamon-roll',
    '20000000-0000-4000-8000-000000000009',
    'سينابون بالقرفة',
    'لفائف سينابون هشة بقرفة سيلانية مع تغليفة جبن كريمي ذائبة.',
    25, null, 30, true, 5,
    now() - interval '2 days', now() - interval '1 day'
  ),
  (
    '30000000-0000-4000-8000-000000000014',
    '10000000-0000-4000-8000-000000000003',
    'oatmeal-cookies',
    '20000000-0000-4000-8000-000000000009',
    'كوكيز الشوفان والزبيب',
    'كوكيز مقرمش من الخارج وطري من الداخل، بشوفان كامل وزبيب ومحلّى قليلًا بدبس التمر.',
    20, null, 40, true, 6,
    now() - interval '2 days', now() - interval '1 day'
  ),
  (
    '30000000-0000-4000-8000-000000000015',
    '10000000-0000-4000-8000-000000000003',
    'sweets-gift-box',
    '20000000-0000-4000-8000-000000000010',
    'صندوق هدايا دار رشف',
    'علبة هدايا فاخرة بتشكيلة مختارة: بقلاوة، كاسات كنافة، وتمور مغلّفة بالشوكولاتة — بعلبة أنيقة ورباط ذهبي.',
    120, 150, 10, true, 7,
    now() - interval '2 days', now() - interval '1 day'
  )
on conflict (id) do update set
  store_id = excluded.store_id,
  slug = excluded.slug,
  category_id = excluded.category_id,
  name = excluded.name,
  description = excluded.description,
  price = excluded.price,
  old_price = excluded.old_price,
  stock = excluded.stock,
  is_visible = excluded.is_visible,
  sort_order = excluded.sort_order,
  updated_at = excluded.updated_at;

-- ------------------------------------------------------------
-- 6) صور المنتجات (الملفات داخل public/seed في المستودع)
-- ------------------------------------------------------------

insert into public.product_images (id, product_id, store_id, url, sort_order)
values
  ('40000000-0000-4000-8000-000000000008', '30000000-0000-4000-8000-000000000008', '10000000-0000-4000-8000-000000000003', '/seed/s-kunafa.jpg', 0),
  ('40000000-0000-4000-8000-000000000009', '30000000-0000-4000-8000-000000000009', '10000000-0000-4000-8000-000000000003', '/seed/s-baklava.jpg', 0),
  ('40000000-0000-4000-8000-000000000010', '30000000-0000-4000-8000-000000000010', '10000000-0000-4000-8000-000000000003', '/seed/s-basbousa.jpg', 0),
  ('40000000-0000-4000-8000-000000000011', '30000000-0000-4000-8000-000000000011', '10000000-0000-4000-8000-000000000003', '/seed/s-choco-cake.jpg', 0),
  ('40000000-0000-4000-8000-000000000012', '30000000-0000-4000-8000-000000000012', '10000000-0000-4000-8000-000000000003', '/seed/s-cheesecake-berry.jpg', 0),
  ('40000000-0000-4000-8000-000000000013', '30000000-0000-4000-8000-000000000013', '10000000-0000-4000-8000-000000000003', '/seed/s-cinnamon.jpg', 0),
  ('40000000-0000-4000-8000-000000000014', '30000000-0000-4000-8000-000000000014', '10000000-0000-4000-8000-000000000003', '/seed/s-cookies.jpg', 0),
  ('40000000-0000-4000-8000-000000000015', '30000000-0000-4000-8000-000000000015', '10000000-0000-4000-8000-000000000003', '/seed/s-giftbox.jpg', 0)
on conflict (id) do update set
  product_id = excluded.product_id,
  store_id = excluded.store_id,
  url = excluded.url,
  sort_order = excluded.sort_order;

-- ------------------------------------------------------------
-- 7) صفحات المتجر
-- ------------------------------------------------------------

insert into public.pages (id, store_id, title, slug, content, is_visible, sort_order, updated_at)
values
  (
    '50000000-0000-4000-8000-000000000004',
    '10000000-0000-4000-8000-000000000003',
    'من نحن',
    'about',
    E'بدأت دار رشف للحلويات من مطبخ منزلي صغير عام 2014، وكبرت بثقة عملائها حتى أصبحت دار حلويات متكاملة.\nنحضّر كل صباح حلوياتنا طازجة: شرقية بالسمن البلدي والفستق الحلبي، وغربية بالشوكولاتة البلجيكية والكريمة الطبيعية.\nوعدنا لكم: جودة ثابتة، حلاوة متوازنة، وتقديم أنيق يليق بمناسباتكم.',
    true, 0, now() - interval '2 days'
  ),
  (
    '50000000-0000-4000-8000-000000000005',
    '10000000-0000-4000-8000-000000000003',
    'التوصيل والشحن',
    'shipping',
    E'نوصّل يوميًا داخل المدينة من 4 عصرًا حتى 11 مساءً.\nالتوصيل داخل المدينة: 15 ر.س — ومجانًا للطلبات فوق 150 ر.س.\nطلبات الكيك والمناسبات تحتاج تجهيزًا مسبقًا 48 ساعة.\nتصلك الحلويات في علب مبرّدة تحفظ طراوتها حتى الاستلام.',
    true, 1, now() - interval '2 days'
  ),
  (
    '50000000-0000-4000-8000-000000000006',
    '10000000-0000-4000-8000-000000000003',
    'سياسة الاستبدال والاسترجاع',
    'policies',
    E'جودة منتجاتنا مسؤوليتنا: إذا وصلك منتج تالف أو غير مطابق للطلب نستبدله أو نعيد قيمته خلال 24 ساعة.\nلا نقبل الاسترجاع لتغيّر الرأي في المنتجات الطازجة لأنها تُحضَّر حسب الطلب، لكن رضاكم غايتنا دائمًا.\nلديك حساسية غذائية؟ نبّهنا عند الطلب — جميع منتجاتنا قد تحتوي مكسرات أو غلوتين أو ألبان.',
    true, 2, now() - interval '2 days'
  ),
  (
    '50000000-0000-4000-8000-000000000007',
    '10000000-0000-4000-8000-000000000003',
    'مناسبات وأفراح',
    'occasions',
    E'نستقبل طلبات الأفراح والخطوبات والتخرج وهدايا الشركات بكميات من 50 إلى 2000 قطعة.\nيشمل كل طلب: تذوق مجاني قبل التأكيد، تصميم خاص بألوان مناسبتك، وبطاقات مطبوعة باسمكم.\nللاستفسار وطلب عرض سعر تواصلوا معنا عبر واتساب أو إنستغرام.',
    true, 3, now() - interval '2 days'
  )
on conflict (id) do update set
  store_id = excluded.store_id,
  title = excluded.title,
  slug = excluded.slug,
  content = excluded.content,
  is_visible = excluded.is_visible,
  sort_order = excluded.sort_order,
  updated_at = excluded.updated_at;

-- ------------------------------------------------------------
-- 8) معرض أعمال المنصة (الصفحة الرئيسية maaoun.com)
-- ------------------------------------------------------------

insert into public.portfolio_items (
  id, title, description, image_url, store_url, tags, is_visible, sort_order, created_at
)
values
  (
    '80000000-0000-4000-8000-000000000003',
    'دار رشف للحلويات',
    'متجر حلويات شرقية وغربية بهوية توتية ذهبية: كتالوج كامل، طلب عبر واتساب، وحسابات تحويل بنكي.',
    '/seed/sweets-cover.jpg',
    'https://sweets.maaoun.com',
    'حلويات, مناسبات, متجر طعام',
    true,
    2,
    now() - interval '1 day'
  )
on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  image_url = excluded.image_url,
  store_url = excluded.store_url,
  tags = excluded.tags,
  is_visible = excluded.is_visible,
  sort_order = excluded.sort_order;

-- ------------------------------------------------------------
-- 9) سجل النشاط (لا يتكرر عند إعادة التشغيل)
-- ------------------------------------------------------------

insert into public.activity_logs (store_id, user_id, actor_email, action, details, created_at)
select
  '10000000-0000-4000-8000-000000000003',
  null,
  coalesce(
    (select email from public.profiles where role = 'owner' order by created_at limit 1),
    'owner@maaoun.com'
  ),
  'store.delivered',
  '{"subdomain":"sweets"}'::jsonb,
  now() - interval '1 day'
where not exists (
  select 1
  from public.activity_logs log
  where log.store_id = '10000000-0000-4000-8000-000000000003'
    and log.action = 'store.delivered'
);

insert into public.activity_logs (store_id, user_id, actor_email, action, details, created_at)
select
  '10000000-0000-4000-8000-000000000003',
  null,
  coalesce(
    (select email from public.profiles where role = 'owner' order by created_at limit 1),
    'owner@maaoun.com'
  ),
  'product.created',
  '{"name":"كنافة نابلسية بالجبن"}'::jsonb,
  now() - interval '2 days'
where not exists (
  select 1
  from public.activity_logs log
  where log.store_id = '10000000-0000-4000-8000-000000000003'
    and log.action = 'product.created'
    and log.details ->> 'name' = 'كنافة نابلسية بالجبن'
);

-- ------------------------------------------------------------
-- 10) ربط حساب العميل بعضوية المتجر (آمن إن لم يكن الحساب موجودًا)
-- ------------------------------------------------------------

insert into public.store_members (store_id, user_id, role)
select stores.id, users.id, 'owner'
from public.stores as stores
join auth.users as users
  on lower(users.email) = 'sara@demo.com'
where stores.subdomain = 'sweets'
on conflict (store_id, user_id) do update
set role = excluded.role;

update public.profiles as profile
set full_name = 'سارة القحطاني'
where lower(profile.email) = 'sara@demo.com'
  and coalesce(profile.full_name, '') = '';

commit;
