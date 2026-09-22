// معين — تبويبات باني المتجر
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Palette,
  Tags,
  Package,
  FileText,
  Search,
  Settings,
  Gift,
} from "lucide-react";

const TABS = [
  { href: "", label: "نظرة عامة", icon: LayoutDashboard },
  { href: "/design", label: "التصميم", icon: Palette },
  { href: "/categories", label: "الأقسام", icon: Tags },
  { href: "/products", label: "المنتجات", icon: Package },
  { href: "/pages", label: "الصفحات", icon: FileText },
  { href: "/seo", label: "SEO", icon: Search },
  { href: "/settings", label: "الإعدادات", icon: Settings },
  { href: "/delivery", label: "التسليم", icon: Gift },
];

export default function BuilderNav({ storeId }: { storeId: string }) {
  const pathname = usePathname();
  const base = `/admin/stores/${storeId}`;
  return (
    <div className="no-scrollbar -mx-1 mb-6 flex gap-1.5 overflow-x-auto border-b border-ink-150 pb-px">
      {TABS.map((t) => {
        const href = base + t.href;
        const active = t.href === "" ? pathname === base : pathname.startsWith(href);
        return (
          <Link
            key={t.href}
            href={href}
            className={`flex shrink-0 items-center gap-2 rounded-t-xl border-b-2 px-4 py-2.5 text-sm font-bold transition-colors ${
              active
                ? "border-brand-600 bg-brand-50/60 text-brand-700"
                : "border-transparent text-ink-500 hover:bg-ink-50 hover:text-ink-800"
            }`}
          >
            <t.icon className="h-4 w-4" />
            {t.label}
          </Link>
        );
      })}
    </div>
  );
}
