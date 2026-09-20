// ============================================================
// وثبة — تنبيه حالة النشر (يظهر في نطاقات المعاينة فقط)
//
// الهدف: لا يخلط المالك (أو زائره) بين رابط المعاينة المؤقت على
// vercel.app وبين الموقع الرسمي على الدومين الحقيقي:
//   • نسخة معاينة مؤقتة  → النطاق الرسمي هو NEXT_PUBLIC_MAIN_DOMAIN
//   • قاعدة بيانات غير مربوطة (بلا Supabase) → البيانات تجريبية فقط
//
// لا يظهر إطلاقًا على الدومين الرسمي بعد ربطه، فلا يراه الزوار.
// ============================================================

import { headers } from "next/headers";
import { AlertTriangle, Info } from "lucide-react";
import { isPreviewHost, mainDomain } from "@/lib/constants";
import { isSupabaseConfigured } from "@/lib/supabase/client";

export default async function DeploymentNotice() {
  const h = await headers();
  const host = h.get("host") || "";
  const domain = mainDomain();
  const onPreviewHost = isPreviewHost(host);
  const dbConnected = isSupabaseConfigured();

  // الموقع الرسمي مع قاعدة بيانات مربوطة → لا شيء
  if (!onPreviewHost && dbConnected) return null;

  const isWarning = !dbConnected;
  const message = !dbConnected
    ? onPreviewHost
      ? `نسخة معاينة: قاعدة بيانات Supabase غير مربوطة — البيانات تجريبية فقط، والنطاق الرسمي ${domain} غير مربوط بعد.`
      : `تنبيه: قاعدة بيانات Supabase غير مربوطة — الموقع لا يحفظ أي بيانات حقيقية. راجع متغيرات البيئة في Vercel.`
    : `أنت تستعرض نسخة معاينة مؤقتة — الموقع الرسمي سيعمل على ${domain} بعد ربط النطاق.`;

  const Icon = isWarning ? AlertTriangle : Info;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-3 z-[60] flex justify-center px-3">
      <div
        dir="rtl"
        className={`pointer-events-auto flex max-w-2xl items-center gap-2 rounded-2xl border px-3.5 py-2 text-[11px] font-semibold leading-5 shadow-lg backdrop-blur ${
          isWarning
            ? "border-amber-400/40 bg-amber-500/15 text-amber-100"
            : "border-white/15 bg-ink-900/85 text-ink-200"
        }`}
      >
        <Icon className="h-3.5 w-3.5 shrink-0" />
        <span>{message}</span>
      </div>
    </div>
  );
}
