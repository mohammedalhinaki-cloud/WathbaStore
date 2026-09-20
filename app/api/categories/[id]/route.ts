// ============================================================
// PATCH  /api/categories/:id — تعديل قسم
// DELETE /api/categories/:id — حذف قسم
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { services } from "@/lib/services";
import { ok, badRequest, requireStoreActor } from "@/lib/api-utils";
import { z } from "zod";

const SCHEMA = z.object({
  name: z.string().min(2).max(60).optional(),
  slug: z.string().max(80).optional(),
  isVisible: z.boolean().optional(),
  sortOrder: z.number().int().min(0).optional(),
});

export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;
  const svc = services();
  const list = await listAll();
  const cat = list.find((c) => c.id === id);
  if (!cat) return badRequest("القسم غير موجود");
  const actor = await requireStoreActor(cat.storeId);
  if (actor instanceof NextResponse) return actor;

  const parsed = SCHEMA.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return badRequest("بيانات غير صالحة");
  const category = await svc.updateCategory(id, parsed.data);
  await svc.logActivity(
    { id: actor.id, email: actor.email },
    cat.storeId,
    "category.updated",
    { name: category.name }
  );
  return ok({ category });
}

export async function DELETE(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;
  const svc = services();
  const list = await listAll();
  const cat = list.find((c) => c.id === id);
  if (!cat) return badRequest("القسم غير موجود");
  const actor = await requireStoreActor(cat.storeId);
  if (actor instanceof NextResponse) return actor;

  await svc.deleteCategory(id);
  await svc.logActivity(
    { id: actor.id, email: actor.email },
    cat.storeId,
    "category.deleted",
    { name: cat.name }
  );
  return ok({ ok: true });
}

// جميع الأقسام (المالك يرى كل شيء عبر RLS؛ في الوضع المحلي نقراء مباشرة)
async function listAll() {
  const stores = await services().listStores();
  const out: { id: string; storeId: string; name: string }[] = [];
  for (const s of stores) {
    const cats = await services().listCategories(s.id, true);
    for (const c of cats) out.push(c);
  }
  return out;
}
