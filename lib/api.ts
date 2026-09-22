// ============================================================
// معين — أدوات مشتركة لواجهات API (الاستجابة + التحقق من الصلاحيات)
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import type { AppUser } from "./types";
import { getCurrentUser } from "./session";
import { canManageStore, canAccessOwnerPanel, isMasterOwner, isStoreMember } from "./authorize";

export function ok(data: unknown, status = 200): NextResponse {
  return NextResponse.json(data, { status });
}

export function err(message: string, status: number): NextResponse {
  return NextResponse.json({ error: message }, { status });
}

export function unauthorized(): NextResponse {
  return err("يجب تسجيل الدخول أولًا", 401);
}

export function forbidden(message = "لا تملك صلاحية لهذا الإجراء"): NextResponse {
  return err(message, 403);
}

/** خطأ طلب (400) — مع رمز/تفصيل اختياري يساعد على التشخيص في الواجهة */
export function badRequest(message = "طلب غير صالح", code?: string, detail?: string): NextResponse {
  return NextResponse.json(
    { error: message, ...(code ? { code } : {}), ...(detail ? { detail } : {}) },
    { status: 400 }
  );
}

/**
 * أي خطأ غير متوقع يتحول إلى **رد JSON واضح** بدل استجابة فارغة.
 * كان الخطأ غير الملتقط يخرج من المسار فيرد الخادم 500 بلا جسم، فتُظهر
 * الواجهة رسالة عامة مثل «فشل الرفع» دون أي سبب.
 */
export function serverError(e: unknown, fallback = "حدث خطأ غير متوقع في الخادم"): NextResponse {
  const detail = e instanceof Error ? e.message : String(e ?? "");
  const code = (e as { code?: string } | null)?.code;
  console.error("[api] خطأ غير متوقع:", detail, e);
  return NextResponse.json(
    { error: fallback, ...(code ? { code } : {}), detail: detail || undefined },
    { status: 500 }
  );
}

/**
 * غلاف لمسارات API: يجعل **كل** استثناء غير متوقع ردَّ JSON واضحًا
 * (بدل استجابة فارغة تُظهر في الواجهة رسالة عامة مثل «فشل الرفع»).
 *
 * الاستخدام:
 *   export const PATCH = route<{ id: string }>(async (req, ctx) => { ... });
 */
export function route<P extends Record<string, string> = Record<string, never>>(
  handler: (req: NextRequest, ctx: { params: Promise<P> }) => Promise<NextResponse>
): (req: NextRequest, ctx: { params: Promise<P> }) => Promise<NextResponse> {
  return async (req, ctx) => {
    try {
      return await handler(req, ctx);
    } catch (e) {
      return serverError(e);
    }
  };
}

/** المالك الرئيسي فقط */
export async function requireOwnerUser(): Promise<AppUser | NextResponse> {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  if (!canAccessOwnerPanel(user)) return forbidden();
  return user;
}

/** مالك المتجر (المالك الرئيسي أو صاحب المتجر) — يُرجع المستخدم أو خطأ صلاحية */
export async function requireStoreActor(storeId: string): Promise<AppUser | NextResponse> {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  if (!canManageStore(user, storeId)) {
    return forbidden("لا تملك صلاحية الوصول إلى بيانات متجر آخر");
  }
  return user;
}

export { canManageStore, isMasterOwner, isStoreMember };
