// ============================================================
// تخطيط لوحة المتجر — بوابته: نطاق المتجر + (صاحب المتجر أو المالك الرئيسي)
//
// العزل:
//   • صاحب المتجر → متجره فقط (store_members).
//   • المالك الرئيسي Master Owner → **كل** متجر بنفس واجهة صاحب المتجر
//     (نفس الصفحات والوظائف: المنتجات، الأقسام، المظهر، السجل)، وأعلى منها
//     في لوحة المالك (تسليم، حالة، نطاق فرعي، حذف…).
// ============================================================

import { notFound, redirect } from "next/navigation";
import { getStoreCtx } from "@/lib/tenant";
import { getCurrentUser } from "@/lib/session";
import { storeHref } from "@/lib/links";
import { canAccessStorePanel, isMasterOwner } from "@/lib/authorize";
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
  // المالك الرئيسي يدير أي متجر — وصاحب المتجر يدير متجره فقط
  if (!canAccessStorePanel(user, store.id)) {
    redirect("/admin/login");
  }

  return (
    <ClientShell
      storeName={store.name}
      subdomain={store.subdomain}
      user={user}
      storeUrl={await storeHref(store.subdomain)}
      masterOwner={isMasterOwner(user)}
    >
      {children}
    </ClientShell>
  );
}
