// ============================================================
// GET  /api/categories?storeId=&includeHidden= — أقسام المتجر
// POST /api/categories — إضافة قسم
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { services } from "@/lib/services";
import { ok, badRequest, requireStoreActor, serverError } from "@/lib/api-utils";
import { z } from "zod";

const SCHEMA = z.object({
  storeId: z.string().min(1),
  name: z.string().min(2, "اسم القسم قصير جدًا").max(60),
  slug: z.string().max(80).optional(),
  isVisible: z.boolean().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const storeId = req.nextUrl.searchParams.get("storeId");
    if (!storeId) return badRequest("storeId مطلوب");
    const actor = await requireStoreActor(storeId);
    if (actor instanceof NextResponse) return actor;
    const includeHidden = req.nextUrl.searchParams.get("includeHidden") === "1";
    const categories = await services().listCategories(storeId, includeHidden);
    return ok({ categories });
  } catch (e) {
    return serverError(e);
  }
}

export async function POST(req: NextRequest) {
  try {
    const parsed = SCHEMA.safeParse(await req.json().catch(() => null));
    if (!parsed.success) {
      return badRequest(parsed.error.issues[0]?.message ?? "بيانات غير صالحة");
    }
    const { storeId, name, slug, isVisible } = parsed.data;
    const actor = await requireStoreActor(storeId);
    if (actor instanceof NextResponse) return actor;

    const category = await services().createCategory(storeId, { name, slug, isVisible });
    await services().logActivity(
      { id: actor.id, email: actor.email },
      storeId,
      "category.created",
      { name }
    );
    return ok({ category }, 201);
  } catch (e) {
    return serverError(e);
  }
}
