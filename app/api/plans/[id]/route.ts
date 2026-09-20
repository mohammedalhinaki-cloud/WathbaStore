// PATCH/DELETE /api/plans/:id — تعديل/حذف باقة (المالك)
import { NextRequest, NextResponse } from "next/server";
import { services } from "@/lib/services";
import { ok, badRequest, requireOwnerUser } from "@/lib/api-utils";
import { z } from "zod";

const SCHEMA = z.object({
  name: z.string().min(2).max(60).optional(),
  price: z.number().min(0).optional(),
  oldPrice: z.number().min(0).nullable().optional(),
  currency: z.string().max(10).optional(),
  features: z.array(z.string().max(200)).max(20).optional(),
  isFeatured: z.boolean().optional(),
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
  if (!parsed.success) return badRequest("بيانات غير صالحة");
  const plan = await services().updatePlan(id, parsed.data);
  return ok({ plan });
}

export async function DELETE(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const user = await requireOwnerUser();
  if (user instanceof NextResponse) return user;
  const { id } = await ctx.params;
  await services().deletePlan(id);
  return ok({ ok: true });
}
