// ============================================================
// وثبة — مكونات UI مشتركة للوحات (مالك + عميل)
// ============================================================

import { STORE_STATUS_LABELS, type StoreStatus } from "@/lib/types";
import { statusTone } from "@/lib/constants";
import { Eye, EyeOff } from "lucide-react";

export function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-2xl border border-ink-150 bg-white p-5 shadow-sm ${className}`}>
      {children}
    </div>
  );
}

export function StatusBadge({ status }: { status: StoreStatus }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ring-1 ${statusTone(status)}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {STORE_STATUS_LABELS[status]}
    </span>
  );
}

export function PageHeader({
  title,
  sub,
  action,
}: {
  title: string;
  sub?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
      <div>
        <h1 className="text-2xl font-extrabold text-ink-900">{title}</h1>
        {sub && <p className="mt-1 text-sm text-ink-500">{sub}</p>}
      </div>
      {action}
    </div>
  );
}

export function Field({
  label,
  hint,
  children,
  required,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-bold text-ink-700">
        {label}
        {required && <span className="mr-1 text-rose-500">*</span>}
      </span>
      {children}
      {hint && <span className="mt-1 block text-xs text-ink-400">{hint}</span>}
    </label>
  );
}

export const inputCls =
  "w-full rounded-xl border border-ink-200 bg-white px-3.5 py-2.5 text-sm text-ink-900 outline-none transition-colors placeholder:text-ink-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20";

export function PrimaryBtn({
  children,
  className = "",
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...rest}
      className={`inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition-all hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
    >
      {children}
    </button>
  );
}

export function GhostBtn({
  children,
  className = "",
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...rest}
      className={`inline-flex items-center justify-center gap-2 rounded-xl border border-ink-200 bg-white px-4 py-2.5 text-sm font-bold text-ink-700 transition-colors hover:bg-ink-50 ${className}`}
    >
      {children}
    </button>
  );
}

export function DangerBtn({
  children,
  className = "",
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...rest}
      className={`inline-flex items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-bold text-rose-600 transition-colors hover:bg-rose-100 ${className}`}
    >
      {children}
    </button>
  );
}

export function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label?: string;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex items-center gap-2"
      aria-pressed={checked}
    >
      <span
        className={`relative h-6 w-11 rounded-full transition-colors ${
          checked ? "bg-brand-600" : "bg-ink-300"
        }`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${
            checked ? "right-0.5" : "right-5"
          }`}
        />
      </span>
      {label && (
        <span className="flex items-center gap-1 text-sm font-semibold text-ink-600">
          {checked ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
          {label}
        </span>
      )}
    </button>
  );
}

export function EmptyState({
  icon,
  title,
  sub,
  action,
}: {
  icon: string;
  title: string;
  sub?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-ink-200 bg-ink-50/50 py-14 text-center">
      <span className="text-4xl">{icon}</span>
      <p className="mt-4 font-bold text-ink-700">{title}</p>
      {sub && <p className="mt-1 max-w-sm text-sm text-ink-500">{sub}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function StatCard({
  icon,
  label,
  value,
  tone = "brand",
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  tone?: "brand" | "emerald" | "amber" | "rose" | "violet";
}) {
  const tones: Record<string, string> = {
    brand: "bg-brand-50 text-brand-600",
    emerald: "bg-emerald-50 text-emerald-600",
    amber: "bg-amber-50 text-amber-600",
    rose: "bg-rose-50 text-rose-600",
    violet: "bg-violet-50 text-violet-600",
  };
  return (
    <Card className="flex items-center gap-4">
      <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${tones[tone]}`}>
        {icon}
      </span>
      <div>
        <p className="text-2xl font-extrabold text-ink-900">{value}</p>
        <p className="text-xs font-semibold text-ink-500">{label}</p>
      </div>
    </Card>
  );
}
