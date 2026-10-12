import type { Metadata } from "next";
import SetupEntry from "./setup-entry";
export const metadata: Metadata = { title: "إعداد متجرك", robots: { index: false, follow: false }, referrer: "no-referrer" };
export default function SetupPage() { return <SetupEntry />; }
