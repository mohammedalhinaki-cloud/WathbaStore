// ============================================================
// معون — غلاف المتجر (الهيدر + الفوتر + متغيرات التصميم)
// كل متجر يستقل هنا: خط، ألوان، شعار، روابط، وSEO
// ============================================================

import type { StoreBundle } from "@/lib/types";
import { FONTS } from "@/lib/types";
import { developerUrl, mainDomain, storeUrl } from "@/lib/constants";
import { isDarkColor } from "@/lib/colors";
import SocialLinks from "@/components/social-links";
import StoreHeader from "./store-header";
import { CartProvider } from "./cart-context";
import CartDrawer from "./cart-drawer";
import StoreJsonLd from "./store-json-ld";

interface Props {
  bundle: StoreBundle;
  /** معامل ?store= في وضع المعاينة */
  query: string;
  /** روابط الأقسام: { href, label } */
  navLinks: { href: string; label: string }[];
  /**
   * الهيدر الشفاف المتراكب فوق صورة الغلاف (الصفحة الرئيسية فقط).
   * يُفعَّل عندما يكون قسم الغلاف ظاهرًا، فيصبح الهيدر position: fixed
   * شفافًا فوق الصورة وتمتد الصورة خلفه إلى أعلى الشاشة (100svh).
   */
  overlayHeader?: boolean;
  children: React.ReactNode;
}

export default function StoreShell({
  bundle,
  query,
  navLinks,
  overlayHeader = false,
  children,
}: Props) {
  const { store, settings } = bundle;
  const font = FONTS.find((f) => f.key === settings.font)?.family ?? "Cairo";
  const devUrl = developerUrl(settings.developerUrl);

  if (store.status === "suspended") {
    return (
      <div className="store-root flex min-h-screen flex-col items-center justify-center bg-ink-50 px-6 text-center" style={{ fontFamily: font }}>
        <div className="max-w-md">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-100">
            <span className="text-3xl">⏸️</span>
          </div>
          <h1 className="mt-6 text-2xl font-extrabold text-ink-900">هذا المتجر متوقف حاليًا</h1>
          <p className="mt-3 leading-7 text-ink-500">
            يرجى التواصل مع صاحب المتجر أو العودة لاحقًا.
          </p>
          <p className="mt-8 text-xs text-ink-400">
            تطوير:{" "}
            <a href={devUrl} target="_blank" rel="noopener noreferrer" className="font-semibold text-ink-500 underline-offset-2 hover:underline">
              {mainDomain()}
            </a>
          </p>
        </div>
      </div>
    );
  }

  const wa = store.whatsapp || settings.socialWhatsApp;
  const footerBg = settings.footerBgColor?.trim() || "";
  /**
   * خلفية الفوتر داكنة؟ إذا كذلك تصبح نصوص الفوتر (الاسم والوصف) بيضاء
   * صريحة (#FFFFFF) أو أوف-وايت (#F3F4F6) بلا أي شفافية — وتبقى داكنة
   * عندما تكون خلفية الفوتر فاتحة أو غير مضبوطة.
   */
  const footerIsDark = footerBg !== "" && isDarkColor(footerBg);

  return (
    <CartProvider storeKey={store.subdomain} adoptLegacy={!query}>
      {/* بيانات Structured Data الديناميكية للمتجر (schema.org) */}
      <StoreJsonLd bundle={bundle} />

      <div
        className={`store-root flex min-h-screen flex-col bg-white ${
          overlayHeader ? "store-root--hero-overlay" : ""
        }`}
        style={
          {
            fontFamily: font,
            "--store-primary": settings.primaryColor,
            "--store-secondary": settings.secondaryColor,
          } as React.CSSProperties
        }
      >
        {/* ===== الهيدر =====
            overlayHeader = شفاف وثابت فوق صورة الغلاف (الرئيسية فقط) */}
        <StoreHeader
          bundle={bundle}
          query={query}
          navLinks={navLinks}
          overlay={overlayHeader}
        />

        {/* ===== المحتوى ===== */}
        <main className="flex-1">{children}</main>

        {/* ===== الفوتر ===== */}
        <footer className="mt-16 border-t" style={{ backgroundColor: footerBg || undefined, borderColor: footerBg ? "transparent" : undefined }}>
          <div className="mx-auto max-w-6xl px-4 py-10">
            <div data-reveal="up" className="flex flex-col items-center gap-6 text-center">
              <div className="flex items-center gap-2.5">
                {store.logoUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={store.logoUrl} alt={store.name} className="h-9 w-9 rounded-lg object-cover" />
                )}
                {/* اسم المتجر: أبيض صريح فوق الخلفيات الداكنة */}
                <span
                  className={`text-lg font-extrabold ${
                    footerIsDark ? "text-white" : "text-ink-900"
                  }`}
                >
                  {store.name}
                </span>
              </div>
              {store.description && (
                /* النص الفرعي: أوف-وايت صريح بلا شفافية فوق الخلفيات الداكنة */
                <p
                  className={`max-w-md text-sm leading-6 ${
                    footerIsDark ? "text-[#F3F4F6]" : "text-ink-500"
                  }`}
                >
                  {store.description}
                </p>
              )}
              {/* التواصل الاجتماعي: أيقونات العلامات الأصلية الملونة
                  (إنستغرام، سناب شات، تيك توك، واتساب) — واتساب هنا فقط */}
              <SocialLinks
                instagram={settings.socialInstagram}
                snapchat={settings.socialSnapchat}
                tiktok={settings.socialTiktok}
                whatsapp={wa}
              />
            </div>
          </div>
        </footer>

        {/* ===== شريط حقوق التطوير — منفصل تمامًا عن جسم الفوتر ===== */}
        <div className="border-t border-white/10 bg-ink-950 py-3 text-center">
          <a
            href={devUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-ink-400 transition-colors hover:text-ink-200"
          >
            تطوير {mainDomain()} © {new Date().getFullYear()}
          </a>
        </div>

        {/* ===== درج السلة ===== */}
        <CartDrawer query={query} />
      </div>
    </CartProvider>
  );
}

/** عنوان المتجر الكامل (للإنتاج) — يُستخدم في canonical/OG */
export function canonicalStoreUrl(subdomain: string, path = ""): string {
  return storeUrl(subdomain, path);
}