// وثبة — إعدادات الموقع العام
import type { Metadata } from "next";
import { services } from "@/lib/services";
import { PageHeader } from "@/components/admin/ui";
import { SiteSettingsForm } from "@/components/admin/site-managers";

export const metadata: Metadata = { title: "الإعدادات" };

export default async function SettingsPage() {
  const settings = await services().getSiteSettings();
  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader title="إعدادات الموقع العام" sub="بيانات وثبة كما تظهر للزوار: الواتساب، النبذة، المميزات، والأسئلة" />
      <SiteSettingsForm settings={settings} />
    </div>
  );
}
