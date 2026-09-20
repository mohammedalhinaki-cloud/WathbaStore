// ============================================================
// وثبة — غلاف المتجر (الهيدر + الفوتر + متغيرات التصميم)
// كل متجر يستقل هنا: خط، ألوان، شعار، روابط، وSEO
// ============================================================

import type { StoreBundle } from "@/lib/types";
import { FONTS } from "@/lib/types";
import { developerUrl, mainDomain, storeUrl } from "@/lib/constants";
import { waChatLink } from "@/lib/wa";
import SocialLinks from "@/components/social-links";

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
              WathbaStore
            </a>
          </p>
        </div>
      </div>
    );
  }

  const wa = store.whatsapp || settings.socialWhatsApp;

  return (
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
      <header className="sticky top-0 z-40 border-b border-ink-100 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
          <a href={query || "/"} className="flex min-w-0 items-center gap-2.5">
            {store.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={store.logoUrl} alt={store.name} className="h-10 w-10 shrink-0 rounded-xl object-cover" />
            ) : (
              <span
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lg font-extrabold text-white"
                style={{ backgroundColor: "var(--store-primary)" }}
              >
                {store.name.charAt(0)}
              </span>
            )}
            <span className="truncate text-lg font-extrabold text-ink-900">{store.name}</span>
          </a>

          <nav className="hidden items-center gap-1 md:flex">
            <a href={query || "/"} className="rounded-lg px-3 py-2 text-sm font-bold text-ink-600 hover:text-[var(--store-primary)]">
              الرئيسية
            </a>
            {navLinks.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="rounded-lg px-3 py-2 text-sm font-bold text-ink-600 hover:text-[var(--store-primary)]"
              >
                {l.label}
              </a>
            ))}
          </nav>

          {wa && (
            <a
              href={waChatLink(wa)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-extrabold text-white shadow-sm transition-opacity hover:opacity-90"
              style={{ backgroundColor: "#25D366" }}
            >
              <span className="text-base">💬</span>
              <span className="hidden sm:inline">واتساب</span>
            </a>
          )}
        </div>
        {/* شريط أقسام للجوال */}
        {navLinks.length > 0 && (
          <div className="no-scrollbar flex gap-2 overflow-x-auto border-t border-ink-100 px-4 py-2 md:hidden">
            <a href={query || "/"} className="shrink-0 rounded-full bg-ink-100 px-3.5 py-1.5 text-xs font-bold text-ink-700">
              الرئيسية
            </a>
            {navLinks.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="shrink-0 rounded-full bg-ink-100 px-3.5 py-1.5 text-xs font-bold text-ink-700"
              >
                {l.label}
              </a>
            ))}
          </div>
        )}
      </header>

      {/* ===== المحتوى ===== */}
      <main className="flex-1">{children}</main>

      {/* ===== الفوتر ===== */}
      <footer className="mt-16 border-t border-ink-100 bg-ink-50">
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
                WathbaStore
              </a>{" "}
              · {mainDomain()}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

/** عنوان المتجر الكامل (للإنتاج) — يُستخدم في canonical/OG */
export function canonicalStoreUrl(subdomain: string, path = ""): string {
  return storeUrl(subdomain, path);
}
