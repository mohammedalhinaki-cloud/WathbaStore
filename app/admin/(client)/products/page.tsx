// لوحة العميل — المنتجات
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getStoreCtx } from "@/lib/tenant";
import { services } from "@/lib/services";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/admin/ui";
import ProductsManager from "@/components/admin/products-manager";

export const metadata: Metadata = { title: "المنتجات" };

export default async function ClientProductsPage() {
  const ctx = await getStoreCtx();
  if (!ctx?.bundle) notFound();
  const { store } = ctx.bundle;

  const [products, categories] = await Promise.all([
    services().listProducts(store.id, { includeHidden: true }),
    services().listCategories(store.id, true),
  ]);

  return (
    <div>
      <PageHeader
        title="المنتجات"
        sub="منتجاتك تظهر في المتجر فور حفظها"
        action={
          <Link
            href="/admin/products/new"
            className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-brand-700"
          >
            <Plus className="h-4 w-4" />
            إضافة منتج
          </Link>
        }
      />
      <ProductsManager
        storeId={store.id}
        products={products}
        categories={categories}
        editBase="/admin/products"
      />
    </div>
  );
}
