-- ============================================================
-- معون maaoun.com — الترحيل 0012
-- إضافة متجر «أسرة منتجة» للفطائر البيتية (osra.maaoun.com) كاملًا
-- ============================================================
--
-- لماذا هذا الملف؟
-- متجر أسرة منتجة متخصص في الفطائر البيتية (جبن، زعتر، سبانخ، لحم بعجين،
-- دجاج بالكريمة) مع صواني المناسبات وعبوات الفطائر المجمّدة، بهوية زيتونية
-- دافئة. يوازي متجري «دار رشف للحلويات» (0007) و«منحل الوثبة» (0011).
--
--   1) المتجر: إنشاء/تحديث → «مسلّم» + شعار وغلاف ووصف.
--   2) بيانات تسليم العميل في store_credentials: osra@demo.com / Osra#2026
--   3) إعدادات كاملة: قالب/خط/ألوان، نص «عن المتجر»، حسابات التواصل،
--      لون الفوتر، ثلاثة آيبانات بنوك **وهمية للعرض**، وSEO كامل.
--   4) أربعة أقسام + تسعة منتجات بصورها + أربع صفحات.
--   5) إدخال في معرض أعمال المنصة (الصفحة الرئيسية maaoun.com).
--   6) سجل نشاط: إنشاء المتجر وإضافة منتج وتسليمه.
--   7) ربط حساب العميل (إن كان موجودًا في Auth) بعضوية المتجر.
--
-- الصور المشار إليها موجودة داخل public/seed وتُنشر مع الموقع
-- (osra-logo.png · osra-cover.jpg · o-p-*.jpg).
--
-- تنبيهات:
--   • الملف آمن للتكرار: كل الإدراجات upsert بمعرّفات ثابتة، بلا أي DELETE.
--   • نفّذه من Supabase → SQL Editor بعد 0011.
--   • الآيبانات أدناه **وهمية تمامًا** (نمط SA + 22 خانة) — لا تربطها بحساب حقيقي.
-- ============================================================

begin;

-- ------------------------------------------------------------
-- 1) المتجر: إنشاء + تسليم + هوية بصرية
-- ------------------------------------------------------------

insert into public.stores (
  id, name, subdomain, status, owner_name, owner_phone, owner_email,
  whatsapp, description, logo_url, cover_url, client_credentials,
  delivered_at, created_at, updated_at
)
values (
  '10000000-0000-4000-8000-000000000005',
  'أسرة منتجة',
  'osra',
  'delivered',
  'أم عبدالله الحربي',
  '0561234567',
  'osra@demo.com',
  '966561234567',
  'فطائر بيتية طازجة تُخبز يوميًا: جبن، زعتر، سبانخ، ولحم بعجين — مع صواني المناسبات وفطائر مجمّدة جاهزة للخبز.',
  '/seed/osra-logo.png',
  '/seed/osra-cover.jpg',
  null,
  now() - interval '1 day',
  now() - interval '3 days',
  now()
)
on conflict (id) do update set
  name = excluded.name,
  subdomain = excluded.subdomain,
  status = excluded.status,
  owner_name = excluded.owner_name,
  owner_phone = excluded.owner_phone,
  owner_email = excluded.owner_email,
  whatsapp = excluded.whatsapp,
  description = excluded.description,
  logo_url = excluded.logo_url,
  cover_url = excluded.cover_url,
  delivered_at = coalesce(public.stores.delivered_at, excluded.delivered_at),
  updated_at = now();

-- بيانات الدخول (يقرؤها مالك المنصة فقط عبر RLS).
insert into public.store_credentials (store_id, email, password, updated_at)
values (
  '10000000-0000-4000-8000-000000000005',
  'osra@demo.com',
  'Osra#2026',
  now()
)
on conflict (store_id) do update set
  email = excluded.email,
  password = excluded.password,
  updated_at = excluded.updated_at;

-- ------------------------------------------------------------
-- 2) إعدادات المتجر
-- ------------------------------------------------------------

insert into public.store_settings (
  store_id, template, font, primary_color, secondary_color, section_order,
  about_text, social_instagram, social_snapchat, social_tiktok, social_whatsapp,
  developer_url, footer_bg_color, iban_rajhi, iban_alinmaa, iban_alahli,
  seo_title, seo_description, seo_keywords, seo_og_image, seo_favicon, seo_canonical,
  updated_at
)
values (
  '10000000-0000-4000-8000-000000000005',
  'modern',
  'cairo',
  '#6B7F4B',
  '#C77B4E',
  '["hero","products","pages","footer"]'::jsonb,
  '«أسرة منتجة» مطبخ بيتي متخصص في الفطائر: جبن، زعتر، سبانخ، لحم بعجين، ودجاج بالكريمة — عجينة تُعجن يوميًا وحشوات طازجة بلا مواد حافظة. نجهّز كذلك صواني المناسبات وعبوات الفطائر المجمّدة الجاهزة للخبز في بيتك.',
  'https://instagram.com/osra.fatayer',
  'osra_fatayer',
  'https://tiktok.com/@osra.fatayer',
  '966561234567',
  'https://maaoun.com',
  '#2F3323',
  'SA0380000000608010167888',
  'SA9211500000012345678955',
  'SA4410000000012345678966',
  'أسرة منتجة | فطائر بيتية طازجة وصواني مناسبات',
  'فطائر بيتية طازجة: جبن، زعتر، سبانخ، لحم بعجين، ودجاج بالكريمة، مع صواني المناسبات وفطائر مجمّدة جاهزة للخبز. اطلب عبر واتساب وتوصيل داخل المدينة.',
  'فطائر, فطاير بيتية, مناقيش زعتر, لحم بعجين, فطائر جبن, صواني مناسبات, أسرة منتجة, مخبوزات منزلية',
  '/seed/osra-cover.jpg',
  '/seed/osra-logo.png',
  'https://osra.maaoun.com',
  now()
)
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
  updated_at = now();

-- ------------------------------------------------------------
-- 3) الأقسام
-- ------------------------------------------------------------

insert into public.categories (id, store_id, name, slug, sort_order, is_visible, created_at)
values
  ('20000000-0000-4000-8000-000000000051', '10000000-0000-4000-8000-000000000005', 'فطائر بالجبن والزعتر', 'fatayer', 0, true, now() - interval '3 days'),
  ('20000000-0000-4000-8000-000000000052', '10000000-0000-4000-8000-000000000005', 'فطائر محشية', 'savory-pies', 1, true, now() - interval '3 days'),
  ('20000000-0000-4000-8000-000000000053', '10000000-0000-4000-8000-000000000005', 'صواني المناسبات', 'party-trays', 2, true, now() - interval '3 days'),
  ('20000000-0000-4000-8000-000000000054', '10000000-0000-4000-8000-000000000005', 'فطائر مجمّدة', 'frozen', 3, true, now() - interval '3 days')
on conflict (id) do update set
  name = excluded.name,
  slug = excluded.slug,
  sort_order = excluded.sort_order,
  is_visible = true;

-- ------------------------------------------------------------
-- 4) المنتجات + صورها
-- ------------------------------------------------------------

insert into public.products (
  id, store_id, category_id, slug, name, description,
  price, old_price, stock, is_visible, sort_order, created_at, updated_at
)
values
  ('30000000-0000-4000-8000-000000000051', '10000000-0000-4000-8000-000000000005', '20000000-0000-4000-8000-000000000051', 'cheese-fatayer', 'فطائر الجبن',
   'فطائر جبن طازجة تُخبز في بيتنا يوميًا بعجينة هشة وحشوة جبن غنية بالقشطة والموزاريلا. تُقدَّم دافئة للفطور والعزائم. الطلبية 12 حبة.',
   30, 36, 40, true, 0, now() - interval '3 days', now()),
  ('30000000-0000-4000-8000-000000000052', '10000000-0000-4000-8000-000000000005', '20000000-0000-4000-8000-000000000051', 'zaatar-manakish', 'مناقيش الزعتر',
   'مناقيش زعتر بلدي معجون بزيت زيتون أصلي على عجينة رقيقة مخبوزة في الفرن. مثالية لفطور الصباح أو مع الشاي. الطلبية 10 أقراص.',
   25, null, 50, true, 1, now() - interval '3 days', now()),
  ('30000000-0000-4000-8000-000000000053', '10000000-0000-4000-8000-000000000005', '20000000-0000-4000-8000-000000000052', 'spinach-fatayer', 'فطائر السبانخ',
   'فطائر سبانخ مثلثة بحشوة سبانخ طازجة مع البصل والسماق وقليل من الليمون — حشوة متوازنة وعجينة خفيفة. الطلبية 12 حبة.',
   32, 38, 35, true, 2, now() - interval '3 days', now()),
  ('30000000-0000-4000-8000-000000000054', '10000000-0000-4000-8000-000000000005', '20000000-0000-4000-8000-000000000052', 'lahm-bi-ajeen', 'لحم بعجين',
   'أقراص لحم بعجين بلحم بقري طازج مفروم يوميًا مع الطماطم والبقدونس والبهارات البيتية. تُخبز على حرارة عالية لتبقى طرية. الطلبية 10 أقراص.',
   45, 52, 30, true, 3, now() - interval '3 days', now()),
  ('30000000-0000-4000-8000-000000000055', '10000000-0000-4000-8000-000000000005', '20000000-0000-4000-8000-000000000052', 'chicken-pies', 'فطائر الدجاج بالكريمة',
   'فطائر محشية صدور دجاج مقطعة مع صلصة كريمة وفطر وبهارات خفيفة، مزيّنة بالسمسم. وجبة عشاء سريعة ومحبوبة للأطفال. الطلبية 12 حبة.',
   40, null, 28, true, 4, now() - interval '3 days', now()),
  ('30000000-0000-4000-8000-000000000056', '10000000-0000-4000-8000-000000000005', '20000000-0000-4000-8000-000000000052', 'potato-pies', 'فطائر البطاطس',
   'فطائر بحشوة بطاطس مهروسة بالبصل والكزبرة والبهارات — خيار نباتي مشبع ولذيذ يناسب رحلات المدرسة والعمل. الطلبية 12 حبة.',
   28, null, 32, true, 5, now() - interval '3 days', now()),
  ('30000000-0000-4000-8000-000000000057', '10000000-0000-4000-8000-000000000005', '20000000-0000-4000-8000-000000000051', 'mini-pizza', 'ميني بيتزا منزلية',
   'بيتزا صغيرة بحجم اللقمة بصلصة طماطم بيتية وجبن موزاريلا وزيتون وفلفل — تُخبز طازجة يوم الطلب. الطلبية 12 حبة.',
   38, 45, 26, true, 6, now() - interval '3 days', now()),
  ('30000000-0000-4000-8000-000000000058', '10000000-0000-4000-8000-000000000005', '20000000-0000-4000-8000-000000000053', 'mixed-tray', 'صينية فطائر مشكّلة',
   'صينية مناسبات تضم 40 قطعة مشكّلة: جبن، زعتر، سبانخ، ولحم بعجين — مغلّفة وجاهزة للتقديم في العزائم والمناسبات العائلية.',
   120, 140, 15, true, 7, now() - interval '3 days', now()),
  ('30000000-0000-4000-8000-000000000059', '10000000-0000-4000-8000-000000000005', '20000000-0000-4000-8000-000000000054', 'frozen-pies', 'فطائر مجمّدة جاهزة للخبز',
   'عبوة فطائر نيّة مجمّدة (24 قطعة مشكّلة) تحفظينها في الفريزر وتخبزينها وقت ما تشائين خلال 15 دقيقة — طازجة كأنها من الفرن مباشرة.',
   55, 65, 24, true, 8, now() - interval '3 days', now())
on conflict (id) do update set
  category_id = excluded.category_id,
  slug = excluded.slug,
  name = excluded.name,
  description = excluded.description,
  price = excluded.price,
  old_price = excluded.old_price,
  stock = excluded.stock,
  is_visible = true,
  sort_order = excluded.sort_order,
  updated_at = now();

insert into public.product_images (id, product_id, store_id, url, sort_order)
values
  ('40000000-0000-4000-8000-000000000051', '30000000-0000-4000-8000-000000000051', '10000000-0000-4000-8000-000000000005', '/seed/o-p-cheese.jpg', 0),
  ('40000000-0000-4000-8000-000000000052', '30000000-0000-4000-8000-000000000052', '10000000-0000-4000-8000-000000000005', '/seed/o-p-zaatar.jpg', 0),
  ('40000000-0000-4000-8000-000000000053', '30000000-0000-4000-8000-000000000053', '10000000-0000-4000-8000-000000000005', '/seed/o-p-spinach.jpg', 0),
  ('40000000-0000-4000-8000-000000000054', '30000000-0000-4000-8000-000000000054', '10000000-0000-4000-8000-000000000005', '/seed/o-p-lahm.jpg', 0),
  ('40000000-0000-4000-8000-000000000055', '30000000-0000-4000-8000-000000000055', '10000000-0000-4000-8000-000000000005', '/seed/o-p-chicken.jpg', 0),
  ('40000000-0000-4000-8000-000000000056', '30000000-0000-4000-8000-000000000056', '10000000-0000-4000-8000-000000000005', '/seed/o-p-potato.jpg', 0),
  ('40000000-0000-4000-8000-000000000057', '30000000-0000-4000-8000-000000000057', '10000000-0000-4000-8000-000000000005', '/seed/o-p-pizza.jpg', 0),
  ('40000000-0000-4000-8000-000000000058', '30000000-0000-4000-8000-000000000058', '10000000-0000-4000-8000-000000000005', '/seed/o-p-mixed.jpg', 0),
  ('40000000-0000-4000-8000-000000000059', '30000000-0000-4000-8000-000000000059', '10000000-0000-4000-8000-000000000005', '/seed/o-p-frozen.jpg', 0)
on conflict (id) do update set
  url = excluded.url,
  sort_order = excluded.sort_order;

-- ------------------------------------------------------------
-- 5) الصفحات
-- ------------------------------------------------------------

insert into public.pages (id, store_id, title, slug, content, is_visible, sort_order, updated_at)
values
  ('50000000-0000-4000-8000-000000000051', '10000000-0000-4000-8000-000000000005', 'من نحن', 'about',
   E'«أسرة منتجة» مشروع بيتي صغير بدأ من مطبخ العائلة قبل خمس سنوات بصينية فطائر للجيران.\nاليوم نخبز يوميًا بكميات محدودة: عجينة تُعجن في نفس اليوم، حشوات طازجة، وزيت زيتون أصلي بلا أي مواد حافظة.\nنؤمن أن الطعم البيتي لا يُقلَّد، ولذلك لا نخبز إلا ما نقدّمه لأهلنا على مائدتنا.',
   true, 0, now()),
  ('50000000-0000-4000-8000-000000000052', '10000000-0000-4000-8000-000000000005', 'كيف أطلب؟', 'order',
   E'١) اختاري المنتج من المتجر واضغطي «اطلب عبر واتساب».\n٢) تصلنا رسالتك باسم المنتج والكمية، ونؤكّد لك الطلب ووقت التسليم.\n٣) نستقبل الطلبات قبل يوم من موعد الاستلام، وطلبات المناسبات قبل يومين على الأقل.\nالطلب الواحد يبدأ من 50 ر.س، والدفع نقدًا عند الاستلام أو تحويلًا بنكيًا.',
   true, 1, now()),
  ('50000000-0000-4000-8000-000000000053', '10000000-0000-4000-8000-000000000005', 'التوصيل والاستلام', 'delivery',
   E'التوصيل داخل المدينة يوميًا من 8 صباحًا حتى 12 ظهرًا، ومساءً من 5 إلى 8.\nرسوم التوصيل 15 ر.س داخل الأحياء القريبة، ومجانًا للطلبات فوق 200 ر.س.\nيمكنك أيضًا الاستلام من البيت بموعد مسبق، وتُسلَّم الفطائر ساخنة في علب كرتونية مخصّصة تحافظ على قرمشتها.',
   true, 2, now()),
  ('50000000-0000-4000-8000-000000000054', '10000000-0000-4000-8000-000000000005', 'السلامة الغذائية والاسترجاع', 'quality',
   E'نلتزم بالنظافة الكاملة في التحضير: مكونات طازجة يوميًا، أدوات معقّمة، وتغليف محكم عند التسليم.\nالفطائر المخبوزة تُستهلك خلال 24 ساعة، والمجمّدة تبقى صالحة شهرًا كاملًا في الفريزر.\nلطبيعة المنتجات الغذائية لا نقبل الاسترجاع بعد الاستلام، لكننا نستبدل أي طلب يصل غير مطابق أو تالفًا خلال ساعتين من التسليم.',
   true, 3, now())
on conflict (id) do update set
  title = excluded.title,
  slug = excluded.slug,
  content = excluded.content,
  is_visible = true,
  sort_order = excluded.sort_order,
  updated_at = now();

-- ------------------------------------------------------------
-- 6) معرض أعمال المنصة
-- ------------------------------------------------------------

insert into public.portfolio_items (
  id, title, description, image_url, store_url, tags, is_visible, sort_order, created_at
)
values (
  '80000000-0000-4000-8000-000000000005',
  'أسرة منتجة',
  'متجر فطائر بيتية لأسرة منتجة بهوية زيتونية دافئة: كتالوج فطائر وصواني مناسبات، طلب عبر واتساب، وحسابات تحويل بنكي.',
  '/seed/osra-cover.jpg',
  'https://osra.maaoun.com',
  'فطائر, مأكولات بيتية, أسرة منتجة',
  true,
  4,
  now() - interval '1 day'
)
on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  image_url = excluded.image_url,
  store_url = excluded.store_url,
  tags = excluded.tags,
  is_visible = true,
  sort_order = excluded.sort_order;

-- ------------------------------------------------------------
-- 7) ربط حساب العميل بعضوية المتجر (إن وُجد في Auth)
-- ------------------------------------------------------------

insert into public.store_members (store_id, user_id, role)
select stores.id, users.id, 'owner'
from public.stores as stores
join auth.users as users
  on lower(users.email) = 'osra@demo.com'
where stores.subdomain = 'osra'
on conflict (store_id, user_id) do update
set role = excluded.role;

update public.profiles as profile
set full_name = 'أم عبدالله الحربي'
where lower(profile.email) = 'osra@demo.com'
  and coalesce(profile.full_name, '') = '';

-- ------------------------------------------------------------
-- 8) سجل النشاط
-- ------------------------------------------------------------

insert into public.activity_logs (store_id, user_id, actor_email, action, details, created_at)
select '10000000-0000-4000-8000-000000000005', null,
  coalesce((select email from public.profiles where role = 'owner' order by created_at limit 1), 'owner@maaoun.com'),
  'store.delivered',
       '{"subdomain":"osra"}'::jsonb, now() - interval '1 day'
where not exists (
  select 1 from public.activity_logs
  where store_id = '10000000-0000-4000-8000-000000000005' and action = 'store.delivered'
);

insert into public.activity_logs (store_id, user_id, actor_email, action, details, created_at)
select '10000000-0000-4000-8000-000000000005', null,
  coalesce((select email from public.profiles where role = 'owner' order by created_at limit 1), 'owner@maaoun.com'),
  'product.created',
       '{"name":"فطائر الجبن"}'::jsonb, now() - interval '2 days'
where not exists (
  select 1 from public.activity_logs
  where store_id = '10000000-0000-4000-8000-000000000005' and action = 'product.created'
);

commit;
