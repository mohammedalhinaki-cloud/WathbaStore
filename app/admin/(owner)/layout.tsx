// ============================================================
// تخطيط لوحة المالك — بوابته: الموقع الرئيسي + دور المالك
// ============================================================

import { notFound, redirect } from "next/navigation";
import { getTenant } from "@/lib/tenant";
import { getCurrentUser } from "@/lib/session";
import OwnerShell from "@/components/admin/owner-shell";

export default async function OwnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const tenant = await getTenant();
  if (tenant.tenant !== "main") notFound();

  const user = await getCurrentUser();
  if (!user) redirect("/admin/login");
  if (user.role !== "owner") redirect("/admin/login");

  return <OwnerShell user={user}>{children}</OwnerShell>;
}
