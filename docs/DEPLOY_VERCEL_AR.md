# نشر وثبة — (نُقل إلى Cloudflare)

> ⚠️ **هذا الدليل قديم.** كانت المنصة تُنشر سابقًا على Vercel، وأصبحت الآن على
> **Cloudflare** (Workers & Pages عبر OpenNext) تحت النطاق الرسمي `waathba.com`.

الكود والإعدادات تم تحديثها بالكامل للعمل على Cloudflare:

- محوّل **OpenNext** (`@opennextjs/cloudflare` + `wrangler`) بدلًا من وظائف Vercel.
- ملفات الإعداد: `wrangler.jsonc` و`open-next.config.ts` و`public/_headers`.
- أوامر النشر: `npm run cf-build` / `npm run cf-deploy` / `npm run cf-preview`.
- النطاق الرئيسي: `waathba.com` (عبر `NEXT_PUBLIC_MAIN_DOMAIN`).
- النطاق العرضي `*.waathba.com` يعمل عبر عمال Cloudflare ودعم `x-forwarded-host`.

**لخطوات النشر الكاملة:** راجع [`docs/DEPLOY_CLOUDFLARE_AR.md`](DEPLOY_CLOUDFLARE_AR.md).

**لدليل المبتدئين خطوة بخطوة (Supabase + Cloudflare):** راجع [`docs/BEGINNER_SETUP_AR.md`](BEGINNER_SETUP_AR.md).

> تريد العودة مؤقتًا إلى Vercel؟ ما زال `npm run build` يعمل بشكل كامل مع Supabase،
> وكل ما يتغير هو خطوة النشر (بوابة Vercel بدل Cloudflare) في الدليل أعلاه.
