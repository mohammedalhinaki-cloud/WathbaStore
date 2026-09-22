// ============================================================
// معين — معالج إنشاء المتجر (3 خطوات)
// ============================================================

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, Globe, User, Palette, ArrowRight, ArrowLeft } from "lucide-react";
import { Card, Field, inputCls } from "@/components/admin/ui";
import { FormAlerts as Alerts } from "@/components/admin/use-api";
import { TEMPLATES, FONTS } from "@/lib/types";
import { mainDomain } from "@/lib/constants";
import type { FontKey, TemplateKey } from "@/lib/types";

interface SubdomainState {
  status: "idle" | "checking" | "ok" | "taken" | "invalid";
  reason?: string;
}

export default function CreateStoreWizard() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [sub, setSub] = useState<SubdomainState>({ status: "idle" });

  // البيانات
  const [ownerName, setOwnerName] = useState("");
  const [ownerPhone, setOwnerPhone] = useState("");
  const [ownerEmail, setOwnerEmail] = useState("");
  const [name, setName] = useState("");
  const [subdomain, setSubdomain] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [description, setDescription] = useState("");
  const [template, setTemplate] = useState<TemplateKey>("modern");
  const [font, setFont] = useState<FontKey>("cairo");
  const [primary, setPrimary] = useState("#4F46E5");
  const [secondary, setSecondary] = useState("#F59E0B");

  // فحص النطاق الفرعي
  const [debounced, setDebounced] = useState("");
  function onSubdomainChange(v: string) {
    const clean = v.trim().toLowerCase().replace(/\s+/g, "");
    setSubdomain(clean);
    setSub({ status: "idle" });
    setDebounced(clean);
  }

  // (الفحص يتم عند الضغط على التالي لخطوة 2)
  async function checkSubdomain() {
    if (!subdomain) {
      setSub({ status: "invalid", reason: "أدخل اسم النطاق الفرعي" });
      return false;
    }
    setSub({ status: "checking" });
    try {
      const res = await fetch(`/api/subdomains/availability?subdomain=${encodeURIComponent(subdomain)}`);
      const data = await res.json();
      if (data.available) setSub({ status: "ok" });
      else setSub({ status: "taken", reason: data.reason });
      return data.available;
    } catch {
      setSub({ status: "invalid", reason: "تعذر الفحص" });
      return false;
    }
  }

  async function next() {
    setError(null);
    if (step === 0) {
      if (ownerName.trim().length < 2) return setError("أدخل اسم العميل");
      if (ownerEmail && !/^\S+@\S+\.\S+$/.test(ownerEmail)) return setError("بريد العميل غير صالح");
      setStep(1);
    } else if (step === 1) {
      if (name.trim().length < 2) return setError("أدخل اسم المتجر");
      if (!subdomain) return setError("أدخل اسم النطاق الفرعي");
      const ok = await checkSubdomain();
      if (!ok) return;
      setStep(2);
    }
  }

  async function submit() {
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch("/api/stores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          subdomain,
          ownerName: ownerName.trim(),
          ownerPhone: ownerPhone.trim(),
          ownerEmail: ownerEmail.trim(),
          whatsapp: whatsapp.trim(),
          description: description.trim(),
          template,
          font,
          primaryColor: primary,
          secondaryColor: secondary,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "فشل إنشاء المتجر");
        return;
      }
      setSuccess("تم إنشاء المتجر — جارٍ التجهيز…");
      setTimeout(() => router.push(`/admin/stores/${data.store.id}`), 600);
    } catch {
      setError("تعذر الاتصال بالخادم");
    } finally {
      setSaving(false);
    }
  }

  const steps = [
    { label: "العميل", icon: User },
    { label: "المتجر والنطاق", icon: Globe },
    { label: "التصميم", icon: Palette },
  ];

  return (
    <div className="space-y-6">
      {/* شريط الخطوات */}
      <div className="flex items-center gap-2">
        {steps.map((s, i) => (
          <div key={s.label} className="flex flex-1 items-center gap-2">
            <div
              className={`flex h-9 flex-1 items-center justify-center gap-2 rounded-xl text-sm font-extrabold transition-colors ${
                i === step
                  ? "bg-brand-600 text-white"
                  : i < step
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-ink-100 text-ink-400"
              }`}
            >
              {i < step ? <Check className="h-4 w-4" /> : <s.icon className="h-4 w-4" />}
              {s.label}
            </div>
            {i < steps.length - 1 && <span className="h-px w-4 shrink-0 bg-ink-200" />}
          </div>
        ))}
      </div>

      <Alerts error={error} success={success} />

      {/* ===== الخطوة 1: العميل ===== */}
      {step === 0 && (
        <Card>
          <h2 className="mb-5 text-lg font-extrabold text-ink-900">بيانات العميل (صاحب المتجر)</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="اسم العميل" required>
              <input className={inputCls} value={ownerName} onChange={(e) => setOwnerName(e.target.value)} placeholder="محمد الرشيف" />
            </Field>
            <Field label="رقم الجوال">
              <input className={inputCls} dir="ltr" value={ownerPhone} onChange={(e) => setOwnerPhone(e.target.value)} placeholder="05xxxxxxxx" />
            </Field>
            <Field label="البريد الإلكتروني" hint="سيُستخدم كاسم دخول لوحة المتجر بعد التسليم">
              <input className={inputCls} dir="ltr" value={ownerEmail} onChange={(e) => setOwnerEmail(e.target.value)} placeholder="client@email.com" />
            </Field>
            <Field label="واتساب الطلبات" hint="الرقم الذي تصله طلبات المتجر (بصيغة دولية: 9665xxxxxxxx)">
              <input className={inputCls} dir="ltr" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="9665xxxxxxxx" />
            </Field>
          </div>
        </Card>
      )}

      {/* ===== الخطوة 2: المتجر والنطاق ===== */}
      {step === 1 && (
        <Card>
          <h2 className="mb-5 text-lg font-extrabold text-ink-900">بيانات المتجر والنطاق الفرعي</h2>
          <div className="space-y-4">
            <Field label="اسم المتجر" required hint="الاسم الذي يظهر للزوار وفي نتائج البحث">
              <input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} placeholder="كافيه رشف" />
            </Field>

            <Field label="النطاق الفرعي" required>
              <div className="flex items-stretch overflow-hidden rounded-xl border border-ink-200 bg-white focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-500/20">
                <input
                  className="min-w-0 flex-1 border-0 px-3.5 py-2.5 text-sm outline-none"
                  dir="ltr"
                  value={subdomain}
                  onChange={(e) => onSubdomainChange(e.target.value)}
                  placeholder="rshaf"
                />
                <span className="flex items-center whitespace-nowrap bg-ink-50 px-3 text-xs font-bold text-ink-400" dir="ltr">
                  .{mainDomain()}
                </span>
              </div>
            </Field>

            {/* حالة النطاق */}
            {sub.status === "ok" && (
              <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">
                <Check className="h-4 w-4" />
                ممتاز! النطاق متاح — سيكون رابط المتجر:{" "}
                <span dir="ltr" className="font-mono">{subdomain}.{mainDomain()}</span>
              </div>
            )}
            {sub.status === "taken" && (
              <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">
                ⚠️ {sub.reason ?? "هذا النطاق مستخدم بالفعل في متجر آخر"}
              </div>
            )}
            {sub.status === "invalid" && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">
                {sub.reason}
              </div>
            )}
            {sub.status === "checking" && (
              <div className="flex items-center gap-2 rounded-xl border border-ink-200 bg-ink-50 px-4 py-3 text-sm font-bold text-ink-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                جارٍ فحص توفر النطاق…
              </div>
            )}

            <Field label="وصف المتجر">
              <textarea className={inputCls} rows={3} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="وصف مختصر يظهر في صفحة المتجر والموقع العام" />
            </Field>
          </div>
        </Card>
      )}

      {/* ===== الخطوة 3: التصميم ===== */}
      {step === 2 && (
        <Card>
          <h2 className="mb-5 text-lg font-extrabold text-ink-900">التصميم الأولي</h2>
          <div className="space-y-5">
            <div>
              <span className="mb-2 block text-sm font-bold text-ink-700">القالب</span>
              <div className="grid gap-3 sm:grid-cols-3">
                {TEMPLATES.map((t) => (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => setTemplate(t.key)}
                    className={`rounded-2xl border-2 p-4 text-right transition-all ${
                      template === t.key
                        ? "border-brand-500 bg-brand-50"
                        : "border-ink-200 bg-white hover:border-brand-300"
                    }`}
                  >
                    <span className="flex items-center justify-between">
                      <span className="font-extrabold text-ink-900">{t.label}</span>
                      {template === t.key && <Check className="h-4 w-4 text-brand-600" />}
                    </span>
                    <span className="mt-1 block text-xs leading-5 text-ink-500">{t.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="الخط">
                <select className={inputCls} value={font} onChange={(e) => setFont(e.target.value as FontKey)}>
                  {FONTS.map((f) => (
                    <option key={f.key} value={f.key}>
                      {f.label}
                    </option>
                  ))}
                </select>
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="اللون الأساسي">
                  <input type="color" className="h-11 w-full cursor-pointer rounded-xl border border-ink-200 bg-white p-1.5" value={primary} onChange={(e) => setPrimary(e.target.value)} />
                </Field>
                <Field label="اللون الثانوي">
                  <input type="color" className="h-11 w-full cursor-pointer rounded-xl border border-ink-200 bg-white p-1.5" value={secondary} onChange={(e) => setSecondary(e.target.value)} />
                </Field>
              </div>
            </div>

            {/* معاينة مصغرة */}
            <div className="overflow-hidden rounded-2xl border border-ink-200">
              <div className="flex h-14 items-center gap-2 px-4" style={{ backgroundColor: primary }}>
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/20 text-xs font-extrabold text-white">
                  {name.charAt(0) || "م"}
                </span>
                <span className="text-sm font-extrabold text-white">{name || "اسم المتجر"}</span>
              </div>
              <div className="grid grid-cols-3 gap-3 bg-white p-4">
                {[0, 1, 2].map((i) => (
                  <div key={i}>
                    <div className="aspect-square rounded-lg" style={{ backgroundColor: `${primary}18` }} />
                    <div className="mt-2 h-2.5 w-4/5 rounded" style={{ backgroundColor: "var(--color-ink-100)" }} />
                    <div className="mt-1.5 h-2.5 w-3/5 rounded" style={{ backgroundColor: primary }} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* الأزرار */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => (step > 0 ? setStep(step - 1) : router.push("/admin/stores"))}
          className="flex items-center gap-2 rounded-xl border border-ink-200 bg-white px-5 py-2.5 text-sm font-bold text-ink-700 hover:bg-ink-50"
        >
          <ArrowRight className="h-4 w-4" />
          {step > 0 ? "السابق" : "إلغاء"}
        </button>

        {step < 2 ? (
          <button
            type="button"
            onClick={() => void next()}
            className="flex items-center gap-2 rounded-xl bg-brand-600 px-6 py-2.5 text-sm font-extrabold text-white shadow-sm hover:bg-brand-700"
          >
            التالي
            <ArrowLeft className="h-4 w-4" />
          </button>
        ) : (
          <button
            type="button"
            onClick={() => void submit()}
            disabled={saving}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-l from-emerald-500 to-emerald-400 px-6 py-2.5 text-sm font-extrabold text-white shadow-lg shadow-emerald-500/25 hover:opacity-90 disabled:opacity-60"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            إنشاء المتجر
          </button>
        )}
      </div>
    </div>
  );
}
