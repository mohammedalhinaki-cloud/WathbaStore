-- ============================================================
-- معون maaoun.com — الترحيل 0011
-- إضافة متجر العرض «منحل الوثبة» (honey.maaoun.com) كاملًا
-- ============================================================
--
-- لماذا هذا الملف؟
-- متجر عسل ومنتجات نحل فاخر يُعرض في معرض أعمال المنصة كمتجر مسلّم مكتمل،
-- بهوية عنبرية ذهبية على خلفية داكنة. يوازي متجر «دار رشف للحلويات» (0007)
-- لكنه ينشئ صف المتجر نفسه لأنه غير موجود في 0002_demo_data.sql.
--
--   1) المتجر: إنشاء/تحديث → «مسلّم» + شعار وغلاف ووصف.
--   2) بيانات تسليم العميل في store_credentials: honey@demo.com / Honey#2026
--   3) إعدادات كاملة: قالب/خط/ألوان، نص «عن المتجر»، حسابات التواصل،
--      لون الفوتر، ثلاثة آيبانات بنوك **وهمية للعرض**، وSEO كامل.
--   4) أربعة أقسام + عشرة منتجات بصورها + أربع صفحات.
--   5) إدخال في معرض أعمال المنصة (الصفحة الرئيسية maaoun.com).
--   6) سجل نشاط: تسليم المتجر وإضافة منتج.
--   7) ربط حساب العميل (إن كان موجودًا في Auth) بعضوية المتجر.
--
-- الصور المشار إليها موجودة داخل public/seed وتُنشر مع الموقع
-- (honey-logo.png · honey-cover.jpg · h-*.jpg).
--
-- تنبيهات:
--   • الملف آمن للتكرار: كل الإدراجات upsert بمعرّفات ثابتة، بلا أي DELETE.
--   • نفّذه من Supabase → SQL Editor بعد 0010.
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
  '10000000-0000-4000-8000-000000000004',
  'منحل الوثبة',
  'honey',
  'delivered',
  'فيصل النحّال',
  '0553334444',
  'honey@demo.com',
  '966553334444',
  'عسل طبيعي 100% ومنتجات نحل فاخرة من مناحلنا الخاصة — سدر جبلي، سَمُر، طلح، وزهور برية تصلك نقية كما أرادتها الطبيعة.',
  '/seed/honey-logo.png',
  '/seed/honey-cover.jpg',
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
  '10000000-0000-4000-8000-000000000004',
  'honey@demo.com',
  'Honey#2026',
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
  '10000000-0000-4000-8000-000000000004',
  'modern',
  'cairo',
  '#C8860D',
  '#E8B54A',
  '["hero","products","pages","footer"]'::jsonb,
  'في منحل الوثبة نقدّم عسلاً طبيعيًا بنسبة 100% من مناحلنا الخاصة: سدر جبلي، سَمُر، طلح، وزهور برية، إضافةً إلى شمع العسل وغذاء الملكات وحبوب اللقاح والعكبر. نقطف في ذروة النضج، بلا تسخين ولا إضافات، ليصلك العسل نقيًا كما أرادته الطبيعة.',
  'https://instagram.com/wathba.honey',
  'wathba_honey',
  'https://tiktok.com/@wathba.honey',
  '966553334444',
  'https://maaoun.com',
  '#241505',
  'SA0380000000608010167777',
  'SA9211500000012345678933',
  'SA4410000000012345678944',
  'منحل الوثبة | عسل طبيعي ومنتجات نحل فاخرة',
  'عسل سدر جبلي، سَمُر، طلح، وزهور برية طبيعي 100% من مناحلنا الخاصة، مع شمع العسل وغذاء الملكات وحبوب اللقاح والعكبر. اطلب الآن عبر واتساب وتوصيل لكل المملكة.',
  'عسل, عسل سدر, عسل طبيعي, شمع العسل, غذاء ملكات النحل, حبوب اللقاح, عكبر, منحل الوثبة',
  '/seed/honey-cover.jpg',
  '/seed/honey-logo.png',
  'https://honey.maaoun.com',
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
  updated_at = excluded.updated_at;

-- ------------------------------------------------------------
-- 3) الأقسام
-- ------------------------------------------------------------

insert into public.categories (id, store_id, name, slug, sort_order, is_visible, created_at)
values
  ('20000000-0000-4000-8000-000000000011', '10000000-0000-4000-8000-000000000004', 'عسل طبيعي', 'natural-honey', 0, true, now() - interval '3 days'),
  ('20000000-0000-4000-8000-000000000012', '10000000-0000-4000-8000-000000000004', 'عسل مخصوص ومنكّه', 'special-honey', 1, true, now() - interval '3 days'),
  ('20000000-0000-4000-8000-000000000013', '10000000-0000-4000-8000-000000000004', 'منتجات النحل', 'bee-products', 2, true, now() - interval '3 days'),
  ('20000000-0000-4000-8000-000000000014', '10000000-0000-4000-8000-000000000004', 'هدايا ومناسبات', 'gifts', 3, true, now() - interval '3 days')
on conflict (id) do update set
  store_id = excluded.store_id,
  name = excluded.name,
  slug = excluded.slug,
  sort_order = excluded.sort_order,
  is_visible = excluded.is_visible;

-- ------------------------------------------------------------
-- 4) المنتجات
-- ------------------------------------------------------------

insert into public.products (
  id, store_id, slug, category_id, name, description, price, old_price, stock, is_visible, sort_order, created_at, updated_at
)
values
  ('30000000-0000-4000-8000-000000000016', '10000000-0000-4000-8000-000000000004', 'sidr-honey', '20000000-0000-4000-8000-000000000011', 'عسل السدر الجبلي', 'عسل سدر جبلي فاخر مقطوف يدويًا من مناحل الجبال، بلون عنبري داكن وقوام كثيف ونكهة غنية. غذاء ومصدر طاقة طبيعي 100% بلا أي إضافات. العبوة 500غ.', 320, 380, 25, true, 0, now() - interval '3 days', now()),
  ('30000000-0000-4000-8000-000000000017', '10000000-0000-4000-8000-000000000004', 'samar-honey', '20000000-0000-4000-8000-000000000011', 'عسل السَّمُر', 'عسل السَّمُر (السنط) صافٍ بلون ذهبي فاتح ونكهة لطيفة متوازنة، مثالي للاستخدام اليومي مع المشروبات الدافئة. طبيعي ونقي. العبوة 500غ.', 180, null, 30, true, 1, now() - interval '3 days', now()),
  ('30000000-0000-4000-8000-000000000018', '10000000-0000-4000-8000-000000000004', 'talh-honey', '20000000-0000-4000-8000-000000000011', 'عسل الطَّلح', 'عسل الطلح البري بلون أحمر عنبري ونكهة عميقة مميزة، معروف بقيمته الغذائية العالية. يُقطف من أزهار شجر الطلح في موسمه. العبوة 500غ.', 150, 180, 28, true, 2, now() - interval '3 days', now()),
  ('30000000-0000-4000-8000-000000000019', '10000000-0000-4000-8000-000000000004', 'wildflower-honey', '20000000-0000-4000-8000-000000000011', 'عسل الزهور البري', 'عسل زهور بري متعدد المراعي بنكهة زهرية عطرة ولون ذهبي مشرق. اختيار اقتصادي ولذيذ للعائلة. طبيعي بالكامل. العبوة 500غ.', 120, null, 40, true, 3, now() - interval '3 days', now()),
  ('30000000-0000-4000-8000-000000000020', '10000000-0000-4000-8000-000000000004', 'honey-nuts', '20000000-0000-4000-8000-000000000012', 'عسل بالمكسرات الملكي', 'خلطة ملكية من العسل الطبيعي مع اللوز والفستق والجوز والبندق — طاقة ومذاق فاخر في ملعقة واحدة. مثالي للفطور والإهداء. العبوة 400غ.', 210, 250, 20, true, 4, now() - interval '3 days', now()),
  ('30000000-0000-4000-8000-000000000021', '10000000-0000-4000-8000-000000000004', 'honeycomb', '20000000-0000-4000-8000-000000000012', 'قرص شمع العسل الطبيعي', 'قرص شمع عسل طبيعي كامل يُؤكل كما هو، بشمعٍ صافٍ وعسل حبيس داخل خلاياه — أنقى صورة للعسل مباشرة من الخلية. العبوة 400غ.', 140, null, 18, true, 5, now() - interval '3 days', now()),
  ('30000000-0000-4000-8000-000000000022', '10000000-0000-4000-8000-000000000004', 'royal-jelly', '20000000-0000-4000-8000-000000000013', 'غذاء ملكات النحل', 'غذاء ملكات النحل الطازج، مكمّل غذائي طبيعي غني بالعناصر، يُحفظ مبرّدًا. يُؤخذ بكميات صغيرة لدعم الحيوية والمناعة. العبوة 25غ.', 260, 300, 15, true, 6, now() - interval '3 days', now()),
  ('30000000-0000-4000-8000-000000000023', '10000000-0000-4000-8000-000000000004', 'bee-pollen', '20000000-0000-4000-8000-000000000013', 'حبوب لقاح النحل', 'حبوب لقاح طبيعية غنية بالبروتين والفيتامينات، تُضاف إلى العصائر والزبادي والعسل. مصدر طبيعي للطاقة والتغذية. العبوة 200غ.', 95, null, 35, true, 7, now() - interval '3 days', now()),
  ('30000000-0000-4000-8000-000000000024', '10000000-0000-4000-8000-000000000004', 'propolis', '20000000-0000-4000-8000-000000000013', 'العكبر (البروبوليس)', 'مستخلص العكبر (صمغ النحل) بقطارة عملية، معروف بخصائصه الطبيعية الداعمة للمناعة. من إنتاج مناحلنا. العبوة 30مل.', 130, 160, 22, true, 8, now() - interval '3 days', now()),
  ('30000000-0000-4000-8000-000000000025', '10000000-0000-4000-8000-000000000004', 'honey-gift-box', '20000000-0000-4000-8000-000000000014', 'صندوق هدايا العسل الفاخر', 'علبة هدايا أنيقة تضم تشكيلة مختارة: عسل سدر، عسل سمر، قرص شمع، وملعقة عسل خشبية — بتغليف فاخر ورباط ذهبي يليق بمناسباتك.', 450, 520, 12, true, 9, now() - interval '3 days', now())
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

insert into public.product_images (id, product_id, store_id, url, sort_order)
values
  ('40000000-0000-4000-8000-000000000016', '30000000-0000-4000-8000-000000000016', '10000000-0000-4000-8000-000000000004', '/seed/h-sidr.jpg', 0),
  ('40000000-0000-4000-8000-000000000017', '30000000-0000-4000-8000-000000000017', '10000000-0000-4000-8000-000000000004', '/seed/h-samar.jpg', 0),
  ('40000000-0000-4000-8000-000000000018', '30000000-0000-4000-8000-000000000018', '10000000-0000-4000-8000-000000000004', '/seed/h-talh.jpg', 0),
  ('40000000-0000-4000-8000-000000000019', '30000000-0000-4000-8000-000000000019', '10000000-0000-4000-8000-000000000004', '/seed/h-wildflower.jpg', 0),
  ('40000000-0000-4000-8000-000000000020', '30000000-0000-4000-8000-000000000020', '10000000-0000-4000-8000-000000000004', '/seed/h-nuts.jpg', 0),
  ('40000000-0000-4000-8000-000000000021', '30000000-0000-4000-8000-000000000021', '10000000-0000-4000-8000-000000000004', '/seed/h-comb.jpg', 0),
  ('40000000-0000-4000-8000-000000000022', '30000000-0000-4000-8000-000000000022', '10000000-0000-4000-8000-000000000004', '/seed/h-royal-jelly.jpg', 0),
  ('40000000-0000-4000-8000-000000000023', '30000000-0000-4000-8000-000000000023', '10000000-0000-4000-8000-000000000004', '/seed/h-pollen.jpg', 0),
  ('40000000-0000-4000-8000-000000000024', '30000000-0000-4000-8000-000000000024', '10000000-0000-4000-8000-000000000004', '/seed/h-propolis.jpg', 0),
  ('40000000-0000-4000-8000-000000000025', '30000000-0000-4000-8000-000000000025', '10000000-0000-4000-8000-000000000004', '/seed/h-giftbox.jpg', 0)
on conflict (id) do update set
  product_id = excluded.product_id,
  store_id = excluded.store_id,
  url = excluded.url,
  sort_order = excluded.sort_order;

-- ------------------------------------------------------------
-- 5) صفحات المتجر
-- ------------------------------------------------------------

insert into public.pages (id, store_id, title, slug, content, is_visible, sort_order, updated_at)
values
  ('50000000-0000-4000-8000-000000000008', '10000000-0000-4000-8000-000000000004', 'من نحن', 'about', E'منحل الوثبة إرثٌ عائلي في تربية النحل وقطف العسل يمتد لأكثر من عشرين عامًا.\nنمتلك مناحلنا الخاصة ونتنقّل بها خلف مواسم الأزهار من الجبال إلى السهول لنقطف أجود أنواع العسل في ذروة نضجه.\nنبيع ما ننتجه فقط: عسل طبيعي 100% بلا تسخين ولا إضافات ولا تحلية — يصلك كما أخرجته النحلة من الخلية.', true, 0, now() - interval '3 days'),
  ('50000000-0000-4000-8000-000000000009', '10000000-0000-4000-8000-000000000004', 'ضمان الجودة والأصالة', 'quality', E'نضمن لك عسلاً طبيعيًا نقيًا؛ كل دفعة تخضع لفحص المختبر للتأكد من خلوّها من الغش والسكريات المضافة.\nنمنحك ضمان الاستبدال الكامل إذا ثبت أن العسل غير طبيعي — ثقتك أغلى ما نملك.\nنرفق مع الطلبات الكبيرة شهادة تحليل عند الطلب، ونوضّح المصدر والموسم لكل نوع.', true, 1, now() - interval '3 days'),
  ('50000000-0000-4000-8000-000000000010', '10000000-0000-4000-8000-000000000004', 'التوصيل والشحن', 'shipping', E'نشحن لجميع مناطق المملكة خلال 2 إلى 4 أيام عمل عبر شركات شحن موثوقة.\nالتوصيل داخل المدينة خلال 24 ساعة، ومجانًا للطلبات فوق 300 ر.س.\nنغلّف العسل بعناية في عبوات زجاجية محكمة تحفظ جودته أثناء النقل، مع تغليف حراري للطلبات الحساسة كغذاء الملكات.', true, 2, now() - interval '3 days'),
  ('50000000-0000-4000-8000-000000000011', '10000000-0000-4000-8000-000000000004', 'سياسة الاستبدال والاسترجاع', 'policies', E'نستبدل أي منتج يصلك تالفًا أو غير مطابق خلال 48 ساعة من الاستلام.\nنظرًا لطبيعة المنتجات الغذائية، لا نقبل استرجاع العبوات المفتوحة إلا في حال ثبوت عيب في الجودة.\nتذكّر أن تبلور العسل (تحبّبه) ظاهرة طبيعية تدل على أصالته ولا تعني فساده — يعود سائلاً بتدفئته بماء دافئ.', true, 3, now() - interval '3 days')
on conflict (id) do update set
  store_id = excluded.store_id,
  title = excluded.title,
  slug = excluded.slug,
  content = excluded.content,
  is_visible = excluded.is_visible,
  sort_order = excluded.sort_order,
  updated_at = excluded.updated_at;

-- ------------------------------------------------------------
-- 6) معرض الأعمال (الصفحة الرئيسية)
-- ------------------------------------------------------------

insert into public.portfolio_items (id, title, description, image_url, store_url, tags, is_visible, sort_order, created_at)
values (
  '80000000-0000-4000-8000-000000000004',
  'منحل الوثبة',
  'متجر عسل ومنتجات نحل فاخر بهوية عنبرية ذهبية على خلفية داكنة: كتالوج كامل، طلب عبر واتساب، وحسابات تحويل بنكي.',
  '/seed/honey-cover.jpg',
  'https://honey.maaoun.com',
  'عسل, منتجات طبيعية, متجر طعام',
  true,
  3,
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
-- 7) سجل النشاط (لا يتكرر عند إعادة التشغيل)
-- ------------------------------------------------------------

insert into public.activity_logs (store_id, user_id, actor_email, action, details, created_at)
select
  '10000000-0000-4000-8000-000000000004',
  null,
  coalesce(
    (select email from public.profiles where role = 'owner' order by created_at limit 1),
    'owner@maaoun.com'
  ),
  'store.delivered',
  '{"subdomain":"honey"}'::jsonb,
  now() - interval '1 day'
where not exists (
  select 1
  from public.activity_logs log
  where log.store_id = '10000000-0000-4000-8000-000000000004'
    and log.action = 'store.delivered'
);

insert into public.activity_logs (store_id, user_id, actor_email, action, details, created_at)
select
  '10000000-0000-4000-8000-000000000004',
  null,
  coalesce(
    (select email from public.profiles where role = 'owner' order by created_at limit 1),
    'owner@maaoun.com'
  ),
  'product.created',
  '{"name":"عسل السدر الجبلي"}'::jsonb,
  now() - interval '3 days'
where not exists (
  select 1
  from public.activity_logs log
  where log.store_id = '10000000-0000-4000-8000-000000000004'
    and log.action = 'product.created'
    and log.details ->> 'name' = 'عسل السدر الجبلي'
);

-- ------------------------------------------------------------
-- 8) ربط حساب العميل بعضوية المتجر (آمن إن لم يكن الحساب موجودًا)
-- ------------------------------------------------------------

insert into public.store_members (store_id, user_id, role)
select stores.id, users.id, 'owner'
from public.stores as stores
join auth.users as users
  on lower(users.email) = 'honey@demo.com'
where stores.subdomain = 'honey'
on conflict (store_id, user_id) do update
set role = excluded.role;

update public.profiles as profile
set full_name = 'فيصل النحّال'
where lower(profile.email) = 'honey@demo.com'
  and coalesce(profile.full_name, '') = '';

commit;
