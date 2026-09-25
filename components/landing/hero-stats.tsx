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
    // @container: عدد الأعمدة يتبع عرض عمود النص الفعلي لا عرض الشاشة
    // (في الكمبيوتر يُقسم الغلاف إلى عمودين فيضيق عمود الإحصائيات)
    <div ref={ref} className="@container mt-10">
      <div className="grid grid-cols-2 gap-3 @lg:grid-cols-4">
        {items.map((stat) => (
          <StatItem key={stat.label} stat={stat} progress={progress} />
        ))}
      </div>
    </div>
  );
}

function StatItem({ stat, progress }: { stat: HeroStat; progress: number }) {
  const suffix = stat.suffix ?? "";
  const finalText = `${stat.value}${suffix}`;
  const currentText = `${Math.round(stat.value * progress)}${suffix}`;

  return (
    // بطاقة زجاجية بارزة: خلفية خفيفة + حد + ظل، وشريط برتقالي صغير
    // يجذب العين — فتظهر الإحصائيات الأربع بوضوح من الوهلة الأولى.
    // (prominent glass card so the four stats read clearly at first glance)
    <div className="rounded-2xl border border-white/10 bg-white/[0.045] p-4 text-center shadow-lg shadow-black/25 ring-1 ring-inset ring-white/[0.03] backdrop-blur transition-colors hover:border-accent-400/30 hover:bg-white/[0.07] sm:p-5">
      <span
        aria-hidden="true"
        className="mx-auto mb-3 block h-1 w-10 rounded-full bg-gradient-to-l from-accent-400 to-accent-500"
      />
      <p className="flex items-baseline justify-center gap-1.5 text-3xl font-extrabold text-white sm:text-4xl">
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
          <span className="text-base font-bold text-accent-400 sm:text-lg">{stat.unit}</span>
        )}
      </p>
      <p className="mt-1.5 text-xs font-semibold leading-5 text-ink-200 sm:text-sm">{stat.label}</p>
    </div>
  );
}
