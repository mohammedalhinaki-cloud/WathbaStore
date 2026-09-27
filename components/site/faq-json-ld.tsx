// معون — Structured Data (schema.org) للأسئلة الشائعة في الصفحة الرئيسية
// يحافظ على تطابق البيانات المنظمة مع الأسئلة والأجوبة الظاهرة للزائر.

type FaqItem = {
  q: string;
  a: string;
};

export default function FaqJsonLd({ items }: { items: FaqItem[] }) {
  const data = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.a,
      },
    })),
  };

  return (
    <script
      type="application/ld+json"
      // تهريب علامة < يمنع إنهاء وسم script إذا احتوى المحتوى المحرر عليها.
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  );
}
