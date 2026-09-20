// ============================================================
// وثبة WathbaStore — ثوابت عامة
// ============================================================

import type { StoreStatus } from "./types";
import { STORE_STATUS_LABELS } from "./types";

export const APP_NAME = "وثبة";
export const APP_EN = "WathbaStore";

export function mainDomain(): string {
  return process.env.NEXT_PUBLIC_MAIN_DOMAIN || "wathbastore.com";
}

export function developerUrl(fallback?: string | null): string {
  return (
    process.env.DEVELOPER_URL ||
    fallback ||
    "https://" + mainDomain()
  );
}

/** نطاقات فرعية محجوزة — لا يمكن تخصيصها لمتجر */
export const RESERVED_SUBDOMAINS = [
  "www", "web", "admin", "admin2", "administrator", "panel", "panels",
  "app", "apps", "api", "apis", "graphql", "assets", "static", "cdn",
  "mail", "webmail", "ftp", "smtp", "imap", "pop",
  "support", "help", "helpdesk", "blog", "docs", "documentation",
  "pay", "payment", "payments", "checkout", "billing",
  "account", "accounts", "login", "signin", "signup", "auth", "sso",
  "store", "stores", "shop", "shops", "cart",
  "new", "create", "add", "test", "testing", "demo", "dev", "development",
  "staging", "preview", "beta", "sandbox",
  "media", "img", "images", "files", "uploads", "storage",
  "wathba", "wathbastore", "system", "root", "default", "home", "main",
  "portal", "dashboard", "dashboard2", "internal", "private", "secure",
  "status", "monitor", "metrics", "logs", "analytics", "stats",
  "marketing", "sales", "hr", "finance", "legal", "privacy", "terms",
];

export function storeUrl(subdomain: string, path = "/"): string {
  return `https://${subdomain}.${mainDomain()}${path}`;
}

export function statusTone(status: StoreStatus): string {
  switch (status) {
    case "draft":
      return "bg-slate-100 text-slate-700 ring-slate-200";
    case "preparing":
      return "bg-blue-50 text-blue-700 ring-blue-200";
    case "testing":
      return "bg-amber-50 text-amber-700 ring-amber-200";
    case "ready":
      return "bg-violet-50 text-violet-700 ring-violet-200";
    case "delivered":
      return "bg-emerald-50 text-emerald-700 ring-emerald-200";
    case "suspended":
      return "bg-rose-50 text-rose-700 ring-rose-200";
  }
}

export function statusLabel(status: StoreStatus): string {
  return STORE_STATUS_LABELS[status] ?? status;
}

export function formatPrice(n: number, currency = "ر.س"): string {
  return `${new Intl.NumberFormat("ar-SA", { maximumFractionDigits: 2 }).format(n)} ${currency}`;
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  try {
    return new Intl.DateTimeFormat("ar-SA", { dateStyle: "medium", timeStyle: "short" }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export function formatDateShort(iso: string | null | undefined): string {
  if (!iso) return "—";
  try {
    return new Intl.DateTimeFormat("ar-SA", { dateStyle: "medium" }).format(new Date(iso));
  } catch {
    return iso;
  }
}
