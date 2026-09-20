// ============================================================
// لوحة العميل — نموذج المظهر (حقوق مقيدة لبيانات متجره فقط)
// ============================================================

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import type { Store, StoreSettings } from "@/lib/types";
import { mainDomain } from "@/lib/constants";
import { Card, Field, inputCls, PrimaryBtn } from "@/components/admin/ui";
import { FormAlerts } from "@/components/admin/use-api";
import UploadField from "@/components/admin/upload-field";

interface Props {
  store: Store;
  settings: StoreSettings;
}

export default function ClientAppearanceForm({ store, settings }: Props) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [name, setName] = useState(store.name);
  const [whatsapp, setWhatsapp] = useState(store.whatsapp || settings.socialWhatsApp);
  const [description, setDescription] = useState(store.description);
  const [aboutText, setAboutText] = useState(settings.aboutText);
  const [instagram, setInstagram] = useState(settings.socialInstagram);
  const [snapchat, setSnapchat] = useState(settings.socialSnapchat);
  const [tiktok, setTiktok] = useState(settings.socialTiktok);
  const [logoUrl, setLogoUrl] = useState<string[]>(store.logoUrl ? [store.logoUrl] : []);
  const [coverUrl, setCoverUrl] = useState<string[]>(store.coverUrl ? [store.coverUrl] : []);
  const [primary, setPrimary] = useState(settings.primaryColor);
  const [secondary, setSecondary] = useState(settings.secondaryColor);

  async function save() {
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      // 1) بيانات المتجر (حقول العميل فقط)
      const r1 = await fetch(`/api/stores/${store.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          whatsapp,
          description,
          logoUrl: logoUrl[0] ?? null,
          coverUrl: coverUrl[0] ?? null,
        }),
      });
      const d1 = await r1.json();
      if (!r1.ok) throw new Error(d1.error ?? "فشل حفظ بيانات المتجر");

      // 2) الإعدادات (واتساب + روابط + عن المتجر)
      const r2 = await fetch(`/api/stores/${store.id}/settings`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          aboutText,
          socialWhatsApp: whatsapp,
          socialInstagram: instagram,
          socialSnapchat: snapchat,
          socialTiktok: tiktok,
        }),
      });
      const d2 = await r2.json();
      if (!r2.ok) throw new Error(d2.error ?? "فشل حفظ الإعدادات");

      // 3) الألوان
      const r3 = await fetch(`/api/stores/${store.id}/design`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ primaryColor: primary, secondaryColor: secondary }),
      });
      const d3 = await r3.json();
      if (!r3.ok) throw new Error(d3.error ?? "فشل حفظ الألوان");

      setSuccess("تم حفظ التغييرات — ستظهر في متجرك فورًا");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "حدث خطأ");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-5">
      <FormAlerts error={error} success={success} />
      <Card>
        <h3 className="mb-4 font-extrabold text-ink-900">بيانات المتجر</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="اسم المتجر">
            <input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} />
          </Field>
          <Field label="واتساب الطلبات" hint={`على ${store.subdomain}.${mainDomain()}`}>
            <input className={inputCls} dir="ltr" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} />
          </Field>
          <div className="sm:col-span-2">
            <Field label="وصف المتجر">
              <input className={inputCls} value={description} onChange={(e) => setDescription(e.target.value)} />
            </Field>
          </div>
          <div className="sm:col-span-2">
            <Field label="نص «عن المتجر»">
              <textarea className={inputCls} rows={2} value={aboutText} onChange={(e) => setAboutText(e.target.value)} />
            </Field>
          </div>
        </div>
      </Card>

      <Card>
        <h3 className="mb-4 font-extrabold text-ink-900">الشعارات والصور</h3>
        <div className="grid gap-5 sm:grid-cols-2">
          <UploadField storeId={store.id} folder="logo" label="الشعار" value={logoUrl} onChange={(u) => setLogoUrl(u.slice(-1))} />
          <UploadField storeId={store.id} folder="cover" label="صورة الغلاف" value={coverUrl} onChange={(u) => setCoverUrl(u.slice(-1))} />
        </div>
      </Card>

      <Card>
        <h3 className="mb-4 font-extrabold text-ink-900">روابط التواصل (الفوتر)</h3>
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
        <h3 className="mb-4 font-extrabold text-ink-900">ألوان المتجر</h3>
        <div className="grid grid-cols-2 gap-4">
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
      </Card>

      <div className="flex justify-end">
        <PrimaryBtn onClick={() => void save()} disabled={saving} className="px-8">
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          حفظ التغييرات
        </PrimaryBtn>
      </div>
    </div>
  );
}
