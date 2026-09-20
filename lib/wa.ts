// ============================================================
// أدوات الواتساب
// ============================================================

/**
 * يولّد رابط واتساب برسالة طلب جاهزة
 */
export function waOrderLink(
  number: string,
  parts: {
    productName?: string;
    price?: string;
    productUrl?: string;
    storeName?: string;
  }
): string {
  const digits = (number || "").replace(/[^\d]/g, "");
  const lines: string[] = ["السلام عليكم، أرغب بطلب:"];
  if (parts.storeName) lines.push(`المتجر: ${parts.storeName}`);
  if (parts.productName) lines.push(`اسم المنتج: ${parts.productName}`);
  if (parts.price) lines.push(`السعر: ${parts.price}`);
  if (parts.productUrl) lines.push(`رابط المنتج: ${parts.productUrl}`);
  const text = lines.join("\n");
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}

/** رابط واتساب عام (تواصل مباشر بدون رسالة) */
export function waChatLink(number: string, message?: string): string {
  const digits = (number || "").replace(/[^\d]/g, "");
  const base = `https://wa.me/${digits}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}

export function isValidPhoneLike(v: string): boolean {
  return /^[+\d][\d\s-]{6,18}$/.test(v.trim());
}
