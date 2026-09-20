// ============================================================
// وثبة — عملاء Supabase (خادم)
// ============================================================

import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

/**
 * عميل الخادم المرتبط بجلسة المستخدم (عبر كوكيز @supabase/ssr) —
 * كل استعلام يمر عبر RLS.
 */
export async function supabaseServer(): Promise<SupabaseClient> {
  const { cookies } = await import("next/headers");
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options as Record<string, unknown>)
            );
          } catch {
            // يُستدعى من Route Handler — تجاهل (الجلسة موجودة مسبقًا)
          }
        },
      },
    }
  );
}

/** عميل الخدمة (خادم فقط) — للعمليات الإدارية مثل إنشاء حسابات العملاء */
let _admin: SupabaseClient | null = null;
export function supabaseAdmin(): SupabaseClient {
  if (!_admin) {
    _admin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );
  }
  return _admin;
}

export const STORAGE_BUCKET = "store-assets";
