"use client";
import { useEffect, useState } from "react";
import { waChatLink } from "@/lib/wa";
import { Card, PrimaryBtn } from "./ui";

export default function SetupLinkPanel({ storeId, phone, name }: { storeId: string; phone: string; name: string }) {
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  async function load() {
    setBusy(true); setError("");
    try {
      const res = await fetch(`/api/stores/${storeId}/setup-link`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setUrl(data.url);
    } catch (e) { setError(e instanceof Error ? e.message : "تعذر تجهيز الرابط"); }
    finally { setBusy(false); }
  }
  useEffect(() => { void load(); }, [storeId]);
  return <Card><h2 className="font-extrabold text-ink-900">رابط إعداد العميل</h2><p className="mt-2 text-sm text-ink-500">رابط خاص يفتح إعدادات هذا المتجر مباشرة. أرسله لصاحب المتجر فقط.</p>
    {error && <p role="alert" className="mt-3 text-sm text-rose-600">{error}</p>}
    {url ? <><input aria-label="رابط إعداد العميل" readOnly dir="ltr" value={url} className="mt-4 w-full rounded-xl border p-3 text-xs" onFocus={(e) => e.target.select()} /><div className="mt-3 flex flex-wrap gap-3"><PrimaryBtn onClick={async () => { try { await navigator.clipboard.writeText(url); setCopied(true); } catch { setError("حدد الرابط وانسخه يدويًا"); } }}>{copied ? "تم النسخ" : "نسخ الرابط"}</PrimaryBtn><a target="_blank" rel="noopener noreferrer" className="rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white" href={phone ? waChatLink(phone, `السلام عليكم، هذا رابط إعداد متجرك ${name}:\n${url}`) : `https://wa.me/?text=${encodeURIComponent(`رابط إعداد متجرك ${name}:\n${url}`)}`}>إرسال عبر واتساب</a></div></> : <PrimaryBtn className="mt-4" disabled={busy} onClick={() => void load()}>{busy ? "جارٍ تجهيز الرابط…" : "تجهيز رابط الإعداد"}</PrimaryBtn>}
  </Card>;
}
