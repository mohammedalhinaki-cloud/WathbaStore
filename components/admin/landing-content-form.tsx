// ============================================================
// معون — تحرير محتوى الموقع العام (الغلاف، الإحصائيات، الأقسام...)
// يحفظ عبر PATCH /api/site ثم تُعرض القيم فورًا في الموقع العام.
// ============================================================

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp, Eye, EyeOff, ExternalLink, Loader2, Plus, RotateCcw, Save, Trash2 } from "lucide-react";
import {
  DEFAULT_LANDING_CONTENT,
  LANDING_LIMITS,
  LANDING_SECTION_LABELS,
  LANDING_TOGGLE_LABELS,
  type LandingSectionKey,
  type LandingToggles,
  type LandingContent,
  type LandingSectionHead,
  type LandingTitleDesc,
} from "@/lib/types";
import { Card, Field, inputCls, PrimaryBtn, GhostBtn } from "./ui";
import { FormAlerts } from "./use-api";

const TABS = [
  { key: "sections", label: "الأقسام والإظهار" },
  { key: "hero", label: "الغلاف" },
  { key: "stats", label: "الإحصائيات" },
  { key: "about", label: "عن معون" },
  { key: "services", label: "الخدمات" },
  { key: "heads", label: "ترويسات الأقسام" },
  { key: "nav", label: "التنقل" },
  { key: "cta", label: "الدعوة والتذييل" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

const HEAD_LABELS: { key: keyof LandingContent["heads"]; label: string; hint: string }[] = [
  { key: "services", label: "قسم الخدمات", hint: "#services" },
  { key: "portfolio", label: "قسم الأعمال", hint: "#portfolio" },
  { key: "pricing", label: "قسم الأسعار", hint: "#pricing" },
  { key: "offers", label: "قسم العروض", hint: "#offers" },
  { key: "features", label: "قسم المميزات", hint: "يُدار محتواه من الإعدادات" },
  { key: "faq", label: "قسم الأسئلة الشائعة", hint: "تُدار الأسئلة من الإعدادات" },
];

function clone<T>(v: T): T {
  return JSON.parse(JSON.stringify(v)) as T;
}

export default function LandingContentForm({ initial }: { initial: LandingContent }) {
  const router = useRouter();
  const [tab, setTab] = useState<TabKey>("sections");
  const [data, setData] = useState<LandingContent>(() => clone(initial));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  function patch<K extends keyof LandingContent>(key: K, val: LandingContent[K]) {
    setData((d) => ({ ...d, [key]: val }));
  }

  async function save() {
    setBusy(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch("/api/site", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ landing: data }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error ?? "فشل الحفظ");
      setSuccess("تم حفظ محتوى الموقع — يظهر الآن في الصفحة العامة");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "حدث خطأ");
    } finally {
      setBusy(false);
    }
  }

  function resetDefaults() {
    if (!window.confirm("استعادة كل النصوص الافتراضية للموقع؟ (لن يُحفظ حتى تضغط حفظ)")) return;
    setData(clone(DEFAULT_LANDING_CONTENT));
    setSuccess("تمت الاستعادة محليًا — اضغط «حفظ» لاعتمادها في الموقع");
  }

  return (
    <div className="space-y-5">
      <FormAlerts error={error} success={success} />

      {/* التبويبات */}
      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`rounded-xl px-4 py-2.5 text-sm font-bold transition-colors ${
              tab === t.key
                ? "bg-ink-950 text-white shadow"
                : "border border-ink-200 bg-white text-ink-600 hover:bg-ink-50"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "sections" && (
        <SectionsTab
          sections={data.sections}
          toggles={data.toggles}
          onSections={(v) => patch("sections", v)}
          onToggles={(v) => patch("toggles", v)}
        />
      )}
      {tab === "hero" && <HeroTab data={data.hero} onChange={(v) => patch("hero", v)} />}
      {tab === "stats" && <StatsTab stats={data.stats} onChange={(v) => patch("stats", v)} />}
      {tab === "about" && <AboutTab data={data.about} onChange={(v) => patch("about", v)} />}
      {tab === "services" && (
        <TitleDescList
          title="بطاقات الخدمات"
          items={data.services}
          max={LANDING_LIMITS.services}
          onChange={(v) => patch("services", v)}
        />
      )}
      {tab === "heads" && <HeadsTab heads={data.heads} onChange={(v) => patch("heads", v)} />}
      {tab === "nav" && <NavTab data={data.nav} onChange={(v) => patch("nav", v)} />}
      {tab === "cta" && (
        <CtaTab cta={data.cta} footer={data.footer} onCta={(v) => patch("cta", v)} onFooter={(v) => patch("footer", v)} />
      )}

      {/* شريط الحفظ */}
      <Card className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2">
          <GhostBtn onClick={resetDefaults} disabled={busy}>
            <RotateCcw className="h-4 w-4" />
            استعادة الافتراضي
          </GhostBtn>
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-ink-200 bg-white px-4 py-2.5 text-sm font-bold text-ink-700 transition-colors hover:bg-ink-50"
          >
            <ExternalLink className="h-4 w-4" />
            معاينة الموقع
          </a>
        </div>
        <PrimaryBtn onClick={() => void save()} disabled={busy} className="px-8">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          حفظ المحتوى
        </PrimaryBtn>
      </Card>
    </div>
  );
}

// ------------------------------------------------------------
// تبويب الغلاف
// ------------------------------------------------------------
function HeroTab({
  data,
  onChange,
}: {
  data: LandingContent["hero"];
  onChange: (v: LandingContent["hero"]) => void;
}) {
  const set = (k: keyof typeof data, v: string) => onChange({ ...data, [k]: v });
  return (
    <Card>
      <h3 className="mb-4 font-extrabold text-ink-900">قسم الغلاف (أعلى الصفحة)</h3>
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="العنوان الرئيسي">
            <input className={inputCls} value={data.title} onChange={(e) => set("title", e.target.value)} />
          </Field>
          <Field label="الشطر الملوّن (السطر الثاني)" hint="يظهر بتدرّج برتقالي">
            <input className={inputCls} value={data.accent} onChange={(e) => set("accent", e.target.value)} />
          </Field>
        </div>
        <Field label="الوصف أسفل العنوان">
          <textarea className={inputCls} rows={3} value={data.subtitle} onChange={(e) => set("subtitle", e.target.value)} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="زر الواتساب">
            <input className={inputCls} value={data.primaryBtn} onChange={(e) => set("primaryBtn", e.target.value)} />
          </Field>
          <Field label="الزر الثاني">
            <input className={inputCls} value={data.secondaryBtn} onChange={(e) => set("secondaryBtn", e.target.value)} />
          </Field>
        </div>
        <Field label="صورة الغلاف" hint="مسار محلي مثل /seed/hero.jpg أو رابط صورة خارجي كامل https://…">
          <input className={inputCls} dir="ltr" value={data.imageUrl} onChange={(e) => set("imageUrl", e.target.value)} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="بطاقة التسليم — العنوان" hint="الشارة العائمة أسفل الصورة">
            <input className={inputCls} value={data.badgeTitle} onChange={(e) => set("badgeTitle", e.target.value)} />
          </Field>
          <Field label="بطاقة التسليم — الوصف">
            <input className={inputCls} value={data.badgeDesc} onChange={(e) => set("badgeDesc", e.target.value)} />
          </Field>
        </div>
      </div>
    </Card>
  );
}

// ------------------------------------------------------------
// تبويب الإحصائيات
// ------------------------------------------------------------
function StatsTab({
  stats,
  onChange,
}: {
  stats: LandingContent["stats"];
  onChange: (v: LandingContent["stats"]) => void;
}) {
  const set = (i: number, k: "value" | "suffix" | "unit" | "label", v: string | number) =>
    onChange(stats.map((s, j) => (j === i ? { ...s, [k]: v } : s)));
  return (
    <Card>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-extrabold text-ink-900">الإحصائيات ({stats.length}/{LANDING_LIMITS.stats})</h3>
        {stats.length < LANDING_LIMITS.stats && (
          <PrimaryBtn onClick={() => onChange([...stats, { value: 0, suffix: "", unit: "", label: "" }])}>
            <Plus className="h-4 w-4" />
            إضافة
          </PrimaryBtn>
        )}
      </div>
      <div className="space-y-3">
        {stats.map((s, i) => (
          <div key={i} className="grid gap-2 rounded-xl border border-ink-100 p-3 sm:grid-cols-[110px_70px_90px_1fr_auto]">
            <Field label="الرقم">
              <input
                className={inputCls}
                type="number"
                min={0}
                max={9999999}
                dir="ltr"
                value={s.value}
                onChange={(e) => set(i, "value", Math.max(0, Math.min(9999999, Number(e.target.value) || 0)))}
              />
            </Field>
            <Field label="رمز" hint="+ أو %">
              <input className={inputCls} dir="ltr" value={s.suffix} onChange={(e) => set(i, "suffix", e.target.value)} placeholder="+" />
            </Field>
            <Field label="وحدة" hint="ريال/أيام">
              <input className={inputCls} value={s.unit} onChange={(e) => set(i, "unit", e.target.value)} placeholder="ريال" />
            </Field>
            <Field label="الوصف">
              <input className={inputCls} value={s.label} onChange={(e) => set(i, "label", e.target.value)} placeholder="الوصف أسفل الرقم" />
            </Field>
            <button
              onClick={() => stats.length > 1 && onChange(stats.filter((_, j) => j !== i))}
              disabled={stats.length <= 1}
              className="self-end rounded-lg p-2.5 text-rose-500 hover:bg-rose-50 disabled:opacity-30"
              aria-label="حذف"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
      <p className="mt-3 text-xs text-ink-400">الأرقام تعدّ تلقائيًا من صفر حتى قيمتها عند ظهورها للزائر.</p>
    </Card>
  );
}

// ------------------------------------------------------------
// تبويب عن معون
// ------------------------------------------------------------
function AboutTab({
  data,
  onChange,
}: {
  data: LandingContent["about"];
  onChange: (v: LandingContent["about"]) => void;
}) {
  return (
    <div className="space-y-5">
      <Card>
        <h3 className="mb-4 font-extrabold text-ink-900">قسم «عن معون»</h3>
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="الشارة الصغيرة">
              <input className={inputCls} value={data.badge} onChange={(e) => onChange({ ...data, badge: e.target.value })} />
            </Field>
            <Field label="العنوان">
              <input className={inputCls} value={data.title} onChange={(e) => onChange({ ...data, title: e.target.value })} />
            </Field>
          </div>
          <p className="rounded-xl bg-ink-50 px-3.5 py-2.5 text-xs text-ink-500">
            الفقرة التعريفية تُحرَّر من صفحة «الإعدادات» ← نبذة عن معون (وتظهر أيضًا في التذييل).
          </p>
        </div>
      </Card>

      <Card>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-extrabold text-ink-900">النقاط ({data.bullets.length}/{LANDING_LIMITS.aboutBullets})</h3>
          {data.bullets.length < LANDING_LIMITS.aboutBullets && (
            <PrimaryBtn onClick={() => onChange({ ...data, bullets: [...data.bullets, ""] })}>
              <Plus className="h-4 w-4" />
              إضافة
            </PrimaryBtn>
          )}
        </div>
        <div className="space-y-2">
          {data.bullets.map((b, i) => (
            <div key={i} className="flex gap-2">
              <input
                className={`${inputCls} flex-1`}
                value={b}
                onChange={(e) =>
                  onChange({ ...data, bullets: data.bullets.map((x, j) => (j === i ? e.target.value : x)) })
                }
                placeholder="نص النقطة"
              />
              <button
                onClick={() => data.bullets.length > 1 && onChange({ ...data, bullets: data.bullets.filter((_, j) => j !== i) })}
                disabled={data.bullets.length <= 1}
                className="rounded-lg px-3 text-rose-500 hover:bg-rose-50 disabled:opacity-30"
                aria-label="حذف"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs text-ink-400">
          تلميح: اكتب <code dir="ltr" className="rounded bg-ink-100 px-1">{"{domain}"}</code> ليُستبدل تلقائيًا بالنطاق
          الفعلي (maaoun.com).
        </p>
      </Card>

      <TitleDescList
        title="البطاقات الأربع"
        items={data.cards}
        max={LANDING_LIMITS.aboutCards}
        onChange={(cards) => onChange({ ...data, cards })}
      />
    </div>
  );
}

// ------------------------------------------------------------
// قائمة عنوان + وصف (خدمات / بطاقات)
// ------------------------------------------------------------
function TitleDescList({
  title,
  items,
  max,
  onChange,
}: {
  title: string;
  items: LandingTitleDesc[];
  max: number;
  onChange: (v: LandingTitleDesc[]) => void;
}) {
  return (
    <Card>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-extrabold text-ink-900">
          {title} ({items.length}/{max})
        </h3>
        {items.length < max && (
          <PrimaryBtn onClick={() => onChange([...items, { title: "", desc: "" }])}>
            <Plus className="h-4 w-4" />
            إضافة
          </PrimaryBtn>
        )}
      </div>
      <div className="space-y-3">
        {items.map((f, i) => (
          <div key={i} className="space-y-2 rounded-xl border border-ink-100 p-3">
            <div className="flex gap-2">
              <input
                className={`${inputCls} flex-1`}
                placeholder="العنوان"
                value={f.title}
                onChange={(e) => onChange(items.map((x, j) => (j === i ? { ...x, title: e.target.value } : x)))}
              />
              <button
                onClick={() => items.length > 1 && onChange(items.filter((_, j) => j !== i))}
                disabled={items.length <= 1}
                className="rounded-lg px-3 text-rose-500 hover:bg-rose-50 disabled:opacity-30"
                aria-label="حذف"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
            <textarea
              className={`${inputCls} w-full`}
              rows={2}
              placeholder="الوصف"
              value={f.desc}
              onChange={(e) => onChange(items.map((x, j) => (j === i ? { ...x, desc: e.target.value } : x)))}
            />
          </div>
        ))}
      </div>
    </Card>
  );
}

// ------------------------------------------------------------
// تبويب ترويسات الأقسام
// ------------------------------------------------------------
function HeadsTab({
  heads,
  onChange,
}: {
  heads: LandingContent["heads"];
  onChange: (v: LandingContent["heads"]) => void;
}) {
  const set = (k: keyof typeof heads, f: keyof LandingSectionHead, v: string) =>
    onChange({ ...heads, [k]: { ...heads[k], [f]: v } });
  return (
    <Card>
      <h3 className="mb-1 font-extrabold text-ink-900">ترويسات الأقسام</h3>
      <p className="mb-4 text-xs text-ink-400">الشارة والعنوان والسطر الفرعي أعلى كل قسم في الصفحة.</p>
      <div className="space-y-3">
        {HEAD_LABELS.map(({ key, label, hint }) => (
          <details key={key} className="rounded-xl border border-ink-100" open={key === "services"}>
            <summary className="cursor-pointer px-4 py-3 text-sm font-bold text-ink-800">
              {label} <span className="mr-2 text-xs font-normal text-ink-400">{hint}</span>
            </summary>
            <div className="space-y-3 border-t border-ink-100 p-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="الشارة">
                  <input className={inputCls} value={heads[key].badge} onChange={(e) => set(key, "badge", e.target.value)} />
                </Field>
                <Field label="العنوان">
                  <input className={inputCls} value={heads[key].title} onChange={(e) => set(key, "title", e.target.value)} />
                </Field>
              </div>
              <Field label="السطر الفرعي">
                <input className={inputCls} value={heads[key].sub} onChange={(e) => set(key, "sub", e.target.value)} />
              </Field>
            </div>
          </details>
        ))}
      </div>
    </Card>
  );
}

// ------------------------------------------------------------
// تبويب التنقل
// ------------------------------------------------------------
function NavTab({
  data,
  onChange,
}: {
  data: LandingContent["nav"];
  onChange: (v: LandingContent["nav"]) => void;
}) {
  return (
    <Card>
      <h3 className="mb-4 font-extrabold text-ink-900">شريط التنقل العلوي</h3>
      <div className="space-y-4">
        <div className="space-y-2">
          {data.links.map((l, i) => (
            <div key={l.href} className="flex items-center gap-2">
              <span dir="ltr" className="w-28 shrink-0 rounded-lg bg-ink-50 px-2 py-2.5 text-center text-xs font-bold text-ink-400">
                {l.href}
              </span>
              <input
                className={`${inputCls} flex-1`}
                value={l.label}
                onChange={(e) =>
                  onChange({ ...data, links: data.links.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)) })
                }
                placeholder="اسم الرابط"
              />
            </div>
          ))}
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="زر «ابدأ مشروعك» (سطح المكتب)">
            <input className={inputCls} value={data.cta} onChange={(e) => onChange({ ...data, cta: e.target.value })} />
          </Field>
          <Field label="زر الواتساب (قائمة الجوال)">
            <input className={inputCls} value={data.ctaMobile} onChange={(e) => onChange({ ...data, ctaMobile: e.target.value })} />
          </Field>
        </div>
      </div>
    </Card>
  );
}

// ------------------------------------------------------------
// تبويب الدعوة الأخيرة + التذييل
// ------------------------------------------------------------
function CtaTab({
  cta,
  footer,
  onCta,
  onFooter,
}: {
  cta: LandingContent["cta"];
  footer: LandingContent["footer"];
  onCta: (v: LandingContent["cta"]) => void;
  onFooter: (v: LandingContent["footer"]) => void;
}) {
  return (
    <div className="space-y-5">
      <Card>
        <h3 className="mb-4 font-extrabold text-ink-900">الدعوة الأخيرة (الصندوق البرتقالي)</h3>
        <div className="space-y-4">
          <Field label="العنوان">
            <input className={inputCls} value={cta.title} onChange={(e) => onCta({ ...cta, title: e.target.value })} />
          </Field>
          <Field label="الوصف">
            <textarea className={inputCls} rows={2} value={cta.desc} onChange={(e) => onCta({ ...cta, desc: e.target.value })} />
          </Field>
          <Field label="نص الزر">
            <input className={inputCls} value={cta.button} onChange={(e) => onCta({ ...cta, button: e.target.value })} />
          </Field>
        </div>
      </Card>
      <Card>
        <h3 className="mb-4 font-extrabold text-ink-900">التذييل</h3>
        <Field label="السطر أسفل الشعار" hint="افتراضيًا: متجرك يبدأ من هنا">
          <input className={inputCls} value={footer.tagline} onChange={(e) => onFooter({ tagline: e.target.value })} />
        </Field>
      </Card>
    </div>
  );
}

// ------------------------------------------------------------
// تبويب الأقسام: إخفاء/إظهار وترتيب كل قسم + عناصر فرعية
// ------------------------------------------------------------
function SectionsTab({
  sections,
  toggles,
  onSections,
  onToggles,
}: {
  sections: LandingContent["sections"];
  toggles: LandingToggles;
  onSections: (v: LandingContent["sections"]) => void;
  onToggles: (v: LandingToggles) => void;
}) {
  const hidden = new Set(sections.hidden);
  const toggleHidden = (k: LandingSectionKey) =>
    onSections({
      ...sections,
      hidden: hidden.has(k) ? sections.hidden.filter((x) => x !== k) : [...sections.hidden, k],
    });
  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= sections.order.length) return;
    const order = [...sections.order];
    [order[i], order[j]] = [order[j], order[i]];
    onSections({ ...sections, order });
  };
  return (
    <div className="space-y-5">
      <Card>
        <h3 className="mb-1 font-extrabold text-ink-900">أقسام الصفحة الرئيسية</h3>
        <p className="mb-4 text-xs text-ink-400">
          أخفِ أي قسم بالكامل أو غيّر ترتيبه. الغلاف يبقى أعلى الصفحة دائمًا. القسم المخفي يُحذف أيضًا من روابط
          التنقل والتذييل.
        </p>
        <div className="space-y-2">
          {sections.order.map((k, i) => {
            const off = hidden.has(k);
            return (
              <div
                key={k}
                className={`flex items-center gap-2 rounded-xl border p-3 ${
                  off ? "border-ink-100 bg-ink-50 opacity-60" : "border-ink-200 bg-white"
                }`}
              >
                <span className="w-6 text-center text-xs font-bold text-ink-400">{i + 1}</span>
                <span className="flex-1 text-sm font-bold text-ink-800">{LANDING_SECTION_LABELS[k]}</span>
                <button onClick={() => move(i, -1)} disabled={i === 0} className="rounded-lg p-2 text-ink-500 hover:bg-ink-100 disabled:opacity-30" aria-label="للأعلى">
                  <ArrowUp className="h-4 w-4" />
                </button>
                <button onClick={() => move(i, 1)} disabled={i === sections.order.length - 1} className="rounded-lg p-2 text-ink-500 hover:bg-ink-100 disabled:opacity-30" aria-label="للأسفل">
                  <ArrowDown className="h-4 w-4" />
                </button>
                <button
                  onClick={() => toggleHidden(k)}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold ${
                    off ? "bg-ink-200 text-ink-600" : "bg-emerald-50 text-emerald-700"
                  }`}
                >
                  {off ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  {off ? "مخفي" : "ظاهر"}
                </button>
              </div>
            );
          })}
        </div>
      </Card>

      <Card>
        <h3 className="mb-1 font-extrabold text-ink-900">عناصر فرعية</h3>
        <p className="mb-4 text-xs text-ink-400">تحكّم بإظهار أجزاء محددة داخل الأقسام.</p>
        <div className="grid gap-2 sm:grid-cols-2">
          {(Object.keys(LANDING_TOGGLE_LABELS) as (keyof LandingToggles)[]).map((k) => (
            <label key={k} className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-ink-100 px-3.5 py-3 text-sm font-semibold text-ink-700 hover:bg-ink-50">
              {LANDING_TOGGLE_LABELS[k]}
              <input
                type="checkbox"
                className="h-5 w-5 accent-orange-600"
                checked={toggles[k]}
                onChange={(e) => onToggles({ ...toggles, [k]: e.target.checked })}
              />
            </label>
          ))}
        </div>
      </Card>
    </div>
  );
}
