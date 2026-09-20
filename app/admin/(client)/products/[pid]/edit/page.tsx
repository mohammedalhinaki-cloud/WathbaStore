// لوحة العميل — تعديل منتج
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getStoreCtx } from "@/lib/tenant";
import { services } from "@/lib/services";
import { PageHeader } from "@/components/admin/ui";
import ProductForm from "@/components/admin/product-form";

export const metadata: Metadata = { title: "تعديل منتج" };

export default async function ClientEditProductPage({
  params,
}: {
  params: Promise<{ pid: string }>;
}) {
  const ctx = await getStoreCtx();
  const { pid } = await params;
  if (!ctx?.bundle) notFound();
  const { store } = ctx.bundle;

  const [product, categories] = await Promise.all([
    services().getProduct(store.id, pid),
    services().listCategories(store.id, true),
  ]);
  if (!product) notFound();

  return (
    <div>
      <PageHeader title={`تعديل: ${product.name}`} />
      <ProductForm
        storeId={store.id}
        categories={categories}
        product={product}
        backHref="/admin/products"
      />
    </div>
  );
}
