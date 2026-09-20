// ============================================================
// وثبة — هيكل لوحة المالك (الشريط الجانبي + الشريط العلوي)
// ============================================================

"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Activity,
  ArrowRight,
  LayoutDashboard,
  LogOut,
  Megaphone,
  Store,
  Tag,
  Globe,
  Settings,
  Users,
  Plus,
  Package,
  CheckCheck,
  Hourglass,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";

const NAV: { href: string; label: string; icon: React.ElementType; end?: boolean }[] = [
  { href: "/admin", label: "الرئيسية", icon: LayoutDashboard, end: true },
  { href: "/admin/stores", label: "المتاجر", icon: Store },
  { href: "/admin/pending", label: "غير المسلّمة", icon: Hourglass },
  { href: "/admin/delivered", label: "المسلّمة", icon: CheckCheck },
  { href: "/admin/clients", label: "العملاء", icon: Users },
  { href: "/admin/domains", label: "النطاقات الفرعية", icon: Globe },
  { href: "/admin/portfolio", label: "الأعمال", icon: Package },
  { href: "/admin/pricing", label: "الأسعار والباقات", icon: Tag },
  { href: "/admin/offers", label: "العروض", icon: Megaphone },
  { href: "/admin/settings", label: "الإعدادات", icon: Settings },
  { href: "/admin/activity", label: "سجل النشاطات", icon: Activity },
];

export default function OwnerShell({
  user,
  children,
}: {
  user: { name: string; email: string };
  children: React.ReactNode;
}) {
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
        <div>
          <p className="text-base font-extrabold text-white">وثبة</p>
          <p className="text-[10px] font-bold text-ink-400">لوحة الإدارة</p>
        </div>
      </div>

      <div className="px-3 pt-4">
        <Link
          href="/admin/stores/new"
          className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-l from-accent-500 to-accent-400 px-4 py-2.5 text-sm font-extrabold text-ink-950 shadow-lg shadow-accent-500/20 transition-transform hover:scale-[1.02]"
        >
          <Plus className="h-4 w-4" />
          إنشاء متجر
        </Link>
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
        <div className="mb-2 flex items-center gap-3 rounded-xl bg-white/5 px-3 py-2.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-500/20 text-sm font-extrabold text-brand-300">
            {user.name?.charAt(0) || "م"}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-white">{user.name || "المالك"}</p>
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
      {/* شريط جانبي ثابت (شاشات كبيرة) */}
      <aside className="fixed inset-y-0 right-0 z-40 hidden w-64 bg-ink-950 lg:block">
        {Sidebar}
      </aside>

      {/* شريط علوي للجوال */}
      <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-ink-200 bg-white/90 px-4 backdrop-blur lg:hidden">
        <button onClick={() => setOpen(true)} className="rounded-lg p-2 text-ink-600">
          <Menu className="h-5 w-5" />
        </button>
        <span className="font-extrabold text-ink-900">لوحة وثبة</span>
        <Link href="/" className="flex items-center gap-1 text-xs font-bold text-brand-600">
          الموقع
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </header>

      {/* درج الجوال */}
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
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</div>
      </div>
    </div>
  );
}
