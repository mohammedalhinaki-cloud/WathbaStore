// ============================================================
// معون — التحقق من الصلاحيات في الخادم
// (يعكس سياسات RLS في Supabase: العزل على مستوى البيانات)
//
// قاعدة المنصة:
//   «المالك الرئيسي» Master Owner = profiles.role = 'owner'
//   يملك **كل** صلاحيات صاحب المتجر على **كل** المتاجر (أي حالة: مسودة،
//   قيد التجهيز، مسلّم…) وأعلى منها (إنشاء/تسليم/تغيير نطاق/تغيير حالة/حذف).
//   صاحب المتجر = عضوية حقيقية في store_members لمتجره فقط.
//   ولا توجد وظيفة يستطيع صاحب المتجر تنفيذها ولا يستطيع المالك تنفيذها.
// ============================================================

import type { AppUser } from "./types";

/** هل هذا الحساب هو المالك الرئيسي للمنصة؟ */
export function isMasterOwner(actor: AppUser | null): boolean {
  return actor?.role === "owner";
}

/** توافق خلفي: الاسم القديم لنفس المفهوم */
export function isOwner(actor: AppUser | null): boolean {
  return isMasterOwner(actor);
}

/** هل المستخدم عضو حقيقي في هذا المتجر؟ (بدون المالك الرئيسي) */
export function isStoreMember(actor: AppUser | null, storeId: string): boolean {
  if (!actor) return false;
  return actor.memberships.some((m) => m.storeId === storeId);
}

/**
 * هل يستطيع المستخدم إدارة هذا المتجر؟
 * - المالك الرئيسي: نعم دائمًا — أي متجر وأي حالة.
 * - صاحب المتجر: متجره فقط (عبر store_members).
 */
export function canManageStore(actor: AppUser | null, storeId: string): boolean {
  if (!actor) return false;
  if (isMasterOwner(actor)) return true;
  return isStoreMember(actor, storeId);
}

/** هل يستطيع المستخدم الدخول إلى لوحة هذا المتجر (نفس واجهة صاحب المتجر)؟ */
export function canAccessStorePanel(actor: AppUser | null, storeId: string): boolean {
  return canManageStore(actor, storeId);
}

/** هل يستطيع المستخدم الوصول إلى لوحة المالك الرئيسي (maaoun.com/admin)؟ */
export function canAccessOwnerPanel(actor: AppUser | null): boolean {
  return isMasterOwner(actor);
}

export function requireOwner(actor: AppUser | null): asserts actor is AppUser {
  if (!isMasterOwner(actor)) {
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
