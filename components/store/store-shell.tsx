// ============================================================
// وثبة — غلاف المتجر (الهيدر + الفوتر + متغيرات التصميم)
// كل متجر يستقل هنا: خط، ألوان، شعار، روابط، وSEO
// ============================================================

import type { StoreBundle } from "@/lib/types";
import { FONTS } from "@/lib/types";
import { developerUrl, mainDomain, storeUrl } from "@/lib/constants";
import { waChatLink } from "@/lib/wa";
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
  children: React.ReactNode;
}

export default function StoreShell({ bundle, query, navLinks, children }: Props) {
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
              waathba.com
            </a>
          </p>
        </div>
      </div>
    );
  }

  const wa = store.whatsapp || settings.socialWhatsApp;
  const footerBg = settings.footerBgColor || undefined;

  return (
    <CartProvider storeKey={store.subdomain} adoptLegacy={!query}>
      {/* بيانات Structured Data الديناميكية للمتجر (schema.org) */}
      <StoreJsonLd bundle={bundle} />

      <div
        className="store-root flex min-h-screen flex-col bg-white"
        style={
          {
            fontFamily: font,
            "--store-primary": settings.primaryColor,
            "--store-secondary": settings.secondaryColor,
          } as React.CSSProperties
        }
      >
        {/* ===== الهيدر ===== */}
        <StoreHeader bundle={bundle} query={query} navLinks={navLinks} />

        {/* ===== المحتوى ===== */}
        <main className="flex-1">{children}</main>

        {/* ===== الفوتر ===== */}
        <footer className="mt-16 border-t" style={{ backgroundColor: footerBg || undefined, borderColor: footerBg ? "transparent" : undefined }}>
          <div className="mx-auto max-w-6xl px-4 py-10">
            <div className="flex flex-col items-center gap-6 text-center">
              <div className="flex items-center gap-2.5">
                {store.logoUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={store.logoUrl} alt={store.name} className="h-9 w-9 rounded-lg object-cover" />
                )}
                <span className="text-lg font-extrabold text-ink-900">{store.name}</span>
              </div>
              {store.description && (
                <p className="max-w-md text-sm leading-6 text-ink-500">{store.description}</p>
              )}
              <SocialLinks
                instagram={settings.socialInstagram}
                snapchat={settings.socialSnapchat}
                tiktok={settings.socialTiktok}
                whatsapp={wa}
              />
              {wa && (
                <a
                  href={waChatLink(wa)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-extrabold text-white"
                  style={{ backgroundColor: "#25D366" }}
                >
                  💬 تواصل معنا عبر واتساب
                </a>
              )}
            </div>

            {/* توقيع المطور — يُضبط من الإعدادات (DEVELOPER_URL) وليس ثابتًا في الكود */}
            <div className="mt-8 border-t border-ink-200 pt-5 text-center">
              <p className="text-xs text-ink-400">
                تطوير:{" "}
                <a
                  href={devUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-ink-500 transition-colors hover:text-[var(--store-primary)]"
                >
                  waathba.com
                </a>{" "}
                · {mainDomain()}
              </p>
            </div>
          </div>
        </footer>

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