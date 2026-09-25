// ============================================================
// معون — نموذج بيانات المتجر (المالك): العميل + الواتساب + الشعارات
// ============================================================

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import type { Store, StoreSettings } from "@/lib/types";
import { mainDomain } from "@/lib/constants";
import { Card, Field, inputCls, PrimaryBtn } from "./ui";
import { FormAlerts } from "./use-api";
import UploadField from "./upload-field";

interface Props {
  store: Store;
  settings: StoreSettings;
}

export default function StoreInfoForm({ store, settings }: Props) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [name, setName] = useState(store.name);
  const [ownerName, setOwnerName] = useState(store.ownerName);
  const [ownerPhone, setOwnerPhone] = useState(store.ownerPhone);
  const [ownerEmail, setOwnerEmail] = useState(store.ownerEmail);
  const [whatsapp, setWhatsapp] = useState(store.whatsapp || settings.socialWhatsApp);
  const [description, setDescription] = useState(store.description);
  const [logoUrl, setLogoUrl] = useState<string[]>(store.logoUrl ? [store.logoUrl] : []);
  const [coverUrl, setCoverUrl] = useState<string[]>(store.coverUrl ? [store.coverUrl] : []);
  const [aboutText, setAboutText] = useState(settings.aboutText);

  async function save() {
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch(`/api/stores/${store.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          ownerName,
          ownerPhone,
          ownerEmail,
          whatsapp,
          description,
          logoUrl: logoUrl[0] ?? null,
          coverUrl: coverUrl[0] ?? null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "فشل الحفظ");

      const res2 = await fetch(`/api/stores/${store.id}/settings`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ aboutText, socialWhatsApp: whatsapp }),
      });
      const data2 = await res2.json();
      if (!res2.ok) throw new Error(data2.error ?? "فشل حفظ الإعدادات");

      setSuccess("تم حفظ بيانات المتجر");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "حدث خطأ");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <h3 className="mb-5 text-lg font-extrabold text-ink-900">بيانات المتجر</h3>
      <FormAlerts error={error} success={success} />
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <Field label="اسم المتجر" required>
          <input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
        <Field label="رقم واتساب الطلبات" hint={`يظهر زر الطلب بهذا الرقم — ${store.subdomain}.${mainDomain()}`}>
          <input className={inputCls} dir="ltr" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="9665xxxxxxxx" />
        </Field>
        <Field label="اسم العميل">
          <input className={inputCls} value={ownerName} onChange={(e) => setOwnerName(e.target.value)} />
        </Field>
        <Field label="جوال العميل">
          <input className={inputCls} dir="ltr" value={ownerPhone} onChange={(e) => setOwnerPhone(e.target.value)} />
        </Field>
        <Field label="بريد العميل" hint="اسم دخول لوحة المتجر بعد التسليم">
          <input className={inputCls} dir="ltr" value={ownerEmail} onChange={(e) => setOwnerEmail(e.target.value)} />
        </Field>
        <Field label="وصف المتجر">
          <input className={inputCls} value={description} onChange={(e) => setDescription(e.target.value)} />
        </Field>
        <div className="sm:col-span-2">
          <Field label="نص «عن المتجر» (يظهر في الغلاف والفوتر)">
            <textarea className={inputCls} rows={2} value={aboutText} onChange={(e) => setAboutText(e.target.value)} />
          </Field>
        </div>
        <UploadField
          storeId={store.id}
          folder="logo"
          label="شعار المتجر"
          value={logoUrl}
          onChange={(urls) => setLogoUrl(urls.slice(-1))}
          hint="مربع صغير، يظهر في الهيدر والفوتر"
        />
        <UploadField
          storeId={store.id}
          folder="cover"
          label="صورة الغلاف (البطل)"
          value={coverUrl}
          onChange={(urls) => setCoverUrl(urls.slice(-1))}
          hint="عريضة، تظهر أعلى صفحة المتجر"
        />
      </div>
      <div className="mt-6 flex justify-end">
        <PrimaryBtn onClick={() => void save()} disabled={saving}>
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          حفظ البيانات
        </PrimaryBtn>
      </div>
    </Card>
  );
}
