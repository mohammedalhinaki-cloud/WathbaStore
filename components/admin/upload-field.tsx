// ============================================================
// معون — حقل رفع صورة (متعددة) مع معاينة
//
// ملاحظة تشخيصية مهمة: كان الحقل يعرض «فشل الرفع» في كل حالة لا يعود
// فيها الخادم برد JSON يحوي error — وأكثر حالاتها استجابة 500 فارغة من
// خطأ غير ملتقط في الخادم. الآن:
//   • نقرأ النص أولًا ثم نحاول تحليله JSON (لا نفترض الشكل).
//   • نعرض رمز HTTP ورسالة الخادم الحقيقية ورمز الخطأ التقني.
//   • الحذف (زر ×) يحذف الصورة من التخزين أيضًا (استبدال/تنظيف حقيقي).
// ============================================================

"use client";

import { useRef, useState } from "react";
import { ImagePlus, X, Loader2, AlertTriangle } from "lucide-react";

interface Props {
  storeId: string;
  folder: "logo" | "cover" | "products" | "pages";
  label: string;
  value: string[];
  onChange: (urls: string[]) => void;
  hint?: string;
  maxSize?: number;
}

interface ApiError {
  error?: string;
  code?: string;
  detail?: string;
}

export default function UploadField({
  storeId,
  folder,
  label,
  value,
  onChange,
  hint,
  maxSize = 5 * 1024 * 1024,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  async function readResponse(res: Response): Promise<ApiError> {
    const text = await res.text().catch(() => "");
    if (!text) return {};
    try {
      const parsed = JSON.parse(text) as ApiError;
      return parsed && typeof parsed === "object" ? parsed : {};
    } catch {
      return {};
    }
  }

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setError(null);
    setErrorCode(null);
    setUploading(true);
    try {
      const urls = [...value];
      for (const file of Array.from(files)) {
        if (file.size > maxSize) {
          setError(`"${file.name}" أكبر من الحد المسموح (5MB)`);
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
          setError("تعذر الاتصال بالخادم — تحقق من الشبكة ثم أعد المحاولة");
          setErrorCode("network");
          continue;
        }
        const data = await readResponse(res);
        if (!res.ok) {
          setError(
            data.error
              ? `${data.error}${data.detail ? ` — ${data.detail}` : ""}`
              : `فشل الرفع — استجابة غير متوقعة من الخادم (HTTP ${res.status})`
          );
          setErrorCode(data.code ?? `http_${res.status}`);
          continue;
        }
        if (!data.error && "url" in data && typeof (data as { url?: string }).url === "string") {
          urls.push((data as { url: string }).url);
        } else {
          setError("لم يُرجع الخادم رابط الصورة — أعد المحاولة");
          setErrorCode("no_url");
        }
      }
      onChange(urls);
    } catch (e) {
      setError(e instanceof Error ? e.message : "فشل الرفع");
      setErrorCode("unexpected");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function removeAt(i: number) {
    const url = value[i];
    onChange(value.filter((_, idx) => idx !== i));
    // تنظيف فعلي: نحذف الكائن من التخزين إن كان من مرفوعاتنا (لا يعطّل الواجهة)
    try {
      await fetch("/api/upload", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storeId, url }),
      });
    } catch {
      /* تجاهل: الحذف من السجل تم أصلًا */
    }
  }

  return (
    <div>
      <span className="mb-1.5 block text-sm font-bold text-ink-700">{label}</span>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          void handleFiles(e.dataTransfer.files);
        }}
        onClick={() => inputRef.current?.click()}
        className={`flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-4 py-8 text-center transition-colors ${
          dragging ? "border-brand-500 bg-brand-50" : "border-ink-200 bg-ink-50/50 hover:border-brand-400 hover:bg-brand-50/40"
        }`}
      >
        {uploading ? (
          <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
        ) : (
          <>
            <ImagePlus className="h-8 w-8 text-ink-400" />
            <p className="mt-2 text-sm font-bold text-ink-600">اسحب الصور هنا أو اضغط للاختيار</p>
            <p className="mt-1 text-xs text-ink-400">JPG, PNG, WebP — حتى 5MB</p>
          </>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          multiple
          className="hidden"
          onChange={(e) => void handleFiles(e.target.files)}
        />
      </div>

      {value.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-3">
          {value.map((url, i) => (
            <div key={i} className="group relative h-20 w-20 overflow-hidden rounded-xl border border-ink-200">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="" className="h-full w-full object-cover" />
              {i === 0 && (
                <span className="absolute bottom-0 right-0 left-0 bg-ink-950/70 py-0.5 text-center text-[10px] font-bold text-white">
                  رئيسية
                </span>
              )}
              <button
                type="button"
                title="حذف الصورة من التخزين"
                onClick={(e) => {
                  e.stopPropagation();
                  void removeAt(i);
                }}
                className="absolute top-1 left-1 hidden h-5 w-5 items-center justify-center rounded-full bg-ink-950/80 text-white group-hover:flex"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}
      {error && (
        <div className="mt-2 flex items-start gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-rose-500" />
          <p className="text-xs font-semibold leading-5 text-rose-700">
            {error}
            {errorCode && <span className="mt-0.5 block font-mono text-[10px] text-rose-400">{errorCode}</span>}
          </p>
        </div>
      )}
      {hint && !error && <p className="mt-2 text-xs text-ink-400">{hint}</p>}
    </div>
  );
}
