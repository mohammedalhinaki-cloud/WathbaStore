// معين — سجل النشاطات (المنصة كلها)
import type { Metadata } from "next";
import { services } from "@/lib/services";
import { PageHeader } from "@/components/admin/ui";
import { ActivityList } from "@/components/admin/site-managers";

export const metadata: Metadata = { title: "سجل النشاطات" };

export default async function ActivityPage() {
  const [logs, stores] = await Promise.all([
    services().listActivity({ limit: 100 }),
    services().listStores(),
  ]);
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="سجل النشاطات" sub="كل العمليات على المنصة والمتاجر" />
      <ActivityList logs={logs} stores={stores.map((s) => ({ id: s.id, name: s.name }))} />
    </div>
  );
}
