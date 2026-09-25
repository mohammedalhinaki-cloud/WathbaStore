// معون — إنشاء متجر جديد (المالك)
import type { Metadata } from "next";
import { mainDomain } from "@/lib/constants";
import CreateStoreWizard from "./wizard";

export const metadata: Metadata = { title: "إنشاء متجر" };

export default function NewStorePage() {
  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold text-ink-900">إنشاء متجر جديد</h1>
        <p className="mt-1 text-sm text-ink-500">
          ابدأ بتجهيز متجر عميلك — سيحصل على نطاقه الخاص على {mainDomain()}
        </p>
      </div>
      <CreateStoreWizard />
    </div>
  );
}
