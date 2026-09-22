// ============================================================
// معين — صفحة العميل (المالك): البيانات + المتجر + الدخول + النشاط
// ============================================================

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { services } from "@/lib/services";
import { mainDomain, formatDate, formatDateShort, formatPrice } from "@/lib/constants";
import { ACTIVITY_LABELS } from "@/lib/types";
import { PageHeader, StatusBadge, Card, EmptyState } from "@/components/admin/ui";
import { ExternalLink, KeyRound, Phone, Mail, Store as StoreIcon, Activity } from "lucide-react";

export const metadata: Metadata = { title: "تفاصيل العميل" };

export default async function ClientPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [client, products, logs] = await Promise.all([
    services().getClient(id),
    services().listProducts(id, { includeHidden: true }),
    services().listActivity({ storeId: id, limit: 15 }),
  ]);
  if (!client) notFound();

  const { store, memberUser } = client;
  const creds = store.clientCredentials;

  return (
    <div>
      <Link href="/admin/clients" className="mb-4 inline-block text-xs font-bold text-brand-600 hover:underline">
        ← كل العملاء
      </Link>
      <PageHeader
        title={store.ownerName || store.name}
        sub={`عميل متجر «${store.name}»`}
        action={
          <a
            href={`https://${store.subdomain}.${mainDomain()}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-extrabold text-white hover:bg-emerald-600"
          >
            <ExternalLink className="h-4 w-4" />
            فتح المتجر
          </a>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* بيانات العميل */}
        <Card>
          <h3 className="mb-4 font-extrabold text-ink-900">بيانات العميل</h3>
          <ul className="space-y-3 text-sm">
            <li className="flex items-center gap-3">
              <StoreIcon className="h-4 w-4 text-brand-500" />
              <span className="font-bold text-ink-800">{store.name}</span>
            </li>
            <li className="flex items-center gap-3 text-ink-600">
              <Mail className="h-4 w-4 text-ink-400" />
              <span dir="ltr">{store.ownerEmail || "—"}</span>
            </li>
            <li className="flex items-center gap-3 text-ink-600">
              <Phone className="h-4 w-4 text-ink-400" />
              <span dir="ltr">{store.ownerPhone || "—"}</span>
            </li>
            <li className="flex items-center gap-3 text-ink-600">
              <KeyRound className="h-4 w-4 text-ink-400" />
              <span>حساب العميل: {memberUser ? "موجود" : "لم يُنشأ (لم يُسلّم)"}</span>
            </li>
          </ul>
        </Card>

        {/* بيانات المتجر */}
        <Card>
          <h3 className="mb-4 font-extrabold text-ink-900">المتجر والنطاق</h3>
          <ul className="space-y-3 text-sm">
            <li className="flex items-center justify-between gap-2">
              <span className="text-ink-500">النطاق الفرعي</span>
              <span className="font-mono text-xs font-bold text-ink-800" dir="ltr">
                {store.subdomain}.{mainDomain()}
              </span>
            </li>
            <li className="flex items-center justify-between gap-2">
              <span className="text-ink-500">الحالة</span>
              <StatusBadge status={store.status} />
            </li>
            <li className="flex items-center justify-between gap-2">
              <span className="text-ink-500">أُنشئ</span>
              <span className="font-semibold text-ink-700">{formatDateShort(store.createdAt)}</span>
            </li>
            <li className="flex items-center justify-between gap-2">
              <span className="text-ink-500">سُلّم</span>
              <span className="font-semibold text-ink-700">{formatDate(store.deliveredAt)}</span>
            </li>
            <li className="flex items-center justify-between gap-2">
              <span className="text-ink-500">واتساب الطلبات</span>
              <span className="font-mono text-xs font-bold text-ink-800" dir="ltr">{store.whatsapp || "—"}</span>
            </li>
          </ul>
          <Link
            href={`/admin/stores/${store.id}`}
            className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-brand-50 py-2.5 text-sm font-bold text-brand-700 ring-1 ring-brand-200 hover:bg-brand-100"
          >
            إدارة المتجر من الباني
          </Link>
        </Card>

        {/* بيانات الدخول */}
        <Card>
          <h3 className="mb-4 font-extrabold text-ink-900">بيانات دخول العميل</h3>
          {creds ? (
            <div className="space-y-3">
              <div className="rounded-xl border border-ink-150 bg-ink-50/50 px-4 py-2.5">
                <p className="text-[11px] font-bold text-ink-400">لوحة التحكم</p>
                <p className="truncate font-mono text-sm font-bold text-ink-800" dir="ltr">
                  {store.subdomain}.{mainDomain()}/admin
                </p>
              </div>
              <div className="rounded-xl border border-ink-150 bg-ink-50/50 px-4 py-2.5">
                <p className="text-[11px] font-bold text-ink-400">البريد</p>
                <p className="truncate font-mono text-sm font-bold text-ink-800" dir="ltr">{creds.email}</p>
              </div>
              <div className="rounded-xl border border-ink-150 bg-ink-50/50 px-4 py-2.5">
                <p className="text-[11px] font-bold text-ink-400">كلمة المرور</p>
                <p className="truncate font-mono text-sm font-bold text-ink-800" dir="ltr">{creds.password}</p>
              </div>
              <p className="text-[11px] leading-5 text-ink-400">
                ⚠️ أُرسلت هذه البيانات للعميل عند التسليم — احتفظ بها أو اطلب من العميل إعادة تعيينها.
              </p>
            </div>
          ) : (
            <p className="rounded-xl border border-dashed border-ink-200 bg-ink-50/50 px-4 py-6 text-center text-sm text-ink-400">
              ستظهر بيانات الدخول بعد تسليم المتجر
            </p>
          )}
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* المنتجات */}
        <Card>
          <h3 className="mb-4 font-extrabold text-ink-900">منتجات المتجر ({products.length})</h3>
          {products.length === 0 ? (
            <EmptyState icon="🛍️" title="لا توجد منتجات" />
          ) : (
            <div className="max-h-96 space-y-2 overflow-y-auto">
              {products.map((p) => (
                <div key={p.id} className="flex items-center justify-between rounded-xl border border-ink-100 px-4 py-2.5">
                  <div className="flex items-center gap-3">
                    <div className="relative h-9 w-9 overflow-hidden rounded-lg bg-ink-100">
                      {p.images[0] && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={p.images[0].url} alt="" className="h-full w-full object-cover" />
                      )}
                    </div>
                    <span className={`text-sm font-bold ${p.isVisible ? "text-ink-800" : "text-ink-400 line-through"}`}>{p.name}</span>
                  </div>
                  <span className="text-xs font-extrabold text-ink-600">{formatPrice(p.price)}</span>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* سجل النشاط */}
        <Card>
          <h3 className="mb-4 flex items-center gap-2 font-extrabold text-ink-900">
            <Activity className="h-4 w-4 text-brand-600" />
            سجل نشاط المتجر
          </h3>
          {logs.length === 0 ? (
            <p className="py-8 text-center text-sm text-ink-400">لا يوجد نشاط</p>
          ) : (
            <ol className="max-h-96 space-y-3 overflow-y-auto">
              {logs.map((l) => (
                <li key={l.id} className="border-b border-ink-100 pb-3 last:border-0">
                  <p className="text-sm font-bold text-ink-800">{ACTIVITY_LABELS[l.action] ?? l.action}</p>
                  <p className="text-xs text-ink-400">{l.actorEmail} · {formatDate(l.createdAt)}</p>
                </li>
              ))}
            </ol>
          )}
        </Card>
      </div>
    </div>
  );
}
