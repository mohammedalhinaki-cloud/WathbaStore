// ============================================================
// GET  /api/stores — قائمة المتاجر (المالك فقط)
// POST /api/stores — إنشاء متجر (المالك فقط)
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { services } from "@/lib/services";
import { requireOwnerUser, ok, badRequest } from "@/lib/api";
import { validateSubdomain } from "@/lib/subdomain";
import { z } from "zod";

const CreateSchema = z.object({
  name: z.string().min(2, "اسم المتجر قصير جدًا").max(80),
  subdomain: z.string().min(2, "النطاق الفرعي قصير جدًا").max(40),
  ownerName: z.string().min(2, "أدخل اسم العميل").max(80),
  ownerPhone: z.string().max(30).optional().default(""),
  ownerEmail: z.string().email("بريد غير صالح").max(120).or(z.literal("")).optional(),
  whatsapp: z.string().max(30).optional().default(""),
  description: z.string().max(500).optional().default(""),
  template: z.enum(["modern", "classic", "minimal"]).optional(),
  font: z.enum(["cairo", "tajawal", "almarai", "ibm-plex"]).optional(),
  primaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  secondaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  logoUrl: z.string().nullable().optional(),
  coverUrl: z.string().nullable().optional(),
});

export async function GET() {
  const user = await requireOwnerUser();
  if (user instanceof NextResponse) return user;
  const stores = await services().listStores();
  return ok({ stores });
}

export async function POST(req: NextRequest) {
  const user = await requireOwnerUser();
  if (user instanceof NextResponse) return user;

  const parsed = CreateSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return badRequest(first?.message ?? "بيانات غير صالحة");
  }
  const input = parsed.data;

  const check = validateSubdomain(input.subdomain);
  if (!check.ok) return badRequest(check.reason!);

  const svc = services();
  if (!(await svc.isSubdomainAvailable(input.subdomain))) {
    return badRequest(`النطاق الفرعي "${input.subdomain}" مستخدم بالفعل في متجر آخر`);
  }

  const store = await svc.createStore({
    name: input.name,
    subdomain: input.subdomain.toLowerCase(),
    ownerName: input.ownerName,
    ownerPhone: input.ownerPhone,
    ownerEmail: input.ownerEmail ?? "",
    whatsapp: input.whatsapp,
    description: input.description,
    template: input.template,
    font: input.font,
    primaryColor: input.primaryColor,
    secondaryColor: input.secondaryColor,
    logoUrl: input.logoUrl ?? null,
    coverUrl: input.coverUrl ?? null,
    status: "preparing",
  });
  await svc.logActivity(
    { id: user.id, email: user.email },
    store.id,
    "store.created",
    { name: store.name, subdomain: store.subdomain }
  );
  return ok({ store }, 201);
}
