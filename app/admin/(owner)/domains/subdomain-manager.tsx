// وثبة — بطاقة نطاق فرعي مع تغيير حي والتحقق
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Copy, Loader2, Save, X } from "lucide-react";
import type { Store } from "@/lib/types";
import { mainDomain } from "@/lib/constants";
import { validateSubdomain } from "@/lib/subdomain";
import { StatusBadge, Card } from "@/components/admin/ui";

export default function SubdomainManager({ store }: { store: Store }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(store.subdomain);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const locked = store.status === "delivered";
  const check = validateSubdomain(value);
  const valid = check.ok && value !== store.subdomain;

  async function save() {
    if (!valid) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/stores/${store.id}/subdomain`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subdomain: value }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "فشل التغيير");
      setEditing(false);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "حدث خطأ");
    } finally {
      setBusy(false);
    }
  }

  function copySub() {
    navigator.clipboard?.writeText(store.subdomain).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <Card>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div>
            <p className="font-extrabold text-ink-900">{store.name}</p>
            <p className="text-xs text-ink-400">{store.ownerName}</p>
          </div>
          <StatusBadge status={store.status} />
        </div>
        {!editing && (
          <button
            onClick={() => {
              if (locked) return;
              setEditing(true);
              setError(null);
            }}
            disabled={locked}
            className="rounded-xl bg-brand-50 px-4 py-2 text-xs font-bold text-brand-700 ring-1 ring-brand-200 hover:bg-brand-100 disabled:cursor-not-allowed disabled:opacity-50"
            title={locked ? "متجر مسلّم — لا يمكن تغيير النطاق" : "تغيير النطاق"}
          >
            تغيير
          </button>
        )}
      </div>

      {editing ? (
        <div className="mt-4 space-y-3">
          <div className="flex items-stretch overflow-hidden rounded-xl border border-ink-200 bg-white focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-500/20">
            <input
              className="min-w-0 flex-1 border-0 px-3.5 py-2.5 text-sm outline-none"
              dir="ltr"
              value={value}
              onChange={(e) => setValue(e.target.value.trim().toLowerCase().replace(/\s+/g, ""))}
            />
            <span className="flex items-center whitespace-nowrap bg-ink-50 px-3 text-xs font-bold text-ink-400" dir="ltr">
              .{mainDomain()}
            </span>
          </div>
          {!check.ok ? (
            <p className="text-xs font-bold text-rose-600">{check.reason}</p>
          ) : valid ? (
            <p className="flex items-center gap-1.5 text-xs font-bold text-emerald-600">
              <Check className="h-3.5 w-3.5" />
              الاسم صالح — جاهز للحفظ
            </p>
          ) : (
            <p className="text-xs text-ink-400">لا تغيير</p>
          )}
          {error && <p className="text-xs font-bold text-rose-600">{error}</p>}
          <div className="flex gap-2">
            <button
              onClick={() => void save()}
              disabled={!valid || busy}
              className="flex items-center gap-1.5 rounded-xl bg-brand-600 px-4 py-2 text-xs font-extrabold text-white hover:bg-brand-700 disabled:opacity-50"
            >
              {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
              حفظ
            </button>
            <button onClick={() => { setEditing(false); setValue(store.subdomain); }} className="rounded-xl border border-ink-200 px-4 py-2 text-xs font-bold text-ink-600 hover:bg-ink-50">
              إلغاء
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-4 flex items-center justify-between gap-3 rounded-xl bg-ink-50/60 px-4 py-3">
          <div>
            <p className="font-mono text-sm font-bold text-ink-800" dir="ltr">
              {store.subdomain}.{mainDomain()}
            </p>
            <p className="mt-0.5 text-[11px] text-ink-400">
              {locked ? "🔒 قُفل بعد التسليم" : "يمكن تغييره حتى التسليم"}
            </p>
          </div>
          <button onClick={copySub} className="rounded-lg p-2 text-ink-400 hover:bg-white hover:text-brand-600">
            {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
          </button>
        </div>
      )}
    </Card>
  );
}
