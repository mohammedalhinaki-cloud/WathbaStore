// ============================================================
// معون — Structured Data (schema.org) للموقع العام (maaoun.com)
// WebSite + Organization حتى يفهم Google هوية المنصة الرئيسية
// بشكل مستقل عن متاجر النطاقات الفرعية.
// ============================================================

import { mainDomain, APP_NAME } from "@/lib/constants";

export default function SiteJsonLd() {
  const url = `https://${mainDomain()}`;
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
      {
        "@type": "Organization",
        "@id": `${url}#organization`,
        name: APP_NAME,
        alternateName: "Maaoun",
        url,
        logo: `${url}/logo.png`,
        image: `${url}/og-image.png`,
      },
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
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
