import { NextRequest, NextResponse } from "next/server";
import { requireOwnerUser, ok, serverError } from "@/lib/api";
import { services } from "@/lib/services";
import { mainDomain } from "@/lib/constants";

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireOwnerUser();
    if (user instanceof NextResponse) return user;
    const { id } = await ctx.params;
    const credentials = await services().ensureStoreSetupAccess(id);
    // The fragment is not sent in HTTP requests, referrers, or link-preview fetches.
    const fragment = new URLSearchParams({ store: id, email: credentials.email, key: credentials.password });
    const origin = process.env.NODE_ENV === "development" ? req.nextUrl.origin : `https://${mainDomain()}`;
    const response = ok({ url: `${origin}/setup#${fragment}` });
    response.headers.set("Cache-Control", "no-store");
    return response;
  } catch (error) {
    return serverError(error);
  }
}
