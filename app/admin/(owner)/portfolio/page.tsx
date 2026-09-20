// وثبة — الأعمال المعروضة في الموقع
import type { Metadata } from "next";
import { services } from "@/lib/services";
import { PageHeader } from "@/components/admin/ui";
import { PortfolioManager } from "@/components/admin/site-managers";

export const metadata: Metadata = { title: "الأعمال" };

export default async function PortfolioPage() {
  const items = await services().listPortfolio(true);
  return (
    <div>
      <PageHeader title="الأعمال المعروضة" sub="المتاجر التي تظهر في قسم «أعمالي» بالموقع العام" />
      <PortfolioManager items={items} />
    </div>
  );
}
