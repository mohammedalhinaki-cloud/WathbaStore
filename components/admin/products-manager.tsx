// ============================================================
// معون — مدير المنتجات (قائمة + ترتيب + إظهار/إخفاء + حذف)
// ============================================================

"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp, Eye, EyeOff, Pencil, Trash2, Loader2 } from "lucide-react";
import type { Category, Product } from "@/lib/types";
import { formatPrice } from "@/lib/constants";
import { Card, EmptyState, Toggle } from "./ui";
import { FormAlerts } from "./use-api";

interface Props {
  storeId: string;
  products: Product[];
  categories: Category[];
  editBase: string;
}

export default function ProductsManager({ storeId, products, categories, editBase }: Props) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [filter, setFilter] = useState("all");

  const list = filter === "all" ? products : products.filter((p) => p.categoryId === filter);
  const catName = (id: string | null) => categories.find((c) => c.id === id)?.name ?? "بدون قسم";

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
    } catch (e) {
      setError(e instanceof Error ? e.message : "حدث خطأ");
    } finally {
      setBusy(null);
    }
  }

  function toggleVisible(p: Product) {
    void run(
      `/api/products/${p.id}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storeId, isVisible: !p.isVisible }),
      },
      `vis-${p.id}`
    );
  }

  function move(p: Product, i: number, dir: "up" | "down") {
    void run(`/api/products/${p.id}/move`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dir }),
    }, `move-${p.id}`);
  }

  function remove(p: Product) {
    if (!confirm(`حذف «${p.name}» نهائيًا؟`)) return;
    void run(`/api/products/${p.id}`, { method: "DELETE" }, `del-${p.id}`);
  }

  return (
    <div className="space-y-4">
      <FormAlerts error={error} success={success} />

      <Card>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h3 className="font-extrabold text-ink-900">المنتجات ({products.length})</h3>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="rounded-xl border border-ink-200 bg-white px-3 py-2 text-sm font-semibold text-ink-700 outline-none focus:border-brand-500"
          >
            <option value="all">كل الأقسام</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        {list.length === 0 ? (
          <EmptyState icon="🛍️" title="لا توجد منتجات" sub="أضف منتجًا ليظهر في المتجر فورًا" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-right text-sm">
              <thead>
                <tr className="border-b border-ink-100 text-xs font-extrabold text-ink-400">
                  <th className="px-3 py-2.5">المنتج</th>
                  <th className="px-3 py-2.5">القسم</th>
                  <th className="px-3 py-2.5">السعر</th>
                  <th className="px-3 py-2.5">المخزون</th>
                  <th className="px-3 py-2.5">الحالة</th>
                  <th className="px-3 py-2.5">إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {list.map((p, i) => (
                  <tr key={p.id} className="border-b border-ink-100 last:border-0 hover:bg-ink-50/40">
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-3">
                        <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-ink-100">
                          {p.images[0] ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={p.images[0].url} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <span className="flex h-full w-full items-center justify-center">🛍️</span>
                          )}
                        </div>
                        <div className="min-w-0">
                          <Link href={`${editBase}/${p.id}/edit`} className="block max-w-52 truncate font-bold text-ink-900 hover:text-brand-600">
                            {p.name}
                          </Link>
                          <p className="text-xs text-ink-400">{p.images.length} صورة</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-xs font-semibold text-ink-500">{catName(p.categoryId)}</td>
                    <td className="px-3 py-3">
                      <span className="font-extrabold text-ink-800">{formatPrice(p.price)}</span>
                      {p.oldPrice != null && (
                        <span className="mr-1.5 text-xs text-ink-400 line-through">{formatPrice(p.oldPrice)}</span>
                      )}
                    </td>
                    <td className="px-3 py-3 text-xs font-semibold text-ink-500">
                      {p.stock != null ? p.stock : "—"}
                    </td>
                    <td className="px-3 py-3">
                      <Toggle checked={p.isVisible} onChange={() => toggleVisible(p)} />
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-1">
                        <button onClick={() => move(p, i, "up")} disabled={i === 0 || busy?.startsWith("move-")} className="rounded-lg p-1.5 text-ink-400 hover:bg-white hover:text-ink-700 disabled:opacity-30">
                          <ArrowUp className="h-4 w-4" />
                        </button>
                        <button onClick={() => move(p, i, "down")} disabled={i === list.length - 1 || busy?.startsWith("move-")} className="rounded-lg p-1.5 text-ink-400 hover:bg-white hover:text-ink-700 disabled:opacity-30">
                          <ArrowDown className="h-4 w-4" />
                        </button>
                        <Link href={`${editBase}/${p.id}/edit`} className="rounded-lg p-2 text-ink-400 hover:bg-white hover:text-brand-600">
                          {busy === `edit-${p.id}` ? <Loader2 className="h-4 w-4 animate-spin" /> : <Pencil className="h-4 w-4" />}
                        </Link>
                        <button onClick={() => remove(p)} disabled={busy === `del-${p.id}`} className="rounded-lg p-2 text-ink-400 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
