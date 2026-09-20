// ============================================================
// وثبة — Middleware: كشف المستأجر من النطاق (subdomain)
//
// rshaf.wathbastore.com  →  x-tenant: store, x-store-slug: rshaf
// wathbastore.com        →  x-tenant: main
//
// المعاينة (نطاق واحد): /?store=rshaf تحاكي النطاق الفرعي
// ============================================================

import { NextResponse, type NextRequest } from "next/server";

const MAIN_HOSTS = ["wathbastore.com", "www.wathbastore.com"];
const SUB_RE = /^[a-z0-9](?:[a-z0-9-]{0,60}[a-z0-9])?$/;

export async function middleware(request: NextRequest) {
  const host = (request.headers.get("host") || "").replace(/:\d+$/, "").toLowerCase();
  let tenant: "main" | "store" = "main";
  let slug: string | null = null;

  if (host.endsWith("wathbastore.com")) {
    const isMain =
      host === "wathbastore.com" || host === "www.wathbastore.com";
    if (!isMain) {
      const sub = host.slice(0, -( "wathbastore.com".length + 1 ));
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
