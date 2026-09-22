// ============================================================
// باني المتجر — نظرة عامة (بيانات المتجر + النطاق + الإجراءات)
// ============================================================

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getTenant } from "@/lib/tenant";
import { services } from "@/lib/services";
import { mainDomain, formatDateShort } from "@/lib/constants";
import { StatusBadge } from "@/components/admin/ui";
import BuilderNav from "@/components/admin/builder-nav";
import StoreInfoForm from "@/components/admin/store-info-form";
import SubdomainManager from "@/components/admin/subdomain-manager";
import StorageHealthCard from "@/components/admin/storage-health-card";
import { Eye, ExternalLink, Gift, LayoutDashboard } from "lucide-react";

export const metadata: Metadata = { title: "إدارة متجر" };

export default async function StoreOverviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const tenant = await getTenant();
  const [store, settings] = await Promise.all([
    services().getStore(id),
    services().getStoreSettings(id),
  ]);
  if (!store) notFound();

  const isRealHost = tenant.host.endsWith(mainDomain());
  const previewUrl = isRealHost
    ? `https://${store.subdomain}.${mainDomain()}`
    : `/?store=${store.subdomain}`;
  // لوحة المتجر بنفس واجهة صاحب المتجر (المالك الرئيسي يملك كل الوظائف فيها)
  const panelUrl = isRealHost
    ? `https://${store.subdomain}.${mainDomain()}/admin`
    : `/admin?store=${store.subdomain}`;

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          {store.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={store.logoUrl} alt="" className="h-14 w-14 rounded-2xl object-cover" />
          ) : (
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-100 text-2xl font-extrabold text-brand-700">
              {store.name.charAt(0)}
            </span>
          )}
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-extrabold text-ink-900">{store.name}</h1>
              <StatusBadge status={store.status} />
            </div>
            <p className="mt-0.5 text-sm text-ink-500" dir="ltr">
              {store.subdomain}.{mainDomain()}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <a
            href={previewUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-extrabold text-white hover:bg-emerald-600"
          >
            <Eye className="h-4 w-4" />
            معاينة المتجر
          </a>
          <a
            href={panelUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-extrabold text-white hover:bg-brand-700"
          >
            <LayoutDashboard className="h-4 w-4" />
            لوحة المتجر
          </a>
          <Link
            href={`/admin/stores/${store.id}/delivery`}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-l from-accent-500 to-accent-400 px-4 py-2.5 text-sm font-extrabold text-ink-950 hover:opacity-90"
          >
            <Gift className="h-4 w-4" />
            التسليم
          </Link>
        </div>
      </div>

      <BuilderNav storeId={store.id} />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <StoreInfoForm store={store} settings={settings} />
          {/* تغيير النطاق الفرعي من داخل المتجر — يعمل لأي حالة (منها المسلّم) */}
          <SubdomainManager store={store} />
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border border-ink-150 bg-white p-5 shadow-sm">
            <h3 className="mb-3 font-extrabold text-ink-900">روابط المتجر</h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <span className="block text-xs font-bold text-ink-400">رابط المتجر</span>
                <a href={previewUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 font-mono text-xs font-bold text-brand-600 hover:underline" dir="ltr">
                  {store.subdomain}.{mainDomain()}
                  <ExternalLink className="h-3 w-3" />
                </a>
              </li>
              <li>
                <span className="block text-xs font-bold text-ink-400">لوحة المتجر (نفس واجهة صاحب المتجر)</span>
                <a href={panelUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 font-mono text-xs font-bold text-brand-600 hover:underline" dir="ltr">
                  {store.subdomain}.{mainDomain()}/admin
                  <ExternalLink className="h-3 w-3" />
                </a>
              </li>
            </ul>
            <div className="mt-4 border-t border-ink-100 pt-4">
              <p className="text-xs text-ink-400">
                أُنشئ: {formatDateShort(store.createdAt)}
                {store.deliveredAt && <> · سُلم: {formatDateShort(store.deliveredAt)}</>}
              </p>
            </div>
          </div>

          <StorageHealthCard storeId={store.id} />

          <div className="rounded-2xl border border-ink-150 bg-white p-5 shadow-sm">
            <h3 className="mb-3 font-extrabold text-ink-900">التالي في الجولة</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href={`/admin/stores/${store.id}/design`} className="font-bold text-brand-600 hover:underline">التصميم والألوان →</Link>
              </li>
              <li>
                <Link href={`/admin/stores/${store.id}/categories`} className="font-bold text-brand-600 hover:underline">الأقسام →</Link>
              </li>
              <li>
                <Link href={`/admin/stores/${store.id}/products/new`} className="font-bold text-brand-600 hover:underline">إضافة منتجات →</Link>
              </li>
              <li>
                <Link href={`/admin/stores/${store.id}/seo`} className="font-bold text-brand-600 hover:underline">إعدادات SEO →</Link>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
