// ============================================================
// تخطيط لوحة العميل — بوابته: نطاق المتجر + عضوية المتجر
// عزل صارم: عضو هذا المتجر فقط (لا المالك العام، لا أعضاء متجر آخر)
// ============================================================

import { notFound, redirect } from "next/navigation";
import { getStoreCtx } from "@/lib/tenant";
import { getCurrentUser } from "@/lib/session";
import { storeHref } from "@/lib/links";
import ClientShell from "@/components/admin/client-shell";

export default async function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const ctx = await getStoreCtx();
  if (!ctx?.bundle) notFound();
  const { store } = ctx.bundle;

  const user = await getCurrentUser();
  if (!user) redirect("/admin/login");
  if (!user.memberships.some((m) => m.storeId === store.id)) {
    redirect("/admin/login");
  }

  return (
    <ClientShell
      storeName={store.name}
      subdomain={store.subdomain}
      user={user}
      storeUrl={await storeHref(store.subdomain)}
    >
      {children}
    </ClientShell>
  );
}
