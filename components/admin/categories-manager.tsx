// ============================================================
// وثبة — مدير الأقسام (إضافة، تعديل، حذف، ترتيب، إظهار/إخفاء)
// ============================================================

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp, Pencil, Plus, Trash2, Loader2 } from "lucide-react";
import type { Category } from "@/lib/types";
import { Card, EmptyState, Field, inputCls, Toggle, PrimaryBtn, GhostBtn, DangerBtn } from "./ui";
import { FormAlerts } from "./use-api";

interface Props {
  storeId: string;
  categories: Category[];
}

export default function CategoriesManager({ storeId, categories }: Props) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [visible, setVisible] = useState(true);

  const [editing, setEditing] = useState<Category | null>(null);
  const [editName, setEditName] = useState("");
  const [editVisible, setEditVisible] = useState(true);

  async function run(url: string, options?: RequestInit, key = "x") {
    setBusy(key);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch(url, options);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "حدث خطأ");
      setSuccess("تم الحفظ بنجاح");
      router.refresh();
      return data;
    } catch (e) {
      setError(e instanceof Error ? e.message : "حدث خطأ");
      return null;
    } finally {
      setBusy(null);
    }
  }

  async function add() {
    if (name.trim().length < 2) return setError("اسم القسم قصير جدًا");
    const data = await run(
      "/api/categories",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storeId, name: name.trim(), isVisible: visible }),
      },
      "add"
    );
    if (data) {
      setName("");
      setVisible(true);
      setShowForm(false);
    }
  }

  function startEdit(c: Category) {
    setEditing(c);
    setEditName(c.name);
    setEditVisible(c.isVisible);
  }

  async function saveEdit() {
    if (!editing) return;
    await run(
      `/api/categories/${editing.id}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editName.trim(), isVisible: editVisible }),
      },
      "edit"
    );
    setEditing(null);
  }

  function remove(c: Category) {
    if (!confirm(`حذف قسم «${c.name}»؟ ستبقى منتجاته دون قسم.`)) return;
    void run(`/api/categories/${c.id}`, { method: "DELETE" }, `del-${c.id}`);
  }

  function move(c: Category, dir: "up" | "down") {
    void run(`/api/categories/${c.id}/move`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dir }),
    }, `move-${c.id}`);
  }

  return (
    <div className="space-y-4">
      <FormAlerts error={error} success={success} />

      <Card>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-extrabold text-ink-900">الأقسام ({categories.length})</h3>
          <PrimaryBtn onClick={() => setShowForm(!showForm)}>
            <Plus className="h-4 w-4" />
            إضافة قسم
          </PrimaryBtn>
        </div>

        {showForm && (
          <div className="mb-5 flex flex-wrap items-end gap-3 rounded-2xl border border-brand-200 bg-brand-50/40 p-4">
            <div className="min-w-52 flex-1">
              <Field label="اسم القسم">
                <input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} placeholder="عطور، بخور، هدايا…" />
              </Field>
            </div>
            <Toggle checked={visible} onChange={setVisible} label="ظاهر" />
            <PrimaryBtn onClick={() => void add()} disabled={busy === "add"}>
              {busy === "add" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              إضافة
            </PrimaryBtn>
            <GhostBtn onClick={() => setShowForm(false)}>إلغاء</GhostBtn>
          </div>
        )}

        {categories.length === 0 ? (
          <EmptyState icon="🗂️" title="لا توجد أقسام" sub="أضف قسمًا لتنظيم منتجات المتجر" />
        ) : (
          <div className="space-y-2">
            {categories.map((c, i) => (
              <div key={c.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-ink-150 bg-ink-50/40 px-4 py-3">
                <div className="flex items-center gap-3">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white text-xs font-extrabold text-ink-500 ring-1 ring-ink-200">
                    {i + 1}
                  </span>
                  {editing?.id === c.id ? (
                    <div className="flex flex-wrap items-center gap-2">
                      <input className={`${inputCls} max-w-56`} value={editName} onChange={(e) => setEditName(e.target.value)} />
                      <Toggle checked={editVisible} onChange={setEditVisible} />
                      <PrimaryBtn onClick={() => void saveEdit()} disabled={busy === "edit"} className="px-3 py-1.5">
                        حفظ
                      </PrimaryBtn>
                      <GhostBtn onClick={() => setEditing(null)} className="px-3 py-1.5">إلغاء</GhostBtn>
                    </div>
                  ) : (
                    <span className={`text-sm font-bold ${c.isVisible ? "text-ink-800" : "text-ink-400 line-through"}`}>
                      {c.name}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1.5">
                  <Toggle checked={c.isVisible} onChange={(v) => void run(`/api/categories/${c.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isVisible: v }) }, `vis-${c.id}`)} />
                  <button onClick={() => move(c, "up")} disabled={i === 0 || busy?.startsWith("move-")} className="rounded-lg p-2 text-ink-400 hover:bg-white hover:text-ink-700 disabled:opacity-30">
                    <ArrowUp className="h-4 w-4" />
                  </button>
                  <button onClick={() => move(c, "down")} disabled={i === categories.length - 1 || busy?.startsWith("move-")} className="rounded-lg p-2 text-ink-400 hover:bg-white hover:text-ink-700 disabled:opacity-30">
                    <ArrowDown className="h-4 w-4" />
                  </button>
                  <button onClick={() => startEdit(c)} className="rounded-lg p-2 text-ink-400 hover:bg-white hover:text-brand-600">
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button onClick={() => remove(c)} disabled={busy === `del-${c.id}`} className="rounded-lg p-2 text-ink-400 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
