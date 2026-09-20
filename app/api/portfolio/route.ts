// ============================================================
// GET  /api/portfolio — الأعمال المعروضة (للعامة: الظاهرة فقط)
// POST /api/portfolio — إضافة عمل (المالك)
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { services } from "@/lib/services";
import { ok, requireOwnerUser } from "@/lib/api-utils";
import { z } from "zod";

const SCHEMA = z.object({
  title: z.string().min(2, "اسم العمل قصير جدًا").max(80),
  description: z.string().max(400).optional().default(""),
  imageUrl: z.string().max(600).default(""),
  storeUrl: z.string().max(300).optional().default(""),
  tags: z.string().max(200).optional().default(""),
  isVisible: z.boolean().optional().default(true),
  sortOrder: z.number().int().min(0).optional().default(0),
});

export async function GET(req: NextRequest) {
  const all = req.nextUrl.searchParams.get("all") === "1";
  const { getCurrentUser } = await import("@/lib/session");
  const user = await getCurrentUser();
  const items = await services().listPortfolio(!(all && user?.role === "owner"));
  return ok({ items });
}

export async function POST(req: NextRequest) {
  const user = await requireOwnerUser();
  if (user instanceof NextResponse) return user;
  const parsed = SCHEMA.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return ok({ error: parsed.error.issues[0]?.message ?? "بيانات غير صالحة" }, 400);
  }
  const item = await services().createPortfolio(parsed.data);
  return ok({ item }, 201);
}
