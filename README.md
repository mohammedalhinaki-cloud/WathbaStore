# وثبة — WathbaStore

منصة متكاملة لإنشاء وتجهيز وتسليم المتاجر الإلكترونية على **نطاقات فرعية**، مع عزل Multi-Tenant حقيقي على مستوى قاعدة البيانات.

```text
                    wathbastore.com
                           │
              ┌────────────┴────────────┐
              │                         │
       الموقع العام                  /admin
       Landing Page               لوحة المالك (خاصة)
              │                         │
      أعمال · أسعار · عروض        إدارة جميع المتاجر
              │                         │
      ┌───────┼─────────────────────────┼──────────────────┐
      ▼       ▼                         ▼                  ▼
rshaf.wathbastore.com   mohammed.wathbastore.com   … (متاجر العملاء)
      │
      ▼
  لوحة العميل (rshaf.wathbastore.com/admin)
```

---

## البنية الثلاثية

| الجزء | الرابط | لمن؟ |
|---|---|---|
| الموقع العام | `wathbastore.com` | الزوار (خدمات، أعمال، أسعار، عروض، FAQ، واتساب) |
| لوحة المالك | `wathbastore.com/admin` | أنت فقط (إنشاء، تجهيز، اختبار، تسليم، إدارة) |
| متاجر العملاء | `name.wathbastore.com` | زوار كل متجر (منتجات، أقسام، صفحات، واتساب) |
| لوحة العميل | `name.wathbastore.com/admin` | صاحب المتجر فقط (منتجاته، أقسامه، مظهره) |

لا يوجد: تسجيل عام، إنشاء متجر ذاتي، أو شراء دومين لكل عميل.
الدورة: **أنا → أنشئ → أجهّز → أختبر → أسلم → العميل يدير متجره.**

## التقنيات

- **Next.js 15** (App Router) + **TypeScript** + **Tailwind CSS v4**
- **Supabase** (PostgreSQL + Auth + Storage) للإنتاج مع **RLS** كامل
- **SQLite** مدمج (node:sqlite) للوضع التجريبي المحلي بدون أي إعداد
- عربي RTL بالكامل، متجاوب، وSEO مستقل لكل متجر

## التشغيل السريع (الوضع التجريبي)

```bash
npm install
npm run dev
```

افتح `http://localhost:3000` — ستجد بيانات جاهزة:

| الدور | البريد | كلمة المرور |
|---|---|---|
| المالك | `owner@wathbastore.com` | `Wathba#2026` |
| عميل (كافيه رشف) | `rshaf@demo.com` | `Rshaf#2026` |
| عميل (عود وروائح) | `oud@demo.com` | `Oud#2026` |

### محاكاة النطاقات الفرعية في التطوير

بدون DNS، يُحاكى النطاق الفرعي عبر معامل `?store=`:

| النطاق الحقيقي | المكافئ في التطوير |
|---|---|
| `rshaf.wathbastore.com` | `/?store=rshaf` |
| `rshaf.wathbastore.com/products/latte` | `/products/latte?store=rshaf` |
| `rshaf.wathbastore.com/admin` | `/admin?store=rshaf` |
| `wathbastore.com/admin` | `/admin` |

عند النشر على الدومين الحقيقي، يقوم الـ Middleware بقراءة الـ Host تلقائيًا
(`rshaf.wathbastore.com` → متجر رشف فقط) — نفس الكود بدون أي تغيير.

## السيناريو الكامل (كما في المتطلبات)

1. ادخل `wathbastore.com/admin` وسجّل دخولك كمالك.
2. اضغط **إنشاء متجر** → بيانات العميل → اسم المتجر + النطاق الفرعي (مع فحص التوفر فوريًا: يمنع المسافات والرموز والمكرر والمحجوز).
3. اختر التصميم (قالب/خط/ألوان) — يظهر الرابط `rshaf.wathbastore.com` تلقائيًا.
4. من باني المتجر: صمّم، ارفع الشعار والغلاف، أضف الأقسام والمنتجات (صور متعددة)، اضبط الصفحات، SEO، وواتساب المتجر.
5. **معاينة** المتجر مباشرة من أي لحظة.
6. **اختبار** (يغيّر الحالة إلى «جاهز للاختبار» ويفتح المتجر).
7. اضغط **تسليم المتجر** → يُنشأ حساب العميل + تُولَّد كلمة مرور + تتغير الحالة إلى «مسلّم» + تظهر نافذة ببيانات الدخول للتسليم.
8. العميل يدخل على `rshaf.wathbastore.com/admin` ببياناته → يضيف منتجًا → يظهر فورًا في المتجر.
9. العميل **لا يستطيع** الوصول إلى: لوحة المالك، متجر عميل آخر، أو أي إعداد نظام — حتى بتعديل الطلبات يدويًا (التحقق في الخادم + RLS).

## الأمان والعزل (Multi-Tenant)

- **Supabase Auth** للجلسات + **Row Level Security** على كل جدول:
  - `stores`: القراءة = المسلّم للزوار، أو المالك، أو أعضاء المتجر.
  - `products/categories/...`: مرتبطة بـ `store_id` ولا تُقرأ إلا للمتاجر المسلّمة أو لأصحابها.
  - `store_members`: يديره المالك فقط (عند التسليم).
  - `site_settings/pricing_plans/offers/portfolio_items`: قراءة عامة + كتابة للمالك فقط.
- **تحقق مزدوج في الخادم**: كل API route يفحص المستخدم وصلاحياته على `store_id` قبل أي عملية (لا تعتمد الواجهة على إخفاء الأزرار).
- **إعفاءات حقلية**: صاحب المتجر لا يستطيع تعديل النطاق/الحالة/بيانات المالك (ترIGGER `protect_store_fields` يحجبها في Supabase، والتحقق في الخادم في الوضع المحلي).
- **التخزين**: bucket `store-assets` بمسارات معزولة `stores/{store_id}/{logo|cover|products|pages}/...`.
- **حالات المتجر**: مسودة، قيد التجهيز، جاهز للاختبار، جاهز للتسليم، مسلّم، متوقف — المتاجر غير المسلّمة لا يراها الزوار.

## Supabase (الإنتاج)

1. أنشئ مشروعًا في [supabase.com](https://supabase.com) وفعّل `*.wathbastore.com` كـ redirect.
2. شغّل `supabase/migrations/0001_init.sql` (SQL Editor أو CLI) — يجهّز الجداول وRLS والتخزين.
3. أنشئ مستخدمك (Authentication → Users) ثم:
   ```sql
   update public.profiles set role = 'owner' where email = 'you@wathbastore.com';
   ```
4. عبّئ `.env`:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
   SUPABASE_SERVICE_ROLE_KEY=eyJ...   # إنشاء حسابات العملاء عند التسليم
   NEXT_PUBLIC_MAIN_DOMAIN=wathbastore.com
   DEVELOPER_URL=https://wathbastore.com
   ```
5. أشر الدومين: `wathbastore.com` و wildcard `*.wathbastore.com` → استضافتك (مثل Vercel) بـ CNAME/A.

> بدون متغيرات Supabase يعمل النظام تلقائيًا بالوضع التجريبي المحلي (SQLite) — مفيد للتطوير والمعاينة.

## الإعدادات القابلة للتغيير دون كود

| الإعداد | مكانه |
|---|---|
| واتساب وثبة (الموقع العام) | لوحة المالك → الإعدادات |
| واتساب كل متجر | باني المتجر / إعدادات المتجر (العميل يعدّله) |
| **DEVELOPER_URL** (توقيع «تطوير: WathbaStore» أسفل كل متجر) | إعدادات كل متجر أو متغير البيئة — قيمة واحدة |
| النطاق الرئيسي | `NEXT_PUBLIC_MAIN_DOMAIN` |
| الأسعار / العروض / الأعمال / FAQ / المميزات | أقسام لوحة المالك |

## البنية الداخلية

```text
middleware.ts                  → كشف subdomain → x-tenant / x-store-slug
lib/tenant.ts                  → سياق المستأجر
lib/services/                  → الواجهة الموحدة: local.ts (SQLite) + supabase.ts (RLS)
lib/api.ts / authorize.ts      → صلاحيات الخادم لكل API route
app/
  page.tsx                     → Landing (الرئيسي) | Home المتجر (فرعي)
  products/[slug]              → منتج المتجر
  categories/[slug]            → قسم المتجر
  pages/[slug]                 → صفحة نصية للمتجر
  admin/login                  → دخول (مالك / عميل حسب النطاق)
  admin/page.tsx               → الرئيسية (لوحة المالك / لوحة العميل)
  admin/(owner)/…              → متاجر، باني المتجر (8 تبويبات)، عملاء، نطاقات،
                                 أعمال، أسعار، عروض، إعدادات، نشاط
  admin/(client)/…             → منتجات، أقسام، مظهر، سجل
app/api/…                      → REST API موثّق بالصلاحيات لكل مسار
supabase/migrations/0001_init.sql → المخطط + RLS + Storage
```

## الملاحظات

- `public/seed/*` صور توضيحية للمتاجر التجريبية.
- `.data/` قاعدة البيانات المحلية + الصور المرفوعة (مستثناة من Git).
- العملة الافتراضية: ر.س (قابلة للتغيير لكل باقة).
