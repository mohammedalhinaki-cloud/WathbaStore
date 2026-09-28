// ============================================================
// معون — Structured Data (schema.org) للموقع العام (maaoun.com)
// WebSite + Organization حتى يفهم Google هوية المنصة الرئيسية
// بشكل مستقل عن متاجر النطاقات الفرعية.
//
// شعار المنظمة (logo) هو ما قد يظهر بجانب اسم الموقع في نتائج بحث
// قوقل، ويُضبط من لوحة المالك (إعدادات ← SEO). عند غياب قيمة مضبوطة
// يعود إلى الشعار الافتراضي فلا يتغيّر الظهور الحالي.
// ============================================================

import { mainDomain, APP_NAME } from "@/lib/constants";
import type { SiteSettings } from "@/lib/types";
import { siteLogoUrl, siteOgImageUrl } from "@/lib/seo";

export default function SiteJsonLd({ settings }: { settings?: SiteSettings }) {
  const url = `https://${mainDomain()}`;
  const logo = settings ? siteLogoUrl(settings) : `${url}/logo.png`;
  const image = settings ? siteOgImageUrl(settings) : `${url}/og-image.png`;
  const description = settings?.seoDescription?.trim() || undefined;

  const organization: Record<string, unknown> = {
    "@type": "Organization",
    "@id": `${url}#organization`,
    name: APP_NAME,
    alternateName: "Maaoun",
    url,
    logo,
    image,
  };
  if (description) organization.description = description;

  const data = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${url}#website`,
        url,
        name: APP_NAME,
        alternateName: "Maaoun",
        inLanguage: "ar",
        publisher: { "@id": `${url}#organization` },
      },
      organization,
      {
        "@type": "Service",
        "@id": `${url}#website-builder-service`,
        name: `${APP_NAME} لبناء المواقع والمتاجر الإلكترونية`,
        serviceType: "بناء المواقع والمتاجر الإلكترونية",
        provider: { "@id": `${url}#organization` },
        areaServed: { "@type": "Country", name: "Saudi Arabia" },
        url,
        inLanguage: "ar",
      },
    ],
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}
