// ============================================================
// معون — شبكة المنتجات مع فلترة بالأقسام وبحث (جوال)
// ============================================================

"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import ProductCard from "./product-card";
import type { Category, Product, TemplateKey } from "@/lib/types";

interface Props {
  products: Product[];
  categories: Category[];
  storeName: string;
  whatsapp: string;
  query: string;
  template: TemplateKey;
}

export default function ProductsGrid({
  products,
  categories,
  storeName,
  whatsapp,
  query,
  template,
}: Props) {
  const [cat, setCat] = useState<string>("all");
  const [term, setTerm] = useState("");

  const filtered = useMemo(() => {
    let list = products;
    if (cat !== "all") list = list.filter((p) => p.categoryId === cat);
    if (term.trim()) {
      const t = term.trim();
      list = list.filter(
        (p) => p.name.includes(t) || (p.description ?? "").includes(t)
      );
    }
    return list;
  }, [products, cat, term]);

  if (products.length === 0) {
    return (
      <div data-reveal="up" className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-ink-200 py-16 text-center">
        <span className="text-4xl">🛍️</span>
        <p className="mt-4 font-bold text-ink-700">لا توجد منتجات بعد</p>
        <p className="mt-1 text-sm text-ink-500">قريبًا ستجد هنا تشكيلة المنتجات</p>
      </div>
    );
  }

  const modern = template !== "classic";

  return (
    <div>
      {/* أدوات الفلترة */}
      <div data-reveal="up" className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="no-scrollbar flex gap-2 overflow-x-auto">
          <Chip active={cat === "all"} onClick={() => setCat("all")}>
            الكل
          </Chip>
          {categories.map((c) => (
            <Chip key={c.id} active={cat === c.id} onClick={() => setCat(c.id)}>
              {c.name}
            </Chip>
          ))}
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
          <input
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder="ابحث عن منتج…"
            className="w-full rounded-xl border border-ink-200 bg-white py-2.5 pr-9 pl-3 text-sm outline-none transition-colors focus:border-[var(--store-primary)]"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div data-reveal="up" className="rounded-2xl border border-dashed border-ink-200 py-12 text-center text-sm text-ink-500">
          لا توجد نتائج مطابقة
        </div>
      ) : modern ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4" data-stagger>
          {filtered.map((p) => (
            <ProductCard
              key={p.id}
              product={p}
              storeName={storeName}
              whatsapp={whatsapp}
              query={query}
              template={template}
            />
          ))}
        </div>
      ) : (
        <div className="divide-y divide-ink-100 rounded-2xl border border-ink-100 px-5" data-stagger>
          {filtered.map((p) => (
            <ProductCard
              key={p.id}
              product={p}
              storeName={storeName}
              whatsapp={whatsapp}
              query={query}
              template={template}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`motion-action shrink-0 rounded-full px-4 py-2 text-sm font-bold transition-colors ${
        active ? "text-white" : "bg-ink-100 text-ink-600 hover:bg-ink-200"
      }`}
      style={active ? { backgroundColor: "var(--store-primary)" } : undefined}
    >
      {children}
    </button>
  );
}
