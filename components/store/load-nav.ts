// وثبة — تحميل روابط تنقل المتجر (أقسام + صفحات)
import { services } from "@/lib/services";
import type { Category, StorePage } from "@/lib/types";

export async function loadStoreAndNav(storeId: string): Promise<{ categories: Category[]; pages: StorePage[] }> {
  const [categories, pages] = await Promise.all([
    services().listCategories(storeId),
    services().listPages(storeId),
  ]);
  return { categories, pages };
}
