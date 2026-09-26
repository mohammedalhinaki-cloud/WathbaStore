"use client";

// ============================================================
// معرض المتاجر (الأعمال) — Carousel تلقائي لا نهائي
// ------------------------------------------------------------
// • متجر واحد فقط ظاهر في كل لحظة، يأخذ المساحة الرئيسية للقسم.
// • يبدأ تلقائيًا من المتجر الأول عند أول رسم للصفحة بلا أي تفاعل.
// • يبقى المتجر ظاهرًا ~4 ثوانٍ ثم ينتقل بحركة هادئة إلى التالي.
// • بعد آخر متجر يعود للأول بلا قفزة مرئية (نسخة مطابقة للأول في
//   نهاية الشريط، ثم إعادة ضبط صامتة بعد انتهاء الحركة).
// • بلا أسهم ولا أزرار ولا نقاط، وبلا أي سحب أو تمرير يدوي،
//   ولا يتوقف عند اللمس أو التمرير أو مرور المؤشر.
// • الحركة transform فقط (بلا تغيّر في الأبعاد) => بلا Layout Shift،
//   وبلا أي مكتبة خارجية.
// ============================================================

import { useEffect, useRef, useState } from "react";
import Image from "next/image";

export interface PortfolioCarouselItem {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  storeUrl: string;
  tags: string;
}

/** زمن بقاء المتجر ثابتًا أمام المستخدم */
const HOLD_MS = 4000;
/** زمن الانتقال الناعم بين متجر والذي يليه */
const SLIDE_MS = 850;
/** هامش أمان بسيط بعد انتهاء الحركة قبل إعادة الضبط الصامتة */
const RESET_BUFFER_MS = 60;

function StoreCard({
  item,
  eager,
}: {
  item: PortfolioCarouselItem;
  /** تحميل مبكر للصور المقبلة حتى لا تظهر بطاقة بلا صورة عند الانتقال */
  eager?: boolean;
}) {
  return (
    <a
      href={item.storeUrl || "#"}
      target="_blank"
      rel="noopener noreferrer"
      draggable={false}
      className="card-dark motion-card group flex h-full flex-col overflow-hidden rounded-3xl transition-all hover:-translate-y-1 hover:border-brand-500/40 hover:shadow-xl hover:shadow-black/30"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-ink-800">
        <Image
          src={item.imageUrl || "/seed/hero.jpg"}
          alt={item.title}
          fill
          sizes="(max-width: 768px) 100vw, 680px"
          loading={eager ? "eager" : "lazy"}
          draggable={false}
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink-950/60 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
      </div>
      <div className="p-5">
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-bold text-fg">{item.title}</h3>
          <span className="rounded-full bg-emerald-500/15 px-2.5 py-1 text-[11px] font-bold text-emerald-400">
            يعمل
          </span>
        </div>
        <p className="mt-1.5 line-clamp-2 text-sm text-muted">{item.description}</p>
        {item.tags && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {item.tags.split(",").slice(0, 3).map((t) => (
              <span
                key={t}
                className="rounded-md bg-white/5 px-2 py-0.5 text-[11px] font-semibold text-ink-300"
              >
                {t.trim()}
              </span>
            ))}
          </div>
        )}
      </div>
    </a>
  );
}

export default function PortfolioCarousel({ items }: { items: PortfolioCarouselItem[] }) {
  const count = items.length;
  const loops = count > 1;

  /** موضع الشريط: 0..count — القيمة count هي نسخة المتجر الأول (للّف السلس) */
  const [index, setIndex] = useState(0);
  /** تُطفأ لحظةً واحدة أثناء إعادة الضبط الصامتة من النسخة إلى الأصل */
  const [animating, setAnimating] = useState(true);
  /**
   * اتجاه الإزاحة: في RTL يكون المتجر التالي على يسار الحالي، فيتحرك
   * الشريط إلى اليمين (+)، وفي LTR إلى اليسار (−). يُقرأ من الاتجاه
   * الفعلي المحسوب حتى تبقى الحركة صحيحة في الحالتين.
   */
  const [sign, setSign] = useState(1);
  /**
   * بعد استقرار الصفحة نطلب صور بقية المتاجر مسبقًا: الشرائح المزاحة
   * خارج الإطار لا يحمّلها المتصفح تلقائيًا، فتظهر فارغة لحظة الانتقال.
   */
  const [warm, setWarm] = useState(false);
  /**
   * الدوران يبدأ عند أول ظهور للقسم في الشاشة (مرة واحدة فقط) حتى يرى
   * كل زائر المتجر الأول أولًا. هذه بداية التشغيل لا أكثر: بعدها يستمر
   * الدوران بلا توقف مهما لمس المستخدم الشاشة أو مرّر الصفحة أو انتقل
   * إلى قسم آخر.
   */
  const [started, setStarted] = useState(false);

  const viewportRef = useRef<HTMLDivElement | null>(null);

  // اتجاه الصفحة (RTL/LTR)
  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    setSign(getComputedStyle(el).direction === "rtl" ? 1 : -1);
  }, []);

  useEffect(() => {
    if (!loops) return;
    const id = window.setTimeout(() => setWarm(true), 1200);
    return () => window.clearTimeout(id);
  }, [loops]);

  // نقطة الانطلاق: أول مرة يظهر فيها القسم (أو فورًا إن تعذّر المراقب).
  useEffect(() => {
    if (!loops || started) return;
    const el = viewportRef.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setStarted(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setStarted(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [loops, started]);

  // المؤقّت التلقائي: يعمل دائمًا ولا يتوقف بأي تفاعل من المستخدم.
  useEffect(() => {
    if (!loops || !started) return;

    const timers = new Set<number>();
    const later = (fn: () => void, ms: number) => {
      const id = window.setTimeout(() => {
        timers.delete(id);
        fn();
      }, ms);
      timers.add(id);
    };

    const goTo = (next: number) => {
      setAnimating(true);
      setIndex(next);

      if (next === count) {
        // وصلنا إلى نسخة المتجر الأول: بعد انتهاء الحركة نعيد الشريط
        // إلى الموضع 0 بلا حركة — المشهد مطابق تمامًا فلا تُرى أي قفزة.
        later(() => {
          setAnimating(false);
          setIndex(0);
          requestAnimationFrame(() => {
            requestAnimationFrame(() => setAnimating(true));
          });
        }, SLIDE_MS + RESET_BUFFER_MS);
        // يكمل الدوران من المتجر الثاني بعد انتهاء زمن العرض نفسه.
        later(() => goTo(1), SLIDE_MS + HOLD_MS);
      } else {
        later(() => goTo(next + 1), SLIDE_MS + HOLD_MS);
      }
    };

    later(() => goTo(1), HOLD_MS);

    return () => {
      for (const id of timers) window.clearTimeout(id);
      timers.clear();
    };
  }, [count, loops, started]);

  /**
   * حاجز أمان: لو حاول المتصفح تمرير الحاوية (مثلًا عند تركيز عنصر
   * مخفي) نعيدها فورًا إلى موضعها حتى لا تنزاح البطاقة الظاهرة.
   */
  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const reset = () => {
      if (el.scrollLeft !== 0) el.scrollLeft = 0;
      if (el.scrollTop !== 0) el.scrollTop = 0;
    };
    el.addEventListener("scroll", reset, { passive: true });
    return () => el.removeEventListener("scroll", reset);
  }, []);

  if (count === 0) return null;

  // متجر واحد فقط: تُعرض البطاقة ثابتة بلا أي حركة.
  if (!loops) {
    return (
      <div className="mx-auto w-full max-w-2xl px-2">
        <StoreCard item={items[0]} />
      </div>
    );
  }

  // نسخة المتجر الأول في النهاية لإتمام اللف بسلاسة.
  const slides = [...items, items[0]];

  return (
    <div
      ref={viewportRef}
      role="region"
      aria-roledescription="carousel"
      aria-label="معرض المتاجر"
      // py-2 يترك متنفسًا رأسيًا لظل البطاقة عند المرور فوقها،
      // والقص الأفقي يبقى دقيقًا فلا تظهر أي بطاقة مجاورة.
      className="mx-auto w-full max-w-2xl overflow-hidden py-2"
      style={{ touchAction: "pan-y" }}
    >
      <div
        className="flex w-full items-stretch"
        style={{
          transform: `translate3d(${sign * index * 100}%, 0, 0)`,
          transition: animating ? `transform ${SLIDE_MS}ms cubic-bezier(0.65, 0, 0.35, 1)` : "none",
          willChange: "transform",
        }}
      >
        {slides.map((item, i) => {
          const isActive = i === index;
          return (
            <div
              key={`${item.id}-${i}`}
              className="w-full min-w-0 shrink-0 grow-0 basis-full px-2"
              aria-hidden={!isActive}
              // العناصر غير الظاهرة خارج شجرة التفاعل: لا تركيز ولا قراءة.
              inert={!isActive}
            >
              <StoreCard item={item} eager={warm} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
