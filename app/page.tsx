// ============================================================
// الصفحة الرئيسية:
// - waathba.com        → الموقع العام (Landing)
// - rshaf.waathba.com  → متجر العميل (أو ?store=rshaf في المعاينة)
// ============================================================

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getStoreCtx } from "@/lib/tenant";
import { storePageMetadata } from "@/lib/seo";
import LandingPage from "@/components/landing/landing-page";
import StoreShell from "@/components/store/store-shell";
import StoreHome from "@/components/store/store-home";
import { services } from "@/lib/services";

export async function generateMetadata(): Promise<Metadata> {
  const ctx = await getStoreCtx();
  if (ctx?.bundle) {
    const { store, settings } = ctx.bundle;
    const og = settings.seoOgImage || store.coverUrl || undefined;
    return storePageMetadata(ctx.bundle, {
      images: og ? [og] : undefined,
    });
  }
  return {};
}

export default async function HomePage() {
  const ctx = await getStoreCtx();

  if (ctx && ctx.tenant.tenant === "store") {
    if (!ctx.bundle) notFound();
    const { store, settings } = ctx.bundle;
    const query = ctx.tenant.isPreview ? `?store=${store.subdomain}` : "";

    const categories = await services().listCategories(store.id);
    const pages = await services().listPages(store.id);
    const navLinks = [
      ...categories
        .filter((c) => c.isVisible)
        .map((c) => ({ href: `/categories/${encodeURIComponent(c.slug)}${query}`, label: c.name })),
      ...pages
        .filter((p) => p.isVisible)
        .map((p) => ({ href: `/pages/${encodeURIComponent(p.slug)}${query}`, label: p.title })),
    ];

    return (
      <StoreShell bundle={ctx.bundle} query={query} navLinks={navLinks}>
        <StoreHome bundle={ctx.bundle} query={query} />
      </StoreShell>
    );
  }

  return <LandingPage />;
}
