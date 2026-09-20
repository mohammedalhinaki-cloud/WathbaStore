// لوحة العميل — منتج جديد
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getStoreCtx } from "@/lib/tenant";
import { services } from "@/lib/services";
import { PageHeader } from "@/components/admin/ui";
import ProductForm from "@/components/admin/product-form";

export const metadata: Metadata = { title: "منتج جديد" };

export default async function ClientNewProductPage() {
  const ctx = await getStoreCtx();
  if (!ctx?.bundle) notFound();
  const { store } = ctx.bundle;
  const categories = await services().listCategories(store.id, true);

  return (
    <div>
      <PageHeader title="منتج جديد" />
      <ProductForm storeId={store.id} categories={categories} backHref="/admin/products" />
    </div>
  );
}
