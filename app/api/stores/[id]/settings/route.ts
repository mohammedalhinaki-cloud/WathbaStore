// ============================================================
// PATCH /api/stores/:id/settings — إعدادات المتجر (واتساب، روابط، عن المتجر)
// المالك: كل الحقول | صاحب المتجر: حوله العامة (واتساب، روابط، عن المتجر)
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { services } from "@/lib/services";
import { ok, badRequest, requireStoreActor } from "@/lib/api-utils";
import { isOwner } from "@/lib/authorize";
import { z } from "zod";

const SCHEMA = z.object({
  aboutText: z.string().max(2000).optional(),
  socialInstagram: z.string().max(300).optional(),
  socialSnapchat: z.string().max(300).optional(),
  socialTiktok: z.string().max(300).optional(),
  socialWhatsApp: z.string().max(30).optional(),
  developerUrl: z.string().max(300).optional(),
  footerBgColor: z.string().max(20).optional(),
  ibanRajhi: z.string().max(30).optional(),
  ibanAlinmaa: z.string().max(30).optional(),
  ibanAlahli: z.string().max(30).optional(),
});

const MEMBER_FIELDS = [
  "aboutText",
  "socialInstagram",
  "socialSnapchat",
  "socialTiktok",
  "socialWhatsApp",
  "footerBgColor",
  "ibanRajhi",
  "ibanAlinmaa",
  "ibanAlahli",
] as const;

export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;
  const actor = await requireStoreActor(id);
  if (actor instanceof NextResponse) return actor;

  const parsed = SCHEMA.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return badRequest("بيانات غير صالحة");
  let patch = parsed.data;

  if (!isOwner(actor)) {
    const restricted: Record<string, unknown> = {};
    for (const f of MEMBER_FIELDS) {
      if (patch[f] !== undefined) restricted[f] = patch[f];
    }
    patch = restricted;
    if (Object.keys(restricted).length === 0) {
      return badRequest("هذه الحقول مقيدة للمالك");
    }
  }

  const settings = await services().updateStoreSettings(id, patch);
  await services().logActivity(
    { id: actor.id, email: actor.email },
    id,
    "settings.updated",
    { fields: Object.keys(patch) }
  );
  return ok({ settings });
}
