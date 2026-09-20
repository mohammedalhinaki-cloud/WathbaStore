// ============================================================
// باني المتجر — تسليم المتجر
// ============================================================

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { services } from "@/lib/services";
import BuilderNav from "@/components/admin/builder-nav";
import DeliveryPanel from "@/components/admin/delivery-panel";
import { mainDomain } from "@/lib/constants";

export const metadata: Metadata = { title: "تسليم المتجر" };

export default async function DeliveryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [store, products, categories, settings] = await Promise.all([
    services().getStore(id),
    services().listProducts(id),
    services().listCategories(id),
    services().getStoreSettings(id),
  ]);
  if (!store) notFound();

  const checklist = [
    { ok: products.length > 0, label: "توجد منتجات ظاهرة", detail: `${products.length} منتج`, href: `/admin/stores/${id}/products` },
    { ok: categories.length > 0, label: "توجد أقسام", detail: `${categories.length} قسم`, href: `/admin/stores/${id}/categories` },
    { ok: Boolean(store.logoUrl), label: "الشعار مرفوع", detail: store.logoUrl ? "موجود" : "ناقص", href: `/admin/stores/${id}` },
    { ok: Boolean(store.coverUrl), label: "صورة الغلاف مرفوعة", detail: store.coverUrl ? "موجودة" : "ناقصة", href: `/admin/stores/${id}` },
    { ok: Boolean(store.whatsapp || settings.socialWhatsApp), label: "رقم واتساب مضبوط", detail: store.whatsapp || settings.socialWhatsApp || "ناقص", href: `/admin/stores/${id}` },
    { ok: Boolean(settings.seoTitle), label: "عنوان SEO محدد", detail: settings.seoTitle || "افتراضي", href: `/admin/stores/${id}/seo` },
    { ok: Boolean(settings.seoDescription), label: "وصف SEO محدد", detail: settings.seoDescription ? "موجود" : "ناقص", href: `/admin/stores/${id}/seo` },
    { ok: Boolean(store.ownerName && store.ownerEmail), label: "بيانات العميل مكتملة", detail: store.ownerEmail ? store.ownerEmail : "ناقص البريد", href: `/admin/stores/${id}` },
  ];

  const allOk = checklist.every((c) => c.ok);

  return (
    <div>
      <h1 className="mb-5 text-2xl font-extrabold text-ink-900">تسليم {store.name}</h1>
      <BuilderNav storeId={store.id} />
      <DeliveryPanel
        store={store}
        checklist={checklist}
        allOk={allOk}
        previewUrl={`https://${store.subdomain}.${mainDomain()}`}
      />
    </div>
  );
}
