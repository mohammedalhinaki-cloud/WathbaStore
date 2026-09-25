// معون — المتاجر المسلّمة
import type { Metadata } from "next";
import { getTenant } from "@/lib/tenant";
import { services } from "@/lib/services";
import { PageHeader } from "@/components/admin/ui";
import StoresTable from "@/components/admin/stores-table";

export const metadata: Metadata = { title: "المتاجر المسلّمة" };

export default async function DeliveredPage() {
  const tenant = await getTenant();
  const stores = (await services().listStores()).filter((s) => s.status === "delivered");
  return (
    <div>
      <PageHeader title="المتاجر المسلّمة" sub="متاجر تم تسليمها للعملاء وتعمل" />
      <StoresTable stores={stores} host={tenant.host} />
    </div>
  );
}
