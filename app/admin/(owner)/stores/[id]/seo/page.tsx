// باني المتجر — SEO المستقل لكل متجر
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { services } from "@/lib/services";
import { mainDomain } from "@/lib/constants";
import BuilderNav from "@/components/admin/builder-nav";
import SeoForm from "@/components/admin/seo-form";

export const metadata: Metadata = { title: "SEO" };

export default async function SeoPage({
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

  const canonical = `https://${store.subdomain}.${mainDomain()}`;

  return (
    <div>
      <h1 className="mb-5 text-2xl font-extrabold text-ink-900">SEO — {store.name}</h1>
      <BuilderNav storeId={store.id} />
      <SeoForm store={store} settings={settings} canonicalBase={canonical} />
    </div>
  );
}
