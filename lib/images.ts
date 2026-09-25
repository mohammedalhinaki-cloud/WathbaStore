// ============================================================
// معون — أدوات روابط الصور
//
// سبب وجود هذا الملف: مُحصِّن الصور في Next (next/image) يرفض أي نطاق
// خارجي غير مُدرج في images.remotePatterns، ويرمي استثناءً أثناء العرض
// فتسقط الصفحة كلها بخطأ 500 — أي أن صورة غلاف مرفوعة على نطاق غير
// متوقع كانت تكفي لإخفاء الصفحة الرئيسية بالكامل.
// هنا نفحص الرابط أولًا: إن كان قابلًا للتحسين استخدمنا المحسِّن،
// وإلا عرضنا الصورة كما هي (unoptimized) بدلًا من كسر الصفحة.
// ============================================================

/** نطاقات خارجية مسموح لمُحصِّن Next بمعالجتها (مطابقة لـ next.config.ts) */
const OPTIMIZABLE_REMOTE_HOSTS = [/\.supabase\.co$/i, /\.supabase\.in$/i];

/** هل الرابط مسار صورة صالح (محلي أو خارجي)؟ */
export function isImageSrc(value: string | null | undefined): boolean {
  const v = (value ?? "").trim();
  if (!v) return false;
  if (v.startsWith("/")) return !v.startsWith("//"); // مسار محلي داخل المشروع
  return /^https?:\/\//i.test(v);
}

/**
 * هل يمكن تمرير الرابط إلى next/image بأمان (بدون استثناء أثناء العرض)؟
 * - المسارات المحلية (/seed/... , /uploads/...) → نعم
 * - نطاقات Supabase وlocalhost → نعم (مُدرجة في remotePatterns)
 * - أي نطاق آخر → لا، تُعرض الصورة بدون تحسين بدل كسر الصفحة
 */
export function isOptimizableSrc(value: string | null | undefined): boolean {
  const v = (value ?? "").trim();
  if (!v) return false;
  if (v.startsWith("/")) return !v.startsWith("//");
  try {
    const u = new URL(v);
    if (u.protocol !== "https:" && u.protocol !== "http:") return false;
    if (u.hostname === "localhost" || u.hostname === "127.0.0.1") return true;
    return OPTIMIZABLE_REMOTE_HOSTS.some((re) => re.test(u.hostname));
  } catch {
    return false;
  }
}

/**
 * اختيار أول رابط صورة صالح من قائمة مرشّحات (بالترتيب).
 * يُستخدم لصورة الغلاف: coverUrl ثم صورة SEO ثم لا شيء.
 */
export function pickFirstImage(
  ...candidates: (string | null | undefined)[]
): string | null {
  for (const c of candidates) {
    const v = (c ?? "").trim();
    if (isImageSrc(v)) return v;
  }
  return null;
}
