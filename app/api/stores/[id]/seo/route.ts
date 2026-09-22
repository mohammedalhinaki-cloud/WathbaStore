// ============================================================
// PATCH /api/stores/:id/seo — إعدادات SEO المستقلة لكل متجر
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { services } from "@/lib/services";
import { ok, badRequest, requireStoreActor, serverError } from "@/lib/api-utils";
import { z } from "zod";

const SCHEMA = z.object({
  seoTitle: z.string().max(200).optional(),
  seoDescription: z.string().max(500).optional(),
  seoKeywords: z.string().max(300).optional(),
  seoOgImage: z.string().max(500).optional(),
  seoFavicon: z.string().max(500).optional(),
  seoCanonical: z.string().max(300).optional(),
});

export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await ctx.params;
    const actor = await requireStoreActor(id);
    if (actor instanceof NextResponse) return actor;

    const parsed = SCHEMA.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return badRequest("بيانات غير صالحة");

    const settings = await services().updateStoreSettings(id, parsed.data);
    await services().logActivity(
      { id: actor.id, email: actor.email },
      id,
      "seo.updated",
      { fields: Object.keys(parsed.data) }
    );
    return ok({ settings });
  } catch (e) {
    return serverError(e);
  }
}
