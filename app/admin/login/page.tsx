// ============================================================
// صفحة تسجيل الدخول:
// - maaoun.com/admin/login      → دخول المالك
// - rshaf.maaoun.com/admin/login → دخول صاحب المتجر
// ============================================================

import type { Metadata } from "next";
import { APP_NAME, mainDomain } from "@/lib/constants";
import { getTenant, getStoreCtx } from "@/lib/tenant";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { Lock, ShieldCheck } from "lucide-react";
import LoginForm from "./login-form";

export const metadata: Metadata = { title: "تسجيل الدخول" };

export default async function LoginPage() {
  const tenant = await getTenant();
  const storeCtx = tenant.tenant === "store" ? await getStoreCtx() : null;

  if (tenant.tenant === "store" && storeCtx?.bundle) {
    const { store, settings } = storeCtx.bundle;
    return (
      <div
        className="store-root flex min-h-screen items-center justify-center bg-ink-950 px-4 py-10"
        style={
          {
            "--store-primary": settings.primaryColor,
          } as React.CSSProperties
        }
      >
        <div className="w-full max-w-md">
          <div className="mb-8 flex flex-col items-center text-center">
            <span
              className="flex h-14 w-14 items-center justify-center rounded-2xl text-2xl font-extrabold text-white shadow-xl"
              style={{ backgroundColor: "var(--store-primary)" }}
            >
              {store.name.charAt(0)}
            </span>
            <h1 className="mt-4 text-2xl font-extrabold text-white">لوحة {store.name}</h1>
            <p className="mt-2 text-sm text-ink-400">
              تسجيل دخول صاحب المتجر —{" "}
              <span className="font-mono text-xs" dir="ltr">
                {store.subdomain}.{mainDomain()}
              </span>
            </p>
          </div>
          <LoginForm kind="client" />
          <p className="mt-6 text-center text-xs text-ink-500">
            هذه اللوحة خاصة بإدارة هذا المتجر فقط.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-ink-950 px-4 py-10">
      <div className="pointer-events-none absolute -top-40 left-1/2 h-[420px] w-[700px] -translate-x-1/2 rounded-full bg-brand-600/20 blur-[110px]" />
      <div className="relative w-full max-w-md">
        <div className="mb-8 flex flex-col items-center text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/mark.svg" alt={APP_NAME} width={56} height={56} className="h-14 w-14 drop-shadow-[0_4px_16px_rgba(230,81,0,0.45)]" />
          <h1 className="mt-4 text-2xl font-extrabold text-white">لوحة إدارة {APP_NAME}</h1>
          <p className="mt-2 flex items-center gap-1.5 text-sm text-ink-400">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            هذه اللوحة خاصة بمالك المنصة فقط
          </p>
        </div>
        <LoginForm kind="owner" />
        {!isSupabaseConfigured() && (
          <div className="mt-5 rounded-2xl border border-brand-400/20 bg-brand-500/10 p-4 text-xs leading-6 text-ink-300">
            <p className="flex items-center gap-1.5 font-extrabold text-brand-300">
              <Lock className="h-3.5 w-3.5" />
              بيانات التجربة (الوضع المحلي)
            </p>
            <p className="mt-1" dir="ltr">
              owner@maaoun.com / Maaoun#2026
            </p>
            <p className="mt-2 text-[11px] text-ink-500">
              ولوحة العميل: rshaf@demo.com / Rshaf#2026 (على نطاق متجر رشف)
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
