// ============================================================
// وثبة — إعدادات المتجر: روابط التواصل + رابط المطور
// (رابط المطور = DEVELOPER_URL — يغيّر توقيع «تطوير: WathbaStore»)
// ============================================================

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import type { Store, StoreSettings } from "@/lib/types";
import { developerUrl } from "@/lib/constants";
import { Card, Field, inputCls, PrimaryBtn } from "./ui";
import { FormAlerts } from "./use-api";

interface Props {
  store: Store;
  settings: StoreSettings;
}

export default function StoreSettingsForm({ store, settings }: Props) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [instagram, setInstagram] = useState(settings.socialInstagram);
  const [snapchat, setSnapchat] = useState(settings.socialSnapchat);
  const [tiktok, setTiktok] = useState(settings.socialTiktok);
  const [whatsapp, setWhatsapp] = useState(settings.socialWhatsApp || store.whatsapp);
  const [devUrl, setDevUrl] = useState(developerUrl(settings.developerUrl));

  async function save() {
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch(`/api/stores/${store.id}/settings`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          socialInstagram: instagram.trim(),
          socialSnapchat: snapchat.trim(),
          socialTiktok: tiktok.trim(),
          socialWhatsApp: whatsapp.trim(),
          developerUrl: devUrl.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "فشل الحفظ");
      setSuccess("تم حفظ الإعدادات");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "حدث خطأ");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <Card>
        <h3 className="mb-1 font-extrabold text-ink-900">روابط التواصل الاجتماعي</h3>
        <p className="mb-5 text-xs text-ink-400">
          تظهر كأيقونات حقيقية قابلة للضغط في فوتر المتجر
        </p>
        <FormAlerts error={error} success={success} />
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label="انستقرام" hint="اسم المستخدم أو الرابط الكامل">
            <input className={inputCls} dir="ltr" value={instagram} onChange={(e) => setInstagram(e.target.value)} placeholder="@rshaf.cafe" />
          </Field>
          <Field label="سناب شات" hint="اسم المستخدم أو الرابط الكامل">
            <input className={inputCls} dir="ltr" value={snapchat} onChange={(e) => setSnapchat(e.target.value)} placeholder="rshaf_cafe" />
          </Field>
          <Field label="تيك توك" hint="اسم المستخدم أو الرابط الكامل">
            <input className={inputCls} dir="ltr" value={tiktok} onChange={(e) => setTiktok(e.target.value)} placeholder="@rshaf.cafe" />
          </Field>
          <Field label="واتساب" hint="رقم الواتساب مع رمز الدولة">
            <input className={inputCls} dir="ltr" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="9665xxxxxxxx" />
          </Field>
        </div>
      </Card>

      <Card>
        <h3 className="mb-1 font-extrabold text-ink-900">رابط الموقع المطور</h3>
        <p className="mb-5 text-xs text-ink-400">
          يظهر أسفل المتجر: «تطوير: WathbaStore» — الرابط يُفتح في تبويب جديد.
          (قيمة واحدة تُغيَّر هنا أو عبر متغير DEVELOPER_URL)
        </p>
        <Field label="DEVELOPER_URL">
          <input className={inputCls} dir="ltr" value={devUrl} onChange={(e) => setDevUrl(e.target.value)} />
        </Field>
        <div className="mt-6 flex justify-end">
          <PrimaryBtn onClick={() => void save()} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            حفظ الإعدادات
          </PrimaryBtn>
        </div>
      </Card>
    </div>
  );
}
