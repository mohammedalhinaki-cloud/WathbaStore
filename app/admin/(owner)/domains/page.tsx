// وثبة — إدارة النطاقات الفرعية (المالك): تغيير النطاق في أي وقت
import type { Metadata } from "next";
import { services } from "@/lib/services";
import { mainDomain } from "@/lib/constants";
import { PageHeader, StatusBadge, Card } from "@/components/admin/ui";
import SubdomainManager from "@/components/admin/subdomain-manager";

export const metadata: Metadata = { title: "النطاقات الفرعية" };

export default async function DomainsPage() {
  const stores = await services().listStores();
  return (
    <div>
      <PageHeader
        title="الدومينات والنطاقات الفرعية"
        sub={`كل متجر يعمل على نطاق فرعي من ${mainDomain()} — يمكن تغيير النطاق في أي وقت، ويتوقف العمل بالرابط القديم بعد التغيير`}
      />
      <div className="grid gap-4 md:grid-cols-2">
        {stores.map((s) => (
          <SubdomainManager key={s.id} store={s} />
        ))}
      </div>
    </div>
  );
}
