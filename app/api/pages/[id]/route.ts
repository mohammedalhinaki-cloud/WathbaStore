// ============================================================
// PATCH  /api/pages/:id — تعديل صفحة
// DELETE /api/pages/:id — حذف صفحة
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { services } from "@/lib/services";
import { ok, badRequest, requireStoreActor } from "@/lib/api-utils";
import { z } from "zod";

const SCHEMA = z.object({
  title: z.string().min(2).max(80).optional(),
  slug: z.string().max(80).optional(),
  content: z.string().max(8000).optional(),
  isVisible: z.boolean().optional(),
});

async function findPage(id: string) {
  const svc = services();
  const stores = await svc.listStores();
  for (const s of stores) {
    const pages = await svc.listPages(s.id);
    const page = pages.find((p) => p.id === id);
    if (page) return page;
  }
  return null;
}

export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;
  const page = await findPage(id);
  if (!page) return badRequest("الصفحة غير موجودة");
  const actor = await requireStoreActor(page.storeId);
  if (actor instanceof NextResponse) return actor;

  const parsed = SCHEMA.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return badRequest("بيانات غير صالحة");
  const updated = await services().updatePage(id, parsed.data);
  await services().logActivity(
    { id: actor.id, email: actor.email },
    page.storeId,
    "page.updated",
    { title: updated.title }
  );
  return ok({ page: updated });
}

export async function DELETE(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;
  const page = await findPage(id);
  if (!page) return badRequest("الصفحة غير موجودة");
  const actor = await requireStoreActor(page.storeId);
  if (actor instanceof NextResponse) return actor;

  await services().deletePage(id);
  await services().logActivity(
    { id: actor.id, email: actor.email },
    page.storeId,
    "page.deleted",
    { title: page.title }
  );
  return ok({ ok: true });
}
