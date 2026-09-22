-- ============================================================
-- وثبة waathba.com — الترحيل 0005
-- إزالة «تبويبات الأقسام» من ترتيب أقسام الصفحة الرئيسية للمتجر
-- ============================================================
--
-- لماذا هذا الملف؟
--
-- كانت الصفحة الرئيسية للمتجر تعرض شريط تبويبات للأقسام (مثال:
-- «قهوة · مشروبات باردة · حلويات») تحت صورة الغلاف مباشرة. أُزيل هذا
-- القسم من الواجهة (components/store/store-home.tsx)، وبقيت الأقسام
-- نفسها تعمل من:
--   • روابط القائمة العلوية في الهيدر
--   • صفحات /categories/[slug]
--   • أزرار فلترة المنتجات داخل شبكة المنتجات
--
-- لذلك نُنظّف عمود store_settings.section_order من القيمة "categories"
-- حتى لا تبقى قسمًا معطّلًا في لوحة التصميم (ترتيب أقسام الصفحة الرئيسية)،
-- ونضمن في الوقت نفسه بقاء "hero" (صورة الغلاف/البطل) ضمن الترتيب —
-- فغيابها هو سبب اختفاء صورة الغلاف عند بعض المتاجر.
--
-- الملف آمن للتكرار (idempotent) ولا يحذف أي صفوف.
-- نفّذه من Supabase → SQL Editor بعد 0004.
-- ============================================================

-- 1) القيمة الافتراضية للأقسام عند إنشاء متجر جديد
alter table public.store_settings
  alter column section_order set default '["hero","products","pages","footer"]'::jsonb;

-- 2) تنظيف الصفوف الموجودة:
--    • حذف "categories" من المصفوفة
--    • إعادة "hero" إلى المقدمة إن لم تكن موجودة (صورة الغلاف قسم أساسي)
--    • إن أصبحت المصفوفة فارغة نعيد الترتيب الافتراضي
update public.store_settings
set section_order = (
  with items as (
    select t.value, t.ord
    from jsonb_array_elements_text(public.store_settings.section_order)
      with ordinality as t(value, ord)
    where t.value <> 'categories'
  ),
  cleaned as (
    select coalesce(
      jsonb_agg(items.value order by items.ord),
      '[]'::jsonb
    ) as arr
    from items
  )
  select case
    when cleaned.arr = '[]'::jsonb
      then '["hero","products","pages","footer"]'::jsonb
    when cleaned.arr @> '["hero"]'::jsonb
      then cleaned.arr
    else '["hero"]'::jsonb || cleaned.arr
  end
  from cleaned
)
where jsonb_typeof(public.store_settings.section_order) = 'array';

-- 3) أي صف بلا ترتيب صالح (قيمة فارغة أو غير مصفوفة) يأخذ الترتيب الافتراضي
update public.store_settings
set section_order = '["hero","products","pages","footer"]'::jsonb
where jsonb_typeof(section_order) is distinct from 'array';
