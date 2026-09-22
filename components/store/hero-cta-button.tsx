// ============================================================
// معين — زر «تسوّق الآن» في صورة الغلاف
//
// تمرير سلس (Smooth Scroll) مضمون إلى قسم «منتجاتنا» (#products):
// الصفحة تعتمد أساسًا على scroll-behavior: smooth الموجودة في
// globals.css، ويضيف هذا المكوّن احتياطًا يعمل في كل المتصفحات
// (بما فيها الويب فيو داخل التطبيقات). يبقى href=#products موجودًا
// كإجراء افتراضي صالح (بدون جافاسكربت / لمحركات البحث).
// ============================================================

"use client";

interface Props {
  /** معرّف القسم الهدف (بدون #) */
  targetId?: string;
}

export default function HeroCtaButton({ targetId = "products" }: Props) {
  return (
    <a
      href={`#${targetId}`}
      onClick={(e) => {
        const el = document.getElementById(targetId);
        if (!el) return; // القسم غير موجود: اترك الرابط يعمل افتراضيًا
        e.preventDefault();
        // احترام تفضيل تقليل الحركة لدى المستخدم
        const reduceMotion = window.matchMedia(
          "(prefers-reduced-motion: reduce)"
        ).matches;
        el.scrollIntoView({
          behavior: reduceMotion ? "auto" : "smooth",
          block: "start",
        });
        // تحديث الهاش دون قفزة (للمشاركة والرجوع)
        window.history.replaceState(null, "", `#${targetId}`);
      }}
      className="mt-6 inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-extrabold text-white shadow-lg transition-transform hover:scale-[1.03]"
      style={{ backgroundColor: "var(--store-secondary)" }}
    >
      تسوّق الآن
      <span aria-hidden="true">←</span>
    </a>
  );
}
