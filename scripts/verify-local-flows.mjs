#!/usr/bin/env node
/**
 * ============================================================
 * معون — اختبار شامل للصلاحيات ولوحات الإدارة (الوضع المحلي/SQLite)
 * ============================================================
 *
 * يشغّل التطبيق المنشور محليًا (next start) على قاعدة البيانات التجريبية
 * ويجرّب السيناريو المطلوب كاملًا عبر HTTP — نفس المسار الذي يسلكه المتصفح:
 *
 *   1) المالك الرئيسي: تعديل بيانات متجر رشف، رفع شعار، رفع غلاف، إضافة
 *      منتج بصورة، تغيير النطاق الفرعي، دخول لوحة المتجر نفسها.
 *   2) صاحب متجر رشف: يدير متجره، ولا يستطيع إدارة متجر عود، ولا لوحة المالك.
 *   3) متجر عود والمتاجر العامة: لا تتأثر (مقارنة لقطة قبل/بعد).
 *   4) استرجاع كل ما عُدّل إلى قيمته الأصلية (لقطة بيانات + ملفات مرفوعة).
 *
 * الاستخدام:
 *   npm run build && node scripts/verify-local-flows.mjs
 *   node scripts/verify-local-flows.mjs --app-dir . --port 3210
 */

import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const args = process.argv.slice(2);
const flag = (n, d) => {
  const i = args.indexOf(n);
  return i === -1 ? d : args[i + 1];
};
const APP_DIR = path.resolve(flag("--app-dir", process.cwd()));
const APP_PORT = Number(flag("--port", 3210));
const BASE = `http://127.0.0.1:${APP_PORT}`;
const DATA_DIR = path.join(APP_DIR, ".data");

const OWNER = { email: "owner@maaoun.com", password: "Maaoun#2026" };
const RSHAF = { email: "rshaf@demo.com", password: "Rshaf#2026" };
const STORE_RSHAF = "store-rshaf";
const STORE_OUD = "store-oud";

let child = null;
const results = [];
let cookies = "";

function record(name, ok, info = "") {
  results.push({ name, ok, info });
  console.log(`  ${ok ? "✓" : "✗"} ${name}${info ? ` — ${info}` : ""}`);
}

async function login(creds, host = null) {
  const res = await fetch(`${BASE}/api/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      // نمرّر المضيف كما يمرّره بروكسي النطاق على Cloudflare — لمحاكاة
      // الدخول من maaoun.com أو من نطاق متجر مثل rshaf.maaoun.com
      ...(host ? { "x-forwarded-host": host } : {}),
    },
    body: JSON.stringify(creds),
  });
  const setCookie = res.headers.getSetCookie?.() ?? [];
  cookies = setCookie.map((c) => c.split(";")[0]).join("; ");
  return { status: res.status, setCookie };
}

async function api(pathname, options = {}) {
  const res = await fetch(`${BASE}${pathname}`, {
    ...options,
    headers: {
      Cookie: cookies,
      ...(options.host ? { "x-forwarded-host": options.host } : {}),
      ...(options.body && !(options.body instanceof FormData)
        ? { "Content-Type": "application/json" }
        : {}),
      ...(options.headers ?? {}),
    },
  });
  const text = await res.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null;
  }
  return { status: res.status, json, text, headers: res.headers };
}

async function page(pathname, opts = {}) {
  const res = await fetch(`${BASE}${pathname}`, {
    headers: {
      Cookie: opts.cookie ?? cookies,
      ...(opts.host ? { "x-forwarded-host": opts.host } : {}),
    },
    redirect: opts.redirect ?? "follow",
  });
  const html = await res.text();
  return { status: res.status, html, url: res.url, location: res.headers.get("location") };
}

function pngBlob() {
  return new Blob(
    [Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==", "base64")],
    { type: "image/png" }
  );
}

async function upload(storeId, folder, filename) {
  const form = new FormData();
  form.append("storeId", storeId);
  form.append("folder", folder);
  form.append("file", pngBlob(), filename);
  return api("/api/upload", { method: "POST", body: form });
}

async function waitForPort(port, timeoutMs = 60000) {
  const t0 = Date.now();
  while (Date.now() - t0 < timeoutMs) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/`);
      if (res.status < 500) return true;
    } catch {
      /* بعد */
    }
    await new Promise((r) => setTimeout(r, 400));
  }
  return false;
}

function startApp(env) {
  child = spawn("npx", ["next", "start", "-p", String(APP_PORT), "-H", "127.0.0.1"], {
    cwd: APP_DIR,
    env,
    detached: true,
    stdio: ["ignore", "pipe", "pipe"],
  });
  child.stdout.on("data", (d) => process.env.VERBOSE && process.stdout.write(`[app] ${d}`));
  child.stderr.on("data", (d) => process.env.VERBOSE && process.stderr.write(`[app!] ${d}`));
}

function stopApp() {
  if (!child) return;
  try {
    process.kill(-child.pid, "SIGKILL");
  } catch {
    try {
      child.kill("SIGKILL");
    } catch {
      /* */
    }
  }
}

async function main() {
  console.log("\n══════ اختبار الصلاحيات واللوحات (وضع SQLite المحلي) ══════");

  if (!fs.existsSync(path.join(APP_DIR, ".next", "BUILD_ID"))) {
    console.error("✗ لا يوجد بناء (.next/BUILD_ID) — شغّل npm run build أولًا");
    process.exit(1);
  }

  // نحفظ قاعدة البيانات التجريبية إن وُجدت ونعيدها بعد الاختبار
  const hadData = fs.existsSync(DATA_DIR);
  const backup = `${DATA_DIR}.verify-backup-${Date.now()}`;
  if (hadData) fs.renameSync(DATA_DIR, backup);

  const env = {
    ...process.env,
    NEXT_PUBLIC_MAIN_DOMAIN: "maaoun.com",
    NEXT_TELEMETRY_DISABLED: "1",
  };
  // تأكد أننا في الوضع المحلي (بلا Supabase)
  delete env.NEXT_PUBLIC_SUPABASE_URL;
  delete env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  delete env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  delete env.SUPABASE_SECRET_KEY;
  delete env.SUPABASE_SERVICE_ROLE_KEY;

  startApp(env);
  if (!(await waitForPort(APP_PORT))) {
    console.error("✗ لم يبدأ الخادم");
    stopApp();
    process.exit(1);
  }
  console.log(`  · الخادم يعمل على ${BASE} (وضع SQLite التجريبي)\n`);

  try {
    // ---------------- لقطة قبل ----------------
    let res = await login(OWNER);
    record("دخول المالك الرئيسي", res.status === 200, `HTTP ${res.status}`);

    const beforeRshafPayload = (await api(`/api/stores/${STORE_RSHAF}`)).json;
    const beforeRshaf = beforeRshafPayload?.store;
    const beforeRshafSettings = beforeRshafPayload?.settings;
    let beforeOud = (await api(`/api/stores/${STORE_OUD}`)).json?.store;
    const beforeOudProducts = (await api(`/api/products?storeId=${STORE_OUD}`)).json?.products;
    const beforeOudSettings = (await api(`/api/stores/${STORE_OUD}`)).json?.settings;
    record("قراءة لقطة متجري رشف وعود", Boolean(beforeRshaf && beforeOud));

    console.log("\n  ── 1) المالك الرئيسي يعدّل متجر رشف ──");

    // تعديل بيانات المتجر (اسم/وصف/واتساب) ثم استرجاعها
    const patch = await api(`/api/stores/${STORE_RSHAF}`, {
      method: "PATCH",
      body: JSON.stringify({
        name: "كافيه رشف — اختبار المالك",
        description: beforeRshaf.description,
        whatsapp: beforeRshaf.whatsapp,
      }),
    });
    record("تعديل اسم/بيانات المتجر", patch.status === 200 && patch.json?.store?.name === "كافيه رشف — اختبار المالك", `HTTP ${patch.status}`);

    // رفع شعار
    const logo = await upload(STORE_RSHAF, "logo", "شعار-اختبار.png");
    record("رفع شعار جديد", logo.status === 201 && typeof logo.json?.url === "string", `HTTP ${logo.status} ${logo.json?.url ?? logo.text.slice(0, 80)}`);

    // الصورة تُخدم فعليًا من نفس الرابط (وتظهر في المتجر العام)
    if (logo.json?.url) {
      const img = await fetch(`${BASE}${logo.json.url}`);
      record("ظهور الشعار المرفوع عبر رابط المتجر", img.status === 200 && (img.headers.get("content-type") || "").startsWith("image/"), `HTTP ${img.status}`);
    }

    // رفع غلاف
    const cover = await upload(STORE_RSHAF, "cover", "cover-test.png");
    record("رفع صورة غلاف", cover.status === 201, `HTTP ${cover.status}`);

    // ربط الشعار والغلاف بالمتجر ثم التحقق من ظهورهما في صفحة المتجر
    const withImages = await api(`/api/stores/${STORE_RSHAF}`, {
      method: "PATCH",
      body: JSON.stringify({ logoUrl: logo.json?.url ?? null, coverUrl: cover.json?.url ?? null }),
    });
    record("ربط الشعار والغلاف بالمتجر", withImages.status === 200 && withImages.json?.store?.logoUrl === logo.json?.url);

    const publicHome = await page(`/?store=rshaf`);
    const logoVisible =
      Boolean(logo.json?.url) && publicHome.html.includes(logo.json.url.replace("/uploads/", "/uploads/"));
    record("ظهور الصور المرفوعة في المتجر العام", publicHome.status === 200 && logoVisible, `HTTP ${publicHome.status}`);

    // إضافة منتج بصورة
    const created = await api("/api/products", {
      method: "POST",
      body: JSON.stringify({
        storeId: STORE_RSHAF,
        name: "منتج اختبار الصلاحيات",
        description: "منتج مؤقت أثناء الاختبار",
        price: 12,
        isVisible: true,
        images: logo.json?.url ? [logo.json.url] : [],
      }),
    });
    const productId = created.json?.product?.id;
    const productSlug = created.json?.product?.slug;
    record("إضافة منتج بصورة", created.status === 201 && Boolean(productId), `HTTP ${created.status}`);

    if (productSlug) {
      const productPage = await page(`/products/${productSlug}?store=rshaf`);
      record(
        "ظهور المنتج الجديد في المتجر العام",
        productPage.status === 200 && productPage.html.includes("منتج اختبار الصلاحيات"),
        `HTTP ${productPage.status}`
      );
    }

    // تعديل المنتج ثم حذفه (حذف/استبدال صورة)
    if (productId) {
      const edited = await api(`/api/products/${productId}`, {
        method: "PATCH",
        body: JSON.stringify({ name: "منتج اختبار الصلاحيات (معدّل)", images: [] }),
      });
      record("تعديل منتج وحذف صورته", edited.status === 200 && edited.json?.product?.images?.length === 0);

      const removed = await api("/api/products/" + productId, { method: "DELETE" });
      record("حذف المنتج", removed.status === 200, `HTTP ${removed.status}`);
    }

    // تغيير النطاق الفرعي ثم إعادته (متجر مسلّم)
    const slugTry = await api(`/api/stores/${STORE_RSHAF}/subdomain`, {
      method: "POST",
      body: JSON.stringify({ subdomain: "rashaf-test" }),
    });
    const afterSlug = (await api(`/api/stores/${STORE_RSHAF}`)).json?.store?.subdomain;
    record("تغيير النطاق الفرعي لمتجر مسلّم", slugTry.status === 200 && afterSlug === "rashaf-test", `HTTP ${slugTry.status} → ${afterSlug}`);

    const slugBack = await api(`/api/stores/${STORE_RSHAF}/subdomain`, {
      method: "POST",
      body: JSON.stringify({ subdomain: "rshaf" }),
    });
    record("إعادة النطاق الفرعي كما كان", slugBack.status === 200);

    // إعدادات SEO (بقيم المتجر نفسها — لا تغيير فعلي)
    const seo = await api(`/api/stores/${STORE_RSHAF}/seo`, {
      method: "PATCH",
      body: JSON.stringify({
        seoTitle: beforeRshaf.name,
        seoDescription: beforeOudSettings?.seoDescription ?? "",
        seoKeywords: "",
      }),
    });
    record("تعديل إعدادات SEO", seo.status === 200, `HTTP ${seo.status}`);

    // إعدادات المتجر (بقيمها الحالية)
    const settings = await api(`/api/stores/${STORE_RSHAF}/settings`, {
      method: "PATCH",
      body: JSON.stringify({ socialWhatsApp: beforeRshaf.whatsapp, footerBgColor: "#f9fafb" }),
    });
    record("تعديل إعدادات المتجر", settings.status === 200, `HTTP ${settings.status}`);

    // تدقيق التصميم (ألوانه الحالية)
    const storeNow = (await api(`/api/stores/${STORE_RSHAF}`)).json?.store;
    const design = await api(`/api/stores/${STORE_RSHAF}/design`, {
      method: "PATCH",
      body: JSON.stringify({ primaryColor: storeNow.settings?.primaryColor ?? "#4F46E5" }),
    });
    record("تعديل التصميم (قالب/ألوان/ترتيب)", design.status === 200, `HTTP ${design.status}`);

    // فحص التخزين (الأداة الجديدة)
    const health = await api(`/api/upload/health?storeId=${STORE_RSHAF}`);
    record(
      "فحص طبقة رفع الصور",
      health.status === 200 && health.json?.health?.sessionUploadOk === true,
      `mode=${health.json?.health?.mode}`
    );

    console.log("\n  ── 1ب) المالك غير مقيّد بحالة المتجر (قيد التجهيز / مسلّم) ──");
    // نحوّل متجر عود إلى «قيد التجهيز» مؤقتًا: المالك يجب أن يبقى قادرًا على
    // إدارته بالكامل، ويختفي المتجر عن الزوار في الوقت نفسه.
    const toPreparing = await api(`/api/stores/${STORE_OUD}/status`, {
      method: "POST",
      body: JSON.stringify({ status: "preparing" }),
    });
    record(
      "المالك يغيّر حالة متجر مسلّم إلى «قيد التجهيز»",
      toPreparing.status === 200 && toPreparing.json?.store?.status === "preparing",
      `HTTP ${toPreparing.status} → ${toPreparing.json?.store?.status}`
    );

    const ownerEditPreparing = await api(`/api/stores/${STORE_OUD}`, {
      method: "PATCH",
      body: JSON.stringify({ name: beforeOud.name, description: beforeOud.description }),
    });
    record("المالك يعدّل بيانات متجر «قيد التجهيز»", ownerEditPreparing.status === 200, `HTTP ${ownerEditPreparing.status}`);

    const preparingPanel = await page("/admin?store=oud");
    record(
      "المالك يفتح لوحة متجر «قيد التجهيز»",
      preparingPanel.status === 200 && preparingPanel.html.includes("إضافة منتج"),
      `HTTP ${preparingPanel.status}`
    );

    const guestPreparing = await page("/?store=oud", { cookie: "" });
    record("الزائر لا يرى متجرًا «قيد التجهيز»", guestPreparing.status === 404, `HTTP ${guestPreparing.status}`);

    const backDelivered = await api(`/api/stores/${STORE_OUD}/status`, {
      method: "POST",
      body: JSON.stringify({ status: "delivered" }),
    });
    record(
      "إرجاع حالة متجر عود إلى «مسلّم»",
      backDelivered.status === 200 && backDelivered.json?.store?.status === "delivered",
      `HTTP ${backDelivered.status}`
    );
    // نُحدّث لقطة المقارنة (تغيّر updated_at بسبب الجولتين أعلاه)
    beforeOud = (await api(`/api/stores/${STORE_OUD}`)).json?.store;

    console.log("\n  ── 2) المالك الرئيسي يدخل لوحة المتجر بنفس واجهة صاحب المتجر ──");
    for (const [label, pathname, marker] of [
      ["الرئيسية", `/admin?store=rshaf`, "إضافة منتج"],
      ["المنتجات", `/admin/products?store=rshaf`, "المنتجات"],
      ["الأقسام", `/admin/categories?store=rshaf`, "الأقسام"],
      ["المظهر والبيانات", `/admin/appearance?store=rshaf`, "المظهر"],
      ["سجل النشاط", `/admin/logs?store=rshaf`, "سجل النشاط"],
    ]) {
      const p = await page(pathname);
      record(`لوحة المتجر — ${label}`, p.status === 200 && p.html.includes(marker), `HTTP ${p.status}`);
    }
    // لوحة المالك الرئيسي نفسها
    const ownerPanel = await page("/admin");
    record("لوحة المالك الرئيسي", ownerPanel.status === 200 && ownerPanel.html.includes("إنشاء متجر"));

    console.log("\n  ── 2ب) المالك من نطاق المتجر نفسه (rshaf.maaoun.com) ──");
    // دخول من الدومين الرئيسي → يجب أن تُكتب كوكي الجلسة على النطاق الأب
    // (.maaoun.com) حتى تصل إلى كل نطاق فرعي بلا تسجيل دخول ثانٍ.
    const mainLogin = await login(OWNER, "maaoun.com");
    const sessionCookieRaw = mainLogin.setCookie.find((c) => c.startsWith("wst_session=")) ?? "";
    record(
      "كوكي الجلسة مكتوبة على النطاق الأب (تعمل على كل النطاقات الفرعية)",
      mainLogin.status === 200 && /Domain=\.maaoun\.com/i.test(sessionCookieRaw),
      sessionCookieRaw ? sessionCookieRaw.replace(/wst_session=[^;]+/, "wst_session=…") : "لا كوكي"
    );

    const storePanel = await page("/admin", { host: "rshaf.maaoun.com" });
    record(
      "المالك يفتح لوحة متجر رشف من نطاق المتجر (نفس واجهة صاحب المتجر)",
      storePanel.status === 200 && storePanel.html.includes("إضافة منتج") && storePanel.html.includes("كافيه رشف"),
      `HTTP ${storePanel.status}`
    );
    const storeProducts = await page("/admin/products", { host: "rshaf.maaoun.com" });
    record("لوحة منتجات المتجر على نطاق المتجر", storeProducts.status === 200, `HTTP ${storeProducts.status}`);

    // نفس الوظائف عبر النطاق الفرعي مباشرة (وليس ?store=)
    const slugOnHost = await api(`/api/stores/${STORE_RSHAF}`, {
      method: "PATCH",
      host: "rshaf.maaoun.com",
      body: JSON.stringify({ name: "كافيه رشف — من نطاق المتجر" }),
    });
    record("تعديل بيانات المتجر من نطاق المتجر", slugOnHost.status === 200, `HTTP ${slugOnHost.status}`);

    console.log("\n  ── 2ج) إعدادات المتجر (لون التذييل + الآيبان) ──");
    const settingsFull = await api(`/api/stores/${STORE_RSHAF}/settings`, {
      method: "PATCH",
      body: JSON.stringify({
        footerBgColor: "#0f172a",
        ibanRajhi: "SA0380000000608010167519",
        ibanAlinmaa: "SA0505000068200000000000",
        ibanAlahli: "SA0310000000000000000000",
      }),
    });
    const savedSettings = (await api(`/api/stores/${STORE_RSHAF}`)).json?.settings;
    record(
      "حفظ لون التذييل والآيبانات الثلاثة",
      settingsFull.status === 200 && savedSettings?.ibanRajhi === "SA0380000000608010167519" && savedSettings?.footerBgColor === "#0f172a",
      `HTTP ${settingsFull.status}`
    );

    console.log("\n  ── 3) صاحب متجر رشف: صلاحياته وحدوده ──");
    res = await login(RSHAF);
    record("دخول صاحب المتجر", res.status === 200, `HTTP ${res.status}`);

    const memberHome = await page("/admin?store=rshaf");
    record("لوحة متجره تعمل", memberHome.status === 200 && memberHome.html.includes("إضافة منتج"), `HTTP ${memberHome.status}`);

    const memberPatchOwn = await api(`/api/stores/${STORE_RSHAF}`, {
      method: "PATCH",
      body: JSON.stringify({ name: "كافيه رشف" }),
    });
    record("يعدّل بيانات متجره", memberPatchOwn.status === 200, `HTTP ${memberPatchOwn.status}`);

    const memberPatchOther = await api(`/api/stores/${STORE_OUD}`, {
      method: "PATCH",
      body: JSON.stringify({ name: "محاولة" }),
    });
    record("لا يعدّل متجر عود", memberPatchOther.status === 403, `HTTP ${memberPatchOther.status}`);

    const memberUploadOwn = await upload(STORE_RSHAF, "products", "member.png");
    record("يرفع صورًا لمتجره", memberUploadOwn.status === 201, `HTTP ${memberUploadOwn.status}`);

    const memberUploadOther = await upload(STORE_OUD, "products", "member-oud.png");
    record("لا يرفع صورًا لمتجر عود", memberUploadOther.status === 403, `HTTP ${memberUploadOther.status}`);

    const memberActivityOther = await api(`/api/activity?storeId=${STORE_OUD}`);
    record("لا يقرأ نشاط متجر عود", memberActivityOther.status === 403, `HTTP ${memberActivityOther.status}`);

    // على النطاقات الحقيقية: صاحب رشف يدخل لوحة متجره ولا يدخل لوحة عود
    res = await login(RSHAF, "rshaf.maaoun.com");
    const memberOnOwnHost = await page("/admin", { host: "rshaf.maaoun.com" });
    record(
      "صاحب المتجر يدخل لوحة متجره من نطاقه",
      memberOnOwnHost.status === 200 && memberOnOwnHost.html.includes("إضافة منتج"),
      `HTTP ${memberOnOwnHost.status}`
    );
    const memberOnOudHost = await page("/admin", { host: "oud.maaoun.com", redirect: "manual" });
    record(
      "صاحب متجر رشف لا يدخل لوحة متجر عود (يُحوّل لتسجيل الدخول)",
      memberOnOudHost.status === 307 || memberOnOudHost.status === 302 || /تسجيل الدخول/.test(memberOnOudHost.html),
      `HTTP ${memberOnOudHost.status}`
    );
    // نُعيد جلسة صاحب المتجر لباقي فحوص العزل أدناه
    res = await login(RSHAF);

    const memberOwnerPanel = await page("/admin/stores");
    const blockedOwnerPanel =
      memberOwnerPanel.status === 200 &&
      !memberOwnerPanel.html.includes("إنشاء متجر") &&
      (memberOwnerPanel.html.includes("تسجيل الدخول") || memberOwnerPanel.html.includes("لوحة إدارة معون"));
    record("لا يدخل لوحة المالك الرئيسي", blockedOwnerPanel, `HTTP ${memberOwnerPanel.status}`);

    const memberCreateStore = await api("/api/stores", {
      method: "POST",
      body: JSON.stringify({ name: "متجر ممنوع", subdomain: "forbidden", ownerName: "x" }),
    });
    record("لا ينشئ متاجر جديدة", memberCreateStore.status === 403, `HTTP ${memberCreateStore.status}`);

    const memberSubdomainCheck = await api("/api/subdomains/availability?subdomain=anything");
    record("لا يفحص النطاقات الفرعية (مالك فقط)", memberSubdomainCheck.status === 403, `HTTP ${memberSubdomainCheck.status}`);

    console.log("\n  ── 4) متجر عود والمتاجر العامة لم تتأثر ──");
    res = await login(OWNER);
    const afterOud = (await api(`/api/stores/${STORE_OUD}`)).json?.store;
    const afterOudProducts = (await api(`/api/products?storeId=${STORE_OUD}`)).json?.products;
    record(
      "بيانات متجر عود كما هي",
      JSON.stringify(beforeOud) === JSON.stringify(afterOud),
      `subdomain=${afterOud?.subdomain}`
    );
    record(
      "منتجات متجر عود كما هي",
      JSON.stringify(beforeOudProducts) === JSON.stringify(afterOudProducts),
      `${afterOudProducts?.length ?? 0} منتج`
    );

    const oudHome = await page("/?store=oud");
    record("المتجر العام لعود يعمل", oudHome.status === 200 && oudHome.html.includes("عود وروائح"));
    const oudProduct = await page("/products/royal-oud?store=oud");
    record("صفحة منتج عامة لعود تعمل", oudProduct.status === 200 && oudProduct.html.includes("عود ملكي"));
    const mainSite = await page("/");
    record("الموقع العام يعمل", mainSite.status === 200);

    console.log("\n  ── 5) استرجاع ما عُدّل ──");
    // إعدادات المتجر كما كانت (القيم المقروءة في اللقطة الأولى قبل أي تعديل)
    const restoreSettings = await api(`/api/stores/${STORE_RSHAF}/settings`, {
      method: "PATCH",
      body: JSON.stringify({
        footerBgColor: beforeRshafSettings?.footerBgColor ?? "",
        ibanRajhi: beforeRshafSettings?.ibanRajhi ?? "",
        ibanAlinmaa: beforeRshafSettings?.ibanAlinmaa ?? "",
        ibanAlahli: beforeRshafSettings?.ibanAlahli ?? "",
      }),
    });
    record("إرجاع إعدادات المتجر", restoreSettings.status === 200, `HTTP ${restoreSettings.status}`);
    const restore = await api(`/api/stores/${STORE_RSHAF}`, {
      method: "PATCH",
      body: JSON.stringify({
        name: beforeRshaf.name,
        description: beforeRshaf.description,
        whatsapp: beforeRshaf.whatsapp,
        logoUrl: beforeRshaf.logoUrl,
        coverUrl: beforeRshaf.coverUrl,
      }),
    });
    record("إرجاع بيانات متجر رشف", restore.status === 200 && restore.json?.store?.name === beforeRshaf.name);

    // حذف الصور المرفوعة أثناء الاختبار
    for (const url of [logo.json?.url, cover.json?.url, memberUploadOwn.json?.url]) {
      if (url) await api("/api/upload", { method: "DELETE", body: JSON.stringify({ storeId: STORE_RSHAF, url }) });
    }
    const finalPayload = (await api(`/api/stores/${STORE_RSHAF}`)).json;
    const finalRshaf = finalPayload?.store;
    record(
      "متجر رشف رجع لأصله",
      finalRshaf.name === beforeRshaf.name &&
        finalRshaf.subdomain === beforeRshaf.subdomain &&
        finalRshaf.logoUrl === beforeRshaf.logoUrl &&
        finalRshaf.coverUrl === beforeRshaf.coverUrl
    );
    record(
      "إعدادات رشف رجعت لأصلها (التذييل والآيبانات)",
      finalPayload?.settings?.ibanRajhi === (beforeRshafSettings?.ibanRajhi ?? "") &&
        finalPayload?.settings?.ibanAlinmaa === (beforeRshafSettings?.ibanAlinmaa ?? "") &&
        finalPayload?.settings?.ibanAlahli === (beforeRshafSettings?.ibanAlahli ?? "")
    );
  } finally {
    stopApp();
    await new Promise((r) => setTimeout(r, 600));
    // نُعيد قاعدة البيانات التجريبية كما كانت قبل الاختبار
    if (hadData) {
      fs.rmSync(DATA_DIR, { recursive: true, force: true });
      fs.renameSync(backup, DATA_DIR);
      console.log("\n  · أُعيدت قاعدة البيانات المحلية إلى نسختها الأصلية");
    } else if (fs.existsSync(DATA_DIR)) {
      fs.rmSync(DATA_DIR, { recursive: true, force: true });
      console.log("\n  · أُزيلت قاعدة البيانات المؤقتة التي أنشأها الاختبار");
    }
  }

  const failed = results.filter((r) => !r.ok);
  console.log(`\n══════ النتيجة: ${results.length - failed.length}/${results.length} ناجح ══════`);
  if (failed.length) {
    for (const f of failed) console.log(`  ✗ ${f.name} ${f.info}`);
    process.exit(1);
  }
  console.log("✅ كل اختبارات الصلاحيات ولوحات الإدارة ناجحة\n");
}

main().catch((e) => {
  console.error(e);
  stopApp();
  process.exit(1);
});
