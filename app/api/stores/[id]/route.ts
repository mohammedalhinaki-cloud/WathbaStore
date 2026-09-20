// ============================================================
// GET   /api/stores/:id — بيانات المتجر (المالك أو عضو المتجر)
// PATCH /api/stores/:id — تعديل بيانات المتجر
//   - المالك: كل الحقول
//   - صاحب المتجر: بياناته العامة فقط (الاسم، الوصف، الواتساب، الشعار، الغلاف)
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { services } from "@/lib/services";
import { ok, badRequest, requireStoreActor } from "@/lib/api-utils";
import { isOwner } from "@/lib/authorize";
import { z } from "zod";

const PatchSchema = z
  .object({
    name: z.string().min(2).max(80).optional(),
    ownerName: z.string().max(80).optional(),
    ownerPhone: z.string().max(30).optional(),
    ownerEmail: z.string().email().max(120).or(z.literal("")).optional(),
    whatsapp: z.string().max(30).optional(),
    description: z.string().max(500).optional(),
    logoUrl: z.string().nullable().optional(),
    coverUrl: z.string().nullable().optional(),
  })
  .partial();

const MEMBER_FIELDS = ["name", "whatsapp", "description", "logoUrl", "coverUrl"] as const;

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;
  const actor = await requireStoreActor(id);
  if (actor instanceof NextResponse) return actor;
  const store = await services().getStore(id);
  if (!store) return badRequest("المتجر غير موجود");
  const settings = await services().getStoreSettings(id);
  return ok({ store, settings });
}

export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;
  const actor = await requireStoreActor(id);
  if (actor instanceof NextResponse) return actor;

  const body = (await req.json().catch(() => null)) as Record<string, unknown>;
  const parsed = PatchSchema.safeParse(body ?? {});
  if (!parsed.success) return badRequest("بيانات غير صالحة");
  let patch = parsed.data;

  if (!isOwner(actor)) {
    // عزل صارم: صاحب المتجر يعدّل حقوله فقط
    const restricted: Record<string, unknown> = {};
    for (const f of MEMBER_FIELDS) {
      if (patch[f] !== undefined) restricted[f] = patch[f];
    }
    patch = restricted;
    if (Object.keys(restricted).length === 0) {
      return badRequest("هذه الحقول مقيدة للمالك");
    }
  }

  const store = await services().updateStore(id, patch);
  await services().logActivity(
    { id: actor.id, email: actor.email },
    id,
    "store.updated",
    { fields: Object.keys(patch) }
  );
  return ok({ store });
}
