# نشر وثبة على Supabase وVercel

هذا الدليل ينشر المنصة مع بيانات عربية تجريبية جاهزة. لا يلزم رفع صور إلى Supabase؛ صور العرض موجودة أصلًا في `public/seed` وتُنشر مع تطبيق Next.js.

> **تنبيه الخطة:** تصلح خطة Vercel Hobby للعرض أو الاستخدام الشخصي غير التجاري. راجع خطة Vercel المناسبة قبل تشغيل خدمة تجارية مدفوعة.

## 1) إنشاء مشروع Supabase

1. افتح [Supabase](https://supabase.com/dashboard) وأنشئ مشروعًا جديدًا.
2. احتفظ بكلمة مرور قاعدة البيانات في مدير كلمات مرور؛ لا تضفها إلى Git.
3. افتح **SQL Editor** وأنشئ استعلامًا جديدًا.
4. الصق محتوى `supabase/migrations/0001_init.sql` كاملًا ثم اضغط **Run**.
5. يجب أن ينتهي التنفيذ بلا أخطاء. ينشئ الملف الجداول وسياسات RLS وbucket باسم `store-assets`.

## 2) إنشاء حسابات الدخول

من **Authentication → Users → Add user** أنشئ الحسابات التالية، مع تفعيل تأكيد البريد إن ظهر الخيار:

| الاستخدام | البريد | كلمة المرور |
|---|---|---|
| مالك المنصة | بريدك الحقيقي | كلمة مرور قوية خاصة بك |
| عرض متجر رشف | `rshaf@demo.com` | `Rshaf#2026` |
| عرض متجر عود وروائح | `oud@demo.com` | `Oud#2026` |

حوّل حسابك فقط إلى مالك للمنصة من **SQL Editor**، بعد استبدال البريد:

```sql
update public.profiles
set role = 'owner'
where lower(email) = lower('you@example.com');
```

تحقق من أن صفًا واحدًا فقط تغير:

```sql
select email, role from public.profiles order by created_at;
```

## 3) تحميل البيانات التجريبية

1. افتح استعلامًا جديدًا في **SQL Editor**.
2. الصق محتوى `supabase/migrations/0002_demo_data.sql` كاملًا.
3. اضغط **Run**.

الملف قابل لإعادة التشغيل، ويضيف:

- 3 متاجر: **كافيه رشف** و**عود وروائح** و**دار رشف للحلويات**.
- 6 أقسام و7 منتجات وصورها.
- صفحات المتاجر وإعدادات التصميم وSEO.
- 3 باقات وعرضين وعملين في معرض الأعمال.
- ربط حسابَي العرض بمتجريهما تلقائيًا إذا أُنشئا في الخطوة السابقة.

تحقق من النتيجة:

```sql
select subdomain, name, status from public.stores order by created_at;

select s.subdomain, u.email, m.role
from public.store_members m
join public.stores s on s.id = m.store_id
join auth.users u on u.id = m.user_id
order by s.subdomain;
```

يجب أن يعرض الاستعلام الثاني عضويتين: `rshaf@demo.com` و`oud@demo.com`.

> إذا شغّلت `0002_demo_data.sql` قبل إنشاء حسابَي العرض، أنشئهما ثم أعد تشغيل قسم **ربط حسابات العملاء** الموجود في نهاية الملف، أو أعد تشغيل الملف كاملًا.

## 4) نسخ مفاتيح Supabase

من نافذة **Connect** أو **Settings → API Keys** انسخ:

1. **Project URL**.
2. **Publishable key**، ويبدأ عادةً بـ `sb_publishable_`.
3. **Secret key**، ويبدأ عادةً بـ `sb_secret_`.

المفتاح السري يتجاوز RLS، لذلك:

- ضعه في متغير خادم فقط.
- لا تضعه في متغير يبدأ بـ `NEXT_PUBLIC_`.
- لا تلصقه في المحادثات أو Git أو لقطات الشاشة.

يدعم المشروع أيضًا اسمي `anon` و`service_role` القديمين للتوافق، لكن المفاتيح الحديثة هي الموصى بها.

## 5) استيراد المشروع في Vercel

1. افتح [vercel.com/new](https://vercel.com/new) وسجّل الدخول باستخدام GitHub.
2. استورد المستودع `mohammedalhinaki-cloud/WathbaStore`.
3. اختر فرع الإنتاج `main` بعد دمج التغييرات.
4. سيكتشف Vercel إطار **Next.js** تلقائيًا؛ اترك أوامر البناء الافتراضية.
5. أضف متغيرات البيئة التالية إلى **Production** و**Preview**:

| الاسم | القيمة |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL من Supabase |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Publishable key |
| `SUPABASE_SECRET_KEY` | Secret key — خادم فقط |
| `NEXT_PUBLIC_MAIN_DOMAIN` | `wathbastore.com` |
| `DEVELOPER_URL` | `https://wathbastore.com` |

إذا استخدمت المفاتيح القديمة بدلًا من الحديثة، استخدم الاسمين التاليين:

| الاسم القديم المدعوم | القيمة |
|---|---|
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Legacy anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Legacy service_role key |

لا تضف الحديث والقديم معًا؛ اختر مجموعة واحدة فقط.

6. اضغط **Deploy**.
7. إذا أضفت أو عدّلت متغيرًا بعد أول نشر، نفّذ **Redeploy** كي يصل إلى التطبيق.

## 6) الاختبار على نطاق `vercel.app`

افترض أن رابط النشر هو `https://your-project.vercel.app`:

| الصفحة | الرابط |
|---|---|
| الموقع العام | `https://your-project.vercel.app/` |
| لوحة المالك | `https://your-project.vercel.app/admin` |
| متجر رشف | `https://your-project.vercel.app/?store=rshaf` |
| لوحة رشف | `https://your-project.vercel.app/admin?store=rshaf` |
| متجر عود وروائح | `https://your-project.vercel.app/?store=oud` |
| لوحة عود وروائح | `https://your-project.vercel.app/admin?store=oud` |

بيانات العرض:

- رشف: `rshaf@demo.com` / `Rshaf#2026`
- عود وروائح: `oud@demo.com` / `Oud#2026`

اختبر على الأقل:

1. ظهور الصفحة العامة والباقات والأعمال.
2. ظهور منتجات المتجرين وصور المنتجات.
3. دخول مالك المنصة إلى `/admin`.
4. دخول كل عميل إلى لوحة متجره فقط.
5. إضافة منتج تجريبي ثم ظهوره في واجهة المتجر.
6. رفع صورة والتأكد من ظهورها بعد تحديث الصفحة.

## 7) ربط النطاق وWildcard

لجعل `rshaf.wathbastore.com` و`oud.wathbastore.com` يعملان مباشرة:

1. في Vercel افتح **Project → Settings → Domains**.
2. أضف `wathbastore.com`.
3. أضف `*.wathbastore.com`.
4. طبّق سجلات DNS التي يعرضها Vercel. أسهل إعداد للـ wildcard هو استخدام nameservers الخاصة بـ Vercel؛ وإن أبقيت مزود DNS خارجيًا فاتبع تعليمات تفويض `_acme-challenge` التي يعرضها Vercel.
5. انتظر حتى تصبح حالة النطاقين **Valid Configuration** وتصدر شهادات HTTPS.
6. اجعل `wathbastore.com` نطاق Production الأساسي.

بعد نجاح DNS تعمل الروابط التالية بلا `?store=`:

- `https://rshaf.wathbastore.com`
- `https://rshaf.wathbastore.com/admin`
- `https://oud.wathbastore.com`

## 8) قبل الإطلاق الحقيقي

- غيّر رقم واتساب التجريبي من لوحة المالك.
- احذف حسابات العرض أو غيّر كلمات مرورها.
- لا تشارك Secret key، ودوّره فورًا إذا انكشف.
- احذف حسابات العرض وبياناتها من `store_credentials`، أو أنشئ متاجر حقيقية جديدة من لوحة المالك.
- راجع أسعار الباقات والعروض وروابط التواصل.
- اختبر تسليم متجر جديد كاملًا بحساب لا تعرفه حسابات العرض.
- راقب سجلات Vercel وSupabase بعد أول نشر.

## استكشاف الأخطاء سريعًا

### الموقع يعمل محليًا لكنه فارغ على Vercel

تحقق من متغيرات Supabase الخمسة، ثم أعد النشر. وجود URL بلا Publishable key يجعل التطبيق يعود إلى الوضع المحلي غير المناسب لوظائف Vercel.

### تسجيل الدخول صحيح ثم يعود إلى صفحة الدخول

تحقق من أن الحساب موجود في `auth.users` وأن له صفًا في `public.profiles`. أعد تشغيل هذا الاستعلام للتأكد:

```sql
select u.email, p.role
from auth.users u
left join public.profiles p on p.id = u.id
order by u.created_at;
```

### حساب العميل يدخل لكنه لا يرى متجره

أعد تشغيل قسم **ربط حسابات العملاء** في نهاية `0002_demo_data.sql`، ثم تحقق من استعلام العضويات في الخطوة 3.

### المتجر لا يظهر للزائر

يجب أن تكون حالة المتجر `delivered`. المتجر `sweets` مقصود أن يبقى `preparing` كي يظهر في لوحة المالك فقط.

### الـ wildcard لا يعمل

تحقق من إضافة `*.wathbastore.com` إلى مشروع Vercel نفسه، ومن اكتمال إعداد DNS وشهادة HTTPS. إضافة سجل DNS وحده دون إضافة النطاق داخل Vercel لا تكفي.
