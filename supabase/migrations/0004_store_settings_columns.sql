-- ============================================================
-- معون maaoun.com — الترحيل 0004
-- إضافة أعمدة store_settings الناقصة (لون التذييل + بيانات الآيبان)
-- ============================================================
--
-- لماذا هذا الملف؟
--
-- طبقة الخدمة (lib/services/supabase.ts → updateStoreSettings) تكتب هذه
-- الأعمدة الأربعة عند **أي** حفظ لإعدادات المتجر:
--
--     footer_bg_color · iban_rajhi · iban_alinmaa · iban_alahli
--
-- لكنها غير موجودة في مخطط قاعدة الإنتاج (0001_init.sql لم يضمّها أصلًا)،
-- فيرد PostgREST بالخطأ:
--
--     PGRST204 — Could not find the 'footer_bg_color' column of
--     'store_settings' in the schema cache
--
-- والنتيجة: **فشل حفظ الإعدادات والمظهر وSEO والآيبانات** في الإنتاج، من
-- لوحة المالك ومن لوحة صاحب المتجر معًا، برسالة عامة «فشل الحفظ» — مع أن
-- خانة الأخطاء لا تقول السبب. (في الوضع التجريبي المحلي لا يظهر الخطأ لأن
-- مخطط SQLite في lib/local/db.ts يضمّ هذه الأعمدة فعلًا.)
--
-- الملف آمن للتكرار ولا يمسّ أي بيانات موجودة: إضافة أعمدة فقط.
-- نفّذه من Supabase → SQL Editor بعد 0003.
-- ============================================================

alter table public.store_settings
  add column if not exists footer_bg_color text,
  add column if not exists iban_rajhi text,
  add column if not exists iban_alinmaa text,
  add column if not exists iban_alahli text;

-- توثيق الأعمدة (اختياري لكنه مفيد لمن يقرأ المخطط لاحقًا)
comment on column public.store_settings.footer_bg_color is 'لون خلفية تذييل المتجر (HEX)';
comment on column public.store_settings.iban_rajhi is 'آيبان بنك الراجحي';
comment on column public.store_settings.iban_alinmaa is 'آيبان بنك الإنماء';
comment on column public.store_settings.iban_alahli is 'آيبان البنك الأهلي';

-- PostgREST يحتفظ بذاكرة مؤقتة للمخطط؛ هذا الأمر يُجبره على إعادة تحميله
-- فورًا فيظهر الحفظ ناجحًا دون انتظار.
notify pgrst, 'reload schema';
