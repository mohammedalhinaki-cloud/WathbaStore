// ============================================================
// معون — تجهيز متغيرات Supabase القادمة من البيئة
//
// لماذا هذا الملف؟
// supabase-js يبني رابط REST هكذا: new URL("rest/v1", projectUrl)
// فإن كان NEXT_PUBLIC_SUPABASE_URL يحوي مسارًا — كما يحدث عند لصق
// رابط REST من لوحة Supabase: https://xxxx.supabase.co/rest/v1 —
// يصبح المسار مكررًا: /rest/v1/rest/v1/<table>
// فيرد PostgREST بالخطأ:
//   PGRST125 — Invalid path specified in request URL
// وهو خطأ يظهر في كل استعلام (listPlans / listOffers / listPortfolio ...)
//
// الحل: نُطبّع القيمة هنا مرة واحدة قبل تمريرها إلى عملاء Supabase،
// كما نفعل مع NEXT_PUBLIC_MAIN_DOMAIN في lib/constants.ts.
// ============================================================

/**
 * مسارات API التي قد تُلصق خطأً في نهاية رابط المشروع:
 * /rest/v1 · /rest/v1/pricing_plans · /auth/v1 · /storage/v1 · /realtime/v1 · /functions/v1
 * وما بعدها يُحذف (مع إبقاء أي مسار أساسي آخر لاستضافات Supabase الذاتية).
 */
const API_PATH_RE = /\/(?:rest|auth|storage|realtime|functions)(?:\/v\d+)?(?:\/.*)?$/i;

/** النص المرئي فقط: إزالة المسافات وأسطر جديدة والمحارف الصامتة وعلامات التنصيص */
function cleanEnvValue(raw: string | undefined | null): string {
  return (raw ?? "")
    .replace(/[\s\u200b-\u200f\u202a-\u202e\ufeff]+/g, "")
    .replace(/^["'`]+|["'`]+$/g, "");
}

/**
 * يُرجع رابط مشروع Supabase بشكل صحيح، أو null إن كانت القيمة غير صالحة.
 * يقبل: https://xxxx.supabase.co · xxxx.supabase.co · https://xxxx.supabase.co/
 * ويتسامح مع: المسافات وأسطر جديدة، علامات التنصيص،
 *              والمسارات الملصوقة خطأً (/rest/v1 ...).
 */
export function normalizeSupabaseUrl(raw: string | undefined | null): string | null {
  let value = cleanEnvValue(raw);
  if (!value) return null;

  // http:/  أو https:///  ← https://
  value = value.replace(/^(https?):\/+/i, "$1://");

  // رابط بلا بروتوكول: xxxx.supabase.co ← https://xxxx.supabase.co
  if (!/^[a-z][a-z0-9+.-]*:\/\//i.test(value)) {
    if (/^[a-z0-9.-]+(?::\d+)?(?:[/?]|$)/i.test(value)) value = `https://${value}`;
    else return null;
  }

  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    return null;
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null;

  // اسم مضيف منطقي: نطاق حقيقي أو localhost أو عنوان IPv6 حرفي
  const host = parsed.hostname;
  if (!host || (!host.includes(".") && host !== "localhost" && !host.startsWith("["))) return null;

  // احتفظ بالأصل فقط: احذف /rest/v1 وأي شرطة نهائية، وأهمل query/hash
  const path = parsed.pathname.replace(API_PATH_RE, "").replace(/\/+$/, "");
  return `${parsed.protocol}//${parsed.host}${path}`;
}

/** رسالة موحّدة تساعد على تصحيح المتغير في منصة النشر */
function invalidUrlError(): Error {
  return new Error(
    "NEXT_PUBLIC_SUPABASE_URL غير صالح. القيمة الصحيحة هي رابط المشروع فقط، مثال: " +
      "https://xxxxxxxxxxxx.supabase.co — بدون مسار /rest/v1 وبدون علامات تنصيص وبدون مسافات. " +
      "صحّح القيمة في منصة النشر (Cloudflare) ثم أعد النشر (قيم NEXT_PUBLIC_ تُدمج وقت البناء)."
  );
}

let _warnedAboutUrl = false;

/** رابط المشروع مُطبَّعًا — يرمي خطأً واضحًا إن كان المتغير غير صالح */
export function supabaseUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const url = normalizeSupabaseUrl(raw);
  if (!url) throw invalidUrlError();

  if (!_warnedAboutUrl) {
    _warnedAboutUrl = true;
    const cleaned = cleanEnvValue(raw).replace(/\/+$/, "");
    if (cleaned && cleaned !== url) {
      console.warn(
        `[supabase] تم تصحيح NEXT_PUBLIC_SUPABASE_URL تلقائيًا: "${cleaned}" ← "${url}". ` +
          "يُفضّل تصحيح القيمة في إعدادات البيئة ثم Redeploy."
      );
    }
  }
  return url;
}

/** المفتاح العام (Publishable أو anon القديم) بعد التنظيف */
export function supabasePublicKey(): string | undefined {
  const key =
    cleanEnvValue(process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) ||
    cleanEnvValue(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  return key || undefined;
}

/** المفتاح السري (Secret أو service_role القديم) بعد التنظيف */
export function supabaseSecretKey(): string | undefined {
  const key =
    cleanEnvValue(process.env.SUPABASE_SECRET_KEY) ||
    cleanEnvValue(process.env.SUPABASE_SERVICE_ROLE_KEY);
  return key || undefined;
}

/**
 * هل وضع Supabase مُهيّأ؟ (يكفي وجود القيمتين — نفس الدلالة السابقة).
 *
 * ملاحظة مقصودة: لا نُرجع false عند وجود رابط غير قابل للتفسير، لأن الرجوع
 * حينها إلى الوضع المحلي (SQLite) يفشل على Cloudflare Workers أصلًا (لا نظام
 * ملفات قابلًا للكتابة) ويُخفي السبب. الأفضل: نُبقي وضع Supabase ونطبع سببًا
 * واضحًا هنا، ثم يرمي supabaseUrl() رسالة صريحة تُسمّي المتغير عند أول استعلام.
 */
export function isSupabaseConfigured(): boolean {
  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = supabasePublicKey();
  if (!raw || !key) return false;

  if (!normalizeSupabaseUrl(raw)) {
    console.error(`[supabase] ${invalidUrlError().message}`);
  }
  return true;
}
