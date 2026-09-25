// ============================================================
// معون — خريطة الموقع (sitemap) الديناميكية
// تُولَّد وقت الطلب من قاعدة البيانات، فتظهر أي متجر جديد تلقائيًا
// دون إعادة نشر. تفهرس الصفحات العامة للمتاجر المسلّمة فقط.
// ============================================================

import type { MetadataRoute } from "next";
import { services } from "@/lib/services";
import { mainDomain, replaceLegacyPlatformDomain, storeUrl } from "@/lib/constants";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // كل روابط الخريطة تمر من هنا، لذلك لا يمكن لقيمة بيئة قديمة أو
  // canonical محفوظ قديم أن يعيد النطاق السابق إلى الناتج العام.
  const publicUrl = (url: string) => replaceLegacyPlatformDomain(url);
  const base = publicUrl(`https://${mainDomain()}`);
  const entries: MetadataRoute.Sitemap = [
    { url: base, lastModified: new Date(), changeFrequency: "weekly", priority: 1 },
  ];

  try {
    const stores = await services().listStores();
    for (const store of stores) {
      // نفهرس المتاجر الظاهرة للزوار فقط (المسلّمة)
      if (store.status !== "delivered") continue;

      const home = publicUrl(storeUrl(store.subdomain));
      entries.push({ url: home, lastModified: new Date(store.updatedAt), changeFrequency: "weekly", priority: 0.8 });

      const [cats, pages, products] = await Promise.all([
        services().listCategories(store.id, false),
        services().listPages(store.id),
        services().listProducts(store.id, { includeHidden: false }),
      ]);

      for (const c of cats.filter((c) => c.isVisible)) {
        entries.push({ url: publicUrl(storeUrl(store.subdomain, `/categories/${c.slug}`)), changeFrequency: "weekly", priority: 0.6 });
      }
      for (const p of pages.filter((p) => p.isVisible)) {
        entries.push({ url: publicUrl(storeUrl(store.subdomain, `/pages/${p.slug}`)), changeFrequency: "monthly", priority: 0.5 });
      }
      for (const p of products.filter((p) => p.isVisible)) {
        entries.push({ url: publicUrl(storeUrl(store.subdomain, `/products/${p.slug}`)), changeFrequency: "weekly", priority: 0.7 });
      }
    }
  } catch {
    // عند أي خطأ في قراءة البيانات نُعيد ما توفّر (صفحة المنصة على الأقل)
  }

  return entries;
}
