// POST /api/categories/:id/move — إعادة ترتيب قسم { dir: 'up' | 'down' }
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
  let found: { id: string; storeId: string; name: string } | null = null;
  for (const s of stores) {
    const cats = await svc.listCategories(s.id, true);
    found = cats.find((c) => c.id === id) ?? null;
    if (found) break;
  }
  if (!found) return badRequest("القسم غير موجود");

  const actor = await requireStoreActor(found.storeId);
  if (actor instanceof NextResponse) return actor;
  await svc.moveCategory(id, dir);
  return ok({ ok: true });
}
