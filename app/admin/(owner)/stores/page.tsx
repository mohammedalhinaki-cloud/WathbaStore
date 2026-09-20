// وثبة — قائمة المتاجر (المالك)
import type { Metadata } from "next";
import Link from "next/link";
import { getTenant } from "@/lib/tenant";
import { services } from "@/lib/services";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/admin/ui";
import StoresTable from "@/components/admin/stores-table";

export const metadata: Metadata = { title: "المتاجر" };

export default async function StoresPage() {
  const tenant = await getTenant();
  const stores = await services().listStores();

  return (
    <div>
      <PageHeader
        title="المتاجر"
        sub="جميع متاجر المنصة وحالتها"
        action={
          <Link
            href="/admin/stores/new"
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-l from-accent-500 to-accent-400 px-4 py-2.5 text-sm font-extrabold text-ink-950 shadow-lg shadow-accent-500/20 transition-transform hover:scale-[1.02]"
          >
            <Plus className="h-4 w-4" />
            إنشاء متجر
          </Link>
        }
      />
      <StoresTable stores={stores} host={tenant.host} />
    </div>
  );
}
