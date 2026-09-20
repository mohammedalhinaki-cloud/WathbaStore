// ============================================================
// GET /api/clients/:id — صفحة العميل (المالك فقط)
// id هنا هو store_id
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { services } from "@/lib/services";
import { ok, badRequest, requireOwnerUser } from "@/lib/api-utils";

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const user = await requireOwnerUser();
  if (user instanceof NextResponse) return user;
  const { id } = await ctx.params;
  const client = await services().getClient(id);
  if (!client) return badRequest("العميل غير موجود");
  const settings = await services().getStoreSettings(id);
  const products = await services().listProducts(id, { includeHidden: true });
  const logs = await services().listActivity({ storeId: id, limit: 30 });
  return ok({ client, settings, products, logs });
}
