// ============================================================
// وثبة — Structured Data (schema.org) للموقع العام (waathba.com)
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
        inLanguage: "ar",
        publisher: { "@id": `${url}#organization` },
      },
      {
        "@type": "Organization",
        "@id": `${url}#organization`,
        name: APP_NAME,
        url,
        alternateName: mainDomain(),
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
