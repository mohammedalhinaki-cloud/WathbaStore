// لوحة العميل — الأقسام
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getStoreCtx } from "@/lib/tenant";
import { services } from "@/lib/services";
import { PageHeader } from "@/components/admin/ui";
import CategoriesManager from "@/components/admin/categories-manager";

export const metadata: Metadata = { title: "الأقسام" };

export default async function ClientCategoriesPage() {
  const ctx = await getStoreCtx();
  if (!ctx?.bundle) notFound();
  const { store } = ctx.bundle;
  const categories = await services().listCategories(store.id, true);

  return (
    <div>
      <PageHeader title="الأقسام" sub="نظّم منتجاتك في أقسام واضحة" />
      <CategoriesManager storeId={store.id} categories={categories.map((c) => ({ ...c }))} />
    </div>
  );
}
