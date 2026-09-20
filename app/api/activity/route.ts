// ============================================================
// GET /api/activity?storeId=&limit= — سجل النشاطات
// المالك: الكل (أو متجر محدد) | صاحب المتجر: متجره فقط
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { services } from "@/lib/services";
import { ok, requireStoreActor } from "@/lib/api-utils";
import { getCurrentUser } from "@/lib/session";
import { isOwner } from "@/lib/authorize";

export async function GET(req: NextRequest) {
  const storeIdParam = req.nextUrl.searchParams.get("storeId");
  const limit = Math.min(Number(req.nextUrl.searchParams.get("limit") ?? 50) || 50, 200);

  if (storeIdParam) {
    const actor = await requireStoreActor(storeIdParam);
    if (actor instanceof NextResponse) return actor;
    const logs = await services().listActivity({ storeId: storeIdParam, limit });
    return ok({ logs });
  }

  // بدون storeId: المالك فقط
  const user = await getCurrentUser();
  if (!isOwner(user)) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }
  const logs = await services().listActivity({ storeId: null, limit });
  return ok({ logs });
}
