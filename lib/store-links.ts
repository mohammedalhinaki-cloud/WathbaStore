// ============================================================
// وثبة — روابط داخل المتجر (دوال نقية: تعمل في الخادم والعميل)
//
// في وضع المعاينة/التطوير (نطاق واحد) يجب أن يحمل كل رابط داخل المتجر
// المعامل ?store=<slug>، وإلا اعتُبر الطلب تابعًا للموقع العام فيرد
// الخادم بـ «الصفحة غير موجودة».
//
// ⚠️ لا تستخدم هنا next/headers حتى يبقى الملف صالحًا لمكوّنات العميل.
// ============================================================

/** معامل الاستعلام الخاص بالمتجر: "?store=rshaf" أو "" على النطاق الحقيقي */
export type StoreQuery = string;

function normalizePath(path: string): string {
  if (!path) return "/";
  return path.startsWith("/") ? path : `/${path}`;
}

/** يدمج ?store= مع رابط داخلي (ويحافظ على أي معاملات موجودة فيه) */
export function withStore(path: string, query: StoreQuery): string {
  const p = normalizePath(path);
  const qs = (query || "").trim().replace(/^\?/, "");
  if (!qs) return p;
  return `${p}${p.includes("?") ? "&" : "?"}${qs}`;
}

/** رابط الصفحة الرئيسية للمتجر: "/?store=rshaf" أو "/" */
export function storeHomeHref(query: StoreQuery): string {
  return withStore("/", query);
}

/** رابط صفحة إتمام الطلب: "/checkout?store=rshaf" أو "/checkout" */
export function checkoutHref(query: StoreQuery): string {
  return withStore("/checkout", query);
}

/** استخراج قيمة ?store= من نص استعلام (يُستخدم في العميل كخطة بديلة) */
export function storeFromSearch(search: string | null | undefined): string | null {
  if (!search) return null;
  try {
    const value = new URLSearchParams(search.replace(/^\?/, "")).get("store");
    const clean = (value || "").trim().toLowerCase();
    return clean || null;
  } catch {
    return null;
  }
}
