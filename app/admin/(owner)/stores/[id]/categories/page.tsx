// باني المتجر — الأقسام
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { services } from "@/lib/services";
import BuilderNav from "@/components/admin/builder-nav";
import CategoriesManager from "@/components/admin/categories-manager";

export const metadata: Metadata = { title: "الأقسام" };

export default async function CategoriesPage({
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
      <h1 className="mb-5 text-2xl font-extrabold text-ink-900">أقسام {store.name}</h1>
      <BuilderNav storeId={store.id} />
      <CategoriesManager
        storeId={store.id}
        categories={categories.map((c) => ({ ...c }))}
      />
    </div>
  );
}
