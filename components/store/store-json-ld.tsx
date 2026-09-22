// ============================================================
// معين — Structured Data (schema.org) لمتجر واحد
// يُضاف داخل StoreShell فيظهر في كل صفحات المتجر العامة:
// الرئيسية، المنتجات، الأقسام، والصفحات النصية.
// الاسم والوصف والصورة تُشتق من Supabase حسب النطاق — لا قيم ثابتة.
// ============================================================

import type { StoreBundle } from "@/lib/types";
import { buildStoreJsonLd } from "@/lib/seo";

export default function StoreJsonLd({ bundle }: { bundle: StoreBundle }) {
  const data = buildStoreJsonLd(bundle);
  return (
    <script
      type="application/ld+json"
      // البيانات مبنية ديناميكيًا من المتجر — آمنة من حقن HTML
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
