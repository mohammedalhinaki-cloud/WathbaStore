// POST /api/auth/logout — تسجيل الخروج
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { isSupabaseConfigured, supabaseServer } from "@/lib/supabase/client";
import { SESSION_COOKIE } from "@/lib/local/auth";

export async function POST() {
  try {
    if (isSupabaseConfigured()) {
      const sb = await supabaseServer();
      await sb.auth.signOut();
    } else {
      const c = await cookies();
      c.delete(SESSION_COOKIE);
    }
  } catch {
    /* ignore */
  }
  return NextResponse.json({ ok: true });
}
