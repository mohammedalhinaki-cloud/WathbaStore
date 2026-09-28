-- ============================================================
-- معون — إعدادات SEO للموقع الرئيسي (maaoun.com) — (0013)
-- ------------------------------------------------------------
-- يضيف أعمدة SEO إلى site_settings ليتحكم بها المالك من لوحة
-- الإعدادات (/admin/settings): العنوان والوصف والكلمات المفتاحية،
-- إضافةً إلى شعار المنصة (seo_logo) الذي يظهر في نتائج بحث قوقل
-- عبر البيانات المنظمة (Organization logo)، وصورة المشاركة
-- (Open Graph) والأيقونة (favicon).
--
-- القيم الغائبة تعود تلقائيًا إلى الافتراضي في الكود، فلا يتغيّر
-- ظهور الموقع الحالي قبل ضبط القيم من اللوحة.
--
-- التطبيق على الإنتاج: الصق هذا الملف في Supabase Dashboard ←
-- SQL Editor ← Run. آمن للإعادة (if not exists).
-- ============================================================

alter table public.site_settings
  add column if not exists seo_title text,
  add column if not exists seo_description text,
  add column if not exists seo_keywords text,
  add column if not exists seo_logo text,
  add column if not exists seo_og_image text,
  add column if not exists seo_favicon text;
