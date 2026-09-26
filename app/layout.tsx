import type { Metadata, Viewport } from "next";
import { APP_NAME, APP_TAGLINE, mainDomain } from "@/lib/constants";
import ScrollMotion from "@/components/motion/scroll-motion";
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
    default: `${APP_NAME} لبناء المواقع والمتاجر الإلكترونية`,
    template: `%s | ${APP_NAME}`,
  },
  description:
    `${APP_NAME} لبناء المواقع والمتاجر الإلكترونية في السعودية. ننشئ لك موقعًا أو متجرًا إلكترونيًا احترافيًا مع التصميم والتجهيز والتسليم والدعم.`,
  keywords: [
    APP_NAME,
    "معون لبناء المواقع",
    "بناء المواقع",
    "إنشاء متجر إلكتروني",
    "تصميم متجر إلكتروني",
    "المواقع والمتاجر الإلكترونية",
    domain,
  ],
  applicationName: APP_NAME,
  robots: { index: true, follow: true },
  alternates: {
    canonical: `https://${domain}`,
  },
  openGraph: {
    title: `${APP_NAME} لبناء المواقع والمتاجر الإلكترونية`,
    description: `${APP_NAME} منصة سعودية لبناء المواقع والمتاجر الإلكترونية وتجهيزها وتسليمها جاهزة للإدارة.`,
    url: `https://${domain}`,
    locale: "ar_SA",
    type: "website",
    images: [
      { url: "/og-image.png", width: 1200, height: 630, alt: `${APP_NAME} — ${APP_TAGLINE}` },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${APP_NAME} لبناء المواقع والمتاجر الإلكترونية`,
    description: `${APP_NAME} لبناء المواقع والمتاجر الإلكترونية باحتراف.`,
    images: ["/og-image.png"],
  },
};

export const viewport: Viewport = {
  themeColor: "#0F172A",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <head>
        {/*
          تفعيل الحركات قبل أول رسم يمنع وميض العناصر ثم اختفاءها عند hydration.
          بدون JavaScript يبقى المحتوى ظاهرًا، ومع reduced-motion لا تُضاف الفئة أصلًا.
        */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "try{if(!matchMedia('(prefers-reduced-motion: reduce)').matches)document.documentElement.classList.add('motion-enabled')}catch(e){}",
          }}
        />
      </head>
      <body className="font-sans min-h-screen">
        <ScrollMotion />
        {children}
      </body>
    </html>
  );
}
