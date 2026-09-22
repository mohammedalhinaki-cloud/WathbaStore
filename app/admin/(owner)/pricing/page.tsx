// معين — الأسعار والباقات
import type { Metadata } from "next";
import { services } from "@/lib/services";
import { PageHeader } from "@/components/admin/ui";
import { PlansManager } from "@/components/admin/site-managers";

export const metadata: Metadata = { title: "الأسعار والباقات" };

export default async function PricingPage() {
  const plans = await services().listPlans(true);
  return (
    <div>
      <PageHeader title="الأسعار والباقات" sub="تظهر في قسم «الأسعار» بالموقع العام" />
      <PlansManager plans={plans} />
    </div>
  );
}
