// ============================================================
// وثبة — Middleware: كشف المستأجر من النطاق (subdomain)
//
// rshaf.waathba.com  →  x-tenant: store, x-store-slug: rshaf
// waathba.com        →  x-tenant: main
//
// الدومين الرئيسي قابل للتهيئة عبر NEXT_PUBLIC_MAIN_DOMAIN
// المعاينة (نطاق واحد): /?store=rshaf تحاكي النطاق الفرعي
//
// شبكة أمان لوضع المعاينة: نتذكر آخر متجر تمت زيارته في كوكي، فإذا فُتح
// مسار يخص المتاجر فقط (مثل /checkout) بدون ?store= نُعاد التوجيه إليه
// بالمعامل الصحيح — بدل أن يظهر «الصفحة غير موجودة».
// ============================================================

import { NextResponse, type NextRequest } from "next/server";

/**
 * الدومين الرئيسي يُقرأ من متغير البيئة NEXT_PUBLIC_MAIN_DOMAIN،
 * مع العودة إلى waathba.com إن لم يُضبط.
 *
 * ملاحظة: Next.js يستبدل متغيرات NEXT_PUBLIC_ وقت البناء، لذلك أي تغيير
 * لقيمة المتغير في Cloudflare يحتاج إعادة بناء كي يسري.
 */
const MAIN_DOMAIN = (process.env.NEXT_PUBLIC_MAIN_DOMAIN || "waathba.com")
  .trim()
  .toLowerCase()
  .replace(/^https?:\/\//, "")
  .replace(/\/.*$/, "")
  .replace(/:\d+$/, "")
  .replace(/^\.+|\.+$/g, "");

const MAIN_HOSTS = [MAIN_DOMAIN, `www.${MAIN_DOMAIN}`];
const SUB_RE = /^[a-z0-9](?:[a-z0-9-]{0,60}[a-z0-9])?$/;

/** كوكي يحفظ آخر متجر في وضع المعاينة (نطاق واحد) */
const PREVIEW_STORE_COOKIE = "wathba_preview_store";
const PREVIEW_COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 يومًا

/** مسارات لا معنى لها خارج متجر — تُستخدم لشبكة الأمان أعلاه */
const STORE_ONLY_PATHS = ["/checkout", "/cart", "/products", "/categories", "/pages"];

function isStoreOnlyPath(pathname: string): boolean {
  return STORE_ONLY_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export async function middleware(request: NextRequest) {
  // يُفضَّل x-forwarded-host — يضبطه بروكسي النطاق العرضي (Cloudflare Worker)
  // ليحافظ على النطاق الفرعي الأصلي للزائر بعد إعادة توجيه الطلب داخليًا.
  const forwarded = (request.headers.get("x-forwarded-host") || "").split(",")[0].trim();
  const host = (forwarded || request.headers.get("host") || "").replace(/:\d+$/, "").toLowerCase();
  const onMainHost = host === MAIN_DOMAIN || host.endsWith(`.${MAIN_DOMAIN}`);

  let tenant: "main" | "store" = "main";
  let slug: string | null = null;
  let isPreviewMode = false;

  if (onMainHost) {
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
    isPreviewMode = true;
    const url = request.nextUrl;
    const q = url.searchParams.get("store");
    if (q && SUB_RE.test(q.trim().toLowerCase())) {
      tenant = "store";
      slug = q.trim().toLowerCase();
    } else if (isStoreOnlyPath(url.pathname)) {
      const remembered = (request.cookies.get(PREVIEW_STORE_COOKIE)?.value || "")
        .trim()
        .toLowerCase();
      if (SUB_RE.test(remembered)) {
        const target = url.clone();
        target.searchParams.set("store", remembered);
        return NextResponse.redirect(target, 307);
      }
    }
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-tenant", tenant);
  if (slug) requestHeaders.set("x-store-slug", slug);

  const response = NextResponse.next({ request: { headers: requestHeaders } });

  // نتذكر المتجر في وضع المعاينة فقط (على النطاق الحقيقي المتجر واضح من الـ Host)
  if (isPreviewMode && tenant === "store" && slug) {
    response.cookies.set(PREVIEW_STORE_COOKIE, slug, {
      path: "/",
      maxAge: PREVIEW_COOKIE_MAX_AGE,
      sameSite: "lax",
    });
  }

  return response;
}

export const config = {
  matcher: [
    // كل المسارات ما عدا الملفات الثابتة
    "/((?!_next/static|_next/image|favicon.ico|icon.svg|uploads/|seed/|api/uploads/.*\\..*).*)",
  ],
};
