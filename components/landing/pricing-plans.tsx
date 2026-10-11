import { ArrowLeft, BadgeCheck } from "lucide-react";

export interface PricingPlanItem {
  id: string;
  name: string;
  price: string;
  oldPrice: string | null;
  features: string[];
  isFeatured: boolean;
  orderHref: string | null;
}

export default function PricingPlans({ plans, billingLabel }: {
  plans: PricingPlanItem[];
  billingLabel: string;
}) {
  if (!plans.length) return null;
  return (
    <div className="mt-8 grid items-stretch gap-5 sm:mt-10 md:grid-cols-2 xl:grid-cols-3">
      {plans.map((plan) => (
        <article key={plan.id} className={`flex min-w-0 flex-col rounded-3xl border p-6 ${plan.isFeatured ? "border-brand-400 bg-surface shadow-lg shadow-brand-600/10" : "card-dark"}`}>
          <div className="flex min-h-7 items-center">
            {plan.isFeatured && <span className="rounded-full bg-brand-600/20 px-3 py-1 text-xs font-bold text-brand-300">باقة مقترحة</span>}
          </div>
          <h3 className="mt-3 text-xl font-extrabold text-fg">{plan.name}</h3>
          <p className="mt-5 flex flex-wrap items-baseline gap-2">
            <span className="text-3xl font-extrabold text-fg">{plan.price}</span>
            <span className="text-sm text-ink-300">{billingLabel}</span>
          </p>
          {plan.oldPrice && <p className="mt-1 text-sm text-muted"><span className="sr-only">السعر السابق: </span><s>{plan.oldPrice}</s></p>}
          <ul className="my-6 flex-1 space-y-3 border-t border-line pt-5">
            {plan.features.map((feature, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm leading-7 text-ink-300">
                <BadgeCheck aria-hidden="true" className="mt-1 h-5 w-5 shrink-0 text-brand-400" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
          {plan.orderHref ? (
            <a href={plan.orderHref} target="_blank" rel="noopener noreferrer" className={`flex min-h-12 items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-extrabold ${plan.isFeatured ? "btn-primary" : "border border-line bg-white/5 text-fg hover:bg-white/10"}`}>
              اطلب {plan.name}<ArrowLeft aria-hidden="true" className="h-4 w-4" />
            </a>
          ) : <p className="text-sm text-muted">التواصل لطلب هذه الباقة غير متاح حاليًا.</p>}
        </article>
      ))}
    </div>
  );
}
