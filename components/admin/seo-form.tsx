// ============================================================
// معين — نموذج SEO المستقل لكل متجر
// ============================================================

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Globe, Loader2, Search } from "lucide-react";
import type { Store, StoreSettings } from "@/lib/types";
import { mainDomain } from "@/lib/constants";
import { Card, Field, inputCls, PrimaryBtn } from "./ui";
import { FormAlerts } from "./use-api";

interface Props {
  store: Store;
  settings: StoreSettings;
  canonicalBase: string;
}

export default function SeoForm({ store, settings, canonicalBase }: Props) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [title, setTitle] = useState(settings.seoTitle || store.name);
  const [desc, setDesc] = useState(settings.seoDescription || store.description);
  const [keywords, setKeywords] = useState(settings.seoKeywords);
  const [ogImage, setOgImage] = useState(settings.seoOgImage || store.coverUrl || "");
  const [favicon, setFavicon] = useState(settings.seoFavicon || store.logoUrl || "");
  const [canonical, setCanonical] = useState(settings.seoCanonical || canonicalBase);

  async function save() {
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch(`/api/stores/${store.id}/seo`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          seoTitle: title.trim(),
          seoDescription: desc.trim(),
          seoKeywords: keywords.trim(),
          seoOgImage: ogImage.trim(),
          seoFavicon: favicon.trim(),
          seoCanonical: canonical.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "فشل الحفظ");
      setSuccess("تم حفظ إعدادات SEO");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "حدث خطأ");
    } finally {
      setSaving(false);
    }
  }

  const url = `${canonicalBase}/`;

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <Card className="lg:col-span-2">
        <h3 className="mb-5 font-extrabold text-ink-900">البيانات الوصفية</h3>
        <FormAlerts error={error} success={success} />
        <div className="mt-4 space-y-4">
          <Field label="عنوان الصفحة (Title)" hint={`${title.length}/60 حرف — يظهر في نتائج البحث وتبويب المتصفح`}>
            <input className={inputCls} value={title} onChange={(e) => setTitle(e.target.value)} placeholder={`كافيه رشف | القهوة والحلويات`} />
          </Field>
          <Field label="وصف الصفحة (Meta Description)" hint={`${desc.length}/160 حرف — يظهر أسفل العنوان في نتائج البحث`}>
            <textarea className={inputCls} rows={3} value={desc} onChange={(e) => setDesc(e.target.value)} />
          </Field>
          <Field label="الكلمات المفتاحية" hint="افصلها بفواصل">
            <input className={inputCls} value={keywords} onChange={(e) => setKeywords(e.target.value)} placeholder="قهوة, لاتيه, حلويات" />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="صورة Open Graph" hint="تظهر عند مشاركة الرابط">
              <input className={inputCls} dir="ltr" value={ogImage} onChange={(e) => setOgImage(e.target.value)} placeholder={store.coverUrl || ""} />
            </Field>
            <Field label="Favicon">
              <input className={inputCls} dir="ltr" value={favicon} onChange={(e) => setFavicon(e.target.value)} placeholder={store.logoUrl || ""} />
            </Field>
          </div>
          <Field label="Canonical URL" hint="اتركه افتراضيًا إلا لرغبة خاصة">
            <input className={inputCls} dir="ltr" value={canonical} onChange={(e) => setCanonical(e.target.value)} />
          </Field>
        </div>
        <div className="mt-6 flex justify-end">
          <PrimaryBtn onClick={() => void save()} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            حفظ SEO
          </PrimaryBtn>
        </div>
      </Card>

      {/* معاينة نتيجة البحث */}
      <Card>
        <h3 className="mb-4 flex items-center gap-2 font-extrabold text-ink-900">
          <Search className="h-4 w-4 text-brand-600" />
          معاينة نتيجة البحث
        </h3>
        <div className="rounded-2xl border border-ink-200 bg-white p-4 shadow-sm">
          <p className="text-xs text-emerald-700" dir="ltr">{url}</p>
          <p className="mt-1 truncate text-lg text-blue-700">{title || "عنوان المتجر"}</p>
          <p className="mt-1 line-clamp-3 text-sm leading-6 text-ink-500">
            {desc || "وصف المتجر يظهر هنا… أضف وصفًا محسنًا لمحركات البحث."}
          </p>
        </div>
        <p className="mt-4 flex items-center gap-1.5 text-xs text-ink-400">
          <Globe className="h-3.5 w-3.5" />
          SEO مستقل لكل متجر على نطاقه الفرعي
        </p>
      </Card>
    </div>
  );
}
