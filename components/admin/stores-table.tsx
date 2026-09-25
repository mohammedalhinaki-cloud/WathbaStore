// ============================================================
// معون — جدول المتاجر (المالك): إدارة، معاينة، اختبار، تسليم
// ============================================================

"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Copy,
  Eye,
  FlaskConical,
  Gift,
  LayoutDashboard,
  Settings2,
  X,
  Check,
  ExternalLink,
} from "lucide-react";
import type { Store } from "@/lib/types";
import { STORE_STATUSES, STORE_STATUS_LABELS } from "@/lib/types";
import { mainDomain, formatDateShort } from "@/lib/constants";
import { StatusBadge } from "./ui";

interface Props {
  stores: Store[];
  host: string;
}

export default function StoresTable({ stores, host }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ text: string; kind: "ok" | "err" } | null>(null);
  const [creds, setCreds] = useState<{ email: string; password: string; store: Store } | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const isRealHost = host.endsWith(mainDomain());
  const previewPath = (subdomain: string) =>
    isRealHost ? `https://${subdomain}.${mainDomain()}` : `/?store=${subdomain}`;
  // لوحة المتجر بنفس واجهة صاحب المتجر — المالك الرئيسي يدخلها لأي متجر
  const panelPath = (subdomain: string) =>
    isRealHost ? `https://${subdomain}.${mainDomain()}/admin` : `/admin?store=${subdomain}`;

  async function act(fn: () => Promise<void>, key: string) {
    setBusy(key);
    setMsg(null);
    try {
      await fn();
      router.refresh();
    } finally {
      setBusy(null);
    }
  }

  function changeStatus(store: Store, status: Store["status"]) {
    void act(async () => {
      const res = await fetch(`/api/stores/${store.id}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      setMsg(
        res.ok
          ? { text: `تم تغيير الحالة إلى «${STORE_STATUS_LABELS[status]}»`, kind: "ok" }
          : { text: data.error ?? "فشل التغيير", kind: "err" }
      );
    }, `status-${store.id}`);
  }

  function testStore(store: Store) {
    void act(async () => {
      const res = await fetch(`/api/stores/${store.id}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "testing" }),
      });
      if (res.ok) {
        window.open(previewPath(store.subdomain), "_blank");
      }
    }, `test-${store.id}`);
  }

  function deliver(store: Store) {
    void act(async () => {
      const res = await fetch(`/api/stores/${store.id}/deliver`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setMsg({ text: data.error ?? "فشل التسليم", kind: "err" });
        return;
      }
      setMsg({ text: `تم تسليم ${store.name} بنجاح 🎉`, kind: "ok" });
      if (data.credentials) setCreds({ ...data.credentials, store });
    }, `deliver-${store.id}`);
  }

  function copy(text: string, key: string) {
    navigator.clipboard?.writeText(text).catch(() => {});
    setCopied(key);
    setTimeout(() => setCopied(null), 1500);
  }

  if (stores.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-ink-200 bg-ink-50/50 py-14 text-center">
        <span className="text-4xl">🏪</span>
        <p className="mt-4 font-bold text-ink-700">لا توجد متاجر هنا</p>
      </div>
    );
  }

  return (
    <div>
      {msg && (
        <div
          className={`mb-4 rounded-xl border px-4 py-3 text-sm font-semibold ${
            msg.kind === "ok"
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-rose-200 bg-rose-50 text-rose-700"
          }`}
        >
          {msg.text}
        </div>
      )}

      <div className="overflow-x-auto rounded-2xl border border-ink-150 bg-white shadow-sm">
        <table className="w-full min-w-[900px] text-right text-sm">
          <thead>
            <tr className="border-b border-ink-100 bg-ink-50/60 text-xs font-extrabold text-ink-500">
              <th className="px-4 py-3">المتجر</th>
              <th className="px-4 py-3">الصاحب</th>
              <th className="px-4 py-3">النطاق الفرعي</th>
              <th className="px-4 py-3">الحالة</th>
              <th className="px-4 py-3">أُنشئ</th>
              <th className="px-4 py-3">إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {stores.map((s) => (
              <tr key={s.id} className="border-b border-ink-100 last:border-0 hover:bg-ink-50/40">
                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-3">
                    {s.logoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={s.logoUrl} alt="" className="h-10 w-10 rounded-lg object-cover" />
                    ) : (
                      <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-100 font-extrabold text-brand-700">
                        {s.name.charAt(0)}
                      </span>
                    )}
                    <div>
                      <Link href={`/admin/stores/${s.id}`} className="font-bold text-ink-900 hover:text-brand-600">
                        {s.name}
                      </Link>
                      <p className="text-xs text-ink-400">{s.description || "—"}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3.5">
                  <p className="font-semibold text-ink-700">{s.ownerName || "—"}</p>
                  <p className="text-xs text-ink-400" dir="ltr">
                    {s.ownerEmail || "—"}
                  </p>
                </td>
                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-1.5">
                    <span className="rounded-lg bg-ink-100 px-2 py-1 font-mono text-xs font-semibold text-ink-700" dir="ltr">
                      {s.subdomain}.{mainDomain()}
                    </span>
                    <button
                      onClick={() => copy(s.subdomain, `sub-${s.id}`)}
                      title="نسخ الاسم"
                      className="rounded-md p-1.5 text-ink-400 hover:bg-ink-100 hover:text-ink-700"
                    >
                      {copied === `sub-${s.id}` ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                </td>
                <td className="px-4 py-3.5">
                  <div className="flex flex-col items-start gap-1.5">
                    <StatusBadge status={s.status} />
                    <select
                      value={s.status}
                      onChange={(e) => changeStatus(s, e.target.value as Store["status"])}
                      disabled={busy === `status-${s.id}`}
                      className="rounded-lg border border-ink-200 bg-white px-2 py-1 text-xs font-semibold text-ink-600 outline-none focus:border-brand-500"
                    >
                      {STORE_STATUSES.map((st) => (
                        <option key={st} value={st}>
                          {STORE_STATUS_LABELS[st]}
                        </option>
                      ))}
                    </select>
                  </div>
                </td>
                <td className="px-4 py-3.5 text-xs text-ink-500">{formatDateShort(s.createdAt)}</td>
                <td className="px-4 py-3.5">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Link
                      href={`/admin/stores/${s.id}`}
                      className="flex items-center gap-1 rounded-lg bg-brand-50 px-2.5 py-1.5 text-xs font-bold text-brand-700 hover:bg-brand-100"
                    >
                      <Settings2 className="h-3.5 w-3.5" />
                      إدارة
                    </Link>
                    <a
                      href={previewPath(s.subdomain)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 rounded-lg bg-emerald-50 px-2.5 py-1.5 text-xs font-bold text-emerald-700 hover:bg-emerald-100"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      معاينة
                    </a>
                    <a
                      href={panelPath(s.subdomain)}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="دخول لوحة المتجر بنفس واجهة صاحب المتجر"
                      className="flex items-center gap-1 rounded-lg bg-violet-50 px-2.5 py-1.5 text-xs font-bold text-violet-700 hover:bg-violet-100"
                    >
                      <LayoutDashboard className="h-3.5 w-3.5" />
                      لوحة المتجر
                    </a>
                    <button
                      onClick={() => testStore(s)}
                      disabled={busy === `test-${s.id}`}
                      className="flex items-center gap-1 rounded-lg bg-amber-50 px-2.5 py-1.5 text-xs font-bold text-amber-700 hover:bg-amber-100 disabled:opacity-50"
                    >
                      <FlaskConical className="h-3.5 w-3.5" />
                      اختبار
                    </button>
                    {s.status !== "delivered" && (
                      <button
                        onClick={() => deliver(s)}
                        disabled={busy === `deliver-${s.id}`}
                        className="flex items-center gap-1 rounded-lg bg-gradient-to-l from-emerald-500 to-emerald-400 px-2.5 py-1.5 text-xs font-extrabold text-white hover:opacity-90 disabled:opacity-50"
                      >
                        <Gift className="h-3.5 w-3.5" />
                        تسليم
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* نافذة بيانات التسليم */}
      {creds && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/60 p-4" onClick={() => setCreds(null)}>
          <div
            className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-extrabold text-ink-900">🎉 تم تسليم {creds.store.name}</h3>
                <p className="mt-1 text-sm text-ink-500">
                  أرسل هذه البيانات لصاحب المتجر في قناة آمنة:
                </p>
              </div>
              <button onClick={() => setCreds(null)} className="rounded-lg p-1.5 text-ink-400 hover:bg-ink-100">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-5 space-y-3">
              <CredRow label="رابط المتجر" value={`${creds.store.subdomain}.${mainDomain()}`} onCopy={() => copy(creds.store.subdomain, "c1")} copied={copied === "c1"} />
              <CredRow label="لوحة التحكم" value={`${creds.store.subdomain}.${mainDomain()}/admin`} onCopy={() => copy(`${creds.store.subdomain}.${mainDomain()}/admin`, "c2")} copied={copied === "c2"} />
              <CredRow label="البريد الإلكتروني" value={creds.email} onCopy={() => copy(creds.email, "c3")} copied={copied === "c3"} />
              <CredRow label="كلمة المرور" value={creds.password} onCopy={() => copy(creds.password, "c4")} copied={copied === "c4"} />
            </div>

            <a
              href={previewPath(creds.store.subdomain)}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 flex items-center justify-center gap-2 rounded-xl bg-emerald-500 py-3 text-sm font-extrabold text-white hover:bg-emerald-600"
            >
              <ExternalLink className="h-4 w-4" />
              فتح المتجر الآن
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

function CredRow({
  label,
  value,
  onCopy,
  copied,
}: {
  label: string;
  value: string;
  onCopy: () => void;
  copied: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-ink-150 bg-ink-50/50 px-4 py-2.5">
      <div className="min-w-0">
        <p className="text-[11px] font-bold text-ink-400">{label}</p>
        <p className="truncate font-mono text-sm font-bold text-ink-800" dir="ltr">
          {value}
        </p>
      </div>
      <button
        onClick={onCopy}
        className="shrink-0 rounded-lg bg-white p-2 text-ink-500 ring-1 ring-ink-200 hover:text-brand-600"
      >
        {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
      </button>
    </div>
  );
}
