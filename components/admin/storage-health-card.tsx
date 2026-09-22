// ============================================================
// معين — بطاقة «فحص رفع الصور» (المالك الرئيسي)
//
// تفحص السلسلة كاملة أمام عينيك: الواجهة → API → التخزين → قاعدة البيانات:
//   • هل خزنة store-assets موجودة وعامة وما حدودها؟
//   • هل يستطيع هذا الحساب الكتابة فعلًا في مسار المتجر (RLS)؟
//   • هل الحذف يعمل (تنظيف الصور المستبدلة)؟
// الفحص يرفع كائن اختبار بحجم 1×1 بكسل ثم يحذفه مباشرة — لا يترك أثرًا.
// ============================================================

"use client";

import { useState } from "react";
import { Card, GhostBtn, PrimaryBtn } from "./ui";
import { Loader2, ShieldCheck, ShieldAlert, RefreshCw } from "lucide-react";

interface StorageHealth {
  mode: "supabase" | "local";
  bucket: string;
  serverKeyPresent: boolean;
  bucketExists: boolean | null;
  bucketPublic: boolean | null;
  fileSizeLimit: number | null;
  allowedMimeTypes: string[] | null;
  sessionUploadOk: boolean | null;
  sessionUploadError: string | null;
  sessionDeleteOk: boolean | null;
  notes: string[];
}

function Row({ label, ok, value }: { label: string; ok: boolean | null; value?: string }) {
  const tone =
    ok === null
      ? "bg-ink-100 text-ink-500 ring-ink-200"
      : ok
        ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
        : "bg-rose-50 text-rose-700 ring-rose-200";
  const text = ok === null ? "غير معروف" : ok ? "سليم" : "مشكلة";
  return (
    <div className="flex items-center justify-between gap-3 border-b border-ink-100 py-2.5 last:border-0">
      <span className="text-sm font-bold text-ink-700">{label}</span>
      <span className="flex items-center gap-2">
        {value && <span className="font-mono text-[11px] text-ink-400" dir="ltr">{value}</span>}
        <span className={`rounded-full px-2.5 py-1 text-xs font-bold ring-1 ${tone}`}>{text}</span>
      </span>
    </div>
  );
}

export default function StorageHealthCard({ storeId }: { storeId: string }) {
  const [busy, setBusy] = useState(false);
  const [health, setHealth] = useState<StorageHealth | null>(null);
  const [checkedAt, setCheckedAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/upload/health?storeId=${encodeURIComponent(storeId)}`, {
        cache: "no-store",
      });
      const text = await res.text();
      let data: { health?: StorageHealth; checkedAt?: string; error?: string } = {};
      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        data = {};
      }
      if (!res.ok || !data.health) {
        setError(data.error ?? `تعذر إتمام الفحص (HTTP ${res.status})`);
        return;
      }
      setHealth(data.health);
      setCheckedAt(data.checkedAt ?? null);
    } catch {
      setError("تعذر الاتصال بالخادم");
    } finally {
      setBusy(false);
    }
  }

  const allOk =
    health !== null &&
    health.bucketExists === true &&
    health.bucketPublic === true &&
    health.sessionUploadOk === true;

  return (
    <Card>
      <div className="mb-3 flex items-center gap-2">
        {allOk ? (
          <ShieldCheck className="h-5 w-5 text-emerald-500" />
        ) : (
          <ShieldAlert className="h-5 w-5 text-amber-500" />
        )}
        <h3 className="font-extrabold text-ink-900">فحص رفع الصور</h3>
      </div>
      <p className="text-xs leading-6 text-ink-500">
        يفحص المسار كاملًا: الواجهة → API → Supabase Storage → قاعدة البيانات (RLS)، ويرفع صورة اختبار
        1×1 بكسل ثم يحذفها فورًا.
      </p>

      {!health && (
        <div className="mt-4 flex justify-end">
          <PrimaryBtn onClick={() => void run()} disabled={busy}>
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}
            تشغيل الفحص
          </PrimaryBtn>
        </div>
      )}

      {health && (
        <div className="mt-4">
          <Row label="وضع التخزين" ok={true} value={health.mode} />
          <Row label={`خزنة «${health.bucket}» موجودة`} ok={health.bucketExists} />
          <Row label="الخزنة عامة (الصور تظهر للزوار)" ok={health.bucketPublic} />
          <Row
            label="الرفع بحساب الجلسة (RLS)"
            ok={health.sessionUploadOk}
            value={
              health.sessionUploadError
                ? health.sessionUploadError.slice(0, 60)
                : health.fileSizeLimit
                  ? `${Math.round(health.fileSizeLimit / 1024 / 1024)}MB`
                  : undefined
            }
          />
          <Row label="حذف الصور (استبدال/تنظيف)" ok={health.sessionDeleteOk} />
          <Row
            label="مفتاح الخادم السري (لتسليم المتاجر)"
            ok={health.serverKeyPresent}
            value="SUPABASE_SECRET_KEY"
          />

          {health.notes.length > 0 && (
            <ul className="mt-3 space-y-2 rounded-xl bg-ink-50/70 p-3">
              {health.notes.map((n, i) => (
                <li key={i} className="text-xs leading-6 font-semibold text-ink-600">
                  • {n}
                </li>
              ))}
            </ul>
          )}

          <div className="mt-4 flex items-center justify-between gap-3">
            <span className="text-[11px] text-ink-400">
              {checkedAt ? `آخر فحص: ${new Date(checkedAt).toLocaleString("ar-SA")}` : ""}
            </span>
            <GhostBtn onClick={() => void run()} disabled={busy}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              إعادة الفحص
            </GhostBtn>
          </div>
        </div>
      )}

      {error && (
        <p className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700">
          {error}
        </p>
      )}
    </Card>
  );
}
