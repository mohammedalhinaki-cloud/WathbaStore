// ============================================================
// وثبة — صفحة إتمام الطلب (Checkout)
// ============================================================

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getStoreCtx } from "@/lib/tenant";
import StoreShell from "@/components/store/store-shell";
import CheckoutContent from "./checkout-content";
import { loadStoreAndNav } from "@/components/store/load-nav";

export const metadata: Metadata = {
  title: "إتمام الطلب",
};

export default async function CheckoutPage() {
  const ctx = await getStoreCtx();
  if (!ctx?.bundle) notFound();
  const { store, settings } = ctx.bundle;
  const query = ctx.tenant.isPreview ? `?store=${store.subdomain}` : "";
  const { categories, pages } = await loadStoreAndNav(store.id);
  const navLinks = [
    ...categories
      .filter((c) => c.isVisible)
      .map((c) => ({ href: `/categories/${encodeURIComponent(c.slug)}${query}`, label: c.name })),
    ...pages.filter((p) => p.isVisible).map((p) => ({ href: `/pages/${encodeURIComponent(p.slug)}${query}`, label: p.title })),
  ];

  const wa = store.whatsapp || settings.socialWhatsApp;

  return (
    <StoreShell bundle={ctx.bundle} query={query} navLinks={navLinks}>
      <CheckoutContent
        whatsapp={wa}
        storeName={store.name}
        ibanRajhi={settings.ibanRajhi}
        ibanAlinmaa={settings.ibanAlinmaa}
        ibanAlahli={settings.ibanAlahli}
        query={query}
      />
    </StoreShell>
  );
}