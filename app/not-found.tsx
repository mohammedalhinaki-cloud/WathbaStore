// وثبة — صفحة 404 (تتكيف: متجر أم الموقع العام)
import Link from "next/link";
import { getTenant } from "@/lib/tenant";

export default async function NotFound() {
  const tenant = await getTenant();
  const isStore = tenant.tenant === "store";

  if (isStore) {
    const query = tenant.slug ? `?store=${tenant.slug}` : "";
    return (
      <div className="store-root flex min-h-screen flex-col items-center justify-center bg-white px-6 text-center">
        <span className="text-6xl">🔍</span>
        <h1 className="mt-6 text-2xl font-extrabold text-ink-900">الصفحة غير موجودة</h1>
        <p className="mt-3 max-w-sm leading-7 text-ink-500">
          لم نعثر على ما تبحث عنه في هذا المتجر.
        </p>
        <a
          href={query || "/"}
          className="mt-8 rounded-xl px-6 py-3 text-sm font-extrabold text-white"
          style={{ backgroundColor: "var(--store-primary, #4f46e5)" }}
        >
          العودة للرئيسية
        </a>
        <p className="mt-10 text-xs text-ink-400">تطوير: WathbaStore</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-ink-950 px-6 text-center">
      <span className="text-6xl">🔍</span>
      <h1 className="mt-6 text-3xl font-extrabold text-white">404 — الصفحة غير موجودة</h1>
      <p className="mt-3 max-w-sm leading-7 text-ink-400">
        الرابط الذي تحاول الوصول إليه غير متوفر.
      </p>
      <Link
        href="/"
        className="mt-8 rounded-xl bg-gradient-to-l from-brand-500 to-violet-600 px-6 py-3 text-sm font-extrabold text-white"
      >
        العودة إلى وثبة
      </Link>
    </div>
  );
}
