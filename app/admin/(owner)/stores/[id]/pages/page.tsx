// باني المتجر — الصفحات
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { services } from "@/lib/services";
import BuilderNav from "@/components/admin/builder-nav";
import PagesManager from "@/components/admin/pages-manager";

export const metadata: Metadata = { title: "الصفحات" };

export default async function PagesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [store, pages] = await Promise.all([
    services().getStore(id),
    services().listPages(id),
  ]);
  if (!store) notFound();

  return (
    <div>
      <h1 className="mb-5 text-2xl font-extrabold text-ink-900">صفحات {store.name}</h1>
      <BuilderNav storeId={store.id} />
      <PagesManager storeId={store.id} pages={pages.map((p) => ({ ...p }))} />
    </div>
  );
}
