// ============================================================
// معون — تخطيط لوحة الإدارة (يمنع فهرسة كل صفحات /admin)
// يشمل: لوحة المالك، لوحة صاحب المتجر، وصفحة تسجيل الدخول.
// لا يغيّر بنية DOM — مجرد غلاف يمرّر الأبناء مع بيانات noindex.
// ============================================================

import type { Metadata } from "next";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
