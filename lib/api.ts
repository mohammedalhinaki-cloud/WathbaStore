// ============================================================
// وثبة — أدوات مشتركة لواجهات API (الاستجابة + التحقق من الصلاحيات)
// ============================================================

import { NextResponse } from "next/server";
import type { AppUser } from "./types";
import { getCurrentUser } from "./session";
import { canManageStore, isOwner } from "./authorize";

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

export function badRequest(message = "طلب غير صالح"): NextResponse {
  return err(message, 400);
}

/** المالك فقط */
export async function requireOwnerUser(): Promise<AppUser | NextResponse> {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  if (!isOwner(user)) return forbidden();
  return user;
}

/** مالك أو عضو المتجر المحدد — يُرجع المستخدم أو خطأ صلاحية */
export async function requireStoreActor(storeId: string): Promise<AppUser | NextResponse> {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  if (!canManageStore(user, storeId)) return forbidden("لن يسمح لك بالوصول إلى بيانات متجر آخر");
  return user;
}
