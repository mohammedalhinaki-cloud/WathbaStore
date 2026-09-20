// ============================================================
// GET  /api/pages?storeId= — صفحات المتجر
// POST /api/pages — إضافة صفحة
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { services } from "@/lib/services";
import { ok, badRequest, requireStoreActor } from "@/lib/api-utils";
import { z } from "zod";

const SCHEMA = z.object({
  storeId: z.string().min(1),
  title: z.string().min(2, "عنوان الصفحة قصير جدًا").max(80),
  slug: z.string().max(80).optional(),
  content: z.string().max(8000).optional().default(""),
  isVisible: z.boolean().optional().default(true),
});

export async function GET(req: NextRequest) {
  const storeId = req.nextUrl.searchParams.get("storeId");
  if (!storeId) return badRequest("storeId مطلوب");
  const actor = await requireStoreActor(storeId);
  if (actor instanceof NextResponse) return actor;
  const pages = await services().listPages(storeId);
  return ok({ pages });
}

export async function POST(req: NextRequest) {
  const parsed = SCHEMA.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return badRequest(parsed.error.issues[0]?.message ?? "بيانات غير صالحة");
  }
  const { storeId, title, slug, content, isVisible } = parsed.data;
  const actor = await requireStoreActor(storeId);
  if (actor instanceof NextResponse) return actor;

  const page = await services().createPage(storeId, { title, slug, content, isVisible });
  await services().logActivity(
    { id: actor.id, email: actor.email },
    storeId,
    "page.created",
    { title }
  );
  return ok({ page }, 201);
}
