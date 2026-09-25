// معون — شريط تنقل الموقع العام (ثيم داكن فاخر، هيدر بلا حدود بنفس
// خلفية الصفحة تمامًا، وشعار نظيف: أيقونة + اسم العلامة فقط)
"use client";

import { useState } from "react";
import { Menu, X, ArrowLeft } from "lucide-react";
import { APP_NAME } from "@/lib/constants";

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
    <header className="fixed inset-x-0 top-0 z-50 bg-base">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <a href="#top" className="flex items-center gap-2.5" aria-label={APP_NAME}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/mark.svg"
            alt=""
            width={36}
            height={36}
            className="h-9 w-9 shrink-0 drop-shadow-[0_2px_10px_rgba(230,81,0,0.45)]"
          />
          <span className="text-xl font-extrabold tracking-tight text-fg">{APP_NAME}</span>
        </a>

        <nav className="hidden items-center gap-1 md:flex">
          {LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="rounded-lg px-3.5 py-2 text-sm font-semibold text-muted transition-colors hover:bg-white/5 hover:text-fg"
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
            className="btn-primary hidden px-4 py-2.5 text-sm sm:inline-flex"
          >
            ابدأ مشروعك
            <ArrowLeft className="h-4 w-4" />
          </a>
          <button
            onClick={() => setOpen(!open)}
            className="rounded-lg p-2 text-fg md:hidden"
            aria-label="القائمة"
          >
            {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {open && (
        <nav className="bg-base px-4 py-3 md:hidden">
          {LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="block rounded-lg px-3 py-2.5 text-sm font-semibold text-muted hover:bg-white/5 hover:text-fg"
            >
              {l.label}
            </a>
          ))}
          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary mt-2 flex px-4 py-2.5 text-sm"
          >
            ابدأ مشروعك عبر واتساب
          </a>
        </nav>
      )}
    </header>
  );
}
