// ============================================================
// معون — ضغط صور المشاركة (Open Graph) قبل الرفع
// ------------------------------------------------------------
// السبب: واتساب يتجاهل og:image بصمت إن تجاوز حجم الملف ~300 كيلوبايت
// تقريبًا (خلافًا لفيسبوك/تويتر الأكثر تسامحًا) — وهذا بالضبط ما كسر
// معاينة رابط maaoun.com بعد رفع صورة شعار/غلاف جديدة بحجم كبير عبر
// حقل «صورة المشاركة (Open Graph)» في لوحة الإعدادات دون أي ضغط.
//
// هذه الدالة تُشغَّل في المتصفح قبل الرفع لحقل الـ OG تحديدًا (وليس
// لبقية حقول الصور كالشعار أو غلاف المتجر المرئي حتى لا يتأثر أي
// تصميم أو صورة أخرى) فتُصغّر الصورة وتعيد ترميزها JPEG بجودة عالية
// حتى تبقى دائمًا ضمن الحد الآمن لمعاينات واتساب.
// ============================================================

/** هامش أمان تحت حد واتساب الحقيقي (~300KB) */
const MAX_SHARE_BYTES = 280 * 1024;
/** أبعاد كافية لبطاقة Open Graph (1200×630 الموصى بها) دون تضخيم الملف */
const MAX_DIMENSION = 1200;

/**
 * يضغط صورة مخصّصة للمشاركة الاجتماعية إن لزم الأمر: يبقيها كما هي
 * إن كانت صغيرة أصلًا أو من نوع لا يجب إعادة ترميزه (SVG متجهي، أو
 * GIF متحرك)، وإلا يعيد رسمها بأقصى بعد 1200px ثم يعيد ترميزها JPEG
 * بجودة تتناقص تدريجيًا حتى تقل عن الحد الآمن.
 */
export async function compressForSocialShare(file: File): Promise<File> {
  if (!file.type.startsWith("image/")) return file;
  if (file.type === "image/svg+xml" || file.type === "image/gif") return file;
  if (file.size <= MAX_SHARE_BYTES) return file;
  if (typeof document === "undefined" || typeof createImageBitmap === "undefined") return file;

  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    // خلفية بيضاء خلف الشفافية — JPEG لا يدعم قناة ألفا
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(bitmap, 0, 0, width, height);

    let quality = 0.85;
    let blob: Blob | null = null;
    for (let i = 0; i < 6; i++) {
      blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, "image/jpeg", quality)
      );
      if (!blob || blob.size <= MAX_SHARE_BYTES || quality <= 0.4) break;
      quality -= 0.12;
    }
    if (!blob || blob.size >= file.size) return file; // لم يتحسّن — أبقِ الأصل
    const newName = file.name.replace(/\.[^.]+$/, "") + ".jpg";
    return new File([blob], newName, { type: "image/jpeg" });
  } catch {
    return file; // أي فشل في الضغط: نرفع الملف الأصلي كما كان سابقًا
  }
}
