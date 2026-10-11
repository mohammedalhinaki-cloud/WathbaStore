// معون — الأسئلة الشائعة (أكورديون) — ثيم داكن فاخر
"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

export default function Faq({ items }: { items: { q: string; a: string }[] }) {
  const [open, setOpen] = useState<number | null>(0);
  if (!items.length) return null;
  return (
    <div className="mx-auto mt-8 max-w-3xl space-y-3 sm:mt-10" data-stagger>
      {items.map((it, i) => (
        <div
          key={i}
          data-reveal="up"
          className="card-dark motion-card overflow-hidden rounded-2xl"
        >
          <button
            onClick={() => setOpen(open === i ? null : i)}
            className="flex w-full items-center justify-between gap-4 px-5 py-4 text-right"
          >
            <span className="font-bold text-fg">{it.q}</span>
            <ChevronDown
              className={`h-5 w-5 shrink-0 text-accent-400 transition-transform ${
                open === i ? "rotate-180" : ""
              }`}
            />
          </button>
          {open === i && (
            <div className="border-t border-line/70 bg-base/40 px-5 py-4 text-sm leading-7 text-muted">
              {it.a}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
