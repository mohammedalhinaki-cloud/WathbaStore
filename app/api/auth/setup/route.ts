import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { services } from "@/lib/services";
import { getCurrentUser } from "@/lib/session";
import { storeHref } from "@/lib/links";
import { isSupabaseConfigured, supabaseServer } from "@/lib/supabase/client";
import { SESSION_COOKIE, sessionCookieOptions, signSession } from "@/lib/local/auth";

export async function POST(req: NextRequest) {
  const fail = () => NextResponse.json({ error: "رابط الإعداد غير صالح. اطلب رابطًا جديدًا من معون." }, { status: 401 });
  try {
    const body = await req.json().catch(() => null);
    if (typeof body?.store !== "string" || !/^setup-[a-f0-9-]{36}@setup\.maaoun\.com$/.test(body?.email ?? "") || !/^[A-Za-z0-9_-]{43}$/.test(body?.key ?? "")) return fail();
    const svc = services();
    const current = await getCurrentUser();
    // Opening a customer's link should not replace the platform owner's session.
    if (current?.role !== "owner") {
      const user = await svc.login(body.email, body.key);
      if (!user) return fail();
      if (user.role === "owner" || user.memberships.length !== 1 || user.memberships[0].storeId !== body.store) {
        if (isSupabaseConfigured()) await (await supabaseServer()).auth.signOut();
        return fail();
      }
      if (!isSupabaseConfigured()) {
        const host = req.headers.get("x-forwarded-host")?.split(",")[0]?.trim() || req.headers.get("host") || "";
        (await cookies()).set(SESSION_COOKIE, signSession(user.id), sessionCookieOptions(host));
      }
    }
    const store = await svc.getStore(body.store);
    if (!store) return fail();
    return NextResponse.json({ next: await storeHref(store.subdomain, "/admin/setup") }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "تعذر فتح رابط الإعداد. حاول مرة أخرى." }, { status: 500 });
  }
}
