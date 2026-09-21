// وثبة — شريط تنقل الموقع العام
"use client";

import { useState } from "react";
import { Menu, X, Store, ArrowLeft } from "lucide-react";

const LINKS = [
  { href: "#services", label: "الخدمات" },
  { href: "#portfolio", label: "أعمالي" },
  { href: "#pricing", label: "الأسعار" },
  { href: "#offers", label: "العروض" },
  { href: "#faq", label: "الأسئلة" },
];

export default function LandingNav({ whatsappHref }: { whatsappHref: string }) {
  const [open, setOpen] = useState(false);
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-ink-950/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <a href="#top" className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-violet-600 shadow-lg shadow-brand-500/30">
            <Store className="h-5 w-5 text-white" />
          </span>
          <span className="text-xl font-extrabold tracking-tight text-white">
            وثبة
            <span className="mr-1.5 rounded-md bg-accent-500/15 px-1.5 py-0.5 text-[10px] font-bold text-accent-400">
              waathba.com
            </span>
          </span>
        </a>

        <nav className="hidden items-center gap-1 md:flex">
          {LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="rounded-lg px-3.5 py-2 text-sm font-semibold text-ink-300 transition-colors hover:bg-white/5 hover:text-white"
            >
              {l.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden items-center gap-2 rounded-xl bg-gradient-to-l from-accent-500 to-accent-400 px-4 py-2.5 text-sm font-bold text-ink-950 shadow-lg shadow-accent-500/25 transition-transform hover:scale-[1.03] sm:flex"
          >
            ابدأ مشروعك
            <ArrowLeft className="h-4 w-4" />
          </a>
          <button
            onClick={() => setOpen(!open)}
            className="rounded-lg p-2 text-white md:hidden"
            aria-label="القائمة"
          >
            {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {open && (
        <nav className="border-t border-white/10 bg-ink-950/95 px-4 py-3 md:hidden">
          {LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="block rounded-lg px-3 py-2.5 text-sm font-semibold text-ink-200 hover:bg-white/5"
            >
              {l.label}
            </a>
          ))}
          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 flex items-center justify-center gap-2 rounded-xl bg-accent-500 px-4 py-2.5 text-sm font-bold text-ink-950"
          >
            ابدأ مشروعك عبر واتساب
          </a>
        </nav>
      )}
    </header>
  );
}
