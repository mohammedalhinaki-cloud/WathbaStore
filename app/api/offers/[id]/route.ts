// PATCH/DELETE /api/offers/:id — تعديل/حذف عرض (المالك)
import { NextRequest, NextResponse } from "next/server";
import { services } from "@/lib/services";
import { ok, badRequest, requireOwnerUser } from "@/lib/api-utils";
import { z } from "zod";

const SCHEMA = z.object({
  title: z.string().min(2).max(120).optional(),
  description: z.string().max(600).optional(),
  price: z.number().min(0).optional(),
  oldPrice: z.number().min(0).nullable().optional(),
  currency: z.string().max(10).optional(),
  startsAt: z.string().nullable().optional(),
  endsAt: z.string().nullable().optional(),
  isActive: z.boolean().optional(),
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
  const offer = await services().updateOffer(id, parsed.data);
  return ok({ offer });
}

export async function DELETE(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const user = await requireOwnerUser();
  if (user instanceof NextResponse) return user;
  const { id } = await ctx.params;
  await services().deleteOffer(id);
  return ok({ ok: true });
}
