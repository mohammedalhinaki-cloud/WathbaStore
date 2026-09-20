// ============================================================
// GET  /api/plans — الباقات (للعامة: الظاهرة فقط)
// POST /api/plans — إضافة باقة (المالك)
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { services } from "@/lib/services";
import { ok, requireOwnerUser } from "@/lib/api-utils";
import { z } from "zod";

const SCHEMA = z.object({
  name: z.string().min(2, "اسم الباقة قصير جدًا").max(60),
  price: z.number().min(0),
  oldPrice: z.number().min(0).nullable().optional(),
  currency: z.string().max(10).optional().default("ر.س"),
  features: z.array(z.string().max(200)).max(20).default([]),
  isFeatured: z.boolean().optional().default(false),
  isVisible: z.boolean().optional().default(true),
  sortOrder: z.number().int().min(0).optional().default(0),
});

export async function GET(req: NextRequest) {
  const all = req.nextUrl.searchParams.get("all") === "1";
  // "all" للمالك فقط
  let visibleOnly = !all;
  if (all) {
    const { getCurrentUser } = await import("@/lib/session");
    const user = await getCurrentUser();
    if (user?.role !== "owner") visibleOnly = true;
  }
  const plans = await services().listPlans(visibleOnly);
  return ok({ plans });
}

export async function POST(req: NextRequest) {
  const user = await requireOwnerUser();
  if (user instanceof NextResponse) return user;
  const parsed = SCHEMA.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return ok({ error: parsed.error.issues[0]?.message ?? "بيانات غير صالحة" }, 400);
  }
  const plan = await services().createPlan({
    name: parsed.data.name,
    price: parsed.data.price,
    oldPrice: parsed.data.oldPrice ?? null,
    currency: parsed.data.currency ?? "ر.س",
    features: parsed.data.features ?? [],
    isFeatured: parsed.data.isFeatured ?? false,
    isVisible: parsed.data.isVisible ?? true,
    sortOrder: parsed.data.sortOrder ?? 0,
  });
  return ok({ plan }, 201);
}
