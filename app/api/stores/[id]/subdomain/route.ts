// POST /api/stores/:id/subdomain — تغيير النطاق الفرعي (المالك فقط، قبل التسليم)
import { NextRequest, NextResponse } from "next/server";
import { services } from "@/lib/services";
import { ok, badRequest, requireOwnerUser } from "@/lib/api-utils";
import { validateSubdomain } from "@/lib/subdomain";

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const user = await requireOwnerUser();
  if (user instanceof NextResponse) return user;
  const { id } = await ctx.params;

  const store = await services().getStore(id);
  if (!store) return badRequest("المتجر غير موجود");
  if (store.status === "delivered") {
    return badRequest("لا يمكن تغيير النطاق الفرعي بعد تسليم المتجر");
  }

  const body = await req.json().catch(() => null);
  const subdomain = String(body?.subdomain ?? "").trim().toLowerCase();
  const check = validateSubdomain(subdomain);
  if (!check.ok) return badRequest(check.reason!);
  if (subdomain === store.subdomain) return ok({ ok: true });

  const res = await services().changeSubdomain(id, subdomain);
  if (!res.ok) return badRequest(res.error ?? "فشل التغيير");
  await services().logActivity(
    { id: user.id, email: user.email },
    id,
    "store.subdomain_changed",
    { from: store.subdomain, to: subdomain }
  );
  return ok({ ok: true, subdomain });
}
