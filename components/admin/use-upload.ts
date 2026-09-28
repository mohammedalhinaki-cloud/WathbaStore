// ============================================================
// معون — خطاف رفع الصور المشترك
// ------------------------------------------------------------
// سبب وجوده: كان منطق الرفع (وقراءة أخطاء الخادم بدقة) محبوسًا داخل
// حقل الصور المتعددة upload-field، فبقيت حقول أخرى (صورة المشاركة،
// أيقونة المتصفح، صورة الغلاف…) نصًّا يُلصق فيه رابط يدويًا.
// الآن المنطق هنا، ويستعمله:
//   • UploadField  — صور متعددة (منتجات…)
//   • ImageField   — صورة واحدة (شعار، Open Graph، Favicon، غلاف…)
//
// نفس معالجة الأخطاء الدقيقة السابقة:
//   • نقرأ النص أولًا ثم نحاول تحليله JSON (لا نفترض الشكل).
//   • نعرض رمز HTTP ورسالة الخادم الحقيقية ورمز الخطأ التقني.
// ============================================================

"use client";

import { useCallback, useState } from "react";

export type UploadFolder = "logo" | "cover" | "products" | "pages";

/** نفس حد الخزنة في /api/upload */
export const MAX_UPLOAD_SIZE = 5 * 1024 * 1024;

/** الأنواع المقبولة في <input type="file"> — مطابقة لما يقبله الخادم */
export const ACCEPT_IMAGES = "image/jpeg,image/png,image/webp,image/gif,image/svg+xml";

/** نص مساعد موحّد أسفل مناطق الإفلات */
export const UPLOAD_FORMATS_HINT = "JPG, PNG, WebP, SVG — حتى 5MB";

interface ApiResponse {
  error?: string;
  code?: string;
  detail?: string;
  url?: string;
}

async function readResponse(res: Response): Promise<ApiResponse> {
  const text = await res.text().catch(() => "");
  if (!text) return {};
  try {
    const parsed = JSON.parse(text) as ApiResponse;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

interface Options {
  storeId: string;
  folder: UploadFolder;
  maxSize?: number;
}

export function useImageUpload({ storeId, folder, maxSize = MAX_UPLOAD_SIZE }: Options) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setError(null);
    setErrorCode(null);
  }, []);

  const fail = useCallback((message: string, code: string) => {
    setError(message);
    setErrorCode(code);
  }, []);

  /** يرفع الملفات ويعيد روابط الصور التي نجح رفعها فقط */
  const upload = useCallback(
    async (files: FileList | File[] | null | undefined): Promise<string[]> => {
      const all = files ? Array.from(files as ArrayLike<File>) : [];
      if (all.length === 0) return [];
      clearError();

      // إفلات ملف غير صورة (PDF مثلًا) → رسالة واضحة بدل «فشل الرفع»
      const images = all.filter((f) => !f.type || f.type.startsWith("image/"));
      if (images.length === 0) {
        fail(`«${all[0].name}» ليس صورة — المسموح: ${UPLOAD_FORMATS_HINT}`, "not_image");
        return [];
      }

      setUploading(true);
      const uploaded: string[] = [];
      try {
        for (const file of images) {
          if (file.size > maxSize) {
            fail(`«${file.name}» أكبر من الحد المسموح (5MB)`, "too_large");
            continue;
          }
          const form = new FormData();
          form.append("storeId", storeId);
          form.append("folder", folder);
          form.append("file", file);

          let res: Response;
          try {
            res = await fetch("/api/upload", { method: "POST", body: form });
          } catch {
            fail("تعذر الاتصال بالخادم — تحقق من الشبكة ثم أعد المحاولة", "network");
            continue;
          }

          const data = await readResponse(res);
          if (!res.ok) {
            fail(
              data.error
                ? `${data.error}${data.detail ? ` — ${data.detail}` : ""}`
                : `فشل الرفع — استجابة غير متوقعة من الخادم (HTTP ${res.status})`,
              data.code ?? `http_${res.status}`
            );
            continue;
          }
          if (typeof data.url === "string" && data.url) {
            uploaded.push(data.url);
          } else {
            fail("لم يُرجع الخادم رابط الصورة — أعد المحاولة", "no_url");
          }
        }
      } catch (e) {
        fail(e instanceof Error ? e.message : "فشل الرفع", "unexpected");
      } finally {
        setUploading(false);
      }
      return uploaded;
    },
    [clearError, fail, folder, maxSize, storeId]
  );

  /**
   * حذف فعلي من التخزين (للصور التي رفعناها فقط — الروابط الخارجية
   * يتجاهلها الخادم ويعيد deleted=false). لا يُعطّل الواجهة عند الفشل.
   */
  const removeUploaded = useCallback(
    async (url: string) => {
      if (!url) return;
      try {
        await fetch("/api/upload", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ storeId, url }),
        });
      } catch {
        /* تجاهل: الحذف من السجل تم أصلًا */
      }
    },
    [storeId]
  );

  return { uploading, error, errorCode, clearError, upload, removeUploaded };
}
