// ============================================================
// معون — هيدر المتجر (اسم الكافيه + التبويبات + أيقونة السلة)
//
// للهيدر وضعان:
//
// 1) الوضع العادي (كل صفحات المتجر ما عدا الرئيسية): شريط لاصق
//    (sticky) بخلفية بيضاء شبه شفافة — كما كان تمامًا.
//
// 2) وضع التراكب overlay (الصفحة الرئيسية فوق صورة الغلاف فقط):
//    • position: fixed أعلى الشاشة وشفاف تمامًا، فتمتد صورة الغلاف
//      خلفه إلى أعلى نقطة في الشاشة (100vh/100svh) بلا أي فراغ أبيض.
//    • تدرّج أسود ناعم (linear-gradient من أعلى لأسفل) خلف الاسم
//      والتبويبات لضمان وضوح القراءة فوق ألوان صورة الغلاف.
//    • النصوص والأيقونات بيضاء مع ظل خفيف (drop-shadow) فوق الصورة.
//    • بعد التمرير بمسافة قصيرة يتحوّل تلقائيًا إلى شريط أبيض صلب
//      بنصوص داكنة، حتى يبقى مقروءًا فوق المحتوى الأبيض (المنتجات).
//    • ينشر ارتفاعه الفعلي في المتغير --store-header-h على عنصر
//      .store-root ليستخدمه الغلاف (حشو علوي) وقسم المنتجات
//      (scroll-margin-top)، فيعمل الضبط تلقائيًا مع ظهور/اختفاء
//      شريط تبويبات الجوال وتغيّر الخطوط.
// ============================================================
"use client";

import { useEffect, useRef, useState } from "react";
import { ShoppingBag } from "lucide-react";
import type { StoreBundle } from "@/lib/types";
import { storeHomeHref } from "@/lib/store-links";
import { useCart } from "./cart-context";

interface Props {
  bundle: StoreBundle;
  query: string;
  navLinks: { href: string; label: string }[];
  /**
   * وضع التراكب: الهيدر شفاف وثابت فوق صورة الغلاف (الصفحة الرئيسية فقط).
   * الافتراضي false = الشريط اللاصق الأبيض المعتاد.
   */
  overlay?: boolean;
}

/** بعد هذه المسافة من أعلى الصفحة يتحوّل الهيدر الشفاف إلى شريط صلب */
const SOLID_AFTER_PX = 40;

/** ظل نص خفيف يضمن قراءة الاسم/التبويبات فوق أي صورة غلاف */
const TEXT_SHADOW = "drop-shadow-[0_1px_4px_rgba(0,0,0,0.55)]";

export default function StoreHeader({ bundle, query, navLinks, overlay = false }: Props) {
  const { store } = bundle;
  const { totalItems, setIsOpen } = useCart();
  const homeHref = storeHomeHref(query);
  const ref = useRef<HTMLElement | null>(null);
  const [scrolled, setScrolled] = useState(false);

  /**
   * هل الشريط في حالته الصلبة (أبيض + نصوص داكنة)؟
   * في الوضع العادي: دائمًا. في وضع التراكب: بعد التمرير فقط.
   */
  const solid = !overlay || scrolled;

  // ===== متابعة التمرير (في وضع التراكب فقط) =====
  useEffect(() => {
    if (!overlay) return;
    const onScroll = () => setScrolled(window.scrollY > SOLID_AFTER_PX);
    onScroll(); // الحالة الصحيحة عند تحميل الصفحة على #products مثلًا
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [overlay]);

  // ===== نشر ارتفاع الهيدر الفعلي في --store-header-h =====
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const publish = () => {
      const h = Math.round(el.getBoundingClientRect().height);
      if (h <= 0) return;
      // ننشر القيمة على جذر المتجر نفسه (.store-root) — النمط المضمّن
      // يتجاوز القيمة الافتراضية المعلنة في globals.css، فيرثها الغلاف
      // وأقسام التمرير (#products) بدقة.
      const root = el.closest<HTMLElement>(".store-root") ?? document.documentElement;
      root.style.setProperty("--store-header-h", `${h}px`);
    };
    publish();
    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined") {
      ro = new ResizeObserver(publish);
      ro.observe(el);
    }
    window.addEventListener("resize", publish);
    // خطوط عربية تُحمَّل بعد العرض الأول قد تغيّر الارتفاع قليلًا
    const t = window.setTimeout(publish, 300);
    return () => {
      ro?.disconnect();
      window.removeEventListener("resize", publish);
      window.clearTimeout(t);
    };
  }, [overlay, navLinks.length]);

  // ===== الأصناف حسب الحالة =====
  const wrapperClass = overlay
    ? "fixed inset-x-0 top-0 z-40"
    : "sticky top-0 z-40 border-b border-ink-100 bg-white/95 backdrop-blur";

  const nameClass = solid
    ? "truncate text-lg font-extrabold text-ink-900 transition-colors"
    : `truncate text-lg font-extrabold text-white transition-colors ${TEXT_SHADOW}`;

  const navLinkClass = solid
    ? "rounded-lg px-3 py-2 text-sm font-bold text-ink-600 transition-colors hover:text-[var(--store-primary)]"
    : `rounded-lg px-3 py-2 text-sm font-bold text-white/90 transition-colors hover:bg-white/10 hover:text-white ${TEXT_SHADOW}`;

  const cartClass = solid
    ? "motion-action relative flex shrink-0 items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-bold text-ink-700 transition-colors hover:bg-ink-50"
    : `motion-action relative flex shrink-0 items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-bold text-white transition-colors hover:bg-white/15 ${TEXT_SHADOW}`;

  const chipClass = solid
    ? "shrink-0 rounded-full bg-ink-100 px-3.5 py-1.5 text-xs font-bold text-ink-700 transition-colors"
    : "shrink-0 rounded-full bg-white/15 px-3.5 py-1.5 text-xs font-bold text-white ring-1 ring-white/25 backdrop-blur-sm transition-colors";

  return (
    <header ref={ref} className={wrapperClass}>
      {overlay && (
        <>
          {/* تدرّج أسود ناعم خلف الاسم والتبويبات فوق صورة الغلاف:
              خفيف جدًا (65% ← 25% ← شفاف) ويمتد قليلًا تحت الهيدر
              ليتلاشى بنعومة، ويختفي عندما يتحوّل الشريط إلى الحالة الصلبة */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[150%] bg-gradient-to-b from-ink-950/65 via-ink-950/25 to-transparent transition-opacity duration-300"
            style={{ opacity: solid ? 0 : 1 }}
          />
          {/* خلفية صلبة تظهر عند التمرير لضمان القراءة فوق المحتوى */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 -z-10 border-b border-ink-100 bg-white/95 shadow-sm backdrop-blur transition-opacity duration-300"
            style={{ opacity: solid ? 1 : 0 }}
          />
        </>
      )}

      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
        <a href={homeHref} className="flex min-w-0 items-center gap-2.5">
          {store.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={store.logoUrl}
              alt={store.name}
              className={`h-10 w-10 shrink-0 rounded-xl object-cover ${
                solid ? "" : "ring-1 ring-white/40"
              }`}
            />
          ) : (
            <span
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lg font-extrabold text-white"
              style={{ backgroundColor: "var(--store-primary)" }}
            >
              {store.name.charAt(0)}
            </span>
          )}
          <span className={nameClass}>{store.name}</span>
        </a>

        <nav className="hidden items-center gap-1 md:flex">
          <a href={homeHref} className={navLinkClass}>
            الرئيسية
          </a>
          {navLinks.map((l) => (
            <a key={l.href} href={l.href} className={navLinkClass}>
              {l.label}
            </a>
          ))}
        </nav>

        {/* أيقونة السلة */}
        <button
          onClick={() => setIsOpen(true)}
          className={cartClass}
          aria-label="فتح السلة"
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
        <div
          className={`no-scrollbar flex gap-2 overflow-x-auto border-t px-4 py-2 md:hidden ${
            solid ? "border-ink-100" : "border-white/15"
          }`}
        >
          <a href={homeHref} className={chipClass}>
            الرئيسية
          </a>
          {navLinks.map((l) => (
            <a key={l.href} href={l.href} className={chipClass}>
              {l.label}
            </a>
          ))}
        </div>
      )}
    </header>
  );
}
