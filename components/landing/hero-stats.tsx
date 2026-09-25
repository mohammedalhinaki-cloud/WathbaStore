// ============================================================
// معون — إحصائيات قسم الغلاف في الصفحة الرئيسية (عدّاد متحرك)
//
// تعدّ الأرقام من 0 حتى قيمتها النهائية مرة واحدة فقط عند وصول
// القسم إلى شاشة المستخدم (IntersectionObserver)، بحركة سريعة تبدأ
// بقوة وتتباطأ بنعومة قرب النهاية، على خط زمني واحد لكل الأرقام.
//
// - القيمة النهائية موجودة دائمًا في HTML (نص مخفي بصريًا لقارئات
//   الشاشة ومحركات البحث)، وتظهر مباشرة بدون جافاسكربت (noscript)
//   أو عند تفعيل «تقليل الحركة» في نظام المستخدم.
// - كل رقم متحرك داخل صندوق بعرض رقمه النهائي، فلا تتزحزح الوحدة
//   («ريال» / «أيام») ولا يهتز التصميم أثناء العدّ.
// - بطاقتان في كل صف على الجوال، وأربع بطاقات في الصف على الشاشات الأكبر.
// ============================================================

"use client";

import { useEffect, useRef, useState } from "react";

export interface HeroStat {
  /** القيمة النهائية التي يصل إليها العدّاد */
  value: number;
  /** رمز ملتصق بالرقم مثل «+» أو «%» */
  suffix?: string;
  /** كلمة بعد الرقم مثل «ريال» أو «أيام» */
  unit?: string;
  /** الوصف أسفل الرقم */
  label: string;
}

/** مدة العدّ: سريعة وواضحة */
const COUNT_DURATION_MS = 1600;

/** نسبة ظهور القسم في الشاشة التي يبدأ عندها العدّ */
const VISIBLE_THRESHOLD = 0.4;

/** تبدأ بسرعة وتتباطأ بنعومة عند الاقتراب من الرقم النهائي */
const easeOutCubic = (t: number) => 1 - (1 - t) ** 3;

export default function HeroStats({ items }: { items: HeroStat[] }) {
  const ref = useRef<HTMLDivElement>(null);
  /** تقدّم الحركة من 0 إلى 1 — خط زمني واحد تبدأ وتنتهي عليه كل الأرقام */
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // احترام تفضيل تقليل الحركة لدى المستخدم: الأرقام النهائية مباشرة
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setProgress(1);
      return;
    }

    let frame = 0;
    const startCounting = () => {
      const startedAt = performance.now();
      const tick = (now: number) => {
        const t = Math.min((now - startedAt) / COUNT_DURATION_MS, 1);
        setProgress(easeOutCubic(t));
        if (t < 1) frame = requestAnimationFrame(tick);
      };
      frame = requestAnimationFrame(tick);
    };

    // متصفح قديم بلا IntersectionObserver: ابدأ العدّ فورًا
    if (typeof IntersectionObserver === "undefined") {
      startCounting();
      return () => cancelAnimationFrame(frame);
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        observer.disconnect(); // مرة واحدة فقط: لا يُعاد العدّ عند التمرير مجددًا
        startCounting();
      },
      { threshold: VISIBLE_THRESHOLD }
    );
    observer.observe(el);

    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div ref={ref} className="mt-8 grid grid-cols-2 gap-3 sm:mt-10 sm:grid-cols-4 sm:gap-4">
      {items.map((stat) => (
        <StatItem key={stat.label} stat={stat} progress={progress} />
      ))}
    </div>
  );
}

function StatItem({ stat, progress }: { stat: HeroStat; progress: number }) {
  const suffix = stat.suffix ?? "";
  const finalText = `${stat.value}${suffix}`;
  const currentText = `${Math.round(stat.value * progress)}${suffix}`;

  return (
    // بطاقة داكنة أنيقة (#1E293B) بحد خافت وشريط عنبري صغير يجذب العين.
    <div className="card-dark rounded-xl px-3 py-4 text-center transition-colors hover:border-accent-400/40 sm:rounded-2xl sm:px-4 sm:py-5">
      <span
        aria-hidden="true"
        className="mx-auto mb-1.5 block h-0.5 w-6 rounded-full bg-gradient-to-l from-brand-600 to-accent-400 sm:mb-3 sm:h-1 sm:w-10"
      />
      <p className="flex items-baseline justify-center gap-1 text-2xl font-extrabold text-fg sm:text-3xl lg:text-4xl">
        <span className="inline-grid tabular-nums">
          {/* يحجز عرض الرقم النهائي، ويظهر بدل العدّاد عند تعطيل جافاسكربت */}
          <span aria-hidden="true" className="invisible col-start-1 row-start-1 noscript:visible">
            {finalText}
          </span>
          <span aria-hidden="true" className="col-start-1 row-start-1 noscript:invisible">
            {currentText}
          </span>
        </span>
        <span className="sr-only">{finalText}</span>
        {stat.unit && (
          <span className="text-sm font-bold text-accent-400 sm:text-lg">{stat.unit}</span>
        )}
      </p>
      <p className="mt-1 text-xs font-semibold leading-5 text-muted sm:mt-1.5 sm:text-sm sm:leading-5">
        {stat.label}
      </p>
    </div>
  );
}
