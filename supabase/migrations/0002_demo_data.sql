-- ============================================================
-- معون maaoun.com — بيانات العرض التجريبية لـ Supabase
-- ============================================================
-- المتطلب السابق: تشغيل 0001_init.sql.
--
-- هذا الملف:
--   1) يضيف نفس محتوى الوضع المحلي (المتاجر والمنتجات والباقات...).
--   2) يستخدم UUIDs ثابتة لسهولة ربط حسابات العملاء.
--   3) يمكن تشغيله أكثر من مرة؛ صفوف العرض نفسها تُحدَّث ولا تتكرر.
--   4) لا ينشئ مستخدمي Auth. أنشئهم من Authentication > Users ثم أعد
--      تشغيل قسم «ربط حسابات العملاء» في نهاية الملف.
--
-- حسابات العرض المقترحة:
--   rshaf@demo.com / Rshaf#2026
--   oud@demo.com    / Oud#2026
--
-- تنبيه: هذه بيانات علنية للعرض فقط. غيّر كلمات المرور أو احذف حسابات
-- العرض قبل استخدام المشروع مع عملاء حقيقيين.
-- ============================================================

begin;

-- ------------------------------------------------------------
-- المتاجر
-- ------------------------------------------------------------

insert into public.stores (
  id,
  name,
  subdomain,
  status,
  owner_name,
  owner_phone,
  owner_email,
  whatsapp,
  description,
  logo_url,
  cover_url,
  client_credentials,
  delivered_at,
  created_at,
  updated_at
)
values
  (
    '10000000-0000-4000-8000-000000000001',
    'كافيه رشف',
    'rshaf',
    'delivered',
    'محمد الرشيف',
    '0551112222',
    'rshaf@demo.com',
    '966551112222',
    'قهوة مختصة وحلويات طازجة تُحضَّر بحب وتُوصَّل إلى بابك.',
    '/seed/rshaf-logo.png',
    '/seed/rshaf-cover.jpg',
    null,
    now() - interval '18 days',
    now() - interval '25 days',
    now() - interval '3 days'
  ),
  (
    '10000000-0000-4000-8000-000000000002',
    'عود وروائح',
    'oud',
    'delivered',
    'أحمد العتيبي',
    '0563334444',
    'oud@demo.com',
    '966563334444',
    'متجر عطور وعود فاخر — تشكيلة مختارة من أرقى الروائح.',
    '/seed/p-oud.jpg',
    '/seed/portfolio-perfume.jpg',
    null,
    now() - interval '10 days',
    now() - interval '14 days',
    now() - interval '4 days'
  ),
  (
    '10000000-0000-4000-8000-000000000003',
    'دار رشف للحلويات',
    'sweets',
    'preparing',
    'سارة القحطاني',
    '0507778899',
    'sara@demo.com',
    '966507778899',
    'حلويات فاخرة ومخبوزات يومية.',
    null,
    null,
    null,
    null,
    now() - interval '2 days',
    now() - interval '1 day'
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
  client_credentials = excluded.client_credentials,
  delivered_at = excluded.delivered_at,
  updated_at = excluded.updated_at;

-- بيانات الدخول محفوظة في جدول خاص لا تسمح RLS بقراءته إلا لمالك المنصة.
insert into public.store_credentials (store_id, email, password, updated_at)
values
  (
    '10000000-0000-4000-8000-000000000001',
    'rshaf@demo.com',
    'Rshaf#2026',
    now()
  ),
  (
    '10000000-0000-4000-8000-000000000002',
    'oud@demo.com',
    'Oud#2026',
    now()
  )
on conflict (store_id) do update set
  email = excluded.email,
  password = excluded.password,
  updated_at = excluded.updated_at;

-- ------------------------------------------------------------
-- إعدادات المتاجر
-- ------------------------------------------------------------

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
  seo_title,
  seo_description,
  seo_keywords,
  seo_og_image,
  seo_favicon,
  seo_canonical,
  updated_at
)
values
  (
    '10000000-0000-4000-8000-000000000001',
    'modern',
    'cairo',
    '#8B5E34',
    '#D97706',
    '["hero","categories","products","pages","footer"]'::jsonb,
    'كافيه رشف وجهةٌ لعشّاق القهوة المختصة؛ نختار حبوبنا بعناية ونحضّر مشروباتنا أمامك بحب.',
    'https://instagram.com/rshaf.cafe',
    'rshaf_cafe',
    'https://tiktok.com/@rshaf.cafe',
    '',
    'https://maaoun.com',
    'كافيه رشف | القهوة والحلويات',
    'قهوة مختصة، مشروبات باردة، وحلويات طازجة في كافيه رشف. اطلب الآن عبر واتساب.',
    'قهوة, لاتيه, حلويات, كافيه رشف, قهوة مختصة',
    '/seed/rshaf-cover.jpg',
    '/seed/rshaf-logo.png',
    '',
    now() - interval '3 days'
  ),
  (
    '10000000-0000-4000-8000-000000000002',
    'classic',
    'almarai',
    '#4A2C17',
    '#C2884E',
    '["hero","categories","products","footer"]'::jsonb,
    'في عود وروائح نختار أجود أنواع العود والعطور من شمول تايلاند والهند وفيتنام، بخلطات عريقة.',
    'https://instagram.com/oud.roua3',
    'oud_roua3',
    '',
    '',
    'https://maaoun.com',
    'عود وروائح | عطور وعود فاخر',
    'تشكيلة فاخرة من العود والعطور الأصلية. جودة مضمونة وتسليم سريع.',
    'عود, عطور, عود تايلاند, عطر فاخر',
    '/seed/portfolio-perfume.jpg',
    '',
    '',
    now() - interval '4 days'
  ),
  (
    '10000000-0000-4000-8000-000000000003',
    'modern',
    'tajawal',
    '#BE185D',
    '#F59E0B',
    '["hero","categories","products","footer"]'::jsonb,
    '',
    '',
    '',
    '',
    '',
    'https://maaoun.com',
    'دار رشف للحلويات',
    'حلويات فاخرة ومخبوزات يومية.',
    '',
    '',
    '',
    '',
    now() - interval '1 day'
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
  seo_title = excluded.seo_title,
  seo_description = excluded.seo_description,
  seo_keywords = excluded.seo_keywords,
  seo_og_image = excluded.seo_og_image,
  seo_favicon = excluded.seo_favicon,
  seo_canonical = excluded.seo_canonical,
  updated_at = excluded.updated_at;

-- ------------------------------------------------------------
-- الأقسام
-- ------------------------------------------------------------

insert into public.categories (
  id,
  store_id,
  name,
  slug,
  sort_order,
  is_visible,
  created_at
)
values
  ('20000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'قهوة', 'coffee', 0, true, now() - interval '25 days'),
  ('20000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000001', 'مشروبات باردة', 'cold-drinks', 1, true, now() - interval '25 days'),
  ('20000000-0000-4000-8000-000000000003', '10000000-0000-4000-8000-000000000001', 'حلويات', 'desserts', 2, true, now() - interval '25 days'),
  ('20000000-0000-4000-8000-000000000004', '10000000-0000-4000-8000-000000000002', 'عود', 'oud', 0, true, now() - interval '14 days'),
  ('20000000-0000-4000-8000-000000000005', '10000000-0000-4000-8000-000000000002', 'عطور', 'perfumes', 1, true, now() - interval '14 days'),
  ('20000000-0000-4000-8000-000000000006', '10000000-0000-4000-8000-000000000002', 'هدايا', 'gifts', 2, true, now() - interval '14 days')
on conflict (id) do update set
  store_id = excluded.store_id,
  name = excluded.name,
  slug = excluded.slug,
  sort_order = excluded.sort_order,
  is_visible = excluded.is_visible;

-- ------------------------------------------------------------
-- المنتجات
-- ------------------------------------------------------------

insert into public.products (
  id,
  store_id,
  slug,
  category_id,
  name,
  description,
  price,
  old_price,
  stock,
  is_visible,
  sort_order,
  created_at,
  updated_at
)
values
  (
    '30000000-0000-4000-8000-000000000001',
    '10000000-0000-4000-8000-000000000001',
    'latte',
    '20000000-0000-4000-8000-000000000001',
    'لاتيه',
    'لاتيه بحليب طازج ورغوة حريرية، محضّر بقهوة مختصة ذات طابع إثيوبي.',
    22,
    28,
    50,
    true,
    0,
    now() - interval '20 days',
    now() - interval '5 days'
  ),
  (
    '30000000-0000-4000-8000-000000000002',
    '10000000-0000-4000-8000-000000000001',
    'cappuccino',
    '20000000-0000-4000-8000-000000000001',
    'كابتشينو',
    'كابتشينو متوازن بين جرعة الإسبريسو والحليب المبخّر، مع رشة قرفة اختيارية.',
    20,
    null,
    40,
    true,
    1,
    now() - interval '20 days',
    now() - interval '5 days'
  ),
  (
    '30000000-0000-4000-8000-000000000003',
    '10000000-0000-4000-8000-000000000001',
    'cheesecake-strawberry',
    '20000000-0000-4000-8000-000000000003',
    'شيز كيك الفراولة',
    'شيز كيك نيويورك كريمي مع صوص فراولة طازج.',
    35,
    null,
    15,
    true,
    2,
    now() - interval '20 days',
    now() - interval '5 days'
  ),
  (
    '30000000-0000-4000-8000-000000000004',
    '10000000-0000-4000-8000-000000000001',
    'chocolate-cake',
    '20000000-0000-4000-8000-000000000003',
    'كيك الشوكولاتة',
    'كيك شوكولاتة غني بطبقة غاناش داكن، يُباع بالقطعة.',
    38,
    45,
    20,
    true,
    3,
    now() - interval '20 days',
    now() - interval '5 days'
  ),
  (
    '30000000-0000-4000-8000-000000000005',
    '10000000-0000-4000-8000-000000000002',
    'royal-oud',
    '20000000-0000-4000-8000-000000000004',
    'عود ملكي',
    'عود ملكي من تايلاند معتّق بعناية، برائحة ثابتة وعطرة تدوم.',
    250,
    320,
    12,
    true,
    0,
    now() - interval '12 days',
    now() - interval '5 days'
  ),
  (
    '30000000-0000-4000-8000-000000000006',
    '10000000-0000-4000-8000-000000000002',
    'luxury-perfume-set',
    '20000000-0000-4000-8000-000000000005',
    'طقم عطور فاخر',
    'طقم من ثلاثة عطور عود مختارة في علبة هدية أنيقة.',
    450,
    520,
    8,
    true,
    1,
    now() - interval '12 days',
    now() - interval '5 days'
  ),
  (
    '30000000-0000-4000-8000-000000000007',
    '10000000-0000-4000-8000-000000000002',
    'gift-box',
    '20000000-0000-4000-8000-000000000006',
    'صندوق هدايا مميز',
    'صندوق هدايا يحتوي عودًا ومسكًا وطيبًا فاخرًا، مثالي للإهداء.',
    180,
    null,
    25,
    true,
    2,
    now() - interval '12 days',
    now() - interval '5 days'
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
-- صور المنتجات (الملفات موجودة داخل public/seed في المشروع)
-- ------------------------------------------------------------

insert into public.product_images (
  id,
  product_id,
  store_id,
  url,
  sort_order
)
values
  ('40000000-0000-4000-8000-000000000001', '30000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', '/seed/p-latte.jpg', 0),
  ('40000000-0000-4000-8000-000000000002', '30000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000001', '/seed/p-cappuccino.jpg', 0),
  ('40000000-0000-4000-8000-000000000003', '30000000-0000-4000-8000-000000000003', '10000000-0000-4000-8000-000000000001', '/seed/p-cheesecake.jpg', 0),
  ('40000000-0000-4000-8000-000000000004', '30000000-0000-4000-8000-000000000004', '10000000-0000-4000-8000-000000000001', '/seed/p-choco.jpg', 0),
  ('40000000-0000-4000-8000-000000000005', '30000000-0000-4000-8000-000000000005', '10000000-0000-4000-8000-000000000002', '/seed/p-oud.jpg', 0),
  ('40000000-0000-4000-8000-000000000006', '30000000-0000-4000-8000-000000000006', '10000000-0000-4000-8000-000000000002', '/seed/p-oud.jpg', 0),
  ('40000000-0000-4000-8000-000000000007', '30000000-0000-4000-8000-000000000007', '10000000-0000-4000-8000-000000000002', '/seed/p-gift.jpg', 0)
on conflict (id) do update set
  product_id = excluded.product_id,
  store_id = excluded.store_id,
  url = excluded.url,
  sort_order = excluded.sort_order;

-- ------------------------------------------------------------
-- صفحات المتاجر
-- ------------------------------------------------------------

insert into public.pages (
  id,
  store_id,
  title,
  slug,
  content,
  is_visible,
  sort_order,
  updated_at
)
values
  (
    '50000000-0000-4000-8000-000000000001',
    '10000000-0000-4000-8000-000000000001',
    'من نحن',
    'about',
    E'بدأ كافيه رشف من شغف بسيط بالقهوة المختصة؛ نحمّص حبوبنا أسبوعيًا، ونختار خلطاتنا بعناية.\nنفخر بإعداد كل كوب بعينٍ على التفاصيل، ونسعد بأن نكون جزءًا من صباحك.',
    true,
    0,
    now() - interval '20 days'
  ),
  (
    '50000000-0000-4000-8000-000000000002',
    '10000000-0000-4000-8000-000000000001',
    'سياسة الاستبدال',
    'policies',
    E'للحفاظ على جودة منتجاتنا الطازجة، لا نقبل استبدال المشروبات.\nللحلويات: يمكنك طلب الاستبدال خلال 24 ساعة من الاستلام إذا وصل المنتج غير مطابق.',
    true,
    1,
    now() - interval '20 days'
  ),
  (
    '50000000-0000-4000-8000-000000000003',
    '10000000-0000-4000-8000-000000000002',
    'من نحن',
    'about',
    'عشر سنوات في سوق العود والعطور أكسبتنا ثقة عملائنا؛ نختار الخامات من مصادرها الأصلية ونختبر كل دفعة قبل طرحها.',
    true,
    0,
    now() - interval '14 days'
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
-- إعدادات الموقع العام
-- ------------------------------------------------------------

insert into public.site_settings (
  id,
  whatsapp_number,
  developer_url,
  about_text,
  hero_title,
  hero_subtitle,
  features,
  faq,
  social_instagram,
  social_snapchat,
  social_tiktok,
  updated_at
)
values (
  1,
  '966500000000',
  'https://maaoun.com',
  'معون منصة متكاملة لإنشاء متاجر إلكترونية للعملاء: أنشئ، صمّم، جهّز المنتجات، اضبط SEO، وسلّم المتجر على نطاق فرعي خاص — ثم يدير العميل متجره بنفسه من لوحة تحكم مستقلة.',
  'متجرك الإلكتروني…',
  'أبني لك متجرًا إلكترونيًا متكاملًا على نطاق خاص بك مثل rshaf.maaoun.com — أنشئه وأجهّزه بالكامل وأسلّمه جاهزًا، وأنت تديره من لوحة تحكمك.',
  '[
    {"title":"نطاق فرعي خاص","desc":"كل متجر على نطاق مستقل: name.maaoun.com — بدون شراء دومين."},
    {"title":"تصميم بهوية متجرك","desc":"قوالب، خطوط، وألوان قابلة للتخصيص بالكامل."},
    {"title":"الطلب عبر واتساب","desc":"زر طلب ذكي برسالة جاهزة تتضمن اسم المنتج وسعره."},
    {"title":"SEO محلي","desc":"عناوين ووصف وكلمات مفتاحية عربية محسّنة لكل متجر."},
    {"title":"أمان حقيقي","desc":"عزل كامل لبيانات كل متجر على مستوى قاعدة البيانات (RLS)."},
    {"title":"لوحة تحكم للعميل","desc":"يدير العميل بنفسه المنتجات والأقسام والأسعار والصور."}
  ]'::jsonb,
  '[
    {"q":"هل أحتاج إلى شراء دومين منفصل لمتجري؟","a":"لا. يحصل متجرك على نطاق فرعي مثل name.maaoun.com، ويمكنك ربط دومين خاص لاحقًا إذا رغبت."},
    {"q":"كيف أطلب المتجر؟","a":"تواصل معي عبر زر واتساب في الموقع، وسأتولى إنشاء متجرك وتجهيزه بالكامل."},
    {"q":"هل أستطيع إدارة متجري بنفسي؟","a":"نعم. بعد التسليم تحصل على لوحة تحكم مستقلة تضيف من خلالها المنتجات وتعدّل الأسعار والصور."},
    {"q":"كيف يتم التسليم؟","a":"بعد اكتمال التجهيز والاختبار، أُنشئ لك حسابًا وأرسل لك بيانات الدخول ورابط متجرك."},
    {"q":"هل الطلبات عبر واتساب؟","a":"نعم. عندما يضغط الزبون «اطلب عبر واتساب» تصلك رسالة باسم المنتج وسعره مباشرة."}
  ]'::jsonb,
  'https://instagram.com/maaoun',
  'maaoun',
  'https://tiktok.com/@maaoun',
  now()
)
on conflict (id) do update set
  whatsapp_number = excluded.whatsapp_number,
  developer_url = excluded.developer_url,
  about_text = excluded.about_text,
  hero_title = excluded.hero_title,
  hero_subtitle = excluded.hero_subtitle,
  features = excluded.features,
  faq = excluded.faq,
  social_instagram = excluded.social_instagram,
  social_snapchat = excluded.social_snapchat,
  social_tiktok = excluded.social_tiktok,
  updated_at = excluded.updated_at;

-- ------------------------------------------------------------
-- الباقات
-- ------------------------------------------------------------

insert into public.pricing_plans (
  id,
  name,
  price,
  old_price,
  currency,
  features,
  is_featured,
  is_visible,
  sort_order,
  updated_at
)
values
  (
    '60000000-0000-4000-8000-000000000001',
    'الأساسية',
    299,
    399,
    'ر.س',
    '["متجر على نطاق فرعي","حتى 50 منتجًا","لوحة تحكم كاملة","زر الطلب عبر واتساب","دعم عبر واتساب"]'::jsonb,
    false,
    true,
    0,
    now()
  ),
  (
    '60000000-0000-4000-8000-000000000002',
    'الاحترافية',
    599,
    799,
    'ر.س',
    '["كل مزايا الباقة الأساسية","منتجات غير محدودة","قالب مخصص وهوية ألوان","SEO محلي كامل","أولوية في الدعم","شهر صيانة مجاني"]'::jsonb,
    true,
    true,
    1,
    now()
  ),
  (
    '60000000-0000-4000-8000-000000000003',
    'بريميوم',
    999,
    1299,
    'ر.س',
    '["كل مزايا الباقة الاحترافية","تصميم فريد بالكامل","صفحات مخصصة إضافية","متابعة وتحسين شهري","دعم فوري 7 أيام"]'::jsonb,
    false,
    true,
    2,
    now()
  )
on conflict (id) do update set
  name = excluded.name,
  price = excluded.price,
  old_price = excluded.old_price,
  currency = excluded.currency,
  features = excluded.features,
  is_featured = excluded.is_featured,
  is_visible = excluded.is_visible,
  sort_order = excluded.sort_order,
  updated_at = excluded.updated_at;

-- ------------------------------------------------------------
-- العروض
-- ------------------------------------------------------------

insert into public.offers (
  id,
  title,
  description,
  price,
  old_price,
  currency,
  starts_at,
  ends_at,
  is_active,
  created_at
)
values
  (
    '70000000-0000-4000-8000-000000000001',
    'عرض الإطلاق',
    'أول 3 متاجر هذا الشهر تحصل على الباقة الاحترافية بسعر الباقة الأساسية!',
    299,
    599,
    'ر.س',
    now() - interval '5 days',
    now() + interval '25 days',
    true,
    now() - interval '5 days'
  ),
  (
    '70000000-0000-4000-8000-000000000002',
    'أحِل صديقك',
    'احصل على خصم 100 ر.س عند إحالة عميل يصلنا عن طريقك.',
    0,
    null,
    'ر.س',
    null,
    null,
    true,
    now() - interval '10 days'
  )
on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price = excluded.price,
  old_price = excluded.old_price,
  currency = excluded.currency,
  starts_at = excluded.starts_at,
  ends_at = excluded.ends_at,
  is_active = excluded.is_active;

-- ------------------------------------------------------------
-- معرض الأعمال
-- ------------------------------------------------------------

insert into public.portfolio_items (
  id,
  title,
  description,
  image_url,
  store_url,
  tags,
  is_visible,
  sort_order,
  created_at
)
values
  (
    '80000000-0000-4000-8000-000000000001',
    'كافيه رشف',
    'متجر قهوة مختصة وحلويات بقالب عصري وألوان دافئة.',
    '/seed/rshaf-cover.jpg',
    'https://rshaf.maaoun.com',
    'قهوة, حلويات, متجر طعام',
    true,
    0,
    now() - interval '18 days'
  ),
  (
    '80000000-0000-4000-8000-000000000002',
    'عود وروائح',
    'متجر عطور وعود فاخر بهوية كلاسيكية راقية.',
    '/seed/portfolio-perfume.jpg',
    'https://oud.maaoun.com',
    'عطور, عود, متجر فاخر',
    true,
    1,
    now() - interval '10 days'
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
-- سجل نشاط تجريبي (لا يتكرر عند إعادة التشغيل)
-- ------------------------------------------------------------

insert into public.activity_logs (
  store_id,
  user_id,
  actor_email,
  action,
  details,
  created_at
)
select
  null,
  null,
  coalesce(
    (select email from public.profiles where role = 'owner' order by created_at limit 1),
    'owner@maaoun.com'
  ),
  'store.created',
  '{"store":"10000000-0000-4000-8000-000000000003","name":"دار رشف للحلويات"}'::jsonb,
  now() - interval '2 days'
where not exists (
  select 1
  from public.activity_logs
  where action = 'store.created'
    and details ->> 'store' = '10000000-0000-4000-8000-000000000003'
);

insert into public.activity_logs (
  store_id,
  user_id,
  actor_email,
  action,
  details,
  created_at
)
select
  '10000000-0000-4000-8000-000000000001',
  null,
  coalesce(
    (select email from public.profiles where role = 'owner' order by created_at limit 1),
    'owner@maaoun.com'
  ),
  'product.created',
  '{"name":"كيك الشوكولاتة"}'::jsonb,
  now() - interval '5 days'
where not exists (
  select 1
  from public.activity_logs
  where store_id = '10000000-0000-4000-8000-000000000001'
    and action = 'product.created'
    and details ->> 'name' = 'كيك الشوكولاتة'
);

insert into public.activity_logs (
  store_id,
  user_id,
  actor_email,
  action,
  details,
  created_at
)
select
  demo.store_id,
  null,
  coalesce(
    (select email from public.profiles where role = 'owner' order by created_at limit 1),
    'owner@maaoun.com'
  ),
  'store.delivered',
  jsonb_build_object('subdomain', demo.subdomain),
  now() - demo.age
from (
  values
    ('10000000-0000-4000-8000-000000000001'::uuid, 'rshaf'::text, interval '18 days'),
    ('10000000-0000-4000-8000-000000000002'::uuid, 'oud'::text, interval '10 days')
) as demo(store_id, subdomain, age)
where not exists (
  select 1
  from public.activity_logs log
  where log.store_id = demo.store_id
    and log.action = 'store.delivered'
    and log.details ->> 'subdomain' = demo.subdomain
);

commit;

-- ============================================================
-- ربط حسابات العملاء
-- ============================================================
-- هذا القسم آمن إذا لم تكن الحسابات موجودة بعد: لن يضيف شيئًا.
-- بعد إنشاء الحسابين من Supabase Dashboard، شغّل هذا القسم وحده
-- (أو أعد تشغيل الملف كاملًا) لربط كل حساب بمتجره.
-- ============================================================

insert into public.store_members (store_id, user_id, role)
select demo.store_id, users.id, 'owner'
from (
  values
    ('10000000-0000-4000-8000-000000000001'::uuid, 'rshaf@demo.com'::text),
    ('10000000-0000-4000-8000-000000000002'::uuid, 'oud@demo.com'::text)
) as demo(store_id, email)
join auth.users as users
  on lower(users.email) = demo.email
on conflict (store_id, user_id) do update
set role = excluded.role;

-- تعبئة الأسماء المعروضة إذا أُنشئت الحسابات بدون User Metadata.
update public.profiles as profile
set full_name = demo.full_name
from (
  values
    ('rshaf@demo.com'::text, 'محمد الرشيف'::text),
    ('oud@demo.com'::text, 'أحمد العتيبي'::text)
) as demo(email, full_name)
where lower(profile.email) = demo.email
  and coalesce(profile.full_name, '') = '';
