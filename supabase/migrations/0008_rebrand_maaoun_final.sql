-- ============================================================
-- معون maaoun.com — توحيد الاسم التجاري في البيانات المخزّنة
--
-- يعيد كتابة أي نص مخزّن ما زال يحمل الاسم السابق «معين» إلى «معون»
-- داخل إعدادات الموقع العام فقط. لا يحذف صفوفًا، ولا يغيّر هيكل
-- الجداول، ولا يمسّ حسابات الدخول أو النطاقات الفرعية أو كلمات المرور.
--
-- ملاحظة: النطاق maaoun.com والمقابض الاجتماعية (instagram.com/maaoun،
-- tiktok.com/@maaoun) صحيحة ومقصودة — لا تُمسّ هنا.
--
-- آمن للتكرار.
-- ============================================================

begin;

update public.site_settings
set
  about_text = replace(coalesce(about_text, ''), 'معين', 'معون'),
  hero_title = replace(coalesce(hero_title, ''), 'معين', 'معون'),
  hero_subtitle = replace(coalesce(hero_subtitle, ''), 'معين', 'معون'),
  features = replace(coalesce(features, '[]'::jsonb)::text, 'معين', 'معون')::jsonb,
  faq = replace(coalesce(faq, '[]'::jsonb)::text, 'معين', 'معون')::jsonb,
  updated_at = now()
where id = 1
  and (
    coalesce(about_text, '') like '%معين%'
    or coalesce(hero_title, '') like '%معين%'
    or coalesce(hero_subtitle, '') like '%معين%'
    or coalesce(features, '[]'::jsonb)::text like '%معين%'
    or coalesce(faq, '[]'::jsonb)::text like '%معين%'
  );

commit;
