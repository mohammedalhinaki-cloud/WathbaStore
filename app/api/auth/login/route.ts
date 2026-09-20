// POST /api/auth/login — تسجيل الدخول (المالك أو صاحب متجر)
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { services } from "@/lib/services";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { SESSION_COOKIE, sessionCookieOptions, signSession } from "@/lib/local/auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    const email = String(body?.email ?? "").trim();
    const password = String(body?.password ?? "");
    if (!email || !password) {
      return NextResponse.json({ error: "أدخل البريد وكلمة المرور" }, { status: 400 });
    }

    const svc = services();
    const user = await svc.login(email, password);
    if (!user) {
      return NextResponse.json({ error: "بيانات الدخول غير صحيحة" }, { status: 401 });
    }

    if (!isSupabaseConfigured()) {
      const c = await cookies();
      c.set(SESSION_COOKIE, signSession(user.id), sessionCookieOptions());
    }

    await svc.logActivity(
      { id: user.id, email: user.email },
      user.memberships[0]?.storeId ?? null,
      user.role === "owner" ? "owner.login" : "member.login",
      {}
    );

    return NextResponse.json({ user });
  } catch (e) {
    console.error("login error", e);
    return NextResponse.json({ error: "حدث خطأ غير متوقع" }, { status: 500 });
  }
}
