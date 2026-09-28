// ============================================================
// معون — حقل رفع صور (متعددة) مع معاينة
//
// ملاحظة تشخيصية مهمة: كان الحقل يعرض «فشل الرفع» في كل حالة لا يعود
// فيها الخادم برد JSON يحوي error — وأكثر حالاتها استجابة 500 فارغة من
// خطأ غير ملتقط في الخادم. الآن (داخل خطاف useImageUpload المشترك):
//   • نقرأ النص أولًا ثم نحاول تحليله JSON (لا نفترض الشكل).
//   • نعرض رمز HTTP ورسالة الخادم الحقيقية ورمز الخطأ التقني.
//   • الحذف (زر ×) يحذف الصورة من التخزين أيضًا (استبدال/تنظيف حقيقي).
//
// لحقل صورة واحدة (شعار، Open Graph، Favicon…) استخدم ImageField في
// components/admin/image-field.tsx — يشارك نفس منطق الرفع.
// ============================================================

"use client";

import { useRef, useState } from "react";
import { ImagePlus, X, Loader2, AlertTriangle } from "lucide-react";
import {
  ACCEPT_IMAGES,
  UPLOAD_FORMATS_HINT,
  useImageUpload,
  type UploadFolder,
} from "./use-upload";

interface Props {
  storeId: string;
  folder: UploadFolder;
  label: string;
  value: string[];
  onChange: (urls: string[]) => void;
  hint?: string;
  maxSize?: number;
}

export default function UploadField({
  storeId,
  folder,
  label,
  value,
  onChange,
  hint,
  maxSize,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const { uploading, error, errorCode, upload, removeUploaded } = useImageUpload({
    storeId,
    folder,
    maxSize,
  });

  async function handleFiles(files: FileList | null) {
    const uploaded = await upload(files);
    if (uploaded.length > 0) onChange([...value, ...uploaded]);
    if (inputRef.current) inputRef.current.value = "";
  }

  async function removeAt(i: number) {
    const url = value[i];
    onChange(value.filter((_, idx) => idx !== i));
    // تنظيف فعلي: نحذف الكائن من التخزين إن كان من مرفوعاتنا (لا يعطّل الواجهة)
    await removeUploaded(url);
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
            <p className="mt-1 text-xs text-ink-400">{UPLOAD_FORMATS_HINT}</p>
          </>
        )}
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT_IMAGES}
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
