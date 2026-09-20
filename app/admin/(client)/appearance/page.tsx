// لوحة العميل — المظهر وبيانات المتجر
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getStoreCtx } from "@/lib/tenant";
import { services } from "@/lib/services";
import { PageHeader } from "@/components/admin/ui";
import ClientAppearanceForm from "./appearance-form";

export const metadata: Metadata = { title: "المظهر والبيانات" };

export default async function ClientAppearancePage() {
  const ctx = await getStoreCtx();
  if (!ctx?.bundle) notFound();
  const { store, settings } = ctx.bundle;

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="المظهر وبيانات المتجر"
        sub="بيانات متجرك كما تظهر لزوارك — الألوان والأساسيات"
      />
      <ClientAppearanceForm store={store} settings={settings} />
    </div>
  );
}
