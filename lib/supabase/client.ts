// ============================================================
// وثبة — عملاء Supabase (خادم)
// ============================================================

import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/** يدعم مفاتيح Supabase الحديثة مع إبقاء الأسماء القديمة للتوافق. */
function publicKey(): string | undefined {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

function secretKey(): string | undefined {
  return process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
}

export function isSupabaseConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && publicKey());
}

/**
 * عميل الخادم المرتبط بجلسة المستخدم (عبر كوكيز @supabase/ssr) —
 * كل استعلام يمر عبر RLS.
 */
export async function supabaseServer(): Promise<SupabaseClient> {
  const { cookies } = await import("next/headers");
  const cookieStore = await cookies();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = publicKey();
  if (!url || !key) {
    throw new Error("متغيرات Supabase العامة غير مكتملة");
  }

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
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = secretKey();
    if (!url || !key) {
      throw new Error("مفتاح Supabase السري غير مضبوط على الخادم");
    }
    _admin = createClient(url, key, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  }
  return _admin;
}

export const STORAGE_BUCKET = "store-assets";
