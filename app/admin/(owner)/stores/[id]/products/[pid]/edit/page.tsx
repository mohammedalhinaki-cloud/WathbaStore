// باني المتجر — تعديل منتج
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { services } from "@/lib/services";
import BuilderNav from "@/components/admin/builder-nav";
import ProductForm from "@/components/admin/product-form";

export const metadata: Metadata = { title: "تعديل منتج" };

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string; pid: string }>;
}) {
  const { id, pid } = await params;
  const [store, product, categories] = await Promise.all([
    services().getStore(id),
    services().getProduct(id, pid),
    services().listCategories(id, true),
  ]);
  if (!store || !product) notFound();

  return (
    <div>
      <h1 className="mb-5 text-2xl font-extrabold text-ink-900">تعديل: {product.name}</h1>
      <BuilderNav storeId={store.id} />
      <ProductForm
        storeId={store.id}
        categories={categories}
        product={product}
        backHref={`/admin/stores/${store.id}/products`}
      />
    </div>
  );
}
