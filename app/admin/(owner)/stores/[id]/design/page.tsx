// باني المتجر — التصميم (قالب، خط، ألوان، ترتيب الأقسام)
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { services } from "@/lib/services";
import BuilderNav from "@/components/admin/builder-nav";
import DesignForm from "@/components/admin/design-form";

export const metadata: Metadata = { title: "التصميم" };

export default async function DesignPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [store, settings] = await Promise.all([
    services().getStore(id),
    services().getStoreSettings(id),
  ]);
  if (!store) notFound();

  return (
    <div>
      <h1 className="mb-5 text-2xl font-extrabold text-ink-900">تصميم {store.name}</h1>
      <BuilderNav storeId={store.id} />
      <DesignForm store={store} settings={settings} />
    </div>
  );
}
