// باني المتجر — المنتجات
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { services } from "@/lib/services";
import { Plus } from "lucide-react";
import BuilderNav from "@/components/admin/builder-nav";
import ProductsManager from "@/components/admin/products-manager";

export const metadata: Metadata = { title: "المنتجات" };

export default async function ProductsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [store, products, categories] = await Promise.all([
    services().getStore(id),
    services().listProducts(id, { includeHidden: true }),
    services().listCategories(id, true),
  ]);
  if (!store) notFound();

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-extrabold text-ink-900">منتجات {store.name}</h1>
        <Link
          href={`/admin/stores/${store.id}/products/new`}
          className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-brand-700"
        >
          <Plus className="h-4 w-4" />
          إضافة منتج
        </Link>
      </div>
      <BuilderNav storeId={store.id} />
      <ProductsManager
        storeId={store.id}
        products={products}
        categories={categories}
        editBase={`/admin/stores/${store.id}/products`}
      />
    </div>
  );
}
