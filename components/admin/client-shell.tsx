// ============================================================
// وثبة — هيكل لوحة العميل (نطاق متجره فقط)
// ============================================================

"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Activity,
  ArrowRight,
  ExternalLink,
  LayoutDashboard,
  LogOut,
  Menu,
  Palette,
  Store,
  Tags,
  X,
} from "lucide-react";
import { useState } from "react";

interface Props {
  storeName: string;
  subdomain: string;
  user: { name: string; email: string };
  storeUrl: string;
  children: React.ReactNode;
}

const NAV = [
  { href: "/admin", label: "الرئيسية", icon: LayoutDashboard, end: true },
  { href: "/admin/products", label: "المنتجات", icon: Store },
  { href: "/admin/categories", label: "الأقسام", icon: Tags },
  { href: "/admin/appearance", label: "المظهر والبيانات", icon: Palette },
  { href: "/admin/logs", label: "سجل النشاط", icon: Activity },
];

export default function ClientShell({ storeName, subdomain, user, storeUrl, children }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  const Sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center gap-2.5 border-b border-white/10 px-5">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-violet-600">
          <Store className="h-5 w-5 text-white" />
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-extrabold text-white">لوحة {storeName}</p>
          <p className="text-[10px] font-bold text-ink-400">{subdomain}.waathba.com</p>
        </div>
      </div>

      <nav className="mt-4 flex-1 space-y-0.5 overflow-y-auto px-3 pb-4">
        {NAV.map((item) => {
          const active = item.end ? pathname === item.href : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-bold transition-colors ${
                active
                  ? "bg-brand-500/15 text-white ring-1 ring-brand-400/30"
                  : "text-ink-400 hover:bg-white/5 hover:text-white"
              }`}
            >
              <item.icon className="h-4.5 w-4.5" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-white/10 p-3">
        <a
          href={storeUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mb-2 flex items-center gap-2 rounded-xl bg-emerald-500/15 px-3.5 py-2.5 text-sm font-bold text-emerald-400 transition-colors hover:bg-emerald-500/25"
        >
          <ExternalLink className="h-4 w-4" />
          زيارة متجرنا
        </a>
        <div className="mb-2 flex items-center gap-3 rounded-xl bg-white/5 px-3 py-2.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-500/20 text-sm font-extrabold text-brand-300">
            {user.name?.charAt(0) || "ع"}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-white">{user.name || "صاحب المتجر"}</p>
            <p className="truncate text-[11px] text-ink-400">{user.email}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="flex w-full items-center gap-2 rounded-xl px-3.5 py-2.5 text-sm font-bold text-ink-400 transition-colors hover:bg-rose-500/10 hover:text-rose-400"
        >
          <LogOut className="h-4 w-4" />
          تسجيل الخروج
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-ink-50">
      <aside className="fixed inset-y-0 right-0 z-40 hidden w-64 bg-ink-950 lg:block">
        {Sidebar}
      </aside>

      <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-ink-200 bg-white/90 px-4 backdrop-blur lg:hidden">
        <button onClick={() => setOpen(true)} className="rounded-lg p-2 text-ink-600">
          <Menu className="h-5 w-5" />
        </button>
        <span className="font-extrabold text-ink-900">لوحة {storeName}</span>
        <Link
          href={storeUrl}
          target="_blank"
          className="flex items-center gap-1 text-xs font-bold text-brand-600"
        >
          المتجر
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </header>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-ink-950/60" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 right-0 w-72 bg-ink-950 shadow-2xl">
            <button
              onClick={() => setOpen(false)}
              className="absolute top-4 left-4 rounded-lg p-1.5 text-ink-400 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
            {Sidebar}
          </aside>
        </div>
      )}

      <div className="lg:mr-64">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</div>
      </div>
    </div>
  );
}
