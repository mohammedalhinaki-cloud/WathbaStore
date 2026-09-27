# إصلاح sitemap.xml و robots.txt — معون

## ما الذي تغيّر في الكود؟

- الخريطة تُولَّد من `app/sitemap.xml/route.ts` بصيغة XML صريحة، مع `Content-Type: application/xml`.
- المسار أصبح `force-dynamic` حتى لا يولّد Next.js نسخة fallback وقت البناء ثم يثبتها في ISR. توجد ذاكرة مؤقتة ناجحة داخل العامل و`Cache-Control` لمدة ساعة بدل التوليد الساكن وقت البناء.
- القراءة تتم مباشرة من Supabase بأربع رحلات فقط بدل استخدام طبقة الخدمات التي كانت تنفذ استعلامات كثيرة (`N+1`) وتحمل صور المنتجات بلا حاجة.
- يُفضّل `SUPABASE_SECRET_KEY` أو `SUPABASE_SERVICE_ROLE_KEY` لتجاوز RLS. إن غابا، يعمل `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` أو `NEXT_PUBLIC_SUPABASE_ANON_KEY` عبر RLS كحل ثانوي.
- رُفعت المهلة مؤقتًا من 4 إلى 10 ثوانٍ. عند الفشل يسجل `app/sitemap.xml/route.ts` الخطأ الفعلي في Functions logs؛ لا يُخزّن fallback في cache ويحمل الرد `Cache-Control: no-store`.
- إن كانت نسخة ناجحة قديمة موجودة في ذاكرة العامل تُستخدم مؤقتًا بدل خسارة كل الروابط، مع تسجيل سبب فشل التحديث.
- تُضاف المتاجر المسلّمة فقط، ثم الأقسام والصفحات والمنتجات الظاهرة. العناصر المخفية والمسارات الخاصة لا تدخل الخريطة.
- عند تجاوز 50,000 رابط، يتحول `/sitemap.xml` تلقائيًا إلى Sitemap Index ويشير إلى `/sitemap-0.xml` و`/sitemap-1.xml`…؛ إعادة الكتابة في `next.config.ts` توصل هذه الروابط إلى Route Handler المقسم.
- `robots.txt` ثابت وخفيف، ولا يحتوي الحقل غير القياسي `Host`، ولا يحجب صور `/uploads` العامة.
- استُثني `/sitemap.xml` و`/robots.txt` وملفات sitemap المقسمة والـ API من `middleware.ts`.

## الاستعلامات والعزل بين المستأجرين

تقرأ الخريطة الجداول التالية فقط:

| الجدول | الفلتر | الروابط الناتجة |
|---|---|---|
| `stores` | `status = 'delivered'` | الصفحة الرئيسية لكل متجر |
| `categories` | `store_id` ضمن المتاجر المسلّمة و`is_visible = true` | صفحات الأقسام |
| `products` | `store_id` ضمن المتاجر المسلّمة و`is_visible = true` | صفحات المنتجات |
| `pages` | `store_id` ضمن المتاجر المسلّمة و`is_visible = true` | صفحات المحتوى |

لا يحتوي مخطط قاعدة البيانات على عمود `tenant_id` مستقل. العزل متعدد المستأجرين قائم على `stores.id`، والجداول الثلاثة الأخرى مرتبطة به عبر `store_id`. نطاق الطلب الرئيسي `maaoun.com` لا يحدد المستأجر في هذا الاستعلام؛ المولد يجلب كل المتاجر المسلّمة صراحة ويولد لكل منها نطاقها الفرعي.

استخدام مفتاح الخدمة لا يعني نشر المسودات: الفلاتر أعلاه تُطبّق داخل الاستعلام حتى مع تجاوز RLS.

## متغيرات Cloudflare Production

في **Workers & Pages → المشروع → Settings → Variables and Secrets** تأكد من وجود القيم في بيئة **Production** وليس Preview فقط:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY   # أو NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SECRET_KEY                    # أو SUPABASE_SERVICE_ROLE_KEY
NEXT_PUBLIC_MAIN_DOMAIN=maaoun.com
```

الأسماء الحديثة موصى بها، والأسماء القديمة في التعليقات مدعومة للتوافق. رابط Supabase يجب أن يكون رابط المشروع فقط مثل `https://xxxx.supabase.co`، بلا `/rest/v1`.

> قيم `NEXT_PUBLIC_*` تُدمج وقت البناء أيضًا، لذلك يلزم **إعادة نشر كاملة** بعد تغييرها. الأسرار غير العامة تبقى على الخادم فقط ولا يجوز وضعها باسم يبدأ بـ`NEXT_PUBLIC_`.

## endpoint التشخيصي المؤقت

أضيف مؤقتًا:

```text
GET /api/debug-sitemap
```

لا يعيد أي قيمة سرية، بل حالة وجود المتغيرات والعدادات فقط. مثال نجاح:

```json
{
  "supabase_url_configured": true,
  "supabase_publishable_key_configured": true,
  "supabase_anon_key_configured": false,
  "supabase_secret_key_configured": true,
  "supabase_service_role_key_configured": false,
  "supabase_public_key_configured": true,
  "supabase_service_key_configured": true,
  "selected_access_mode": "service_role",
  "access_mode": "service_role",
  "stores_count": 5,
  "categories_count": 18,
  "products_count": 34,
  "pages_count": 15,
  "total_urls": 73,
  "error": null
}
```

بعد فحص Production وحفظ نتيجة السجلات، احذف `app/api/debug-sitemap/route.ts` في PR لاحق لأنه endpoint تشخيصي مؤقت.

## ملاحظة مهمة حول `output: "export"`

هذا المشروع **لا يدعم Static Export الكامل**. صفحات المتاجر متعددة المستأجرين، وRoute Handlers، والمصادقة، وSupabase تحتاج تشغيل Next.js على Cloudflare Workers عبر OpenNext. إعداد النشر الصحيح:

```text
Build command: npm run cf-build
Output: .open-next
```

وضع `output: "export"` أو استخدام مجلد `out` سيحوّل المسارات الديناميكية و`/api` إلى 404.

## الفحص بعد النشر

إذا كان رد الصفحة الرئيسية القديم مخزنًا في Cloudflare، نفّذ **Purge Cache** للمسار `/sitemap.xml` مرة واحدة بعد النشر، ثم:

```bash
# البيئة والعدادات (مؤقت)
curl -fsSL https://maaoun.com/api/debug-sitemap | jq

# الترويسات: راقب X-Sitemap-Source وX-Sitemap-Urls
curl -sS -D - -o /dev/null https://maaoun.com/sitemap.xml -A "Googlebot"

# المحتوى الكامل وعدد الروابط
curl -fsSL https://maaoun.com/sitemap.xml -A "Googlebot" | tee sitemap.xml
grep -c '<url>' sitemap.xml

# robots
curl -fsSL https://maaoun.com/robots.txt
```

النتيجة المطلوبة:

- `HTTP 200` و`Content-Type: application/xml`؛
- `X-Sitemap-Source: supabase` (أول طلب) أو `memory-cache` (الطلبات التالية)، وليس `fallback`؛
- عدد `X-Sitemap-Urls` يساوي `total_urls` من endpoint التشخيصي؛
- يبدأ body بـ `<?xml version="1.0" encoding="UTF-8"?>`؛
- يحتوي روابط المتاجر والأقسام والمنتجات والصفحات؛
- لا يحتوي روابط `waathba.com` أو `wathbastore.com`؛
- عند نجاح البيانات يظهر في Cloudflare Functions logs سجل مشابه:

```text
[sitemap] تم توليد الخريطة من Supabase {
  access_mode: "service_role",
  counts: { stores: 5, categories: 18, products: 34, pages: 15, totalUrls: 73 }
}
```

وعند الفشل يظهر `[sitemap] تعذّر جلب بيانات Supabase` مع اسم الجدول و`code/details/hint` وحالة المتغيرات، من دون طباعة المفاتيح.

## Google Search Console

بعد نجاح الفحص:

1. افتح خاصية `https://maaoun.com` في Google Search Console.
2. من **Sitemaps** أرسل `sitemap.xml` فقط.
3. افحص حالة الإرسال ثم استخدم **URL Inspection** للصفحة الرئيسية ولصفحات متجر عامة.
4. اطلب إعادة الزحف. تحسن الفهرسة لا يظهر لحظيًا.
5. احذف endpoint التشخيصي المؤقت بعد انتهاء التشخيص.
