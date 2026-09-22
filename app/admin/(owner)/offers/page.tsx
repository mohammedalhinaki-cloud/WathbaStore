// معين — العروض
import type { Metadata } from "next";
import { services } from "@/lib/services";
import { PageHeader } from "@/components/admin/ui";
import { OffersManager } from "@/components/admin/site-managers";

export const metadata: Metadata = { title: "العروض" };

export default async function OffersPage() {
  const offers = await services().listOffers();
  return (
    <div>
      <PageHeader title="العروض" sub="عروض مؤقتة أو دائمة تظهر في الموقع العام" />
      <OffersManager offers={offers} />
    </div>
  );
}
