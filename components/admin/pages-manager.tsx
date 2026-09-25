// ============================================================
// معون — مدير صفحات المتجر (من نحن، سياسات…)
// ============================================================

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import type { StorePage } from "@/lib/types";
import { Card, EmptyState, Field, inputCls, PrimaryBtn, GhostBtn, Toggle } from "./ui";
import { FormAlerts } from "./use-api";

interface Props {
  storeId: string;
  pages: StorePage[];
}

export default function PagesManager({ storeId, pages }: Props) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const [editing, setEditing] = useState<Partial<StorePage> | null>(null);

  async function run(url: string, options?: RequestInit, key = "x") {
    setBusy(key);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch(url, options);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "حدث خطأ");
      setSuccess("تم الحفظ");
      router.refresh();
      return data;
    } catch (e) {
      setError(e instanceof Error ? e.message : "حدث خطأ");
      return null;
    } finally {
      setBusy(null);
    }
  }

  function startNew() {
    setEditing({ title: "", slug: "", content: "", isVisible: true });
  }

  async function save() {
    if (!editing) return;
    if (editing.title && editing.title.trim().length < 2) {
      setError("عنوان الصفحة قصير جدًا");
      return;
    }
    const data = await run(
      editing.id ? `/api/pages/${editing.id}` : "/api/pages",
      {
        method: editing.id ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storeId,
          title: editing.title?.trim(),
          slug: editing.slug?.trim() || undefined,
          content: editing.content ?? "",
          isVisible: editing.isVisible ?? true,
        }),
      },
      "save-page"
    );
    if (data) setEditing(null);
  }

  function remove(p: StorePage) {
    if (!confirm(`حذف صفحة «${p.title}»؟`)) return;
    void run(`/api/pages/${p.id}`, { method: "DELETE" }, `del-${p.id}`);
  }

  return (
    <div className="space-y-4">
      <FormAlerts error={error} success={success} />

      <Card>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-extrabold text-ink-900">الصفحات ({pages.length})</h3>
          <PrimaryBtn onClick={startNew}>
            <Plus className="h-4 w-4" />
            إضافة صفحة
          </PrimaryBtn>
        </div>

        {pages.length === 0 && !editing && (
          <EmptyState icon="📄" title="لا توجد صفحات" sub="أضف صفحات مثل «من نحن» و«سياسة الاستبدال»" />
        )}

        {pages.map((p) => (
          <div key={p.id} className="mb-2 flex items-center justify-between rounded-xl border border-ink-150 bg-ink-50/40 px-4 py-3">
            <div>
              <p className={`text-sm font-bold ${p.isVisible ? "text-ink-800" : "text-ink-400 line-through"}`}>{p.title}</p>
              <p className="text-xs text-ink-400" dir="ltr">/pages/{p.slug}</p>
            </div>
            <div className="flex items-center gap-1.5">
              <button onClick={() => setEditing(p)} className="rounded-lg p-2 text-ink-400 hover:bg-white hover:text-brand-600">
                <Pencil className="h-4 w-4" />
              </button>
              <button onClick={() => remove(p)} disabled={busy === `del-${p.id}`} className="rounded-lg p-2 text-ink-400 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}

        {editing && (
          <div className="mt-5 space-y-4 rounded-2xl border border-brand-200 bg-brand-50/40 p-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="عنوان الصفحة" required>
                <input className={inputCls} value={editing.title ?? ""} onChange={(e) => setEditing({ ...editing, title: e.target.value })} placeholder="من نحن" />
              </Field>
              <Field label="رابط (slug)" hint="اتركه فارغًا لتوليد تلقائي">
                <input className={inputCls} dir="ltr" value={editing.slug ?? ""} onChange={(e) => setEditing({ ...editing, slug: e.target.value })} placeholder="about" />
              </Field>
            </div>
            <Field label="المحتوى">
              <textarea className={inputCls} rows={6} value={editing.content ?? ""} onChange={(e) => setEditing({ ...editing, content: e.target.value })} />
            </Field>
            <div className="flex items-center justify-between">
              <Toggle checked={editing.isVisible ?? true} onChange={(v) => setEditing({ ...editing, isVisible: v })} label="ظاهر" />
              <div className="flex gap-2">
                <GhostBtn onClick={() => setEditing(null)}>إلغاء</GhostBtn>
                <PrimaryBtn onClick={() => void save()} disabled={busy === "save-page"}>
                  {busy === "save-page" && <Loader2 className="h-4 w-4 animate-spin" />}
                  حفظ
                </PrimaryBtn>
              </div>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
