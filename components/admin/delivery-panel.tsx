// ============================================================
// معون — لوحة التسليم: قائمة تحقق + زر التسليم + بيانات العميل
// ============================================================

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Check, Copy, ExternalLink, Gift, Loader2, X } from "lucide-react";
import type { Store, StoreStatus } from "@/lib/types";
import { mainDomain } from "@/lib/constants";
import { Card, StatusBadge, PrimaryBtn } from "./ui";

interface Props {
  store: Store;
  checklist: { ok: boolean; label: string; detail: string; href: string }[];
  allOk: boolean;
  previewUrl: string;
}

interface Creds {
  email: string;
  password: string;
}

export default function DeliveryPanel({ store, checklist, allOk, previewUrl }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [creds, setCreds] = useState<Creds | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  async function deliver() {
    if (!confirm(`تسليم «${store.name}» للعميل ${store.ownerEmail || "—"}؟\nسيتم إنشاء حساب العميل وتغيير حالة المتجر إلى «مسلّم».`)) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/stores/${store.id}/deliver`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "فشل التسليم");
      setCreds(data.credentials);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "حدث خطأ");
    } finally {
      setBusy(false);
    }
  }

  function copy(text: string, key: string) {
    navigator.clipboard?.writeText(text).catch(() => {});
    setCopied(key);
    setTimeout(() => setCopied(null), 1500);
  }

  const delivered = store.status === "delivered";

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <Card className="lg:col-span-2">
        <h3 className="mb-5 font-extrabold text-ink-900">قائمة التحقق قبل التسليم</h3>
        <div className="space-y-2.5">
          {checklist.map((c) => (
            <div key={c.label} className="flex items-center justify-between rounded-xl border border-ink-150 bg-ink-50/40 px-4 py-3">
              <div className="flex items-center gap-3">
                <span
                  className={`flex h-7 w-7 items-center justify-center rounded-full ${
                    c.ok ? "bg-emerald-100 text-emerald-600" : "bg-rose-100 text-rose-500"
                  }`}
                >
                  {c.ok ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
                </span>
                <div>
                  <p className="text-sm font-bold text-ink-800">{c.label}</p>
                  <p className="text-xs text-ink-400">{c.detail}</p>
                </div>
              </div>
              {!c.ok && (
                <Link href={c.href} className="text-xs font-bold text-brand-600 hover:underline">
                  إكمال ←
                </Link>
              )}
            </div>
          ))}
        </div>

        {error && (
          <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
            {error}
          </div>
        )}

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-ink-100 pt-5">
          <p className="text-sm text-ink-500">
            {allOk ? (
              <span className="font-bold text-emerald-600">كل شيء جاهز للتسليم 🎉</span>
            ) : (
              <span>أكمل النقاط الناقصة ثم سلّم المتجر</span>
            )}
          </p>
          {!delivered ? (
            <PrimaryBtn
              onClick={() => void deliver()}
              disabled={busy}
              className="bg-gradient-to-l from-emerald-500 to-emerald-400 px-6 from-emerald-500"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Gift className="h-4 w-4" />}
              تسليم المتجر للعميل
            </PrimaryBtn>
          ) : (
            <span className="flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-2.5 text-sm font-extrabold text-emerald-700 ring-1 ring-emerald-200">
              <Check className="h-4 w-4" />
              المتجر مسلّم
              {store.deliveredAt && <span className="font-normal text-emerald-600/70">({new Date(store.deliveredAt).toLocaleDateString("ar-SA")})</span>}
            </span>
          )}
        </div>
      </Card>

      {/* بيانات التسليم */}
      <Card>
        <h3 className="mb-4 font-extrabold text-ink-900">بيانات تسليم العميل</h3>
        {delivered || creds ? (
          <div className="space-y-3">
            <CredRow label="رابط المتجر" value={`${store.subdomain}.${mainDomain()}`} onCopy={() => copy(store.subdomain, "d1")} copied={copied === "d1"} />
            <CredRow label="رابط لوحة العميل" value={`${store.subdomain}.${mainDomain()}/admin`} onCopy={() => copy(`${store.subdomain}.${mainDomain()}/admin`, "d2")} copied={copied === "d2"} />
            <CredRow label="البريد الإلكتروني" value={(creds ?? store.clientCredentials)?.email ?? store.ownerEmail} onCopy={() => copy((creds ?? store.clientCredentials)?.email ?? store.ownerEmail, "d3")} copied={copied === "d3"} />
            {(creds ?? store.clientCredentials)?.password && (
              <CredRow label="كلمة المرور" value={(creds ?? store.clientCredentials)!.password} onCopy={() => copy((creds ?? store.clientCredentials)!.password, "d4")} copied={copied === "d4"} />
            )}
            <a
              href={previewUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 rounded-xl bg-emerald-500 py-3 text-sm font-extrabold text-white hover:bg-emerald-600"
            >
              <ExternalLink className="h-4 w-4" />
              فتح المتجر المسلّم
            </a>
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-ink-200 bg-ink-50/50 p-5 text-center">
            <span className="text-3xl">📦</span>
            <p className="mt-3 text-sm font-bold text-ink-700">لم يُسلّم المتجر بعد</p>
            <p className="mt-1 text-xs leading-5 text-ink-400">
              عند الضغط على «تسليم المتجر» سيتم:
              <br />1) إنشاء حساب العميل
              <br />2) توليد كلمة مرور
              <br />3) تغيير الحالة إلى «مسلّم»
            </p>
          </div>
        )}
      </Card>
    </div>
  );
}

function CredRow({ label, value, onCopy, copied }: { label: string; value: string; onCopy: () => void; copied: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-ink-150 bg-ink-50/50 px-4 py-2.5">
      <div className="min-w-0">
        <p className="text-[11px] font-bold text-ink-400">{label}</p>
        <p className="truncate font-mono text-sm font-bold text-ink-800" dir="ltr">{value || "—"}</p>
      </div>
      <button onClick={onCopy} className="shrink-0 rounded-lg bg-white p-2 text-ink-500 ring-1 ring-ink-200 hover:text-brand-600">
        {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
      </button>
    </div>
  );
}
