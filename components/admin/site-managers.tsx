// ============================================================
// وثبة — إدارة محتوى الموقع العام (المالك)
// أعمال، باقات، عروض، إعدادات الموقع، سجل النشاطات
// ============================================================

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import type { ActivityLog, Offer, PortfolioItem, PricingPlan, SiteSettings } from "@/lib/types";
import { ACTIVITY_LABELS } from "@/lib/types";
import { formatDate } from "@/lib/constants";
import { formatPrice } from "@/lib/constants";
import { Card, Field, inputCls, PrimaryBtn, GhostBtn, Toggle, EmptyState } from "./ui";
import { FormAlerts } from "./use-api";
import UploadField from "./upload-field";

// ------------------------------------------------------------
// قائمة نشاط عام
// ------------------------------------------------------------
export function ActivityList({ logs, stores }: { logs: ActivityLog[]; stores: { id: string; name: string }[] }) {
  const storeName = (id: string | null) => stores.find((s) => s.id === id)?.name ?? "المنصة";
  if (logs.length === 0) {
    return <EmptyState icon="📝" title="لا توجد نشاطات" sub="ستظهر هنا كل العمليات التي تمت" />;
  }
  return (
    <Card>
      <ol className="divide-y divide-ink-100">
        {logs.map((l) => (
          <li key={l.id} className="flex items-start justify-between gap-4 py-3.5">
            <div className="flex items-start gap-3">
              <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-brand-500" />
              <div>
                <p className="text-sm font-bold text-ink-800">{ACTIVITY_LABELS[l.action] ?? l.action}</p>
                <p className="mt-0.5 text-xs text-ink-400">
                  {storeName(l.storeId)} · {l.actorEmail || "النظام"}
                </p>
              </div>
            </div>
            <span className="shrink-0 text-xs text-ink-400">{formatDate(l.createdAt)}</span>
          </li>
        ))}
      </ol>
    </Card>
  );
}

// ------------------------------------------------------------
// الأعمال (Portfolio)
// ------------------------------------------------------------
export function PortfolioManager({ items }: { items: PortfolioItem[] }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState<Partial<PortfolioItem> | null>(null);

  async function run(url: string, options?: RequestInit) {
    setBusy(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch(url, options);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "حدث خطأ");
      setSuccess("تم الحفظ");
      router.refresh();
      return data;
    } catch (e) {
      setError(e instanceof Error ? e.message : "حدث خطأ");
      return null;
    } finally {
      setBusy(false);
    }
  }

  async function save() {
    if (!editing) return;
    const data = await run(
      editing.id ? `/api/portfolio/${editing.id}` : "/api/portfolio",
      {
        method: editing.id ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editing.title,
          description: editing.description ?? "",
          imageUrl: editing.imageUrl || "",
          storeUrl: editing.storeUrl ?? "",
          tags: editing.tags ?? "",
          isVisible: editing.isVisible ?? true,
          sortOrder: editing.sortOrder ?? 0,
        }),
      }
    );
    if (data) setEditing(null);
  }

  return (
    <div className="space-y-4">
      <FormAlerts error={error} success={success} />
      <Card>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-extrabold text-ink-900">الأعمال المعروضة ({items.length})</h3>
          <PrimaryBtn onClick={() => setEditing({ title: "", description: "", imageUrl: "", storeUrl: "", tags: "", isVisible: true, sortOrder: items.length })}>
            <Plus className="h-4 w-4" />
            إضافة عمل
          </PrimaryBtn>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {items.map((p) => (
            <div key={p.id} className="flex items-center gap-3 rounded-xl border border-ink-150 bg-ink-50/40 p-3">
              <div className="relative h-14 w-20 shrink-0 overflow-hidden rounded-lg bg-ink-100">
                {p.imageUrl && <img src={p.imageUrl} alt="" className="h-full w-full object-cover" />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-ink-800">{p.title}</p>
                <p className="truncate text-xs text-ink-400" dir="ltr">{p.storeUrl || "—"}</p>
              </div>
              <button onClick={() => setEditing(p)} className="rounded-lg p-2 text-ink-400 hover:bg-white hover:text-brand-600">
                <Pencil className="h-4 w-4" />
              </button>
              <button
                onClick={() => confirm("حذف هذا العمل؟") && void run(`/api/portfolio/${p.id}`, { method: "DELETE" })}
                className="rounded-lg p-2 text-ink-400 hover:bg-rose-50 hover:text-rose-600"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>

        {editing && (
          <div className="mt-5 space-y-4 rounded-2xl border border-brand-200 bg-brand-50/40 p-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="اسم العمل" required>
                <input className={inputCls} value={editing.title ?? ""} onChange={(e) => setEditing({ ...editing, title: e.target.value })} />
              </Field>
              <Field label="رابط المتجر">
                <input className={inputCls} dir="ltr" value={editing.storeUrl ?? ""} onChange={(e) => setEditing({ ...editing, storeUrl: e.target.value })} placeholder="https://rshaf.waathba.com" />
              </Field>
            </div>
            <Field label="وصف مختصر">
              <textarea className={inputCls} rows={2} value={editing.description ?? ""} onChange={(e) => setEditing({ ...editing, description: e.target.value })} />
            </Field>
            <Field label="الوسوم" hint="افصل بفواصل">
              <input className={inputCls} value={editing.tags ?? ""} onChange={(e) => setEditing({ ...editing, tags: e.target.value })} placeholder="قهوة, حلويات" />
            </Field>
            <UploadField
              storeId="site"
              folder="pages"
              label="صورة العمل"
              value={editing.imageUrl ? [editing.imageUrl] : []}
              onChange={(urls) => setEditing({ ...editing, imageUrl: urls[urls.length - 1] ?? "" })}
            />
            <div className="flex items-center justify-between">
              <Toggle checked={editing.isVisible ?? true} onChange={(v) => setEditing({ ...editing, isVisible: v })} label="ظاهر في الموقع" />
              <div className="flex gap-2">
                <GhostBtn onClick={() => setEditing(null)}>إلغاء</GhostBtn>
                <PrimaryBtn onClick={() => void save()} disabled={busy}>
                  {busy && <Loader2 className="h-4 w-4 animate-spin" />}
                  حفظ
                </PrimaryBtn>
              </div>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

// ------------------------------------------------------------
// الباقات (Pricing)
// ------------------------------------------------------------
export function PlansManager({ plans }: { plans: PricingPlan[] }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState<Partial<PricingPlan> | null>(null);

  async function run(url: string, options?: RequestInit) {
    setBusy(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch(url, options);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "حدث خطأ");
      setSuccess("تم الحفظ");
      router.refresh();
      return data;
    } catch (e) {
      setError(e instanceof Error ? e.message : "حدث خطأ");
      return null;
    } finally {
      setBusy(false);
    }
  }

  async function save() {
    if (!editing) return;
    const data = await run(
      editing.id ? `/api/plans/${editing.id}` : "/api/plans",
      {
        method: editing.id ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editing.name,
          price: Number(editing.price) || 0,
          oldPrice: editing.oldPrice ? Number(editing.oldPrice) : null,
          currency: editing.currency || "ر.س",
          features: (editing.features ?? []).filter(Boolean),
          isFeatured: editing.isFeatured ?? false,
          isVisible: editing.isVisible ?? true,
          sortOrder: editing.sortOrder ?? 0,
        }),
      }
    );
    if (data) setEditing(null);
  }

  return (
    <div className="space-y-4">
      <FormAlerts error={error} success={success} />
      <Card>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-extrabold text-ink-900">الباقات ({plans.length})</h3>
          <PrimaryBtn onClick={() => setEditing({ name: "", price: 0, oldPrice: null, currency: "ر.س", features: [], isFeatured: false, isVisible: true, sortOrder: plans.length })}>
            <Plus className="h-4 w-4" />
            إضافة باقة
          </PrimaryBtn>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {plans.map((p) => (
            <div key={p.id} className="rounded-xl border border-ink-150 bg-ink-50/40 p-4">
              <div className="flex items-center justify-between">
                <p className="font-extrabold text-ink-800">{p.name}</p>
                {p.isFeatured && <span className="rounded-full bg-accent-100 px-2 py-0.5 text-[10px] font-extrabold text-accent-600">مميزة</span>}
              </div>
              <p className="mt-1 text-lg font-extrabold text-brand-700">{formatPrice(p.price, p.currency)}</p>
              <p className="mt-2 line-clamp-2 text-xs text-ink-500">{p.features.join(" · ")}</p>
              <div className="mt-3 flex gap-1.5">
                <button onClick={() => setEditing(p)} className="flex-1 rounded-lg bg-white py-1.5 text-xs font-bold text-brand-600 ring-1 ring-brand-200">
                  تعديل
                </button>
                <button onClick={() => confirm("حذف الباقة؟") && void run(`/api/plans/${p.id}`, { method: "DELETE" })} className="rounded-lg bg-white px-3 py-1.5 text-xs font-bold text-rose-500 ring-1 ring-rose-200">
                  حذف
                </button>
              </div>
            </div>
          ))}
        </div>

        {editing && (
          <div className="mt-5 space-y-4 rounded-2xl border border-brand-200 bg-brand-50/40 p-5">
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="اسم الباقة" required>
                <input className={inputCls} value={editing.name ?? ""} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
              </Field>
              <Field label="السعر">
                <input className={inputCls} dir="ltr" type="number" min="0" value={editing.price ?? 0} onChange={(e) => setEditing({ ...editing, price: Number(e.target.value) })} />
              </Field>
              <Field label="السعر السابق">
                <input className={inputCls} dir="ltr" type="number" min="0" value={editing.oldPrice ?? ""} onChange={(e) => setEditing({ ...editing, oldPrice: e.target.value ? Number(e.target.value) : null })} />
              </Field>
            </div>
            <Field label="المميزات" hint="كل سطر = ميزة">
              <textarea
                className={inputCls}
                rows={4}
                value={(editing.features ?? []).join("\n")}
                onChange={(e) => setEditing({ ...editing, features: e.target.value.split("\n") })}
              />
            </Field>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex gap-5">
                <Toggle checked={editing.isFeatured ?? false} onChange={(v) => setEditing({ ...editing, isFeatured: v })} label="الأكثر طلبًا" />
                <Toggle checked={editing.isVisible ?? true} onChange={(v) => setEditing({ ...editing, isVisible: v })} label="ظاهر" />
              </div>
              <div className="flex gap-2">
                <GhostBtn onClick={() => setEditing(null)}>إلغاء</GhostBtn>
                <PrimaryBtn onClick={() => void save()} disabled={busy}>
                  {busy && <Loader2 className="h-4 w-4 animate-spin" />}
                  حفظ
                </PrimaryBtn>
              </div>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

// ------------------------------------------------------------
// العروض (Offers)
// ------------------------------------------------------------
export function OffersManager({ offers }: { offers: Offer[] }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState<Partial<Offer> | null>(null);

  async function run(url: string, options?: RequestInit) {
    setBusy(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch(url, options);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "حدث خطأ");
      setSuccess("تم الحفظ");
      router.refresh();
      return data;
    } catch (e) {
      setError(e instanceof Error ? e.message : "حدث خطأ");
      return null;
    } finally {
      setBusy(false);
    }
  }

  async function save() {
    if (!editing) return;
    const data = await run(
      editing.id ? `/api/offers/${editing.id}` : "/api/offers",
      {
        method: editing.id ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editing.title,
          description: editing.description ?? "",
          price: Number(editing.price) || 0,
          oldPrice: editing.oldPrice ? Number(editing.oldPrice) : null,
          currency: editing.currency || "ر.س",
          startsAt: editing.startsAt ? new Date(editing.startsAt).toISOString() : null,
          endsAt: editing.endsAt ? new Date(editing.endsAt).toISOString() : null,
          isActive: editing.isActive ?? true,
        }),
      }
    );
    if (data) setEditing(null);
  }

  return (
    <div className="space-y-4">
      <FormAlerts error={error} success={success} />
      <Card>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-extrabold text-ink-900">العروض ({offers.length})</h3>
          <PrimaryBtn onClick={() => setEditing({ title: "", description: "", price: 0, oldPrice: null, currency: "ر.س", startsAt: null, endsAt: null, isActive: true })}>
            <Plus className="h-4 w-4" />
            إضافة عرض
          </PrimaryBtn>
        </div>

        <div className="space-y-2.5">
          {offers.map((o) => (
            <div key={o.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-ink-150 bg-ink-50/40 px-4 py-3">
              <div>
                <p className="text-sm font-bold text-ink-800">{o.title}</p>
                <p className="text-xs text-ink-400">
                  {o.oldPrice != null && o.price > 0 ? `${formatPrice(o.price, o.currency)} بدل ${formatPrice(o.oldPrice, o.currency)}` : o.price > 0 ? formatPrice(o.price, o.currency) : "عرض بدون سعر"}
                  {o.endsAt ? ` · حتى ${new Date(o.endsAt).toLocaleDateString("ar-SA")}` : " · دائم"}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Toggle checked={o.isActive} onChange={(v) => void run(`/api/offers/${o.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isActive: v }) })} />
                <button onClick={() => setEditing(o)} className="rounded-lg p-2 text-ink-400 hover:bg-white hover:text-brand-600">
                  <Pencil className="h-4 w-4" />
                </button>
                <button onClick={() => confirm("حذف العرض؟") && void run(`/api/offers/${o.id}`, { method: "DELETE" })} className="rounded-lg p-2 text-ink-400 hover:bg-rose-50 hover:text-rose-600">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {editing && (
          <div className="mt-5 space-y-4 rounded-2xl border border-brand-200 bg-brand-50/40 p-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="عنوان العرض" required>
                <input className={inputCls} value={editing.title ?? ""} onChange={(e) => setEditing({ ...editing, title: e.target.value })} />
              </Field>
              <Field label="الوصف">
                <input className={inputCls} value={editing.description ?? ""} onChange={(e) => setEditing({ ...editing, description: e.target.value })} />
              </Field>
              <Field label="السعر">
                <input className={inputCls} dir="ltr" type="number" min="0" value={editing.price ?? 0} onChange={(e) => setEditing({ ...editing, price: Number(e.target.value) })} />
              </Field>
              <Field label="السعر قبل الخصم">
                <input className={inputCls} dir="ltr" type="number" min="0" value={editing.oldPrice ?? ""} onChange={(e) => setEditing({ ...editing, oldPrice: e.target.value ? Number(e.target.value) : null })} />
              </Field>
              <Field label="تاريخ البداية">
                <input className={inputCls} type="date" dir="ltr" value={editing.startsAt ? editing.startsAt.slice(0, 10) : ""} onChange={(e) => setEditing({ ...editing, startsAt: e.target.value || null })} />
              </Field>
              <Field label="تاريخ النهاية">
                <input className={inputCls} type="date" dir="ltr" value={editing.endsAt ? editing.endsAt.slice(0, 10) : ""} onChange={(e) => setEditing({ ...editing, endsAt: e.target.value || null })} />
              </Field>
            </div>
            <div className="flex items-center justify-between">
              <Toggle checked={editing.isActive ?? true} onChange={(v) => setEditing({ ...editing, isActive: v })} label="نشط" />
              <div className="flex gap-2">
                <GhostBtn onClick={() => setEditing(null)}>إلغاء</GhostBtn>
                <PrimaryBtn onClick={() => void save()} disabled={busy}>
                  {busy && <Loader2 className="h-4 w-4 animate-spin" />}
                  حفظ
                </PrimaryBtn>
              </div>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

// ------------------------------------------------------------
// إعدادات الموقع العام
// ------------------------------------------------------------
export function SiteSettingsForm({ settings }: { settings: SiteSettings }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [whatsapp, setWhatsapp] = useState(settings.whatsappNumber);
  const [about, setAbout] = useState(settings.aboutText);
  const [heroTitle, setHeroTitle] = useState(settings.heroTitle);
  const [heroSubtitle, setHeroSubtitle] = useState(settings.heroSubtitle);
  const [devUrl, setDevUrl] = useState(settings.developerUrl);
  const [instagram, setInstagram] = useState(settings.socialInstagram);
  const [snapchat, setSnapchat] = useState(settings.socialSnapchat);
  const [tiktok, setTiktok] = useState(settings.socialTiktok);
  const [features, setFeatures] = useState(settings.features.map((f) => ({ ...f })));
  const [faq, setFaq] = useState(settings.faq.map((f) => ({ ...f })));

  async function save() {
    setBusy(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch("/api/site", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          whatsappNumber: whatsapp.trim(),
          aboutText: about.trim(),
          heroTitle: heroTitle.trim(),
          heroSubtitle: heroSubtitle.trim(),
          developerUrl: devUrl.trim(),
          socialInstagram: instagram.trim(),
          socialSnapchat: snapchat.trim(),
          socialTiktok: tiktok.trim(),
          features: features.filter((f) => f.title.trim()),
          faq: faq.filter((f) => f.q.trim()),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "فشل الحفظ");
      setSuccess("تم حفظ إعدادات الموقع العام");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "حدث خطأ");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-5">
      <FormAlerts error={error} success={success} />
      <Card>
        <h3 className="mb-4 font-extrabold text-ink-900">بيانات التواصل</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="رقم واتساب وثبة" hint="يظهر في زر التواصل في الموقع العام">
            <input className={inputCls} dir="ltr" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="9665xxxxxxxx" />
          </Field>
          <Field label="رابط الموقع المطور (DEVELOPER_URL)">
            <input className={inputCls} dir="ltr" value={devUrl} onChange={(e) => setDevUrl(e.target.value)} />
          </Field>
        </div>
      </Card>

      <Card>
        <h3 className="mb-4 font-extrabold text-ink-900">المحتوى الرئيسي</h3>
        <div className="space-y-4">
          <Field label="عنوان الـ Hero">
            <input className={inputCls} value={heroTitle} onChange={(e) => setHeroTitle(e.target.value)} />
          </Field>
          <Field label="نص الـ Hero الفرعي">
            <textarea className={inputCls} rows={2} value={heroSubtitle} onChange={(e) => setHeroSubtitle(e.target.value)} />
          </Field>
          <Field label="نبذة عن وثبة">
            <textarea className={inputCls} rows={3} value={about} onChange={(e) => setAbout(e.target.value)} />
          </Field>
        </div>
      </Card>

      <Card>
        <h3 className="mb-4 font-extrabold text-ink-900">روابط تواصل وثبة</h3>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="انستقرام">
            <input className={inputCls} dir="ltr" value={instagram} onChange={(e) => setInstagram(e.target.value)} />
          </Field>
          <Field label="سناب">
            <input className={inputCls} dir="ltr" value={snapchat} onChange={(e) => setSnapchat(e.target.value)} />
          </Field>
          <Field label="تيك توك">
            <input className={inputCls} dir="ltr" value={tiktok} onChange={(e) => setTiktok(e.target.value)} />
          </Field>
        </div>
      </Card>

      <Card>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-extrabold text-ink-900">المميزات ({features.length})</h3>
          <PrimaryBtn onClick={() => setFeatures([...features, { title: "", desc: "" }])}>
            <Plus className="h-4 w-4" />
            إضافة
          </PrimaryBtn>
        </div>
        <div className="space-y-3">
          {features.map((f, i) => (
            <div key={i} className="flex gap-2">
              <input className={`${inputCls} flex-1`} placeholder="العنوان" value={f.title} onChange={(e) => setFeatures(features.map((x, j) => (j === i ? { ...x, title: e.target.value } : x)))} />
              <input className={`${inputCls} flex-[2]`} placeholder="الوصف" value={f.desc} onChange={(e) => setFeatures(features.map((x, j) => (j === i ? { ...x, desc: e.target.value } : x)))} />
              <button onClick={() => setFeatures(features.filter((_, j) => j !== i))} className="rounded-lg px-3 text-rose-500 hover:bg-rose-50">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-extrabold text-ink-900">الأسئلة الشائعة ({faq.length})</h3>
          <PrimaryBtn onClick={() => setFaq([...faq, { q: "", a: "" }])}>
            <Plus className="h-4 w-4" />
            إضافة
          </PrimaryBtn>
        </div>
        <div className="space-y-3">
          {faq.map((f, i) => (
            <div key={i} className="space-y-2 rounded-xl border border-ink-100 p-3">
              <div className="flex gap-2">
                <input className={`${inputCls} flex-1`} placeholder="السؤال" value={f.q} onChange={(e) => setFaq(faq.map((x, j) => (j === i ? { ...x, q: e.target.value } : x)))} />
                <button onClick={() => setFaq(faq.filter((_, j) => j !== i))} className="rounded-lg px-3 text-rose-500 hover:bg-rose-50">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <textarea className={`${inputCls} w-full`} rows={2} placeholder="الإجابة" value={f.a} onChange={(e) => setFaq(faq.map((x, j) => (j === i ? { ...x, a: e.target.value } : x)))} />
            </div>
          ))}
        </div>
      </Card>

      <div className="flex justify-end">
        <PrimaryBtn onClick={() => void save()} disabled={busy} className="px-8">
          {busy && <Loader2 className="h-4 w-4 animate-spin" />}
          حفظ كل الإعدادات
        </PrimaryBtn>
      </div>
    </div>
  );
}
