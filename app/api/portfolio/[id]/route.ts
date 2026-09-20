// PATCH/DELETE /api/portfolio/:id — تعديل/حذف عمل (المالك)
import { NextRequest, NextResponse } from "next/server";
import { services } from "@/lib/services";
import { ok, badRequest, requireOwnerUser } from "@/lib/api-utils";
import { z } from "zod";

const SCHEMA = z.object({
  title: z.string().min(2).max(80).optional(),
  description: z.string().max(400).optional(),
  imageUrl: z.string().max(600).optional(),
  storeUrl: z.string().max(300).optional(),
  tags: z.string().max(200).optional(),
  isVisible: z.boolean().optional(),
  sortOrder: z.number().int().min(0).optional(),
});

export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const user = await requireOwnerUser();
  if (user instanceof NextResponse) return user;
  const { id } = await ctx.params;
  const parsed = SCHEMA.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return badRequest("بيانات غير صالة");
  const item = await services().updatePortfolio(id, parsed.data);
  return ok({ item });
}

export async function DELETE(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const user = await requireOwnerUser();
  if (user instanceof NextResponse) return user;
  const { id } = await ctx.params;
  await services().deletePortfolio(id);
  return ok({ ok: true });
}
