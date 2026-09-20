// GET /api/subdomains/availability?subdomain=rshaf&storeId= — هل النطاق متاح؟
import { NextRequest, NextResponse } from "next/server";
import { services } from "@/lib/services";
import { ok, requireOwnerUser } from "@/lib/api-utils";
import { validateSubdomain } from "@/lib/subdomain";

export async function GET(req: NextRequest) {
  const user = await requireOwnerUser();
  if (user instanceof NextResponse) return user;
  const subdomain = (req.nextUrl.searchParams.get("subdomain") ?? "").trim().toLowerCase();
  const exceptId = req.nextUrl.searchParams.get("storeId") ?? undefined;

  const check = validateSubdomain(subdomain);
  if (!check.ok) return ok({ available: false, reason: check.reason });

  const available = await services().isSubdomainAvailable(subdomain, exceptId);
  return ok({ available, reason: available ? undefined : "النطاق مستخدم بالفعل" });
}
