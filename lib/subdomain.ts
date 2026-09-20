// ============================================================
// التحقق من النطاق الفرعي
// ============================================================

import { RESERVED_SUBDOMAINS } from "./constants";

export interface SubdomainCheck {
  ok: boolean;
  reason?: string;
}

const SUBDOMAIN_RE = /^[a-z0-9](?:[a-z0-9-]{0,38}[a-z0-9])?$/;

/**
 * يتحقق من صحة اسم النطاق الفرعي:
 * - أحرف إنجليزية صغيرة وأرقام وشرطة (-) فقط
 * - يبدأ وينتهى بحرف أو رقم
 * - طول 2-40
 * - غير محجوز
 */
export function validateSubdomain(raw: string): SubdomainCheck {
  const subdomain = (raw || "").trim().toLowerCase();

  if (!subdomain) return { ok: false, reason: "أدخل اسم النطاق الفرعي" };
  if (/\s/.test(subdomain)) return { ok: false, reason: "لا يُسمح بالمسافات" };
  if (!SUBDOMAIN_RE.test(subdomain))
    return {
      ok: false,
      reason:
        "استخدم أحرفًا إنجليزية صغيرة (a-z) وأرقامًا وشرطة (-) فقط، وابدأ وانتهِ بحرف أو رقم",
    };
  if (subdomain.length < 2) return { ok: false, reason: "الاسم قصير جدًا (حرفان على الأقل)" };
  if (subdomain.length > 40) return { ok: false, reason: "الاسم طويل جدًا (40 حرفًا كحد أقصى)" };
  if (subdomain.includes("..")) return { ok: false, reason: "أحرف غير مسموح بها" };
  if (RESERVED_SUBDOMAINS.includes(subdomain))
    return { ok: false, reason: "هذا الاسم محجوز للنظام" };

  return { ok: true };
}

export function isReservedSubdomain(subdomain: string): boolean {
  return RESERVED_SUBDOMAINS.includes(subdomain.trim().toLowerCase());
}
