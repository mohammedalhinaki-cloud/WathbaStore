// ============================================================
// معون — خطاف API للوحات: fetch + إعادة تحميل + رسائل
// ============================================================

"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";

interface ApiState {
  loading: boolean;
  error: string | null;
  success: string | null;
}

export function useApi() {
  const router = useRouter();
  const [state, setState] = useState<ApiState>({ loading: false, error: null, success: null });

  const api = useCallback(
    async <T = unknown>(
      url: string,
      options?: {
        method?: string;
        body?: unknown;
        formData?: FormData;
        onSuccess?: (data: T) => void;
        redirect?: string;
      }
    ): Promise<T | null> => {
      setState({ loading: true, error: null, success: null });
      try {
        const res = await fetch(url, {
          method: options?.method ?? (options?.body || options?.formData ? "POST" : "GET"),
          headers: options?.body ? { "Content-Type": "application/json" } : undefined,
          body: options?.formData
            ? options.formData
            : options?.body
              ? JSON.stringify(options.body)
              : undefined,
        });
        const data = (await res.json().catch(() => ({}))) as T & { error?: string };
        if (!res.ok) {
          const msg = data?.error ?? "حدث خطأ غير متوقع";
          setState({ loading: false, error: msg, success: null });
          return null;
        }
        setState({ loading: false, error: null, success: "تم الحفظ بنجاح" });
        router.refresh();
        options?.onSuccess?.(data);
        if (options?.redirect) {
          setTimeout(() => router.push(options.redirect!), 350);
        }
        return data;
      } catch {
        setState({ loading: false, error: "تعذر الاتصال بالخادم", success: null });
        return null;
      }
    },
    [router]
  );

  return { api, ...state };
}

export function FormAlerts({
  error,
  success,
}: {
  error: string | null;
  success: string | null;
}) {
  if (!error && !success) return null;
  return (
    <div className="space-y-2">
      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
          {success}
        </div>
      )}
    </div>
  );
}
