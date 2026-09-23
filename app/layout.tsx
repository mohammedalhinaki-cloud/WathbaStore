import type { Metadata, Viewport } from "next";
import { APP_NAME, mainDomain } from "@/lib/constants";
import "./globals.css";
import "@fontsource/cairo/400.css";
import "@fontsource/cairo/500.css";
import "@fontsource/cairo/600.css";
import "@fontsource/cairo/700.css";
import "@fontsource/cairo/800.css";
import "@fontsource/tajawal/400.css";
import "@fontsource/tajawal/500.css";
import "@fontsource/tajawal/700.css";
import "@fontsource/almarai/400.css";
import "@fontsource/almarai/700.css";
import "@fontsource/ibm-plex-sans-arabic/400.css";
import "@fontsource/ibm-plex-sans-arabic/600.css";
import "@fontsource/ibm-plex-sans-arabic/700.css";

const domain = mainDomain();

export const metadata: Metadata = {
  metadataBase: new URL(`https://${domain}`),
  icons: {
    icon: [
      { url: "/icon", sizes: "any" },
      { url: "/favicon-32x32.png", type: "image/png", sizes: "32x32" },
      { url: "/favicon-16x16.png", type: "image/png", sizes: "16x16" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    apple: { url: "/apple-touch-icon.png", sizes: "180x180" },
  },
  title: {
    default: `${APP_NAME} — متجرك الإلكتروني مع ${APP_NAME}`,
    template: `%s | ${APP_NAME}`,
  },
  description:
    `منصة ${APP_NAME} أنشئ بها متجرًا إلكترونيًا متكاملًا على نطاق فرعي خاص بك — تصميم، منتجات، SEO، وتسليم جاهز للإدارة.`,
  keywords: ["متاجر إلكترونية", APP_NAME, domain, "إنشاء متاجر", "متجر إلكتروني"],
  applicationName: APP_NAME,
  alternates: {
    canonical: `https://${domain}`,
  },
  openGraph: {
    title: `${APP_NAME} — متجرك الإلكتروني مع ${APP_NAME}`,
    description: `متجرك الإلكتروني مع ${APP_NAME} — أنشئه وأجهزه وسلّمه جاهزًا.`,
    url: `https://${domain}`,
    locale: "ar_SA",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#0a0c14",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl">
      <body className="font-sans min-h-screen">{children}</body>
    </html>
  );
}
