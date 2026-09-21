import type { Metadata, Viewport } from "next";
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

export const metadata: Metadata = {
  metadataBase: new URL("https://waathba.com"),
  // أيقونة المفضلة ديناميكية حسب النطاق (app/icon/route.ts)
  icons: {
    icon: "/icon",
    apple: "/icon",
  },
  title: {
    default: "وثبة | waathba.com — متجرك الإلكتروني بثبة واحدة",
    template: "%s | وثبة",
  },
  description:
    "منصة وثبة أنشئ بها متجرًا إلكترونيًا متكاملًا على نطاق فرعي خاص بك — تصميم، منتجات، SEO، وتسليم جاهز للإدارة.",
  keywords: ["متاجر إلكترونية", "وثبة", "waathba.com", "إنشاء متاجر", "متجر إلكتروني"],
  openGraph: {
    title: "وثبة | waathba.com",
    description: "متجرك الإلكتروني بثبة واحدة — أنشئه وأجهزه وسلّمه جاهزًا.",
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
