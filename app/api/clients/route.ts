// GET /api/clients — قائمة العملاء (المالك فقط)
import { NextResponse } from "next/server";
import { services } from "@/lib/services";
import { ok, requireOwnerUser } from "@/lib/api-utils";

export async function GET() {
  const user = await requireOwnerUser();
  if (user instanceof NextResponse) return user;
  const clients = await services().listClients();
  return ok({ clients });
}
