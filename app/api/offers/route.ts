// ============================================================
// GET  /api/offers — العروض (للعامة)
// POST /api/offers — إضافة عرض (المالك)
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { services } from "@/lib/services";
import { ok, requireOwnerUser } from "@/lib/api-utils";
import { z } from "zod";

const SCHEMA = z.object({
  title: z.string().min(2, "عنوان العرض قصير جدًا").max(120),
  description: z.string().max(600).optional().default(""),
  price: z.number().min(0).optional().default(0),
  oldPrice: z.number().min(0).nullable().optional(),
  currency: z.string().max(10).optional().default("ر.س"),
  startsAt: z.string().nullable().optional(),
  endsAt: z.string().nullable().optional(),
  isActive: z.boolean().optional().default(true),
});

function isLive(o: { startsAt: string | null; endsAt: string | null; isActive: boolean }): boolean {
  if (!o.isActive) return false;
  const now = Date.now();
  if (o.startsAt && new Date(o.startsAt).getTime() > now) return false;
  if (o.endsAt && new Date(o.endsAt).getTime() < now) return false;
  return true;
}

export async function GET(req: NextRequest) {
  const all = req.nextUrl.searchParams.get("all") === "1";
  let offers = await services().listOffers();
  const { getCurrentUser } = await import("@/lib/session");
  const user = await getCurrentUser();
  if (all && user?.role === "owner") {
    // المالك يرى الكل
  } else {
    offers = offers.filter(isLive);
  }
  return ok({ offers });
}

export async function POST(req: NextRequest) {
  const user = await requireOwnerUser();
  if (user instanceof NextResponse) return user;
  const parsed = SCHEMA.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return ok({ error: parsed.error.issues[0]?.message ?? "بيانات غير صالحة" }, 400);
  }
  const offer = await services().createOffer({
    title: parsed.data.title,
    description: parsed.data.description ?? "",
    price: parsed.data.price ?? 0,
    oldPrice: parsed.data.oldPrice ?? null,
    currency: parsed.data.currency ?? "ر.س",
    startsAt: parsed.data.startsAt ?? null,
    endsAt: parsed.data.endsAt ?? null,
    isActive: parsed.data.isActive ?? true,
  });
  return ok({ offer }, 201);
}
