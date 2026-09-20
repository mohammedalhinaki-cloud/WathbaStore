// ============================================================
// صفحة القسم: rshaf.wathbastore.com/categories/coffee
// ============================================================

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getStoreCtx } from "@/lib/tenant";
import { services } from "@/lib/services";
import { canonicalStoreUrl } from "@/components/store/store-shell";
import StoreShell from "@/components/store/store-shell";
import ProductsGrid from "@/components/store/products-grid";
import { loadStoreAndNav } from "@/components/store/load-nav";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const ctx = await getStoreCtx();
  const { slug } = await params;
  if (!ctx?.bundle) return {};
  const cats = await services().listCategories(ctx.bundle.store.id);
  const cat = cats.find((c) => c.slug === decodeURIComponent(slug));
  if (!cat) return {};
  const { store } = ctx.bundle;
  return {
    title: `${cat.name} | ${store.name}`,
    description: `${cat.name} في ${store.name}`,
    alternates: { canonical: canonicalStoreUrl(store.subdomain, `/categories/${cat.slug}`) },
  };
}

export default async function CategoryPage({ params }: Props) {
  const ctx = await getStoreCtx();
  const { slug } = await params;
  if (!ctx?.bundle) notFound();
  const { store, settings } = ctx.bundle;

  const cats = await services().listCategories(store.id);
  const cat = cats.find((c) => c.slug === decodeURIComponent(slug));
  if (!cat || !cat.isVisible) notFound();

  const [products, nav] = await Promise.all([
    services().listProducts(store.id, { categoryId: cat.id }),
    loadStoreAndNav(store.id),
  ]);

  const query = ctx.tenant.isPreview ? `?store=${store.subdomain}` : "";
  const navLinks = [
    ...nav.categories
      .filter((c) => c.isVisible)
      .map((c) => ({ href: `/categories/${encodeURIComponent(c.slug)}${query}`, label: c.name })),
    ...nav.pages
      .filter((p) => p.isVisible)
      .map((p) => ({ href: `/pages/${encodeURIComponent(p.slug)}${query}`, label: p.title })),
  ];

  return (
    <StoreShell bundle={ctx.bundle} query={query} navLinks={navLinks}>
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="mb-8 flex items-center gap-3">
          <span className="h-8 w-1.5 rounded-full" style={{ backgroundColor: "var(--store-primary)" }} />
          <div>
            <h1 className="text-2xl font-extrabold text-ink-900">{cat.name}</h1>
            <p className="mt-0.5 text-sm text-ink-500">{products.length} منتج</p>
          </div>
        </div>
        <ProductsGrid
          products={products}
          categories={nav.categories.filter((c) => c.isVisible)}
          storeName={store.name}
          whatsapp={store.whatsapp || settings.socialWhatsApp}
          query={query}
          template={settings.template}
        />
      </div>
    </StoreShell>
  );
}
