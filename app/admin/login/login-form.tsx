// وثبة — نموذج تسجيل الدخول
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Lock, Mail } from "lucide-react";

export default function LoginForm({ kind }: { kind: "owner" | "client" }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "بيانات الدخول غير صحيحة");
        return;
      }
      // في وضع المعاينة نحافظ على ?store= عند الانتقال
      const search =
        typeof window !== "undefined" ? window.location.search : "";
      window.location.assign(`/admin${search}`);
    } catch {
      setError("تعذر الاتصال بالخادم");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={submit}
      className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-2xl backdrop-blur"
    >
      <div className="space-y-4">
        <label className="block">
          <span className="mb-1.5 block text-sm font-bold text-ink-300">البريد الإلكتروني</span>
          <div className="relative">
            <Mail className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-500" />
            <input
              type="email"
              required
              dir="ltr"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={kind === "owner" ? "owner@wathbastore.com" : "client@email.com"}
              className="w-full rounded-xl border border-white/10 bg-ink-950/60 py-3 pr-10 pl-3 text-left text-sm text-white outline-none transition-colors placeholder:text-ink-600 focus:border-brand-400"
            />
          </div>
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-bold text-ink-300">كلمة المرور</span>
          <div className="relative">
            <Lock className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-500" />
            <input
              type="password"
              required
              dir="ltr"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-xl border border-white/10 bg-ink-950/60 py-3 pr-10 pl-3 text-left text-sm text-white outline-none transition-colors placeholder:text-ink-600 focus:border-brand-400"
            />
          </div>
        </label>

        {error && (
          <div className="rounded-xl border border-rose-400/30 bg-rose-500/10 px-4 py-2.5 text-sm font-semibold text-rose-300">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-l from-brand-500 to-violet-600 py-3 text-sm font-extrabold text-white shadow-lg shadow-brand-500/25 transition-transform hover:scale-[1.01] disabled:opacity-60"
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          {kind === "owner" ? "دخول لوحة المالك" : "دخول لوحة المتجر"}
        </button>
      </div>
    </form>
  );
}
