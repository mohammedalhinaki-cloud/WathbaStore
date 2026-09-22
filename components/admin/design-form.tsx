// معين — نموذج التصميم: قالب، خط، ألوان، ترتيب الأقسام
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowUp, ArrowDown, Loader2, Monitor } from "lucide-react";
import type { Store, StoreSettings, SectionKey } from "@/lib/types";
import { TEMPLATES, FONTS, SECTIONS } from "@/lib/types";
import { Card, Field, inputCls, PrimaryBtn } from "./ui";
import { FormAlerts } from "./use-api";

interface Props {
  store: Store;
  settings: StoreSettings;
}

export default function DesignForm({ store, settings }: Props) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [template, setTemplate] = useState(settings.template);
  const [font, setFont] = useState(settings.font);
  const [primary, setPrimary] = useState(settings.primaryColor);
  const [secondary, setSecondary] = useState(settings.secondaryColor);
  const [order, setOrder] = useState<SectionKey[]>(settings.sectionOrder);

  function move(i: number, dir: "up" | "down") {
    setOrder((prev) => {
      const next = [...prev];
      const j = dir === "up" ? i - 1 : i + 1;
      if (j < 0 || j >= next.length) return prev;
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  }

  async function save() {
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch(`/api/stores/${store.id}/design`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ template, font, primaryColor: primary, secondaryColor: secondary, sectionOrder: order }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "فشل الحفظ");
      setSuccess("تم حفظ التصميم — ستظهر التغييرات فورًا في المتجر");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "حدث خطأ");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-2">
        <Card>
          <h3 className="mb-5 font-extrabold text-ink-900">القالب والخط</h3>
          <div className="grid gap-3 sm:grid-cols-3">
            {TEMPLATES.map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => setTemplate(t.key)}
                className={`rounded-2xl border-2 p-4 text-right transition-all ${
                  template === t.key ? "border-brand-500 bg-brand-50" : "border-ink-200 bg-white hover:border-brand-300"
                }`}
              >
                <span className="font-extrabold text-ink-900">{t.label}</span>
                <span className="mt-1 block text-xs leading-5 text-ink-500">{t.desc}</span>
              </button>
            ))}
          </div>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <Field label="خط المتجر">
              <select className={inputCls} value={font} onChange={(e) => setFont(e.target.value as StoreSettings["font"])}>
                {FONTS.map((f) => (
                  <option key={f.key} value={f.key}>{f.label}</option>
                ))}
              </select>
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="اللون الأساسي">
                <div className="flex items-center gap-2">
                  <input type="color" className="h-11 w-14 cursor-pointer rounded-xl border border-ink-200 bg-white p-1" value={primary} onChange={(e) => setPrimary(e.target.value)} />
                  <input className={inputCls} dir="ltr" value={primary} onChange={(e) => setPrimary(e.target.value)} />
                </div>
              </Field>
              <Field label="اللون الثانوي">
                <div className="flex items-center gap-2">
                  <input type="color" className="h-11 w-14 cursor-pointer rounded-xl border border-ink-200 bg-white p-1" value={secondary} onChange={(e) => setSecondary(e.target.value)} />
                  <input className={inputCls} dir="ltr" value={secondary} onChange={(e) => setSecondary(e.target.value)} />
                </div>
              </Field>
            </div>
          </div>
        </Card>

        <Card>
          <h3 className="mb-2 font-extrabold text-ink-900">ترتيب أقسام الصفحة الرئيسية</h3>
          <p className="mb-4 text-xs text-ink-400">تحكم في ترتيب ظهور الأقسام أعلى المتجر</p>
          <div className="space-y-2">
            {order.map((s, i) => (
              <div key={s} className="flex items-center justify-between rounded-xl border border-ink-150 bg-ink-50/40 px-4 py-2.5">
                <span className="flex items-center gap-3">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-xs font-extrabold text-ink-500 ring-1 ring-ink-200">
                    {i + 1}
                  </span>
                  <span className="text-sm font-bold text-ink-700">{SECTIONS.find((x) => x.key === s)?.label ?? s}</span>
                </span>
                <span className="flex gap-1">
                  <button onClick={() => move(i, "up")} disabled={i === 0} className="rounded-lg p-1.5 text-ink-400 hover:bg-white hover:text-ink-700 disabled:opacity-30">
                    <ArrowUp className="h-4 w-4" />
                  </button>
                  <button onClick={() => move(i, "down")} disabled={i === order.length - 1} className="rounded-lg p-1.5 text-ink-400 hover:bg-white hover:text-ink-700 disabled:opacity-30">
                    <ArrowDown className="h-4 w-4" />
                  </button>
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* معاينة حية */}
      <div>
        <Card className="sticky top-6">
          <h3 className="mb-4 flex items-center gap-2 font-extrabold text-ink-900">
            <Monitor className="h-4 w-4 text-brand-600" />
            معاينة
          </h3>
          <div className="overflow-hidden rounded-2xl border border-ink-200 shadow-inner">
            <div className="flex h-12 items-center gap-2 px-3" style={{ backgroundColor: primary }}>
              <span className="flex h-6 w-6 items-center justify-center rounded-md bg-white/20 text-[10px] font-extrabold text-white">
                {store.name.charAt(0)}
              </span>
              <span className="truncate text-xs font-extrabold text-white">{store.name}</span>
            </div>
            {/* صورة الغلاف (البطل) تظهر في كل القوالب — بما فيها «بسيط» */}
            <div className="relative h-20" style={{ backgroundColor: primary }}>
              {store.coverUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={store.coverUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
              ) : (
                <div className="absolute inset-0 opacity-30 [background-image:radial-gradient(circle_at_30%_60%,white_1.5px,transparent_1.5px)] [background-size:18px_18px]" />
              )}
              <div className="absolute inset-0 bg-gradient-to-l from-black/60 to-transparent" />
              <div className="absolute bottom-3 right-3">
                <div className="h-2.5 w-20 rounded bg-white/80" />
                <div className="mt-1.5 h-2 w-28 rounded bg-white/50" />
                <div className="mt-2 h-4 w-14 rounded-md" style={{ backgroundColor: secondary }} />
              </div>
            </div>
            <div className={`grid gap-2.5 bg-white p-3 ${template === "classic" ? "grid-cols-1" : "grid-cols-2"}`}>
              {[0, 1, 2, 3].map((i) =>
                template === "classic" ? (
                  <div key={i} className="flex items-center gap-2">
                    <div className="h-9 w-9 rounded" style={{ backgroundColor: `${primary}20` }} />
                    <div className="flex-1">
                      <div className="h-2 w-3/4 rounded bg-ink-100" />
                      <div className="mt-1 h-2 w-1/3 rounded" style={{ backgroundColor: primary }} />
                    </div>
                  </div>
                ) : (
                  <div key={i}>
                    <div className={`rounded ${template === "minimal" ? "" : "rounded-lg"}`} style={{ aspectRatio: "1", backgroundColor: `${primary}15` }} />
                    <div className="mt-1.5 h-2 w-4/5 rounded bg-ink-100" />
                    <div className="mt-1 h-2 w-2/5 rounded" style={{ backgroundColor: primary }} />
                  </div>
                )
              )}
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <PrimaryBtn onClick={() => void save()} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              حفظ التصميم
            </PrimaryBtn>
          </div>
          <FormAlerts error={error} success={success} />
        </Card>
      </div>
    </div>
  );
}
