// ============================================================
// صفحة المنتج: rshaf.wathbastore.com/products/latte
// ============================================================

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import { ChevronRight } from "lucide-react";
import { getStoreCtx } from "@/lib/tenant";
import { services } from "@/lib/services";
import { formatPrice } from "@/lib/constants";
import { waOrderLink } from "@/lib/wa";
import { canonicalStoreUrl } from "@/components/store/store-shell";
import StoreShell from "@/components/store/store-shell";
import ProductCard from "@/components/store/product-card";
import { loadStoreAndNav } from "@/components/store/load-nav";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const ctx = await getStoreCtx();
  const { slug } = await params;
  if (!ctx?.bundle) return {};
  const product = await services().getProduct(ctx.bundle.store.id, decodeURIComponent(slug));
  if (!product) return {};
  const { store, settings } = ctx.bundle;
  const title = `${product.name} | ${store.name}`;
  return {
    title,
    description: product.description || settings.seoDescription || store.description,
    alternates: {
      canonical: settings.seoCanonical || canonicalStoreUrl(store.subdomain, `/products/${product.slug}`),
    },
    openGraph: {
      title,
      description: product.description,
      images: product.images[0] ? [{ url: product.images[0].url }] : undefined,
      locale: "ar_SA",
    },
  };
}

export default async function ProductPage({ params }: Props) {
  const ctx = await getStoreCtx();
  const { slug } = await params;
  if (!ctx?.bundle) notFound();
  const { store, settings } = ctx.bundle;

  const product = await services().getProduct(store.id, decodeURIComponent(slug));
  if (!product || !product.isVisible) notFound();

  const query = ctx.tenant.isPreview ? `?store=${store.subdomain}` : "";
  const { categories, pages } = await loadStoreAndNav(store.id);
  const navLinks = [
    ...categories
      .filter((c) => c.isVisible)
      .map((c) => ({ href: `/categories/${encodeURIComponent(c.slug)}${query}`, label: c.name })),
    ...pages.filter((p) => p.isVisible).map((p) => ({ href: `/pages/${encodeURIComponent(p.slug)}${query}`, label: p.title })),
  ];

  const wa = store.whatsapp || settings.socialWhatsApp;
  const priceText = formatPrice(product.price);
  const waLink = waOrderLink(wa, {
    productName: product.name,
    price: priceText,
    productUrl: canonicalStoreUrl(store.subdomain, `/products/${product.slug}`),
    storeName: store.name,
  });

  // منتجات مقترحة من نفس القسم
  const related =
    product.categoryId != null
      ? (await services().listProducts(store.id, { categoryId: product.categoryId })).filter(
          (p) => p.id !== product.id
        ).slice(0, 4)
      : [];

  return (
    <StoreShell bundle={ctx.bundle} query={query} navLinks={navLinks}>
      <div className="mx-auto max-w-6xl px-4 py-8">
        {/* مسار التنقل */}
        <nav className="mb-6 flex items-center gap-1.5 text-sm text-ink-500">
          <a href={query || "/"} className="hover:text-[var(--store-primary)]">الرئيسية</a>
          <ChevronRight className="h-4 w-4" />
          <span className="font-semibold text-ink-800">{product.name}</span>
        </nav>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* الصور */}
          <div>
            <div className="relative aspect-square overflow-hidden rounded-3xl border border-ink-100 bg-ink-100">
              {product.images[0] ? (
                <Image
                  src={product.images[0].url}
                  alt={product.name}
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-5xl">🛍️</div>
              )}
            </div>
            {product.images.length > 1 && (
              <div className="mt-3 flex gap-2 overflow-x-auto">
                {product.images.slice(1, 6).map((img) => (
                  <div key={img.id} className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-ink-100 bg-ink-100">
                    <Image src={img.url} alt={product.name} fill sizes="64px" className="object-cover" />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* التفاصيل */}
          <div>
            {product.categoryId && (
              <span
                className="inline-block rounded-full px-3 py-1 text-xs font-bold text-white"
                style={{ backgroundColor: "var(--store-secondary)" }}
              >
                {categories.find((c) => c.id === product.categoryId)?.name ?? "منتجات"}
              </span>
            )}
            <h1 className="mt-3 text-2xl font-extrabold text-ink-900 sm:text-3xl">{product.name}</h1>

            <div className="mt-4 flex items-center gap-3">
              <span className="text-3xl font-extrabold" style={{ color: "var(--store-primary)" }}>
                {priceText}
              </span>
              {product.oldPrice != null && (
                <span className="text-lg text-ink-400 line-through">{formatPrice(product.oldPrice)}</span>
              )}
            </div>

            {product.stock != null && (
              <p className={`mt-2 text-sm font-semibold ${product.stock > 0 ? "text-emerald-600" : "text-rose-600"}`}>
                {product.stock > 0 ? `متوفر — ${product.stock} قطعة` : "نفدت الكمية"}
              </p>
            )}

            {product.description && (
              <p className="mt-5 whitespace-pre-line leading-8 text-ink-600">{product.description}</p>
            )}

            <a
              href={waLink}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-7 flex w-full items-center justify-center gap-2.5 rounded-2xl px-6 py-4 text-lg font-extrabold text-white shadow-lg transition-transform hover:scale-[1.02]"
              style={{ backgroundColor: "var(--store-primary)" }}
            >
              <span className="text-2xl">💬</span>
              اطلب عبر واتساب
            </a>
            <p className="mt-3 text-center text-xs text-ink-400">
              ستصلك الرسالة تلقائيًا باسم المنتج وسعره — يتم التأكيد معك على التفاصيل.
            </p>
          </div>
        </div>

        {related.length > 0 && (
          <section className="mt-16">
            <div className="mb-6 flex items-center gap-3">
              <span className="h-7 w-1.5 rounded-full" style={{ backgroundColor: "var(--store-primary)" }} />
              <h2 className="text-xl font-extrabold text-ink-900">منتجات مشابهة</h2>
            </div>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {related.map((p) => (
                <ProductCard
                  key={p.id}
                  product={p}
                  storeName={store.name}
                  whatsapp={wa}
                  query={query}
                  template={settings.template}
                />
              ))}
            </div>
          </section>
        )}
      </div>
    </StoreShell>
  );
}
