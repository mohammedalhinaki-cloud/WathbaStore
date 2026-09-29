// ============================================================
// معون — حقل صورة واحدة: رفع / سحب وإفلات / لصق + رابط اختياري
// ------------------------------------------------------------
// كانت حقول الصور في إعدادات SEO (صورة المشاركة Open Graph وأيقونة
// المتصفح Favicon وصورة الغلاف) مجرد خانة نص تتطلب رابطًا جاهزًا —
// وهو أمر شاق على المستخدم. هذا المكوّن يوحّدها كلها:
//   • اسحب الصورة وأفلتها، أو اضغط لاختيارها من جهازك،
//   • أو الصقها من الحافظة (Ctrl+V) بعد الضغط على المربع،
//   • أو الصق رابطًا جاهزًا في الحقل الصغير أسفله (يبقى متاحًا).
//
// ملاحظة مقصودة: زر «إزالة» يمسح الرابط من الحقل فقط ولا يحذف الملف
// من التخزين — لأن نفس الصورة قد تكون مستخدمة في حقل آخر (الشعار =
// الأيقونة مثلًا) فحذفها من التخزين يكسر المكان الآخر.
// ============================================================

"use client";

import { useRef, useState } from "react";
import { AlertTriangle, ImagePlus, Loader2, RefreshCw, Trash2 } from "lucide-react";
import { inputCls } from "./ui";
import {
  ACCEPT_IMAGES,
  UPLOAD_FORMATS_HINT,
  useImageUpload,
  type UploadFolder,
} from "./use-upload";

type Shape = "square" | "wide" | "icon";

const PREVIEW_BOX: Record<Shape, string> = {
  square: "h-24 w-24",
  wide: "h-24 w-40",
  icon: "h-16 w-16",
};

interface Props {
  storeId: string;
  folder: UploadFolder;
  label: string;
  value: string;
  onChange: (url: string) => void;
  /** شرح أسفل الحقل */
  hint?: string;
  /** المقاس المقترح — يظهر داخل منطقة الإفلات */
  recommend?: string;
  /** شكل المعاينة */
  shape?: Shape;
  /** نص حقل الرابط الاختياري */
  urlLabel?: string;
  urlPlaceholder?: string;
}

export default function ImageField({
  storeId,
  folder,
  label,
  value,
  onChange,
  hint,
  recommend,
  shape = "square",
  urlLabel = "أو الصق رابط صورة جاهز",
  urlPlaceholder,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [broken, setBroken] = useState(false);
  const { uploading, error, errorCode, clearError, upload } = useImageUpload({ storeId, folder });

  async function handleFiles(files: FileList | File[] | null) {
    const urls = await upload(files);
    const last = urls[urls.length - 1];
    if (last) {
      setBroken(false);
      onChange(last);
    }
  }

  function openPicker() {
    inputRef.current?.click();
  }

  const hasValue = Boolean(value.trim());

  return (
    // min-w-0: الصندوق عنصر داخل grid — بدونها قد يفرض محتواه
    // حدًّا أدنى أعرض من عمود الشبكة على شاشات الجوال الضيقة
    <div className="min-w-0 rounded-2xl border border-ink-150 bg-ink-50/40 p-4">
      <div className="mb-2 flex items-center justify-between gap-3">
        <span className="text-sm font-bold text-ink-700">{label}</span>
        {hasValue && (
          <button
            type="button"
            onClick={() => {
              clearError();
              setBroken(false);
              onChange("");
            }}
            className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-bold text-ink-400 transition-colors hover:bg-rose-50 hover:text-rose-600"
          >
            <Trash2 className="h-3.5 w-3.5" />
            إزالة
          </button>
        )}
      </div>

      <div
        role="button"
        tabIndex={0}
        aria-label={`${label} — اسحب صورة أو اضغط للاختيار`}
        onClick={openPicker}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            openPicker();
          }
        }}
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
        onPaste={(e) => {
          const files = e.clipboardData?.files;
          if (files && files.length > 0) {
            e.preventDefault();
            void handleFiles(files);
          }
        }}
        className={`cursor-pointer rounded-2xl border-2 border-dashed px-4 py-5 text-center outline-none transition-colors focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 ${
          dragging
            ? "border-brand-500 bg-brand-50"
            : "border-ink-200 bg-white/70 hover:border-brand-400 hover:bg-brand-50/40"
        }`}
      >
        {uploading ? (
          <div className="flex flex-col items-center gap-2 py-3">
            <Loader2 className="h-7 w-7 animate-spin text-brand-500" />
            <p className="text-sm font-bold text-ink-600">جارٍ رفع الصورة…</p>
          </div>
        ) : hasValue ? (
          // على الجوال: المعاينة فوق والنص تحتها (لا تنحشر بجانب بعضها).
          // من شاشة sm وما فوق تعود بجانب النص كما كانت.
          <div className="flex flex-col items-start gap-3 text-right sm:flex-row sm:items-center sm:gap-4">
            <div
              className={`grid shrink-0 place-items-center overflow-hidden rounded-xl bg-white ring-1 ring-ink-200 ${PREVIEW_BOX[shape]}`}
            >
              {broken ? (
                <span className="px-1 text-[10px] font-bold leading-4 text-rose-500">
                  تعذّر عرض الصورة
                </span>
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={value}
                  alt=""
                  className="h-full w-full object-contain"
                  onError={() => setBroken(true)}
                  onLoad={() => setBroken(false)}
                />
              )}
            </div>
            <div className="w-full min-w-0 sm:flex-1">
              <p className="inline-flex items-center gap-1.5 text-sm font-bold text-ink-700">
                <RefreshCw className="h-3.5 w-3.5 shrink-0 text-brand-600" />
                اسحب صورة جديدة هنا أو اضغط للاستبدال
              </p>
              <p className="mt-1 w-full truncate text-xs text-ink-400" dir="ltr">
                {value}
              </p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center py-1">
            <ImagePlus className="h-8 w-8 text-ink-400" />
            <p className="mt-2 text-sm font-bold text-ink-600">اسحب الصورة هنا أو اضغط للاختيار</p>
            <p className="mt-1 text-xs text-ink-400">
              {UPLOAD_FORMATS_HINT}
              {recommend ? ` · ${recommend}` : ""}
            </p>
            <p className="mt-0.5 text-[11px] text-ink-400">
              يمكنك أيضًا لصق صورة من الحافظة (Ctrl+V) بعد الضغط هنا
            </p>
          </div>
        )}

        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT_IMAGES}
          className="hidden"
          onClick={(e) => e.stopPropagation()}
          onChange={(e) => {
            const picked = e.target.files ? Array.from(e.target.files) : [];
            e.target.value = ""; // نسمح باختيار نفس الملف مرة أخرى
            void handleFiles(picked);
          }}
        />
      </div>

      {error && (
        <div className="mt-2 flex items-start gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-rose-500" />
          {/* break-words: رسائل الخادم قد تحمل رابطًا طويلًا بلا فراغات
              فتخرج عن حدود الصندوق على الجوال بدونها */}
          <p className="min-w-0 break-words text-xs font-semibold leading-5 text-rose-700">
            {error}
            {errorCode && (
              <span className="mt-0.5 block font-mono text-[10px] text-rose-400">{errorCode}</span>
            )}
          </p>
        </div>
      )}

      {hint && !error && <p className="mt-2 text-xs leading-5 text-ink-400">{hint}</p>}

      <label className="mt-3 block">
        <span className="mb-1 block text-xs font-bold text-ink-500">{urlLabel}</span>
        <input
          className={`${inputCls} py-2 text-xs`}
          dir="ltr"
          value={value}
          placeholder={urlPlaceholder}
          onChange={(e) => {
            clearError();
            setBroken(false);
            onChange(e.target.value);
          }}
          onPaste={(e) => {
            const files = e.clipboardData?.files;
            if (files && files.length > 0) {
              e.preventDefault();
              void handleFiles(files);
            }
          }}
        />
      </label>
    </div>
  );
}
