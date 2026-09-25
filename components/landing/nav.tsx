// معون — شريط تنقل الموقع العام (ثيم داكن فاخر)
//
// الهيدر لاصق (fixed) أعلى الصفحة، وحالته بصريًا حالتان:
//
// 1) أعلى الصفحة (Top): خلفية شفافة تمامًا — فيبدو الهيدر جزءًا من
//    الغلاف (Hero) بلا أي خط أو خلفية تقطع التصميم.
// 2) عند التمرير (Scroll): تتحوّل الخلفية فورًا إلى داكنة صلبة
//    #0F172A مع ضبابية backdrop-filter: blur(12px) وحد سفلي رقيق
//    rgba(255,255,255,0.05) — فتفصل عناصر الهيدر والشعار عن نصوص
//    الصفحة بدل أن تتداخل معها أثناء التمرير.
//
// الشعار: Wordmark «معون» بحروف بيضاء نظيفة مع نقطة بتدرّج برتقالي
// أصفر على حرف النون (public/mark.svg) — بلا أي أيقونة حقيبة/قفل.
// ============================================================
"use client";

import { useEffect, useState } from "react";
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
  const [scrolled, setScrolled] = useState(false);

  // ===== حالة التمرير: أي تمرير للأعلى/الأسفل يفعّل الخلفية الداكنة =====
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 0);
    onScroll(); // الحالة الصحيحة عند فتح الصفحة على مرساة مثل #pricing
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return (
    <header
      className={`site-header${scrolled ? " site-header--scrolled" : ""}`}
      data-scrolled={scrolled ? "true" : "false"}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        {/* الشعار النصّي: «معون» أبيض + نقطة بتدرّج العلامة على النون */}
        <a href="#top" className="flex items-center" aria-label={APP_NAME}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/mark.svg"
            alt={APP_NAME}
            width={89}
            height={32}
            className="h-8 w-auto shrink-0"
          />
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
            aria-expanded={open}
          >
            {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {open && (
        <nav className="site-header-panel px-4 py-3 md:hidden">
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
