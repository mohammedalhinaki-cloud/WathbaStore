// POST /api/products/:id/move — إعادة ترتيب منتج { dir: 'up' | 'down' }
import { NextRequest, NextResponse } from "next/server";
import { services } from "@/lib/services";
import { ok, badRequest, requireStoreActor } from "@/lib/api-utils";

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;
  const body = await req.json().catch(() => null);
  const dir = body?.dir === "up" ? "up" : body?.dir === "down" ? "down" : null;
  if (!dir) return badRequest("dir غير صالح");

  const svc = services();
  const stores = await svc.listStores();
  let product = null;
  for (const s of stores) {
    product = await svc.getProduct(s.id, id);
    if (product) break;
  }
  if (!product) return badRequest("المنتج غير موجود");

  const actor = await requireStoreActor(product.storeId);
  if (actor instanceof NextResponse) return actor;
  await svc.moveProduct(product.id, dir);
  return ok({ ok: true });
}
