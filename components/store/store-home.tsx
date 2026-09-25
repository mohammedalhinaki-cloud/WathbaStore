// ============================================================
// معون — الصفحة الرئيسية للمتجر (أقسام حسب ترتيب الإعدادات)
//
// تغييرات مقصودة هنا:
// 1) أُزيل شريط «تبويبات الأقسام» (قهوة / مشروبات باردة / حلويات) من
//    وسط الصفحة الرئيسية — الأقسام ما زالت متاحة من القائمة العلوية
//    وصفحات /categories/[slug] وأزرار فلترة المنتجات.
// 2) صورة الغلاف (البطل) تظهر دائمًا: لم تعد مرتبطة بالقالب («بسيط» كان
//    يخفيها)، ولها سلسلة بدائل حتى لا يظهر مكانها مستطيل لون فارغ:
//    coverUrl ← صورة SEO ← خلفية متدرجة بألوان المتجر.
// 3) الغلاف يملأ الشاشة بالكامل (hero-fullscreen = 100vh/100svh) على
//    الجوال والكمبيوتر عند الدخول الأول، وزر «تسوّق الآن» يمرّر الشاشة
//    تمريرًا سلسًا إلى قسم «منتجاتنا» (#products) مباشرة.
// 4) الهيدر العلوي شفاف ومتراكب فوق الغلاف (position: fixed) — تُفعّله
//    app/page.tsx عبر overlayHeader بنفس شرط showHero أدناه. لذا يأخذ
//    الغلاف حشوًا علويًا بمقدار ارتفاع الهيدر الفعلي (--store-header-h)
//    حتى لا يختفي اسم المتجر خلفه، وصورة الغلاف تمتد خلف الهيدر إلى
//    أعلى نقطة في الشاشة بلا فراغ أبيض.
// ============================================================

import Image from "next/image";
import { services } from "@/lib/services";
import { isOptimizableSrc, pickFirstImage } from "@/lib/images";
import { isHeroEnabled, type StoreBundle } from "@/lib/types";
import ProductsGrid from "./products-grid";
import HeroCtaButton from "./hero-cta-button";

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
  const wa = store.whatsapp || settings.socialWhatsApp;

  const sections = settings.sectionOrder;
  const showHero = isHeroEnabled(sections);

  /**
   * صورة الغلاف الفعلية: صورة المتجر أولًا، ثم صورة SEO إن ضُبطت،
   * وإلا نعرض خلفية متدرجة بألوان المتجر (لا مستطيل فارغ).
   */
  const cover = pickFirstImage(store.coverUrl, settings.seoOgImage);
  const heroTitle = store.name;
  const heroText = store.description || settings.aboutText;

  return (
    <div>
      {/* ===== صورة الغلاف (البطل) — ملء الشاشة بالكامل خلف الهيدر الشفاف ===== */}
      {showHero && (
        <section
          id="top"
          className="hero-fullscreen relative isolate flex items-center overflow-hidden"
          style={{ backgroundColor: "var(--store-primary)" }}
        >
          {cover ? (
            <>
              <Image
                src={cover}
                alt={`صورة غلاف ${heroTitle}`}
                fill
                priority
                sizes="100vw"
                unoptimized={!isOptimizableSrc(cover)}
                className="-z-10 object-cover"
              />
              <div className="absolute inset-0 -z-10 bg-gradient-to-l from-ink-950/85 via-ink-950/55 to-ink-950/10" />
            </>
          ) : (
            <>
              {/* لا توجد صورة غلاف مرفوعة بعد: خلفية أنيقة بألوان المتجر */}
              <div
                className="absolute inset-0 -z-10"
                style={{
                  backgroundImage:
                    "linear-gradient(135deg, var(--store-primary) 0%, var(--store-primary) 45%, var(--store-secondary) 100%)",
                }}
              />
              <div className="pointer-events-none absolute inset-0 -z-10 opacity-20 [background-image:radial-gradient(circle_at_20%_50%,white_1px,transparent_1px)] [background-size:24px_24px]" />
              <div className="absolute inset-0 -z-10 bg-gradient-to-l from-ink-950/70 via-ink-950/30 to-transparent" />
            </>
          )}

          {/* الحشو العلوي (hero-inner) = ارتفاع الهيدر الشفاف + هامش مريح:
              يضمن بقاء الاسم والوصف وزر «تسوّق الآن» تحت الهيدر لا خلفه */}
          <div className="hero-inner relative mx-auto w-full max-w-6xl px-4 pb-16 sm:pb-20">
            <div className="max-w-xl">
              {store.logoUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={store.logoUrl}
                  alt={heroTitle}
                  className="mb-4 h-16 w-16 rounded-2xl object-cover ring-4 ring-white/20"
                />
              )}
              <h1 className="text-3xl font-extrabold text-white drop-shadow sm:text-4xl">
                {heroTitle}
              </h1>
              {heroText && (
                <p className="mt-3 text-base leading-7 text-white/90 drop-shadow sm:text-lg">
                  {heroText}
                </p>
              )}
              {sections.includes("products") && (
                <HeroCtaButton targetId="products" />
              )}
            </div>
          </div>
        </section>
      )}

      {/* ===== المنتجات =====
          store-scroll-anchor: إزاحة تمرير = ارتفاع الهيدر الثابت + هامش،
          حتى لا يغطّي الهيدر عنوان القسم عند الضغط على «تسوّق الآن» */}
      {sections.includes("products") && (
        <section
          id="products"
          className="store-scroll-anchor mx-auto max-w-6xl px-4 pt-12"
        >
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
