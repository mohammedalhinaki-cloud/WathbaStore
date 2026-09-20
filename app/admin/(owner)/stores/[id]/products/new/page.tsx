// باني المتجر — منتج جديد
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { services } from "@/lib/services";
import BuilderNav from "@/components/admin/builder-nav";
import ProductForm from "@/components/admin/product-form";

export const metadata: Metadata = { title: "منتج جديد" };

export default async function NewProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [store, categories] = await Promise.all([
    services().getStore(id),
    services().listCategories(id, true),
  ]);
  if (!store) notFound();

  return (
    <div>
      <h1 className="mb-5 text-2xl font-extrabold text-ink-900">منتج جديد — {store.name}</h1>
      <BuilderNav storeId={store.id} />
      <ProductForm
        storeId={store.id}
        categories={categories}
        backHref={`/admin/stores/${store.id}/products`}
      />
    </div>
  );
}
