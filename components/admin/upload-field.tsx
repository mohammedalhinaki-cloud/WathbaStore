// ============================================================
// وثبة — حقل رفع صورة (متعددة) مع معاينة
// ============================================================

"use client";

import { useRef, useState } from "react";
import { ImagePlus, X, Loader2 } from "lucide-react";

interface Props {
  storeId: string;
  folder: "logo" | "cover" | "products" | "pages";
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
  maxSize = 5 * 1024 * 1024,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setError(null);
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
        const res = await fetch("/api/upload", { method: "POST", body: form });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error ?? "فشل الرفع");
        urls.push(data.url as string);
      }
      onChange(urls);
    } catch (e) {
      setError(e instanceof Error ? e.message : "فشل رفع الصورة");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function removeAt(i: number) {
    onChange(value.filter((_, idx) => idx !== i));
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
                onClick={(e) => {
                  e.stopPropagation();
                  removeAt(i);
                }}
                className="absolute top-1 left-1 hidden h-5 w-5 items-center justify-center rounded-full bg-ink-950/80 text-white group-hover:flex"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}
      {error && <p className="mt-2 text-xs font-semibold text-rose-600">{error}</p>}
      {hint && !error && <p className="mt-2 text-xs text-ink-400">{hint}</p>}
    </div>
  );
}
