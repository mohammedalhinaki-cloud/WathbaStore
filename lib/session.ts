// ============================================================
// وثبة — الجلسة الحالية (Supabase Auth أو جلسة محلية)
// ============================================================

import { cookies } from "next/headers";
import { isSupabaseConfigured, supabaseServer } from "./supabase/client";
import { services } from "./services";
import type { AppUser } from "./types";
import { SESSION_COOKIE, verifySession } from "./local/auth";

export async function getCurrentUser(): Promise<AppUser | null> {
  if (isSupabaseConfigured()) {
    const sb = await supabaseServer();
    const {
      data: { user },
    } = await sb.auth.getUser();
    if (!user) return null;
    try {
      return await services().userById(user.id);
    } catch {
      return null;
    }
  }

  const c = await cookies();
  const token = c.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const session = verifySession(token);
  if (!session) return null;
  return services().userById(session.uid);
}

/** المستخدم المطلوب (لصاحب متجر محدد) — يُستخدم في لوحة العميل */
export async function getStoreActor(storeId: string): Promise<AppUser | null> {
  const user = await getCurrentUser();
  if (!user) return null;
  if (user.role === "owner") return user;
  if (user.memberships.some((m) => m.storeId === storeId)) return user;
  return null;
}

export function logoutCookieName(): string {
  return SESSION_COOKIE;
}
