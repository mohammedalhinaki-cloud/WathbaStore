// ============================================================
// وثبة — الصفحة الرئيسية للمتجر (أقسام حسب ترتيب الإعدادات)
// ============================================================

import Image from "next/image";
import { services } from "@/lib/services";
import type { StoreBundle } from "@/lib/types";
import ProductsGrid from "./products-grid";

interface Props {
  bundle: StoreBundle;
  query: string;
}

export default async function StoreHome({ bundle, query }: Props) {
  const { store, settings } = bundle;
  const [products, categories, pages] = await Promise.all([
    services().listProducts(store.id),
    services().listCategories(store.id),
    services().listPages(store.id),
  ]);

  const visibleCats = categories.filter((c) => c.isVisible);
  const visiblePages = pages.filter((p) => p.isVisible);
  const heroCover = settings.template !== "minimal";
  const wa = store.whatsapp || settings.socialWhatsApp;

  const sections = settings.sectionOrder;

  return (
    <div>
      {/* ===== Hero ===== */}
      {heroCover && sections.includes("hero") && (
        <section className="relative overflow-hidden" style={{ backgroundColor: "var(--store-primary)" }}>
          {store.coverUrl ? (
            <>
              <Image
                src={store.coverUrl}
                alt={store.name}
                fill
                priority
                sizes="100vw"
                className="object-cover opacity-90"
              />
              <div className="absolute inset-0 bg-gradient-to-l from-ink-950/80 via-ink-950/50 to-transparent" />
            </>
          ) : (
            <div className="pointer-events-none absolute inset-0 opacity-20 [background-image:radial-gradient(circle_at_20%_50%,white_1px,transparent_1px)] [background-size:24px_24px]" />
          )}
          <div className="relative mx-auto max-w-6xl px-4 py-14 sm:py-20">
            <div className="max-w-xl">
              {store.logoUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={store.logoUrl}
                  alt={store.name}
                  className="mb-4 h-16 w-16 rounded-2xl object-cover ring-4 ring-white/20"
                />
              )}
              <h1 className="text-3xl font-extrabold text-white drop-shadow sm:text-4xl">
                {store.name}
              </h1>
              {(store.description || settings.aboutText) && (
                <p className="mt-3 text-base leading-7 text-white/90 drop-shadow sm:text-lg">
                  {store.description || settings.aboutText}
                </p>
              )}
              <a
                href="#products"
                className="mt-6 inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-extrabold text-white shadow-lg transition-transform hover:scale-[1.03]"
                style={{ backgroundColor: "var(--store-secondary)" }}
              >
                تسوّق الآن
                <span>←</span>
              </a>
            </div>
          </div>
        </section>
      )}

      {/* ===== الأقسام ===== */}
      {sections.includes("categories") && visibleCats.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 pt-10">
          <div className="no-scrollbar flex gap-3 overflow-x-auto pb-1">
            {visibleCats.map((c) => (
              <a
                key={c.id}
                href={`/categories/${encodeURIComponent(c.slug)}${query || ""}`}
                className="shrink-0 rounded-2xl border border-ink-150 bg-white px-5 py-3 text-center shadow-sm transition-all hover:-translate-y-0.5 hover:shadow"
              >
                <span className="block text-sm font-extrabold text-ink-800">{c.name}</span>
                <span
                  className="mx-auto mt-1.5 block h-1 w-8 rounded-full"
                  style={{ backgroundColor: "var(--store-primary)" }}
                />
              </a>
            ))}
          </div>
        </section>
      )}

      {/* ===== المنتجات ===== */}
      {sections.includes("products") && (
        <section id="products" className="mx-auto max-w-6xl px-4 pt-12">
          <div className="mb-6 flex items-center gap-3">
            <span className="h-7 w-1.5 rounded-full" style={{ backgroundColor: "var(--store-primary)" }} />
            <h2 className="text-xl font-extrabold text-ink-900 sm:text-2xl">منتجاتنا</h2>
          </div>
          <ProductsGrid
            products={products}
            categories={visibleCats}
            storeName={store.name}
            whatsapp={wa}
            query={query}
            template={settings.template}
          />
        </section>
      )}

      {/* ===== صفحات المتجر ===== */}
      {sections.includes("pages") && visiblePages.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 pt-12">
          <div className="flex flex-wrap gap-3">
            {visiblePages.map((p) => (
              <a
                key={p.id}
                href={`/pages/${encodeURIComponent(p.slug)}${query || ""}`}
                className="rounded-xl border border-ink-150 bg-white px-5 py-2.5 text-sm font-bold text-ink-700 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow"
              >
                {p.title}
              </a>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
