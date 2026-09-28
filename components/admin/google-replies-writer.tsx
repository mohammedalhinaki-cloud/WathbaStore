"use client";

import { useState } from "react";
import { Check, Clipboard, Copy, MessageSquareText, RefreshCw, Sparkles } from "lucide-react";

const types = ["مطعم", "مقهى", "صالون", "عيادة", "متجر", "أخرى"];
const stars = [1, 2, 3, 4, 5];

function makeReply(name: string, type: string, rating: number, review: string) {
  const business = name.trim() || "منشأتنا";
  const text = review.trim();
  const mention = text.length > 12 ? text.split(/[،.!؟\n]/)[0].slice(0, 70) : "";
  if (rating >= 4) {
    return `${business} يشكرك على تقييمك الجميل. ${mention ? `سعدنا جدًا بذكرك لـ${mention}، ` : ""}وسعداء أن تجربتك كانت موفقة. نتطلع لاستقبالك مرة أخرى قريبًا.`;
  }
  if (rating <= 2) {
    return `شكرًا لك على مشاركة تجربتك معنا. نأسف لأن زيارتك لم تكن بالمستوى الذي نحرص عليه، ونأخذ ملاحظتك بجدية. يسعدنا تواصلك معنا مباشرة عبر قنوات ${business} لنفهم التفاصيل ونعمل على معالجة الأمر.`;
  }
  return `شكرًا لك على تقييمك وملاحظتك. نقدّر وقتك، ونسعد بأن تمنحنا فرصة أخرى لنقدم لك تجربة أفضل في ${business}.`;
}

export default function GoogleRepliesWriter() {
  const [name, setName] = useState("");
  const [type, setType] = useState(types[0]);
  const [rating, setRating] = useState(5);
  const [review, setReview] = useState("");
  const [reply, setReply] = useState("");
  const [copied, setCopied] = useState(false);

  function generate() {
    setReply(makeReply(name, type, rating, review));
    setCopied(false);
  }
  async function copy() {
    if (!reply) return;
    try {
      await navigator.clipboard.writeText(reply);
    } catch {
      const area = document.createElement("textarea");
      area.value = reply;
      area.style.position = "fixed";
      area.style.opacity = "0";
      document.body.appendChild(area);
      area.select();
      document.execCommand("copy");
      area.remove();
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  return (
    <main dir="rtl" className="mx-auto max-w-4xl">
      <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-brand-50 px-3 py-1 text-xs font-extrabold text-brand-700">
            <Sparkles className="h-3.5 w-3.5" /> إضافة مدفوعة مستقلة
          </div>
          <h1 className="text-2xl font-black tracking-tight text-ink-900 sm:text-3xl">كاتب ردود Google maps</h1>
          <p className="mt-2 max-w-2xl text-sm leading-7 text-ink-500">أنشئ ردودًا دافئة واحترافية على تقييمات عملائك، بصوت قريب من أسلوب نشاطك ويحافظ على علاقتك بهم.</p>
        </div>
        <div className="hidden h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-brand-600 text-white shadow-lg shadow-brand-600/20 sm:flex"><MessageSquareText /></div>
      </div>

      <section className="rounded-2xl border border-ink-200 bg-white p-4 shadow-sm sm:p-7">
        <div className="mb-6 flex items-center gap-3 border-b border-ink-100 pb-5">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600"><MessageSquareText className="h-5 w-5" /></span>
          <div><h2 className="font-extrabold text-ink-900">بيانات التقييم</h2><p className="text-xs text-ink-500">أدخل التفاصيل لنكتب ردًا مناسبًا للسياق.</p></div>
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <label className="text-sm font-bold text-ink-700">اسم النشاط التجاري<input value={name} onChange={e => setName(e.target.value)} placeholder="مثال: مطعم مذاق" className="mt-2 w-full rounded-xl border border-ink-200 bg-ink-50/40 px-4 py-3 text-sm outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10" /></label>
          <label className="text-sm font-bold text-ink-700">نوع النشاط<select value={type} onChange={e => setType(e.target.value)} className="mt-2 w-full rounded-xl border border-ink-200 bg-ink-50/40 px-4 py-3 text-sm outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10">{types.map(item => <option key={item}>{item}</option>)}</select></label>
          <div className="sm:col-span-2"><p className="mb-2 text-sm font-bold text-ink-700">التقييم</p><div className="flex gap-1.5" role="radiogroup" aria-label="التقييم">{stars.map(star => <button type="button" key={star} onClick={() => setRating(star)} aria-label={`${star} نجوم`} aria-pressed={rating === star} className={`rounded-xl px-3 py-2 text-xl transition sm:px-4 ${rating >= star ? "bg-amber-50 text-amber-400" : "bg-ink-50 text-ink-300"}`}>★<span className="sr-only">{star}</span></button>)}</div></div>
          <label className="sm:col-span-2 text-sm font-bold text-ink-700">نص تقييم العميل<textarea value={review} onChange={e => setReview(e.target.value)} rows={5} placeholder="الصق تقييم العميل هنا..." className="mt-2 w-full resize-y rounded-xl border border-ink-200 bg-ink-50/40 px-4 py-3 text-sm leading-7 outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10" /></label>
        </div>
        <button type="button" onClick={generate} className="btn-primary mt-6 w-full px-5 py-3.5 text-sm sm:w-auto"><Sparkles className="h-4 w-4" /> إنشاء الرد</button>
      </section>

      {reply && <section className="mt-6 rounded-2xl border border-brand-100 bg-brand-50/50 p-4 sm:p-7"><div className="mb-4 flex items-center justify-between"><div><h2 className="font-extrabold text-ink-900">الرد المقترح</h2><p className="mt-1 text-xs text-ink-500">راجع الرد قبل نشره على Google.</p></div><span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-brand-700">جاهز للمراجعة</span></div><p className="rounded-xl border border-brand-100 bg-white p-4 text-sm leading-8 text-ink-800">{reply}</p><div className="mt-4 flex flex-col gap-3 sm:flex-row"><button type="button" onClick={copy} className="flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-3 text-sm font-extrabold text-white transition hover:bg-brand-700">{copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}{copied ? "تم نسخ الرد" : "نسخ الرد"}</button><button type="button" onClick={generate} className="flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-extrabold text-ink-700 ring-1 ring-ink-200 transition hover:bg-ink-50"><RefreshCw className="h-4 w-4" /> إعادة إنشاء</button></div></section>}
    </main>
  );
}
