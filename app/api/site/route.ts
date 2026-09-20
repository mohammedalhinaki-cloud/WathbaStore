// ============================================================
// GET  /api/site — إعدادات الموقع العام (للعامة)
// PATCH /api/site — تعديل (المالك فقط)
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { services } from "@/lib/services";
import { ok, requireOwnerUser } from "@/lib/api-utils";
import { z } from "zod";

const SCHEMA = z.object({
  whatsappNumber: z.string().max(30).optional(),
  developerUrl: z.string().max(300).optional(),
  aboutText: z.string().max(3000).optional(),
  heroTitle: z.string().max(200).optional(),
  heroSubtitle: z.string().max(600).optional(),
  features: z
    .array(z.object({ title: z.string().max(120), desc: z.string().max(500) }))
    .max(12)
    .optional(),
  faq: z
    .array(z.object({ q: z.string().max(300), a: z.string().max(1500) }))
    .max(20)
    .optional(),
  socialInstagram: z.string().max(300).optional(),
  socialSnapchat: z.string().max(300).optional(),
  socialTiktok: z.string().max(300).optional(),
});

export async function GET() {
  const settings = await services().getSiteSettings();
  return ok({ settings });
}

export async function PATCH(req: NextRequest) {
  const user = await requireOwnerUser();
  if (user instanceof NextResponse) return user;
  const parsed = SCHEMA.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return ok({ error: "بيانات غير صالحة" }, 400);
  const settings = await services().updateSiteSettings(parsed.data);
  return ok({ settings });
}
