# تشخيص: «الموقع بطيء ولا يفتح» — الأسباب والإصلاحات

تقرير فحص `honey.maaoun.com` وبقية المتاجر، والأسباب الفعلية المؤكَّدة.

---

## الخلاصة أولًا

الموقع **لم يكن متوقفًا**: الصفحة الرئيسية وصفحات الأقسام والصفحات التعريفية كانت
تعمل وترد محتوى صحيحًا. المشكلة كانت ثلاثة أعطال منفصلة اجتمعت فبدت للزائر
وكأن الموقع «بطيء ولا يفتح»:

| # | العطل | الأثر على الزائر |
|---|-------|------------------|
| ١ | كل صفحات `/products/*` ترد «الصفحة غير موجودة» | «الروابط لا تفتح» |
| ٢ | `/_next/image` يرد خطأ 500 | الصور لا تظهر، المتصفح ينتظرها طويلًا |
| ٣ | عشرات الرحلات المتتابعة إلى Supabase + شعار ١٫٨ ميغابايت | بطء حقيقي في الظهور |

---

## العطل ١ — كل صفحات المنتجات كانت 404 (السبب الجذري)

### الدليل

```
https://honey.maaoun.com/products/sidr-honey   →  «الصفحة غير موجودة»
https://honey.maaoun.com/categories/natural-honey →  تعمل ✅
https://honey.maaoun.com/pages/about           →  تعمل ✅
```

الأقسام والصفحات تعمل، والمنتجات وحدها تفشل — رغم أن الصفحة الرئيسية
و`sitemap.xml` يشيران إليها.

### السبب

في `lib/services/supabase.ts` كانت دالة `getProduct` تستعلم هكذا:

```ts
.or(`id.eq.${idOrSlug},slug.eq.${idOrSlug}`)
```

وعمود `products.id` معرَّف في المخطط على أنه `uuid`:

```sql
-- supabase/migrations/0001_init.sql
create table public.products (
  id uuid primary key default gen_random_uuid(),
  ...
```

عند فتح `/products/sidr-honey` يبني PostgREST الشرط:

```sql
where id = 'sidr-honey' or slug = 'sidr-honey'
```

فيرفض Postgres تحويل `'sidr-honey'` إلى `uuid`:

```
22P02 | invalid input syntax for type uuid: "sidr-honey"
```

والأسوأ أن الكود كان يفكك `{ data }` **فقط** ويُهمل `error`، فيعود
`data = null` فتُفسَّر النتيجة على أنها «المنتج غير موجود» وتُستدعى
`notFound()`. أي أن **خطأ قاعدة بيانات كان يُعرض كصفحة 404**.

### لماذا لم يظهر العطل أثناء التطوير؟

الوضع المحلي يستخدم SQLite (`lib/services/local.ts`) وينفّذ:

```sql
SELECT * FROM products WHERE store_id = ? AND (id = ? OR slug = ?)
```

وSQLite لا يفرض أنواعًا صارمة، فالاستعلام ينجح محليًا ويفشل على Supabase فقط.

### الإصلاح

نطابق `id` فقط حين تكون القيمة UUID صالحًا، وإلا نطابق `slug` مباشرة،
مع تسجيل أخطاء قاعدة البيانات بدل ابتلاعها:

```ts
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

let q = (await supabaseServer()).from("products").select("*").eq("store_id", storeId);
q = UUID_RE.test(key) ? q.or(`id.eq.${key},slug.eq.${key}`) : q.eq("slug", key);

const { data, error } = await q.maybeSingle();
if (error) {
  console.error("[getProduct] فشل الاستعلام:", { storeId, key, error: error.message });
  return null;
}
```

البحث بالمعرّف (UUID) — الذي تستخدمه لوحة التحكم — يبقى كما هو بلا تغيير.

---

## العطل ٢ — الصور تفشل بخطأ 500

### الدليل

```
https://honey.maaoun.com/_next/image?url=%2Fseed%2Fh-sidr.jpg&w=640&q=75
→ HTTP 500
```

كل صور المنتجات والأغلفة تمرّ عبر هذا المسار، فكانت كلها تفشل.

### السبب

محوّل OpenNext لـ Cloudflare يتطلب ربط `IMAGES` في `wrangler.jsonc` لتفعيل
تحسين الصور. بدونه يرد `/_next/image` بخطأ 500.
المرجع: <https://opennext.js.org/cloudflare/howtos/image>

### الإصلاح

```jsonc
"images": {
  "binding": "IMAGES"
},
"observability": {
  "enabled": true
}
```

> **تنبيه:** تحسين الصور عبر Cloudflare Images قد تترتب عليه تكلفة حسب الخطة.
> إن لم ترغب في تفعيله، البديل هو `images: { unoptimized: true }` في
> `next.config.ts` — الصور ستظهر فورًا وبلا تكلفة، لكن بأحجامها الأصلية.

---

## العطل ٣ — بطء الخادم

### أ) استعلام N+1 في `listProducts`

```ts
// قبل — حلقة تنتظر رحلة شبكة مستقلة لكل منتج
for (const r of data ?? []) {
  out.push(this.mapProd(r, await this.loadImages(r.id)));
}
```

متجر العسل فيه ١٠ منتجات ⇒ **١٠ رحلات متتابعة** إلى Supabase لجلب الصور فقط،
قبل أن تبدأ الصفحة بالظهور. صارت الآن **استعلامًا واحدًا مجمّعًا**
عبر `.in("product_id", ids)` ثم توزيع النتائج محليًا.

### ب) تكرار الجلب في الطلب الواحد

Next.js ينفّذ `generateMetadata` ثم التخطيط ثم الصفحة في الطلب نفسه، وكل
واحدة كانت تعيد نفس العمل:

| البيانات | قبل | بعد |
|----------|-----|-----|
| `getStoreCtx` (المتجر + الإعدادات) | مرتان | مرة |
| `getCurrentUser` (Supabase Auth + profiles) | مرتان | مرة |
| الأقسام والصفحات | مرتان لكل منهما | مرة |

الحل: تغليف `getTenant` و`getStoreCtx` و`getCurrentUser` و`loadStoreAndNav`
بـ `cache()` من React — تُحسب مرة واحدة لكل طلب.

### ج) حجم الصفحة

- شعار المتجر كان يُعرض بوسم `<img>` خام:
  `honey-logo.png` بمقاس ١٤٠٨×٧٦٨ وحجم **١٫٨ ميغابايت** لعرضه في **٤٠ بكسل**،
  في الهيدر الظاهر على **كل صفحة**. صار عبر `next/image` بمقاسات ٤٠/٦٤ بكسل.
- ضغط أصول `public/seed`: **٧٫٥ ميغابايت ← ٢٫٧ ميغابايت** (توفير ٦٤٪).
  `honey-logo.png` وحده: **١٧٧٥ ك.ب ← ٤٩ ك.ب**.

---

## التحقق

- `npx tsc --noEmit` — نظيف.
- `next build` — ناجح (٤١ صفحة).
- زحف آلي على **جميع** الروابط الداخلية: **٨٣ رابطًا** عبر
  `honey` و`osra` و`sweets` و`oud` و`rshaf` والموقع الرئيسي → **كلها 200**.
- `/_next/image` → 200 و`image/jpeg`.
- خطأ `22P02` أُعيد إنتاجه والتحقق من إصلاحه على Postgres حقيقي (pglite).

---

## المطلوب منك

1. **أعِد النشر** — الإصلاحات لا تسري قبل ذلك:
   ```bash
   npm run cf-deploy
   ```
2. تأكد أن ربط `IMAGES` ظاهر في: لوحة Cloudflare → Workers & Pages →
   `waathba` → Settings → Bindings. وإن لم ترغب في Cloudflare Images،
   استخدم بديل `unoptimized` المذكور أعلاه.

## تحسين مقترح لاحقًا (لم يُنفَّذ)

صفحات المتاجر ديناميكية بالكامل (تقرأ `headers()`)، أي أن **كل زيارة** تعيد
الاستعلام من Supabase بلا أي تخزين مؤقت. تفعيل ذاكرة تخزين مؤقت لـ OpenNext
(R2/KV) أو تخزين HTML على حافة Cloudflare سيقلّل زمن الاستجابة إلى حد كبير،
لكنه يحتاج تهيئة موارد في حسابك وقرارًا بشأن مدة الصلاحية بعد كل تعديل
من لوحة التحكم.
