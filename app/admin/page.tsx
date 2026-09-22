// ============================================================
// /admin — الرئيسية (تتفرع):
// - المالك (waathba.com) → إحصائيات وإدارة المنصة
// - صاحب المتجر (rshaf.waathba.com) → لوحة متجره
// ============================================================

import type { Metadata } from "next";
import { redirect, notFound } from "next/navigation";
import { getTenant, getStoreCtx } from "@/lib/tenant";
import { getCurrentUser } from "@/lib/session";
import { canAccessStorePanel, isMasterOwner } from "@/lib/authorize";
import { services } from "@/lib/services";
import { storeHref } from "@/lib/links";
import { mainDomain } from "@/lib/constants";
import { ACTIVITY_LABELS } from "@/lib/types";
import { formatDateShort } from "@/lib/constants";
import OwnerShell from "@/components/admin/owner-shell";
import ClientShell from "@/components/admin/client-shell";
import { Card, StatCard, StatusBadge, PageHeader, EmptyState } from "@/components/admin/ui";
import {
  Store,
  Hourglass,
  CheckCheck,
  Users,
  PauseCircle,
  Package,
  ArrowLeft,
  ExternalLink,
  MessageCircle,
  Plus,
  Palette,
  Activity as ActivityIcon,
} from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = { title: "الرئيسية" };

export default async function AdminHome() {
  const tenant = await getTenant();
  const user = await getCurrentUser();

  if (tenant.tenant === "store") {
    const ctx = await getStoreCtx();
    if (!ctx?.bundle) notFound();
    const { store } = ctx.bundle;
    // المالك الرئيسي يدخل لوحة أي متجر بنفس واجهة صاحب المتجر
    if (!user) redirect("/admin/login");
    if (!canAccessStorePanel(user, store.id)) {
      redirect("/admin/login");
    }
    return (
      <ClientDashboard
        user={user}
        storeId={store.id}
        storeUrlHref={await storeHref(store.subdomain)}
        masterOwner={isMasterOwner(user)}
      />
    );
  }

  // موقع رئيسي: لوحة المالك
  if (!user || user.role !== "owner") redirect("/admin/login");
  return <OwnerDashboard user={user} />;
}

// ============================================================
// لوحة المالك
// ============================================================

async function OwnerDashboard({ user }: { user: { name: string; email: string } }) {
  const [stores, logs] = await Promise.all([
    services().listStores(),
    services().listActivity({ limit: 8 }),
  ]);

  const inProgress = stores.filter((s) => s.status === "draft" || s.status === "preparing").length;
  const testing = stores.filter((s) => s.status === "testing" || s.status === "ready").length;
  const delivered = stores.filter((s) => s.status === "delivered").length;
  const suspended = stores.filter((s) => s.status === "suspended").length;
  const clients = new Set(stores.map((s) => s.ownerEmail).filter(Boolean)).size;

  return (
    <OwnerShell user={user}>
      <PageHeader
        title={`أهلًا ${user.name || "بك"} 👋`}
        sub="نظرة عامة على متجرك المنصة"
        action={
          <Link
            href="/admin/stores/new"
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-l from-accent-500 to-accent-400 px-4 py-2.5 text-sm font-extrabold text-ink-950 shadow-lg shadow-accent-500/20 transition-transform hover:scale-[1.02]"
          >
            <Plus className="h-4 w-4" />
            إنشاء متجر
          </Link>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard icon={<Store className="h-6 w-6" />} label="إجمالي المتاجر" value={stores.length} />
        <StatCard icon={<Hourglass className="h-6 w-6" />} label="قيد التجهيز" value={inProgress} tone="amber" />
        <StatCard icon={<CheckCheck className="h-6 w-6" />} label="مسلّمة" value={delivered} tone="emerald" />
        <StatCard icon={<PauseCircle className="h-6 w-6" />} label="متوقفة" value={suspended} tone="rose" />
        <StatCard icon={<Users className="h-6 w-6" />} label="العملاء" value={clients} tone="violet" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {/* آخر المتاجر */}
        <Card className="lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-extrabold text-ink-900">أحدث المتاجر</h2>
            <Link href="/admin/stores" className="flex items-center gap-1 text-xs font-bold text-brand-600 hover:text-brand-700">
              الكل
              <ArrowLeft className="h-3.5 w-3.5" />
            </Link>
          </div>
          {stores.length === 0 ? (
            <EmptyState
              icon="🏪"
              title="لا توجد متاجر بعد"
              sub="ابدأ بإنشاء أول متجر لعملائك"
              action={
                <Link href="/admin/stores/new" className="text-sm font-bold text-brand-600 hover:underline">
                  + إنشاء متجر جديد
                </Link>
              }
            />
          ) : (
            <div className="space-y-3">
              {stores.slice(0, 5).map((s) => (
                <div
                  key={s.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-ink-100 bg-ink-50/40 px-4 py-3"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    {s.logoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={s.logoUrl} alt="" className="h-10 w-10 rounded-lg object-cover" />
                    ) : (
                      <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-100 font-extrabold text-brand-700">
                        {s.name.charAt(0)}
                      </span>
                    )}
                    <div className="min-w-0">
                      <Link
                        href={`/admin/stores/${s.id}`}
                        className="block truncate font-bold text-ink-900 hover:text-brand-600"
                      >
                        {s.name}
                      </Link>
                      <p className="truncate text-xs text-ink-500" dir="ltr">
                        {s.subdomain}.{mainDomain()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={s.status} />
                    <Link
                      href={`/admin/stores/${s.id}`}
                      className="rounded-lg bg-white px-3 py-1.5 text-xs font-bold text-ink-700 ring-1 ring-ink-200 hover:bg-ink-50"
                    >
                      إدارة
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* آخر النشاطات */}
        <Card>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-extrabold text-ink-900">آخر النشاطات</h2>
            <Link href="/admin/activity" className="flex items-center gap-1 text-xs font-bold text-brand-600 hover:text-brand-700">
              الكل
              <ArrowLeft className="h-3.5 w-3.5" />
            </Link>
          </div>
          {logs.length === 0 ? (
            <p className="py-8 text-center text-sm text-ink-400">لا توجد نشاطات بعد</p>
          ) : (
            <ol className="space-y-4">
              {logs.map((l) => (
                <li key={l.id} className="flex gap-3">
                  <span className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-50">
                    <ActivityIcon className="h-3.5 w-3.5 text-brand-600" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-ink-800">
                      {ACTIVITY_LABELS[l.action] ?? l.action}
                    </p>
                    <p className="truncate text-xs text-ink-400">
                      {l.actorEmail} · {formatDateShort(l.createdAt)}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </Card>
      </div>
    </OwnerShell>
  );
}

// ============================================================
// لوحة العميل
// ============================================================

async function ClientDashboard({
  user,
  storeId,
  storeUrlHref,
  masterOwner = false,
}: {
  user: { name: string; email: string };
  storeId: string;
  storeUrlHref: string;
  masterOwner?: boolean;
}) {
  const [store, products, categories, logs] = await Promise.all([
    services().getStore(storeId),
    services().listProducts(storeId, { includeHidden: true }),
    services().listCategories(storeId, true),
    services().listActivity({ storeId, limit: 6 }),
  ]);
  if (!store) notFound();

  const visible = products.filter((p) => p.isVisible).length;
  const query = `?store=${store.subdomain}`;
  void query;

  return (
    <ClientShell
      storeName={store.name}
      subdomain={store.subdomain}
      user={user}
      storeUrl={storeUrlHref}
      masterOwner={masterOwner}
    >
      <PageHeader
        title={`أهلًا ${user.name || store.ownerName} 👋`}
        sub={`إدارة ${store.name} — ${store.subdomain}.${mainDomain()}`}
        action={
          <Link
            href="/admin/products/new"
            className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-brand-700"
          >
            <Plus className="h-4 w-4" />
            إضافة منتج
          </Link>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard icon={<Package className="h-6 w-6" />} label="المنتجات الظاهرة" value={visible} />
        <StatCard icon={<Store className="h-6 w-6" />} label="الأقسام" value={categories.length} tone="violet" />
        <StatCard icon={<MessageCircle className="h-6 w-6" />} label="واتساب المتجر" value={store.whatsapp ? "مفعّل" : "غير مضبوط"} tone={store.whatsapp ? "emerald" : "rose"} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-extrabold text-ink-900">أحدث المنتجات</h2>
            <Link href="/admin/products" className="flex items-center gap-1 text-xs font-bold text-brand-600 hover:text-brand-700">
              الكل
              <ArrowLeft className="h-3.5 w-3.5" />
            </Link>
          </div>
          {products.length === 0 ? (
            <EmptyState
              icon="🛍️"
              title="لا توجد منتجات"
              sub="أضف أول منتج لمتجرك ليظهر لزوارك فورًا"
              action={
                <Link href="/admin/products/new" className="text-sm font-bold text-brand-600 hover:underline">
                  + إضافة منتج
                </Link>
              }
            />
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {products.slice(0, 4).map((p) => (
                <Link
                  key={p.id}
                  href={`/admin/products/${p.id}/edit`}
                  className="group overflow-hidden rounded-xl border border-ink-100 bg-white transition-all hover:-translate-y-0.5 hover:shadow"
                >
                  <div className="relative aspect-square bg-ink-100">
                    {p.images[0] && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.images[0].url} alt={p.name} className="h-full w-full object-cover" />
                    )}
                  </div>
                  <div className="p-2.5">
                    <p className="truncate text-xs font-bold text-ink-800 group-hover:text-brand-600">{p.name}</p>
                    <p className="mt-0.5 text-[11px] text-ink-500">{p.isVisible ? "ظاهر" : "مخفي"}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <h2 className="mb-4 font-extrabold text-ink-900">آخر النشاط</h2>
          {logs.length === 0 ? (
            <p className="py-6 text-center text-sm text-ink-400">لا يوجد نشاط بعد</p>
          ) : (
            <ol className="space-y-3">
              {logs.map((l) => (
                <li key={l.id} className="border-b border-ink-100 pb-3 last:border-0">
                  <p className="text-sm font-bold text-ink-800">{ACTIVITY_LABELS[l.action] ?? l.action}</p>
                  <p className="text-xs text-ink-400">{formatDateShort(l.createdAt)}</p>
                </li>
              ))}
            </ol>
          )}
          <a
            href={storeUrlHref}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-extrabold text-emerald-700 ring-1 ring-emerald-200 transition-colors hover:bg-emerald-100"
          >
            <ExternalLink className="h-4 w-4" />
            زيارة متجرنا
          </a>
        </Card>
      </div>
    </ClientShell>
  );
}
