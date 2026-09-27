# إصلاح sitemap.xml و robots.txt — معون

## ما الذي تغيّر في الكود؟

- استُبدل `app/sitemap.ts` الديناميكي غير المحدود بـ `app/sitemap.xml/route.ts`.
- الخريطة تُولَّد بصيغة XML صريحة، مع `Content-Type: application/xml` وترويسات تخزين مناسبة.
- يوجد حد زمني قدره 4 ثوانٍ لقراءة البيانات. إذا تعذّر Supabase أو طال الرد، يعيد المسار XML صالحًا يحتوي الصفحة الرئيسية بدل `500` أو `524`.
- تستخدم Next.js إعادة تحقق كل ساعة، كما توجد ذاكرة مؤقتة داخل العامل. هذا يمنع استدعاء قاعدة البيانات عند كل زحف.
- تُضاف المتاجر المسلّمة فقط، ثم الأقسام والصفحات والمنتجات الظاهرة. العناصر المخفية والمسارات الخاصة لا تدخل الخريطة.
- عند تجاوز 50,000 رابط، يتحول `/sitemap.xml` تلقائيًا إلى Sitemap Index ويشير إلى `/sitemap-0.xml` و`/sitemap-1.xml`…؛ إعادة الكتابة في `next.config.ts` توصل هذه الروابط إلى Route Handler المقسم.
- `robots.txt` أصبح ثابتًا وخفيفًا، وحُذف منه `Host`. أزيل حجب `/uploads` لأن هذا المسار يقدم صور المتاجر العامة.
- استُثني `/sitemap.xml` و`/robots.txt` وملفات sitemap المقسمة والـ API من `middleware.ts`.

## ملاحظة مهمة حول `output: "export"`

هذا المشروع **لا يدعم Static Export الكامل حاليًا**. السبب أنه يحتوي على:

- صفحات متاجر متعددة المستأجرين على نطاقات فرعية؛
- Route Handlers للـ API والمصادقة والرفع؛
- قراءة Supabase وقت التشغيل.

لذلك لم نضع `output: "export"` في `next.config.ts`؛ وضعه سيحوّل المسارات الديناميكية و`/api` إلى 404. إعداد النشر الصحيح لهذا المستودع هو OpenNext على Cloudflare Workers:

```text
Build command: npm run cf-build
Output: .open-next
```

أما الإعداد التالي:

```text
npx next build
Output: out
```

فهو صالح فقط بعد تحويل المشروع إلى موقع ثابت بالكامل وإزالة الاعتماد على قاعدة البيانات وAPI، وليس إصلاحًا آمنًا لهذا المشروع الحالي.

## إعداد Cloudflare

### النشر الحالي: Workers + OpenNext

اتبع إعدادات `docs/DEPLOY_CLOUDFLARE_AR.md`:

```bash
npm run cf-build
# أو للنشر
npm run cf-deploy
```

يجب ضبط متغيرات Supabase و`NEXT_PUBLIC_MAIN_DOMAIN=maaoun.com` **أثناء البناء**؛ لأن Next.js قد يُنشئ نسخة sitemap المحسنة أثناء `next build`.

### Cache Rule

إن كان المشروع مربوطًا في لوحة Cloudflare Pages/Workers وتريد تنفيذ الإعداد المطلوب يدويًا:

1. افتح **Caching → Cache Rules → Create rule**.
2. الشرط: **URI Path equals `/sitemap.xml`**.
3. الإجراء: **Cache eligibility → Bypass cache**.
4. احفظ القاعدة وانشرها على الإنتاج.

المسار نفسه يرسل `Cache-Control` ويستخدم إعادة تحقق وذاكرة داخلية؛ لذلك يظل الرد سريعًا حتى مع Bypass. إذا اخترت الاعتماد على تخزين Cloudflare بدل القاعدة اليدوية، استخدم `Cache-Control` الموجود في Route Handler ولا تضف Bypass.

## الفحص المحلي أو بعد النشر

```bash
# فحص headers والمهلة مع User-Agent مشابه لـ Googlebot
curl -I https://maaoun.com/sitemap.xml --max-time 30 -A "Googlebot"

# فحص أن body XML وليس صفحة HTML أو رسالة خطأ
curl -fsSL https://maaoun.com/sitemap.xml -A "Googlebot" | head -40

# فحص robots
curl -fsSL https://maaoun.com/robots.txt
```

النتيجة المطلوبة لـ sitemap:

- `HTTP/2 200`؛
- `Content-Type: application/xml`؛
- يبدأ body بـ `<?xml version="1.0" encoding="UTF-8"?>`؛
- يحتوي `<urlset>` أو `<sitemapindex>`؛
- لا يحتوي `Host:` ولا روابط `waathba.com` أو `wathbastore.com`؛
- الاستجابة خلال أقل من 5 ثوانٍ.

## Google Search Console

بعد نشر التغيير:

1. افتح خاصية `https://maaoun.com` في Google Search Console.
2. من **Sitemaps** أرسل `sitemap.xml` فقط، دون كتابة النطاق الكامل إذا كانت الخاصية مضبوطة.
3. افحص حالة الإرسال ثم استخدم **URL Inspection** للصفحة الرئيسية ولصفحات متجر عامة.
4. أعد الفحص بعد أن يزور Google الخريطة؛ تحسن الفهرسة لا يظهر لحظيًا.
5. استخدم `site:maaoun.com` كفحص تقريبي، مع العلم أن Google لا يضمن عرض كل النتائج فورًا.

> لا يمكن تغيير Cache Rule أو إرسال الخريطة إلى Search Console من داخل مستودع GitHub؛ هاتان خطوتان في لوحتي Cloudflare وGoogle بعد النشر.
