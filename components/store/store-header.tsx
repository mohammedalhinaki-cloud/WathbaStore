// ============================================================
// معين — هيدر المتجر (مع أيقونة السلة)
// ============================================================
"use client";

import { ShoppingBag } from "lucide-react";
import type { StoreBundle } from "@/lib/types";
import { storeHomeHref } from "@/lib/store-links";
import { useCart } from "./cart-context";

interface Props {
  bundle: StoreBundle;
  query: string;
  navLinks: { href: string; label: string }[];
}

export default function StoreHeader({ bundle, query, navLinks }: Props) {
  const { store } = bundle;
  const { totalItems, setIsOpen } = useCart();
  const homeHref = storeHomeHref(query);

  return (
    <header className="sticky top-0 z-40 border-b border-ink-100 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
        <a href={homeHref} className="flex min-w-0 items-center gap-2.5">
          {store.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={store.logoUrl} alt={store.name} className="h-10 w-10 shrink-0 rounded-xl object-cover" />
          ) : (
            <span
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lg font-extrabold text-white"
              style={{ backgroundColor: "var(--store-primary)" }}
            >
              {store.name.charAt(0)}
            </span>
          )}
          <span className="truncate text-lg font-extrabold text-ink-900">{store.name}</span>
        </a>

        <nav className="hidden items-center gap-1 md:flex">
          <a href={homeHref} className="rounded-lg px-3 py-2 text-sm font-bold text-ink-600 hover:text-[var(--store-primary)]">
            الرئيسية
          </a>
          {navLinks.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="rounded-lg px-3 py-2 text-sm font-bold text-ink-600 hover:text-[var(--store-primary)]"
            >
              {l.label}
            </a>
          ))}
        </nav>

        {/* أيقونة السلة */}
        <button
          onClick={() => setIsOpen(true)}
          className="relative flex shrink-0 items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-bold text-ink-700 transition-colors hover:bg-ink-50"
        >
          <ShoppingBag className="h-5 w-5" />
          <span className="hidden sm:inline">السلة</span>
          {totalItems > 0 && (
            <span
              className="absolute -top-1 -left-1 flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px] font-extrabold text-white"
              style={{ backgroundColor: "var(--store-primary)" }}
            >
              {totalItems}
            </span>
          )}
        </button>
      </div>
      {/* شريط أقسام للجوال */}
      {navLinks.length > 0 && (
        <div className="no-scrollbar flex gap-2 overflow-x-auto border-t border-ink-100 px-4 py-2 md:hidden">
          <a href={homeHref} className="shrink-0 rounded-full bg-ink-100 px-3.5 py-1.5 text-xs font-bold text-ink-700">
            الرئيسية
          </a>
          {navLinks.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="shrink-0 rounded-full bg-ink-100 px-3.5 py-1.5 text-xs font-bold text-ink-700"
            >
              {l.label}
            </a>
          ))}
        </div>
      )}
    </header>
  );
}