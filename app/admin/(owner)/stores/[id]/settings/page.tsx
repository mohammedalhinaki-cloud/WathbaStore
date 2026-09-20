// باني المتجر — إعدادات المتجر (روابط التواصل + الموقع المطور)
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { services } from "@/lib/services";
import BuilderNav from "@/components/admin/builder-nav";
import StoreSettingsForm from "@/components/admin/store-settings-form";

export const metadata: Metadata = { title: "إعدادات المتجر" };

export default async function StoreSettingsPage({
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
      <h1 className="mb-5 text-2xl font-extrabold text-ink-900">إعدادات {store.name}</h1>
      <BuilderNav storeId={store.id} />
      <StoreSettingsForm store={store} settings={settings} />
    </div>
  );
}
