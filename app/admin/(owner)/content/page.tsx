// معون — محتوى الموقع العام (يحرره المالك، ويظهر فورًا للزوار)
import type { Metadata } from "next";
import { services } from "@/lib/services";
import { PageHeader } from "@/components/admin/ui";
import LandingContentForm from "@/components/admin/landing-content-form";

export const metadata: Metadata = { title: "محتوى الموقع" };

export default async function ContentPage() {
  const settings = await services().getSiteSettings();
  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="محتوى الموقع"
        sub="كل نصوص الصفحة العامة: الغلاف، الإحصائيات، عن معون، الخدمات، الترويسات، التنقل، والدعوة الأخيرة"
        action={
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-xl border border-ink-200 bg-white px-4 py-2.5 text-sm font-bold text-ink-700 transition-colors hover:bg-ink-50"
          >
            عرض الموقع
          </a>
        }
      />
      <LandingContentForm initial={settings.landing} />
    </div>
  );
}
