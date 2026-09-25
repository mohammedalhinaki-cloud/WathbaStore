// ============================================================
// GET  /api/site — إعدادات الموقع العام (للعامة)
// PATCH /api/site — تعديل (المالك فقط)
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { services } from "@/lib/services";
import { ok, requireOwnerUser } from "@/lib/api-utils";
import { LANDING_LIMITS, mergeLandingContent, type LandingContent } from "@/lib/types";
import { z } from "zod";

const titleDesc = z.object({ title: z.string().max(120), desc: z.string().max(600) });
const sectionHead = z.object({
  badge: z.string().max(60),
  title: z.string().max(160),
  sub: z.string().max(300),
});

const LANDING_SCHEMA = z
  .object({
    hero: z
      .object({
        title: z.string().max(200).optional(),
        accent: z.string().max(120).optional(),
        subtitle: z.string().max(600).optional(),
        primaryBtn: z.string().max(60).optional(),
        secondaryBtn: z.string().max(60).optional(),
        imageUrl: z.string().max(500).optional(),
        badgeTitle: z.string().max(120).optional(),
        badgeDesc: z.string().max(200).optional(),
      })
      .optional(),
    stats: z
      .array(
        z.object({
          value: z.number().min(0).max(9999999),
          suffix: z.string().max(8).optional().default(""),
          unit: z.string().max(20).optional().default(""),
          label: z.string().max(120),
        })
      )
      .max(LANDING_LIMITS.stats)
      .optional(),
    about: z
      .object({
        badge: z.string().max(60).optional(),
        title: z.string().max(200).optional(),
        bullets: z.array(z.string().max(300)).max(LANDING_LIMITS.aboutBullets).optional(),
        cards: z.array(titleDesc).max(LANDING_LIMITS.aboutCards).optional(),
      })
      .optional(),
    services: z.array(titleDesc).max(LANDING_LIMITS.services).optional(),
    heads: z
      .object({
        services: sectionHead.optional(),
        portfolio: sectionHead.optional(),
        pricing: sectionHead.optional(),
        offers: sectionHead.optional(),
        features: sectionHead.optional(),
        faq: sectionHead.optional(),
      })
      .optional(),
    nav: z
      .object({
        links: z
          .array(z.object({ href: z.string().regex(/^#[a-zA-Z-]+$/), label: z.string().max(40) }))
          .max(LANDING_LIMITS.navLinks)
          .optional(),
        cta: z.string().max(60).optional(),
        ctaMobile: z.string().max(80).optional(),
      })
      .optional(),
    cta: z
      .object({
        title: z.string().max(200).optional(),
        desc: z.string().max(600).optional(),
        button: z.string().max(80).optional(),
      })
      .optional(),
    footer: z.object({ tagline: z.string().max(120).optional() }).optional(),
  })
  .optional();

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
  landing: LANDING_SCHEMA,
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
  const data = parsed.data;
  // دمج على مستوى الأقسام: إرسال قسم واحد لا يمسح بقية الأقسام
  let landing: LandingContent | undefined;
  if (data.landing) {
    const cur = await services().getSiteSettings();
    const curRec = cur.landing as unknown as Record<string, unknown>;
    const inRec = data.landing as unknown as Record<string, unknown>;
    const merged: Record<string, unknown> = { ...curRec };
    for (const [key, val] of Object.entries(inRec)) {
      if (val === undefined) continue;
      if (Array.isArray(val) || typeof val !== "object" || val === null) {
        merged[key] = val;
      } else {
        merged[key] = { ...((curRec[key] as Record<string, unknown>) ?? {}), ...(val as Record<string, unknown>) };
      }
    }
    // دمج أعمق لترويسات الأقسام (heads.services ... إلخ)
    const curHeads = (curRec.heads as Record<string, unknown>) ?? {};
    const inHeads = (inRec.heads as Record<string, unknown> | undefined) ?? null;
    if (inHeads) {
      const headsOut: Record<string, unknown> = {};
      for (const k of Object.keys(curHeads)) {
        headsOut[k] = {
          ...((curHeads[k] as Record<string, unknown>) ?? {}),
          ...((inHeads[k] as Record<string, unknown>) ?? {}),
        };
      }
      merged.heads = headsOut;
    }
    landing = mergeLandingContent(merged);
  }
  const { landing: _omit, ...rest } = data;
  void _omit;
  const settings = await services().updateSiteSettings(landing ? { ...rest, landing } : rest);
  return ok({ settings });
}
