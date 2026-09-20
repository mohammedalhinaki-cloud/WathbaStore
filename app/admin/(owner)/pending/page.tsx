// وثبة — المتاجر غير المسلّمة
import type { Metadata } from "next";
import { getTenant } from "@/lib/tenant";
import { services } from "@/lib/services";
import { PageHeader } from "@/components/admin/ui";
import StoresTable from "@/components/admin/stores-table";

export const metadata: Metadata = { title: "المتاجر غير المسلّمة" };

export default async function PendingPage() {
  const tenant = await getTenant();
  const stores = (await services().listStores()).filter(
    (s) => s.status !== "delivered"
  );
  return (
    <div>
      <PageHeader title="المتاجر غير المسلّمة" sub="قيد الإنشاء أو التجهيز أو الاختبار" />
      <StoresTable stores={stores} host={tenant.host} />
    </div>
  );
}
