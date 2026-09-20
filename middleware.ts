// ============================================================
// وثبة — Middleware: كشف المستأجر من النطاق (subdomain)
//
// rshaf.wathbastore.com  →  x-tenant: store, x-store-slug: rshaf
// wathbastore.com        →  x-tenant: main
//
// الدومين الرئيسي قابل للتهيئة عبر NEXT_PUBLIC_MAIN_DOMAIN
// المعاينة (نطاق واحد): /?store=rshaf تحاكي النطاق الفرعي
// ============================================================

import { NextResponse, type NextRequest } from "next/server";
import { isPreviewHost } from "./lib/constants";

/**
 * الدومين الرئيسي يُقرأ من متغير البيئة NEXT_PUBLIC_MAIN_DOMAIN،
 * مع العودة إلى wathbastore.com إن لم يُضبط.
 *
 * ملاحظة: Next.js يستبدل متغيرات NEXT_PUBLIC_ وقت البناء، لذلك أي تغيير
 * لقيمة المتغير في Vercel يحتاج إعادة نشر (Redeploy) كي يسري.
 */
const MAIN_DOMAIN = (process.env.NEXT_PUBLIC_MAIN_DOMAIN || "wathbastore.com")
  .trim()
  .toLowerCase()
  .replace(/^https?:\/\//, "")
  .replace(/\/.*$/, "")
  .replace(/:\d+$/, "")
  .replace(/^\.+|\.+$/g, "");

const MAIN_HOSTS = [MAIN_DOMAIN, `www.${MAIN_DOMAIN}`];
const SUB_RE = /^[a-z0-9](?:[a-z0-9-]{0,60}[a-z0-9])?$/;

export async function middleware(request: NextRequest) {
  const host = (request.headers.get("host") || "").replace(/:\d+$/, "").toLowerCase();
  let tenant: "main" | "store" = "main";
  let slug: string | null = null;

  // على نطاقات المعاينة (vercel.app / e2b.app / localhost) لا يمكن الاعتماد
  // على النطاق الفرعي، فالمحاكاة عبر ?store= أولى حتى لو أشار
  // NEXT_PUBLIC_MAIN_DOMAIN إلى نفس نطاق المعاينة بالخطأ.
  if (!isPreviewHost(host) && (host === MAIN_DOMAIN || host.endsWith(`.${MAIN_DOMAIN}`))) {
    const isMain = MAIN_HOSTS.includes(host);
    if (!isMain) {
      const sub = host.slice(0, -(MAIN_DOMAIN.length + 1));
      if (SUB_RE.test(sub)) {
        tenant = "store";
        slug = sub;
      }
    }
  } else {
    // وضع المعاينة/التطوير: نطاق واحد — نحاكي النطاق الفرعي عبر ?store=
    const q = request.nextUrl.searchParams.get("store");
    if (q && SUB_RE.test(q.trim().toLowerCase())) {
      tenant = "store";
      slug = q.trim().toLowerCase();
    }
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-tenant", tenant);
  if (slug) requestHeaders.set("x-store-slug", slug);

  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: [
    // كل المسارات ما عدا الملفات الثابتة
    "/((?!_next/static|_next/image|favicon.ico|icon.svg|uploads/|seed/|api/uploads/.*\\..*).*)",
  ],
};
