import type { Metadata } from "next";
import GoogleRepliesWriter from "@/components/admin/google-replies-writer";

export const metadata: Metadata = { title: "كاتب ردود Google maps" };

export default function GoogleRepliesPage() {
  return <GoogleRepliesWriter />;
}
