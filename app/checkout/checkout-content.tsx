// ============================================================
// معون — محتوى صفحة إتمام الطلب
// ============================================================
"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Copy, Check, Building2, ChevronLeft, ShieldCheck } from "lucide-react";
import { useCart, type CartItem } from "@/components/store/cart-context";
import { formatPrice } from "@/lib/constants";
import { storeHomeHref } from "@/lib/store-links";

interface Props {
  whatsapp: string;
  storeName: string;
  ibanRajhi: string;
  ibanAlinmaa: string;
  ibanAlahli: string;
  query: string;
}

interface BankInfo {
  key: string;
  name: string;
  iban: string;
  color: string;
  icon: string;
}

export default function CheckoutContent({ whatsapp, storeName, ibanRajhi, ibanAlinmaa, ibanAlahli, query }: Props) {
  const { items, totalPrice, clearCart } = useCart();
  const [showBanks, setShowBanks] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [ibanErrors, setIbanErrors] = useState<Record<string, string>>({});
  const [mounted, setMounted] = useState(false);
  /** رابط العودة للمتجر — يحمل ?store= في وضع المعاينة */
  const homeHref = storeHomeHref(query);

  useEffect(() => { setMounted(true); }, []);

  if (!mounted) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 rounded bg-ink-100" />
          <div className="h-32 rounded-2xl bg-ink-50" />
        </div>
      </div>
    );
  }

  const banks: BankInfo[] = [];
  if (ibanRajhi?.trim()) banks.push({ key: "rajhi", name: "حساب الراجحي", iban: ibanRajhi.trim(), color: "#003F2D", icon: "🏦" });
  if (ibanAlinmaa?.trim()) banks.push({ key: "alinmaa", name: "حساب الإنماء", iban: ibanAlinmaa.trim(), color: "#00A650", icon: "🏛️" });
  if (ibanAlahli?.trim()) banks.push({ key: "alahli", name: "حساب الأهلي", iban: ibanAlahli.trim(), color: "#E31837", icon: "🏢" });

  function buildWAMessage(): string {
    const lines: string[] = ["السلام عليكم، اريد طلب هذه المنتجات من متجركم:", ""];
    items.forEach((item, i) => {
      lines.push(`${i + 1}. ${item.name} × ${item.quantity} — ${formatPrice(item.price * item.quantity)}`);
    });
    lines.push("");
    lines.push(`المجموع: ${formatPrice(totalPrice)}`);
    return lines.join("\n");
  }

  function openWhatsApp() {
    const digits = (whatsapp || "").replace(/[^\d]/g, "");
    const text = encodeURIComponent(buildWAMessage());
    window.open(`https://wa.me/${digits}?text=${text}`, "_blank");
  }

  function handleCashOnDelivery() {
    openWhatsApp();
  }

  function handleBankTransfer() {
    // Validate IBANs
    const errors: Record<string, string> = {};
    banks.forEach((bank) => {
      const clean = bank.iban.replace(/\s/g, "");
      if (!/^SA\d{22}$/.test(clean)) {
        errors[bank.key] = "الآيبان لازم 24 خانة يبدأ بـ SA";
      }
    });
    setIbanErrors(errors);
    if (Object.keys(errors).length > 0) return;
    setShowBanks(true);
  }

  function formatIban(iban: string): string {
    const clean = iban.replace(/\s/g, "").toUpperCase();
    return clean.replace(/(.{4})/g, "$1 ").trim();
  }

  async function copyIban(iban: string, key: string) {
    const clean = iban.replace(/\s/g, "");
    try {
      await navigator.clipboard.writeText(clean);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    } catch {
      /* fallback */
    }
  }

  function handleTransferSent() {
    openWhatsApp();
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16">
        <div data-reveal="up" className="flex flex-col items-center text-center">
          <span className="text-6xl">🛒</span>
          <h1 className="mt-4 text-xl font-extrabold text-ink-900">سلتك فارغة</h1>
          <p className="mt-2 text-sm text-ink-500">أضف منتجات من المتجر لتتمم طلبك</p>
          <a
            href={homeHref}
            className="motion-action mt-6 inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-extrabold text-white"
            style={{ backgroundColor: "var(--store-primary)" }}
          >
            <ChevronLeft className="h-4 w-4" />
            العودة للمتجر
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 data-reveal="inline-start" className="mb-6 text-2xl font-extrabold text-ink-900">إتمام الطلب</h1>

      {/* ملخص الطلب */}
      <div data-reveal="up" className="motion-card rounded-2xl border border-ink-100 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-sm font-extrabold text-ink-700">منتجاتك</h2>
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.productId} className="flex items-center gap-3">
              <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-ink-100">
                {item.imageUrl ? (
                  <Image src={item.imageUrl} alt={item.name} fill sizes="56px" className="object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center text-lg">🛍️</div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="truncate text-sm font-bold text-ink-900">{item.name}</h3>
                <span className="text-xs text-ink-500">الكمية: {item.quantity}</span>
              </div>
              <span className="text-sm font-extrabold" style={{ color: "var(--store-primary)" }}>
                {formatPrice(item.price * item.quantity)}
              </span>
            </div>
          ))}
        </div>
        <div className="mt-4 flex items-center justify-between border-t border-ink-100 pt-4">
          <span className="text-sm font-bold text-ink-500">المجموع الكلي</span>
          <span className="text-xl font-extrabold" style={{ color: "var(--store-primary)" }}>
            {formatPrice(totalPrice)}
          </span>
        </div>
      </div>

      {/* أزرار الدفع */}
      <div className="mt-6 space-y-3">
        {/* زر 1: الدفع عند الاستلام */}
        <button
          onClick={handleCashOnDelivery}
          className="motion-action flex w-full items-center justify-center gap-2.5 rounded-2xl px-6 py-4 text-base font-extrabold text-white shadow-lg transition-transform hover:scale-[1.01]"
          style={{ backgroundColor: "#25D366" }}
        >
          <span className="text-xl">💵</span>
          الدفع عند الاستلام
        </button>
        <p className="text-center text-xs text-ink-400">سيتم إرسال طلبك عبر واتساب للمراجعة والتأكيد</p>

        {/* زر 2: تحويل بنكي */}
        {banks.length > 0 && (
          <>
            <div className="relative my-2">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-ink-200" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-white px-3 text-xs text-ink-400">أو</span>
              </div>
            </div>

            <button
              onClick={handleBankTransfer}
              className="motion-action flex w-full items-center justify-center gap-2.5 rounded-2xl border-2 px-6 py-4 text-base font-extrabold shadow-sm transition-all hover:shadow-md"
              style={{ borderColor: "var(--store-primary)", color: "var(--store-primary)" }}
            >
              <Building2 className="h-5 w-5" />
              تحويل بنكي
            </button>
          </>
        )}
      </div>

      {/* حسابات البنوك */}
      {showBanks && banks.length > 0 && (
        <div className="mt-6 space-y-3" data-stagger>
          <h3 data-reveal="inline-start" className="text-sm font-extrabold text-ink-700">حسابات البنوك</h3>
          {banks.map((bank) => {
            const clean = bank.iban.replace(/\s/g, "");
            const hasError = ibanErrors[bank.key];
            return (
              <div
                key={bank.key}
                data-reveal="up"
                className="motion-card rounded-2xl border border-ink-100 bg-white p-4 shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-xl text-lg"
                    style={{ backgroundColor: `${bank.color}15` }}
                  >
                    {bank.icon}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-sm font-bold text-ink-900">{bank.name}</h4>
                    <p
                      className="mt-0.5 font-mono text-sm font-semibold tracking-wider text-ink-700"
                      dir="ltr"
                    >
                      {formatIban(bank.iban)}
                    </p>
                    {hasError && (
                      <p className="mt-1 text-xs font-semibold text-rose-500">{hasError}</p>
                    )}
                  </div>
                  <button
                    onClick={() => copyIban(bank.iban, bank.key)}
                    className="flex h-9 w-9 items-center justify-center rounded-lg bg-ink-50 text-ink-500 transition-colors hover:bg-ink-100"
                    title="نسخ الآيبان"
                  >
                    {copiedKey === bank.key ? (
                      <Check className="h-4 w-4 text-emerald-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
            );
          })}

          {/* زر أرسلت الحوالة */}
          <button
            onClick={handleTransferSent}
            className="motion-action mt-4 flex w-full items-center justify-center gap-2.5 rounded-2xl px-6 py-4 text-base font-extrabold text-white shadow-lg transition-transform hover:scale-[1.01]"
            style={{ backgroundColor: "var(--store-primary)" }}
          >
            <ShieldCheck className="h-5 w-5" />
            أرسلت الحوالة
          </button>
          <p className="text-center text-xs text-ink-400">سيتم إرسال تفاصيل طلبك عبر واتساب للتأكيد</p>
        </div>
      )}

      {/* رابط العودة */}
      <div className="mt-8 text-center">
        <a href={homeHref} className="text-sm font-bold text-ink-400 hover:text-[var(--store-primary)]">
          ← العودة للمتجر
        </a>
      </div>
    </div>
  );
}