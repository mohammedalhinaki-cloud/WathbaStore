// ============================================================
// وثبة — التحقق من الصلاحيات في الخادم
// (يعكس سياسات RLS في Supabase: العزل على مستوى البيانات)
// ============================================================

import type { AppUser } from "./types";

/** هل يستطيع المستخدم إدارة هذا المتجر؟ (المالك العام أو عضو المتجر) */
export function canManageStore(actor: AppUser | null, storeId: string): boolean {
  if (!actor) return false;
  if (actor.role === "owner") return true;
  return actor.memberships.some((m) => m.storeId === storeId);
}

/** هل هو مالك المنصة (أنت)؟ */
export function isOwner(actor: AppUser | null): boolean {
  return actor?.role === "owner";
}

export function requireOwner(actor: AppUser | null): asserts actor is AppUser {
  if (!isOwner(actor)) {
    throw new AuthError("غير مصرّح لك بالدخول إلى هذه الصفحة");
  }
}

export function requireStoreAccess(actor: AppUser | null, storeId: string): asserts actor is AppUser {
  if (!canManageStore(actor, storeId)) {
    throw new AuthError("لا تملك صلاحية الوصول إلى هذا المتجر");
  }
}

export class AuthError extends Error {
  status: number;
  constructor(message: string, status = 403) {
    super(message);
    this.status = status;
  }
}
