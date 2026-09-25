// معون — قائمة العملاء (المالك)
import type { Metadata } from "next";
import Link from "next/link";
import { services } from "@/lib/services";
import { mainDomain, formatDateShort } from "@/lib/constants";
import { PageHeader, StatusBadge, EmptyState, Card } from "@/components/admin/ui";

export const metadata: Metadata = { title: "العملاء" };

export default async function ClientsPage() {
  const clients = await services().listClients();

  return (
    <div>
      <PageHeader title="العملاء" sub="أصحاب المتاجر وبياناتهم" />
      {clients.length === 0 ? (
        <EmptyState icon="👥" title="لا يوجد عملاء بعد" sub="سيظهر كل عميل عند إنشاء متجره" />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {clients.map((c) => (
            <Link
              key={c.store.id}
              href={`/admin/clients/${c.store.id}`}
              className="group rounded-2xl border border-ink-150 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  {c.store.logoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={c.store.logoUrl} alt="" className="h-11 w-11 rounded-xl object-cover" />
                  ) : (
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-100 font-extrabold text-brand-700">
                      {c.store.name.charAt(0)}
                    </span>
                  )}
                  <div>
                    <p className="font-extrabold text-ink-900 group-hover:text-brand-600">{c.store.ownerName || "بدون اسم"}</p>
                    <p className="text-xs text-ink-400">{c.store.name}</p>
                  </div>
                </div>
                <StatusBadge status={c.store.status} />
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                <p className="rounded-lg bg-ink-50 px-3 py-2 text-ink-500" dir="ltr">
                  {c.store.subdomain}.{mainDomain()}
                </p>
                <p className="truncate rounded-lg bg-ink-50 px-3 py-2 text-ink-500" dir="ltr">
                  {c.store.ownerEmail || "—"}
                </p>
              </div>
              <p className="mt-3 text-[11px] text-ink-400">
                {c.productCount} منتج · {c.categoryCount} قسم · أُنشئ {formatDateShort(c.store.createdAt)}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
