// معون — الأسئلة الشائعة (أكورديون)
"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

export default function Faq({ items }: { items: { q: string; a: string }[] }) {
  const [open, setOpen] = useState<number | null>(0);
  if (!items.length) return null;
  return (
    <div className="mx-auto mt-12 max-w-3xl space-y-3">
      {items.map((it, i) => (
        <div
          key={i}
          className="overflow-hidden rounded-2xl border border-ink-200 bg-white shadow-sm"
        >
          <button
            onClick={() => setOpen(open === i ? null : i)}
            className="flex w-full items-center justify-between gap-4 px-5 py-4 text-right"
          >
            <span className="font-bold text-ink-900">{it.q}</span>
            <ChevronDown
              className={`h-5 w-5 shrink-0 text-brand-500 transition-transform ${
                open === i ? "rotate-180" : ""
              }`}
            />
          </button>
          {open === i && (
            <div className="border-t border-ink-100 bg-ink-50/50 px-5 py-4 text-sm leading-7 text-ink-600">
              {it.a}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
