// ============================================================
// POST /api/stores/:id/deliver — تسليم المتجر للعميل (المالك فقط)
// يغيّر الحالة إلى «مسلّم» + ينشئ حساب العميل ويعيد بيانات الدخول
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { services } from "@/lib/services";
import { ok, badRequest, requireOwnerUser, serverError } from "@/lib/api-utils";

export async function POST(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireOwnerUser();
    if (user instanceof NextResponse) return user;
    const { id } = await ctx.params;

    const store = await services().getStore(id);
    if (!store) return badRequest("المتجر غير موجود");
    if (store.status === "delivered") {
      return badRequest("المتجر مسلّم بالفعل");
    }

    const res = await services().deliverStore(id, user.email);
    if (!res.ok) return badRequest(res.error ?? "فشل التسليم");

    return ok({
      ok: true,
      credentials: res.credentials,
      store: await services().getStore(id),
    });
  } catch (e) {
    return serverError(e);
  }
}
