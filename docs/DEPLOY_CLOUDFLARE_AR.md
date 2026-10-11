# نشر معون maaoun.com على Cloudflare

هذا الدليل ينقل المنصة من Vercel إلى **Cloudflare** (Workers & Pages) وينشر النطاق
`maaoun.com` مع النطاقات الفرعية (Wildcard) `*.maaoun.com` لكل متاجر العملاء.

> **منصة النشر:** Cloudflare لا تدعم Next.js 15 بالطريقة التقليدية، وأداة
> `@cloudflare/next-on-pages` القديمة أصبحت مهجورة رسميًا. يعتمد هذا المشروع على
> المحوّل الرسمي الحالي **`@opennextjs/cloudflare`** الذي يجري الموقع على Cloudflare
> Workers (منصة Workers & Pages في لوحة Cloudflare).

---

## 0) المتطلبات المسبقة

1. حساب Cloudflare.
2. النطاق `maaoun.com` **مضاف إلى Cloudflare** كمنطقة (Zone) نشطة
   (Nameservers لدى Cloudflare في المنطقة الحرة يكفي).
3. مشروع Supabase جاهز (كما كان على Vercel) — الخطوات 1–4 أدناه.
4. مستودع `mohammedalhinaki-cloud/WathbaStore` على GitHub.

> ⚠️ **ملاحظة مهمة عن البيانات:**
> - **Supabase**: مطلوب في الإنتاج على Cloudflare — كما كان على Vercel.
> - **الوضع التجريبي المحلي** (SQLite عبر `node:sqlite` + نظام ملفات `.data/`)
>   يعمل على جهازك **فقط** (`npm run dev`). لا يعمل على Cloudflare Workers
>   (نفس سبب عدم عمله على نظام الملفات للقراءة فقط في Vercel).
> - إن نسيت متغيرات Supabase على Cloudflare سيعرض التطبيق رسالة خطأ واضحة
>   تطلب ضبطها بدل أن يفشل فشلًا صامتًا.

---

## 1) إنشاء مشروع Supabase

1. افتح [Supabase](https://supabase.com/dashboard) وأنشئ مشروعًا جديدًا.
2. من **SQL Editor** نفّذ ملفات الترحيل بالترتيب، كل ملف مرة واحدة:
   | الملف | ماذا يفعل |
   |---|---|
   | `supabase/migrations/0001_init.sql` | الجداول + RLS + خزنة `store-assets` |
   | `supabase/migrations/0003_master_owner_permissions.sql` | صلاحيات المالك الرئيسي الكاملة على كل المتاجر + سياسات كتابة التخزين لأصحاب المتاجر + إصلاح/إنشاء الخزنة |
   | `supabase/migrations/0004_store_settings_columns.sql` | أعمدة `store_settings` الناقصة (`footer_bg_color` والآيبانات) — بدونها يفشل حفظ الإعدادات بخطأ `PGRST204` |
   | `supabase/migrations/0010_landing_content.sql` | عمود `landing` في `site_settings` — بدونه لن يُحفظ محتوى الموقع من صفحة «محتوى الموقع» |
3. أنشئ حسابك من **Authentication → Users** ثم حوّله إلى مالك:
   ```sql
   update public.profiles set role = 'owner' where email = 'you@maaoun.com';
   ```
4. (اختياري) نفّذ `supabase/migrations/0002_demo_data.sql` لإضافة المتاجر والعروض العربية الجاهزة — **لا تُعد تنفيذه على قاعدة فيها بيانات**.
5. تأكد من التخزين: **Storage** يجب أن توجد خزنة `store-assets` (Public، حد 5MB). الترحيل 0003 يُنشئها تلقائيًا إن كانت ناقصة.

---

## 2) مفاتيح Supabase

من **Settings → API Keys** انسخ:

| المتغير | القيمة |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | رابط المشروع فقط مثل `https://abcd.supabase.co` (بلا `/rest/v1`) |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | المفتاح `sb_publishable_...` |
| `SUPABASE_SECRET_KEY` | المفتاح السري `sb_secret_...` — خادم فقط |

المفتاح السري يتجاوز RLS — ضعه في متغير سرّي ولا تبدأ اسمه بـ `NEXT_PUBLIC_`.

---

## 3) متغيرات البيئة على Cloudflare

في لوحة Cloudflare → **Workers & Pages** → مشروعك → **Settings → Variables and Secrets**:

| المتغير | القيمة |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | رابط المشروع من Supabase |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Publishable key |
| `SUPABASE_SECRET_KEY` | Secret key (Secret) |
| `NEXT_PUBLIC_MAIN_DOMAIN` | `maaoun.com` |
| `DEVELOPER_URL` | `https://maaoun.com` |

> ⚠️ **متغيرات `NEXT_PUBLIC_` تُدمج وقت البناء** في Next.js. أي تغيير لها يتطلب
> إعادة بناء (إعادة نشر) كي يسري — وليس تعديل المتغير فقط.

---

## 4) النشر على Cloudflare

### الطريقة أ) عبر Git (المستودع مرتبط)

1. في Cloudflare: **Workers & Pages → Create → Pages → Connect to Git**.
2. اختر المستودع `mohammedalhinaki-cloud/WathbaStore` وفرع الإنتاج (`main`).
3. إعدادات البناء:
   - **Framework preset**: Next.js
   - **Build command**: `npm run cf-build`
   - **Build output directory**: `.open-next` (أو اترك التعرف التلقائي)
4. أضف متغيرات البيئة أعلاه ثم **Save and Deploy**.

> ☁️ **Compatibility flags:** مشروعك يضبط `nodejs_compat` و`compatibility_date`
> تلقائيًا من `wrangler.jsonc` الموجود في المشروع. إن لم تُقرأ تلقائيًا أضف
> **nodejs_compat** من Settings → Compatibility Flags (Production وPreview).

### الطريقة ب) عبر سطر الأوامر

```bash
npm install
npm run cf-deploy        # = opennextjs-cloudflare build && deploy
# أو رفع نسخة دون تفعيل: npm run cf-upload
```

للمعاينة محليًا داخل بيئة Workers نفسها:

```bash
npm run cf-preview      # تعمل على http://localhost:8787
```

---

## 5) ربط النطاق `maaoun.com` والنطاق العرضي `*.maaoun.com`

**يتكون الموقع من جزأين:** حساب Works (OpenNext) + منطقة DNS للنطاق `maaoun.com`
(النطاق مضاف إلى Cloudflare كنطاق "Zone").

1. من **Workers & Pages** → العامل الحالي `waathba` → **Settings → Domains & Routes**.

> اسم العامل في `wrangler.jsonc` يبقى `waathba` عمدًا. تغييره إلى `maaoun` قبل النشر ينشئ عاملًا جديدًا ولا يحدّث العامل المنشور. إعادة التسمية اختيارية ومن لوحة Cloudflare فقط، وبعدها حدّث الاسم في الملف.
2. أضف **Custom Domains**:
   - `maaoun.com`
   - `www.maaoun.com`
   - وأي نطاق فرعي ثابت تريده (مثل `admin.maaoun.com` إن أردته).
   Cloudflare ينشئ شهادة SSL وجرّات DNS تلقائيًا.

3. **النطاق العرضي (Wildcard) لأي اسم متجر جديد `name.maaoun.com`:**
   - **ـ نطاقات مخصصة (Custom Domains) لا تدعم Wildcard** في Cloudflare.
   - الحل المعتمد: أضف **Route** بنمط `*maaoun.com/*` يمر عبر عاملك، مع
     سجل DNS لأي نطاق فرعي (كما يوضح الجدول):

   | الإجراء | الإعداد |
   |---|---|
   | DNS Wildcard | سجل `CNAME` باسم `*` يشير إلى `maaoun.com` (بروكسي - سحابة برتقالية) |
   | Route في العامل | نمط `*maaoun.com/*` + `zone_name: maaoun.com` |

   أو (الأقوى للـ Multi-Tenant): **عامل Wildcard صغير** يمرر `x-forwarded-host`
   (التطبيق يقرأها) ليعرف المتجر المطلوب:

   ```js
   export default {
     async fetch(request, env) {
       const url = new URL(request.url);
       const hostname = url.hostname;
       // الموقع العام فقط هو ما يُعالج هنا (rshaf.maaoun.com ... إلخ)
       // تمرير الطلب إلى تطبيق OpenNext مع تمرير النطاق الأصلي في x-forwarded-host
       const target = new URL("https://maaoun.com" + url.pathname + url.search);
       return fetch(target, {
         ...request,
         headers: {
           ...Object.fromEntries(request.headers),
           "x-forwarded-host": hostname,
         },
       });
     },
   };
   ```

   > التطبيق يقرأ `x-forwarded-host` أولًا (انظر `middleware.ts` و`lib/tenant.ts`) ليعرف
   > النطاق الفرعي المطلوب ويربطه بقاعدة البيانات، فيعمل `rshaf.maaoun.com`
   > مباشرة **بلا `?store=`**.

3. في DNS للمنطقة أضف السجلات:

   | النوع | الاسم | القيمة | الحالة |
   |---|---|---|---|
   | CNAME | `@` (الجذر) | نطاق الصفحة/العامل الذي تعرضه Cloudflare (قد يبقى `waathba.pages.dev` إن لم تُعد تسمية المشروع) | بروكسي |
   | CNAME | `www` | الجذر أو العامل | بروكسي |
   | CNAME | `*` | الجذر `maaoun.com` | بروكسي |

4. انتظر حتى تصبح الحالة **Active** وتصدر شهادات SSL (قد يستغرق دقائق).

بعد نجاح DNS تعمل:

- `https://maaoun.com` — الموقع العام
- `https://maaoun.com/admin` — لوحة المالك
- `https://rshaf.maaoun.com` — متجر كافيه رشف (بلا `?store=`)
- `https://rshaf.maaoun.com/admin` — لوحة عميل رشف
- `https://oud.maaoun.com` — متجر عود وروائح

---

## 5ب) إعدادات خارج الكود (يدويًا)

لا توجد قائمة CORS أو روابط إعادة توجيه Auth داخل المستودع. بعد نقل النطاق حدّثها في اللوحات:

| المكان | ماذا تفعل |
|---|---|
| Cloudflare → العامل `waathba` → Domains | أضف `maaoun.com` و`www.maaoun.com`، وسجّل DNS `CNAME *` مع Route `*maaoun.com/*` |
| Cloudflare → Variables | `NEXT_PUBLIC_MAIN_DOMAIN=maaoun.com` و`DEVELOPER_URL=https://maaoun.com` ثم **أعد البناء** |
| Supabase → Authentication → URL Configuration | Site URL = `https://maaoun.com`، وأضف Redirect URLs: `https://maaoun.com/**` و`https://*.maaoun.com/**` |
| Supabase → SQL Editor | شغّل `0006_rebrand_maaoun.sql` مرة واحدة. **لا تُعد تشغيل `0002`** على قاعدة فيها بيانات |
| Supabase → Authentication → Users | إن كان بريد المالك `@waathba.com` فغيّره يدويًا. الترحيل لا يمسّ `auth.users` |
| اسم مشروع Pages / Supabase | إعادة التسمية اختيارية. تغيير اسم مشروع Pages يغيّر `*.pages.dev` |

النطاق القديم `waathba.com` يبقى مفهومًا في الكود أثناء النقل، لكن الروابط الجديدة تُولَّد على `maaoun.com`.

---

## 6) الاختبار

على نطاق التجربة `*.pages.dev` أو عنوان المعاينة قبل ربط النطاق، اختبر:

| الصفحة | الرابط |
|---|---|
| الموقع العام | `/` |
| لوحة المالك | `/admin` |
| متجر رشف | `/?store=rshaf` |
| لوحة رشف | `/admin?store=rshaf` |

بيانات العرض: رشف `rshaf@demo.com` / `Rshaf#2026`، عود `oud@demo.com` / `Oud#2026`.

---

## 7) قبل الإطلاق الحقيقي

- غيّر رقم واتساب التجريبي من لوحة المالك.
- غيّر كلمات مرور حسابات العرض أو احذفها.
- لا تشارك Secret key.
- راجع أسعار الباقات والعروض وروابط التواصل.
- راقب سجلات **Workers → Logs** و**Supabase → Logs** بعد أول نشر.

---

## استكشاف الأخطاء سريعًا

### الموقع يعمل محليًا لكنه فارغ على Cloudflare

السبب الأول عالميًا: نسيت متغيرات Supabase. أضف الثلاثة في Cloudflare ثم أعد النشر.
(الوضع المحلي SQLite لا يعمل على Cloudflare Workers.)

### رسالة «وضع Cloudflare Workers يتطلب Supabase»

أضف `NEXT_PUBLIC_SUPABASE_URL` و`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
و`SUPABASE_SECRET_KEY` ثم أعد النشر. بدونها يعود التطبيق للوضع المحلي غير المدعوم على Workers.

### الخطأ `Invalid path specified in request URL` (PGRST125)

قيمة `NEXT_PUBLIC_SUPABASE_URL` تحوي مسارًا (`/rest/v1`). اجعلها رابط المشروع فقط
`https://abcd.supabase.co`، ثم أعد النشر. (التطبيق ينظفها تلقائيًا مع تحذير في السجلات.)

### الـ Wildcard لا يعمل

- تأكد من سجل DNS `CNAME *` بروكسي.
- تأكد من إضافة Route بنمط `*maaoun.com/*` (أو عامل الـ Wildcard) في إعدادات العامل.
- النطاق الفرعي يجب أن يكون مسلّم الحالة (`delivered`) ليظهر للزوار.

### رسالة «فشل الرفع» عند رفع شعار/غلاف/صورة منتج

السبب الحقيقي يُعرض الآن في نفس الرسالة. افتح **لوحة المالك → أي متجر → «فحص رفع الصور»**
واضغط «تشغيل الفحص» لترى أي طبقة فشلت بالضبط:

| ما يظهر | المعنى | الحل |
|---|---|---|
| «خزنة الصور غير موجودة» | خزنة `store-assets` غير موجودة في Storage | نفّذ الترحيل 0003 (يُنشئها) |
| «لا تملك صلاحية الكتابة» | سياسات كتابة التخزين قديمة (0001 فقط) | نفّذ الترحيل 0003 |
| المفتاح السري غير موجود | `SUPABASE_SECRET_KEY` غير مضبوط — **لم يعد مطلوبًا للرفع** | لا شيء؛ الرفع يعمل بجلسة المستخدم |
| «فشل الحفظ» عند حفظ الإعدادات | عمود ناقص في `store_settings` (`PGRST204`) | نفّذ الترحيل 0004 |

### رسالة «فشل الحفظ» في الإعدادات/المظهر رغم أن البيانات صحيحة

قاعدة بيانات لم يُنفَّذ عليها الترحيل 0004: PostgREST يرد
`PGRST204 — Could not find the 'footer_bg_color' column`. نفّذ الترحيل 0004 ثم أعد المحاولة.

### متجر النطاق الفرعي لا يفتح، أو «الصفحة غير موجودة» على `rshaf.maaoun.com`

- المتجر غير المسلّم (`delivered`) لا يظهر للزوار إطلاقًا — هذا سلوك مقصود.
  لوحة المتجر تعمل للمالك الرئيسي في أي حالة.
- على نطاق حقيقي تأكد أن متصفحك/البروكسي يمرّر ترويسة `x-forwarded-host` بالنطاق الأصلي
  (راجع قسم «ربط النطاق `maaoun.com` والنطاق العرضي» أعلاه).

### المالك الرئيسي يفتح `rshaf.maaoun.com/admin` فيجد نفسه غير مسجَّل

كوكي الجلسة تُكتب الآن على النطاق الأب `.maaoun.com` (من `lib/constants.ts` →
`sharedCookieDomain`) لتعمل على كل النطاقات الفرعية. تأكد أن النطاقات الفرعية كلها تحت نفس
الدومين (`*.maaoun.com`) — أما في وضع المعاينة (نطاق واحد + `?store=slug`) فتُكتب الكوكي
على المضيف الحالي كما هو.

### متغير `NEXT_PUBLIC_` عُدّل لكنه لم يسري

قيم `NEXT_PUBLIC_` تُدمج وقت البناء. أعد النشر (Redeploy/إعادة بناء) بعد أي تعديل.
