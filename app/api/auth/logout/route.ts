// POST /api/auth/logout — تسجيل الخروج
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { isSupabaseConfigured, supabaseServer } from "@/lib/supabase/client";
import { SESSION_COOKIE, sessionCookieOptions } from "@/lib/local/auth";

export async function POST(req: NextRequest) {
  try {
    if (isSupabaseConfigured()) {
      const sb = await supabaseServer();
      await sb.auth.signOut();
    } else {
      const c = await cookies();
      // نحذف الكوكي بنفس الخيارات التي كُتبت بها (وإلا بقيت كوكي النطاق الأب)
      const host =
        req.headers.get("x-forwarded-host")?.split(",")[0]?.trim() ||
        req.headers.get("host") ||
        "";
      c.set(SESSION_COOKIE, "", { ...sessionCookieOptions(host), maxAge: 0 });
    }
  } catch {
    /* ignore */
  }
  return NextResponse.json({ ok: true });
}
