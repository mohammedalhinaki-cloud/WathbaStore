// معون — تحميل روابط تنقل المتجر (أقسام + صفحات)
import { cache } from "react";
import { services } from "@/lib/services";
import type { Category, StorePage } from "@/lib/types";

/**
 * مغلّفة بـ cache(): الصفحة الرئيسية كانت تجلب الأقسام والصفحات مرة لبناء
 * روابط الهيدر، ثم يجلبها StoreHome مرة أخرى لعرض الأقسام — أربع رحلات
 * إلى قاعدة البيانات بدل اثنتين. الآن تُجلب مرة واحدة لكل طلب.
 */
export const loadStoreAndNav = cache(async function loadStoreAndNav(
  storeId: string
): Promise<{ categories: Category[]; pages: StorePage[] }> {
  const [categories, pages] = await Promise.all([
    services().listCategories(storeId),
    services().listPages(storeId),
  ]);
  return { categories, pages };
});
