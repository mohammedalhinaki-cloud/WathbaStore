// POST /api/stores/:id/status — تغيير حالة المتجر (المالك فقط)
import { NextRequest, NextResponse } from "next/server";
import { services } from "@/lib/services";
import { ok, badRequest, requireOwnerUser, serverError } from "@/lib/api-utils";
import type { StoreStatus } from "@/lib/types";

const STATUSES: StoreStatus[] = ["draft", "preparing", "testing", "ready", "delivered", "suspended"];

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireOwnerUser();
    if (user instanceof NextResponse) return user;
    const { id } = await ctx.params;
    const body = await req.json().catch(() => null);
    const status = body?.status as StoreStatus;
    if (!STATUSES.includes(status)) return badRequest("حالة غير صالحة");

    const store = await services().getStore(id);
    if (!store) return badRequest("المتجر غير موجود");

    await services().setStoreStatus(id, status);
    await services().logActivity(
      { id: user.id, email: user.email },
      id,
      "store.status_changed",
      { from: store.status, to: status }
    );
    return ok({ store: await services().getStore(id) });
  } catch (e) {
    return serverError(e);
  }
}
