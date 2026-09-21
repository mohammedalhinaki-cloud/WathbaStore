// ============================================================
// صفحة نصية للمتجر: rshaf.waathba.com/pages/about
// ============================================================

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getStoreCtx } from "@/lib/tenant";
import { services } from "@/lib/services";
import { storePageMetadata } from "@/lib/seo";
import StoreShell from "@/components/store/store-shell";
import { loadStoreAndNav } from "@/components/store/load-nav";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const ctx = await getStoreCtx();
  const { slug } = await params;
  if (!ctx?.bundle) return {};
  const page = await services().getPageBySlug(ctx.bundle.store.id, decodeURIComponent(slug));
  if (!page || !page.isVisible) return {};
  const { store } = ctx.bundle;
  return storePageMetadata(ctx.bundle, {
    title: `${page.title} | ${store.name}`,
    path: `/pages/${page.slug}`,
  });
}

export default async function StorePageView({ params }: Props) {
  const ctx = await getStoreCtx();
  const { slug } = await params;
  if (!ctx?.bundle) notFound();
  const { store, settings } = ctx.bundle;

  const page = await services().getPageBySlug(store.id, decodeURIComponent(slug));
  if (!page || !page.isVisible) notFound();

  const query = ctx.tenant.isPreview ? `?store=${store.subdomain}` : "";
  const { categories, pages } = await loadStoreAndNav(store.id);
  const navLinks = [
    ...categories
      .filter((c) => c.isVisible)
      .map((c) => ({ href: `/categories/${encodeURIComponent(c.slug)}${query}`, label: c.name })),
    ...pages.filter((p) => p.isVisible).map((p) => ({ href: `/pages/${encodeURIComponent(p.slug)}${query}`, label: p.title })),
  ];

  return (
    <StoreShell bundle={ctx.bundle} query={query} navLinks={navLinks}>
      <div className="mx-auto max-w-3xl px-4 py-12">
        <div className="mb-6 flex items-center gap-3">
          <span className="h-8 w-1.5 rounded-full" style={{ backgroundColor: "var(--store-primary)" }} />
          <h1 className="text-2xl font-extrabold text-ink-900">{page.title}</h1>
        </div>
        <div className="whitespace-pre-line rounded-3xl border border-ink-100 bg-white p-6 leading-8 text-ink-700 shadow-sm sm:p-8">
          {page.content}
        </div>
      </div>
    </StoreShell>
  );
}
