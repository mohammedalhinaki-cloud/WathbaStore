// ============================================================
// PATCH /api/stores/:id/design — إعدادات التصميم
// (المالك: كل شيء | صاحب المتجر: الألوان فقط)
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { services } from "@/lib/services";
import { ok, badRequest, requireStoreActor } from "@/lib/api-utils";
import { isOwner } from "@/lib/authorize";
import { z } from "zod";
import type { SectionKey } from "@/lib/types";

const SCHEMA = z.object({
  template: z.enum(["modern", "classic", "minimal"]).optional(),
  font: z.enum(["cairo", "tajawal", "almarai", "ibm-plex"]).optional(),
  primaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  secondaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  sectionOrder: z
    .array(z.enum(["hero", "categories", "products", "pages", "footer"]))
    .optional(),
});

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
    // صاحب المتجر: الألوان فقط (القالب وترتيب الأقسام قرار المالك)
    patch = {
      primaryColor: patch.primaryColor,
      secondaryColor: patch.secondaryColor,
    };
    if (!patch.primaryColor && !patch.secondaryColor) {
      return badRequest("هذه الإعدادات قرار المالك");
    }
  }

  const settings = await services().updateStoreSettings(id, {
    template: patch.template,
    font: patch.font,
    primaryColor: patch.primaryColor,
    secondaryColor: patch.secondaryColor,
    sectionOrder: patch.sectionOrder as SectionKey[] | undefined,
  });
  await services().logActivity(
    { id: actor.id, email: actor.email },
    id,
    "design.updated",
    { fields: Object.keys(patch) }
  );
  return ok({ settings });
}
