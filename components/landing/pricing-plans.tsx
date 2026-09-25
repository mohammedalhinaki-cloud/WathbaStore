// ============================================================
// معون — باقات الأسعار (قائمة مطوية / أكورديون) — ثيم داكن فاخر
//
// نفس أسلوب قسم «الأسئلة الشائعة»: كل باقة صف مستقل يظهر فيه اسمها
// وسعرها دائمًا، والتفاصيل (المزايا + زر «اطلب هذه الباقة») داخل لوحة
// تُفتح وتُغلق بالضغط على الصف.
//
// - كل الباقات مطوية افتراضيًا حتى لا يأخذ القسم مساحة رأسية كبيرة،
//   وتُفتح باقة واحدة في كل مرة (مثل الأسئلة الشائعة).
// - فتح/إغلاق بحركة ارتفاع ناعمة (grid-template-rows)، وتتعطّل الحركة
//   عند تفعيل «تقليل الحركة» في نظام المستخدم.
// - المزايا تبقى داخل HTML حتى وهي مطوية (مفيد لمحركات البحث)، واللوحة
//   المطوية inert فلا يصل إليها التنقل بلوحة المفاتيح ولا قارئات الشاشة.
// ============================================================
"use client";

import { useId, useState } from "react";
import { ArrowLeft, BadgeCheck, ChevronDown } from "lucide-react";

export interface PricingPlanItem {
  id: string;
  name: string;
  /** السعر منسّقًا مسبقًا في الخادم (مثل «٥٩٩ ر.س») — نص ثابت بلا اختلاف عند الـ hydration */
  price: string;
  /** السعر السابق منسّقًا، أو null إن لم يوجد */
  oldPrice: string | null;
  features: string[];
  isFeatured: boolean;
}

export default function PricingPlans({
  plans,
  orderHref,
}: {
  plans: PricingPlanItem[];
  /** رابط الطلب (واتساب) لزر «اطلب هذه الباقة» */
  orderHref: string;
}) {
  const [open, setOpen] = useState<string | null>(null);
  const baseId = useId();
  if (!plans.length) return null;

  return (
    <div className="mx-auto mt-8 max-w-3xl space-y-3 sm:mt-10">
      {plans.map((p, i) => {
        const isOpen = open === p.id;
        const buttonId = `${baseId}-plan-${i}`;
        const panelId = `${baseId}-plan-${i}-details`;
        return (
          <div
            key={p.id}
            className={`overflow-hidden rounded-2xl border ${
              p.isFeatured
                ? "border-accent-400/50 bg-surface bg-gradient-to-l from-brand-600/15 to-transparent shadow-lg shadow-brand-600/10"
                : "card-dark"
            }`}
          >
            <h3>
              <button
                type="button"
                id={buttonId}
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => setOpen(isOpen ? null : p.id)}
                className="flex w-full items-center justify-between gap-4 px-5 py-4 text-right"
              >
                <span className="flex min-w-0 flex-1 flex-col gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="text-base font-extrabold text-fg sm:text-lg">{p.name}</span>
                    {p.isFeatured && (
                      <span className="rounded-full bg-gradient-to-l from-brand-600 to-accent-400 px-2.5 py-0.5 text-[11px] font-extrabold text-ink-950">
                        الأكثر طلبًا
                      </span>
                    )}
                  </span>
                  <span className="flex items-baseline gap-2">
                    <span className="text-xl font-extrabold text-fg sm:text-2xl">{p.price}</span>
                    {p.oldPrice && (
                      <span className="text-xs text-muted line-through sm:text-sm">
                        <span className="sr-only">بدلًا من </span>
                        {p.oldPrice}
                      </span>
                    )}
                  </span>
                </span>
                <ChevronDown
                  aria-hidden="true"
                  className={`h-5 w-5 shrink-0 text-accent-400 transition-transform motion-reduce:transition-none ${
                    isOpen ? "rotate-180" : ""
                  }`}
                />
              </button>
            </h3>

            {/* 0fr ↔ 1fr: ارتفاع اللوحة يتحرك بنعومة بين الطي والفتح */}
            <div
              id={panelId}
              role="region"
              aria-labelledby={buttonId}
              inert={!isOpen}
              className={`grid transition-[grid-template-rows] duration-300 ease-out motion-reduce:transition-none ${
                isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
              }`}
            >
              <div className="overflow-hidden">
                <div className="border-t border-line/70 bg-base/40 px-5 py-5">
                  {p.features.length > 0 && (
                    <ul className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
                      {p.features.map((f, j) => (
                        <li key={`${f}-${j}`} className="flex items-start gap-2.5 text-sm leading-6 text-ink-300">
                          <BadgeCheck className="mt-0.5 h-4.5 w-4.5 shrink-0 text-accent-400" />
                          {f}
                        </li>
                      ))}
                    </ul>
                  )}
                  <a
                    href={orderHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`flex w-full items-center justify-center gap-2 rounded-2xl px-6 py-3 text-sm font-extrabold transition-transform hover:scale-[1.02] sm:w-fit ${
                      p.features.length > 0 ? "mt-5" : ""
                    } ${
                      p.isFeatured
                        ? "btn-primary"
                        : "border border-line bg-white/5 text-fg hover:bg-white/10"
                    }`}
                  >
                    اطلب هذه الباقة
                    <ArrowLeft className="h-4 w-4" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
