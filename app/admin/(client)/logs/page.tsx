// لوحة العميل — سجل نشاط متجره
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getStoreCtx } from "@/lib/tenant";
import { services } from "@/lib/services";
import { PageHeader } from "@/components/admin/ui";
import { ActivityList } from "@/components/admin/site-managers";

export const metadata: Metadata = { title: "سجل النشاط" };

export default async function ClientLogsPage() {
  const ctx = await getStoreCtx();
  if (!ctx?.bundle) notFound();
  const { store } = ctx.bundle;
  const logs = await services().listActivity({ storeId: store.id, limit: 50 });

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="سجل النشاط" sub="آخر العمليات على متجرك" />
      <ActivityList logs={logs} stores={[{ id: store.id, name: store.name }]} />
    </div>
  );
}
