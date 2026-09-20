// ============================================================
// وثبة — عملاء Supabase (خادم)
// ============================================================

import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import {
  isSupabaseConfigured,
  normalizeSupabaseUrl,
  supabasePublicKey,
  supabaseSecretKey,
  supabaseUrl,
} from "./env";

// كل القراءات تمر عبر lib/supabase/env.ts الذي يُطبّع القيم:
// إزالة المسافات وأسطر جديدة والتنصيص، وإزالة أي مسار ملصوق مثل /rest/v1
// (تكرار المسار هو سبب خطأ PostgREST: PGRST125 — Invalid path specified in request URL).
export { isSupabaseConfigured, normalizeSupabaseUrl, supabaseUrl };

/**
 * عميل الخادم المرتبط بجلسة المستخدم (عبر كوكيز @supabase/ssr) —
 * كل استعلام يمر عبر RLS.
 */
export async function supabaseServer(): Promise<SupabaseClient> {
  const { cookies } = await import("next/headers");
  const cookieStore = await cookies();
  const key = supabasePublicKey();
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !key) {
    throw new Error("متغيرات Supabase العامة غير مكتملة");
  }
  const url = supabaseUrl();

  return createServerClient(
    url,
    key,
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
    const key = supabaseSecretKey();
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !key) {
      throw new Error("مفتاح Supabase السري غير مضبوط على الخادم");
    }
    _admin = createClient(supabaseUrl(), key, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  }
  return _admin;
}

export const STORAGE_BUCKET = "store-assets";
