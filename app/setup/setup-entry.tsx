"use client";
import { useEffect, useRef, useState } from "react";

export default function SetupEntry() {
  const started = useRef(false);
  const [error, setError] = useState("");
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const params = new URLSearchParams(window.location.hash.slice(1));
    window.history.replaceState(null, "", window.location.pathname);
    void fetch("/api/auth/setup", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ store: params.get("store"), email: params.get("email"), key: params.get("key") }),
    }).then(async (response) => {
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      window.location.replace(data.next);
    }).catch((e) => setError(e instanceof Error ? e.message : "تعذر فتح الرابط"));
  }, []);
  return <main dir="rtl" className="flex min-h-screen items-center justify-center bg-ink-50 p-6"><div className="max-w-md rounded-3xl bg-white p-8 text-center shadow-sm"><h1 className="text-2xl font-bold">إعداد متجرك</h1><p role="status" className="mt-4 text-ink-600">{error || "جارٍ فتح لوحة إعداد متجرك…"}</p>{error && <p className="mt-4 text-sm">افتح الرابط الأصلي الذي أُرسل إليك عبر واتساب مجددًا.</p>}</div></main>;
}
