#!/usr/bin/env node
/**
 * ============================================================
 * وثبة — إعادة إنتاج سبب «فشل الرفع» واختبار الإصلاح
 * ============================================================
 *
 * يشغّل خادم Supabase وهميًا (scripts/stub-supabase.mjs) ثم يشغّل التطبيق
 * في وضع Supabase مضبوطًا عليه، ويسجّل الدخول كمالك رئيسي ويرفع صورة شعار
 * فعليًا عبر /api/upload — ويراقب: رمز الاستجابة، وجسمها، وسلوك RLS.
 *
 * الاستخدام:
 *   node scripts/repro-upload.mjs                     # الشجرة الحالية
 *   node scripts/repro-upload.mjs --app-dir /tmp/orig # كود قديم للمقارنة
 *   node scripts/repro-upload.mjs --no-secret-key     # بلا مفتاح خادم
 *   node scripts/repro-upload.mjs --no-bucket         # خزنة غير موجودة
 */

import { spawn } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import path from "node:path";
import process from "node:process";

const args = process.argv.slice(2);
const flag = (name, def) => {
  const i = args.indexOf(name);
  if (i === -1) return def;
  return args[i + 1];
};
const has = (name) => args.includes(name);

const APP_DIR = path.resolve(flag("--app-dir", process.cwd()));
const APP_PORT = Number(flag("--port", 3199));
const STUB_PORT = Number(flag("--stub-port", 8799));
const WITH_SECRET_KEY = !has("--no-secret-key");
const WRONG_SECRET_KEY = has("--wrong-secret-key");
const BUCKET_EXISTS = !has("--no-bucket");
const SECRET_KEY = "sk_stub_secret";
const OWNER_ID = "11111111-1111-4111-8111-111111111111";
const MEMBER_ID = "22222222-2222-4222-8222-222222222222";
const STORE_ID = "33333333-3333-4333-8333-333333333333"; // متجر المالك الرئيسي المطلوب تعديله
const OTHER_STORE_ID = "44444444-4444-4444-8444-444444444444"; // متجر لا يملكه العضو

const BASE = `http://127.0.0.1:${APP_PORT}`;
const children = [];
let cookies = "";

function log(...a) {
  console.log(...a);
}

function start(cmd, cmdArgs, opts) {
  const child = spawn(cmd, cmdArgs, { ...opts, detached: true, stdio: ["ignore", "pipe", "pipe"] });
  child.stdout.on("data", (d) => process.env.VERBOSE && process.stdout.write(`[${path.basename(cmd)}] ${d}`));
  child.stderr.on("data", (d) => process.env.VERBOSE && process.stderr.write(`[${path.basename(cmd)}!] ${d}`));
  children.push(child);
  return child;
}

async function waitForPort(port, timeoutMs = 120000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/`, { method: "GET" });
      if (res.status < 500) return true;
    } catch {
      /* لم يُفتح بعد */
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  return false;
}

function pngBytes() {
  return Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
    "base64"
  );
}

async function login(email) {
  const res = await fetch(`${BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password: "test-pass" }),
  });
  const setCookie = res.headers.getSetCookie?.() ?? [];
  cookies = setCookie.map((c) => c.split(";")[0]).join("; ");
  const body = await res.text();
  log(`  · تسجيل الدخول ${email}: HTTP ${res.status}${cookies ? " (كوكي جلسة ✓)" : " (بلا كوكي)"}`);
  if (res.status !== 200) log(`    ${body.slice(0, 200)}`);
  return res.status === 200;
}

async function upload(storeId, folder = "logo", name = "logo.png") {
  const form = new FormData();
  form.append("storeId", storeId);
  form.append("folder", folder);
  form.append("file", new Blob([pngBytes()], { type: "image/png" }), name);
  const res = await fetch(`${BASE}/api/upload`, { method: "POST", headers: { Cookie: cookies }, body: form });
  const text = await res.text();
  let parsed = null;
  try {
    parsed = JSON.parse(text);
  } catch {
    parsed = null;
  }
  return { status: res.status, text, parsed, contentType: res.headers.get("content-type") || "" };
}

async function deleteImage(storeId, url) {
  const res = await fetch(`${BASE}/api/upload`, {
    method: "DELETE",
    headers: { Cookie: cookies, "Content-Type": "application/json" },
    body: JSON.stringify({ storeId, url }),
  });
  const text = await res.text();
  return { status: res.status, text };
}

async function health(storeId) {
  const res = await fetch(`${BASE}/api/upload/health?storeId=${storeId}`, { headers: { Cookie: cookies } });
  const text = await res.text();
  try {
    return { status: res.status, body: JSON.parse(text) };
  } catch {
    return { status: res.status, body: text.slice(0, 200) };
  }
}

async function cleanup() {
  for (const c of children) {
    try {
      // detached: true → نقتل مجموعة العمليات كاملة (npx/next/workerd)
      process.kill(-c.pid, "SIGKILL");
    } catch {
      try {
        c.kill("SIGKILL");
      } catch {
        /* */
      }
    }
  }
  // مهلة قصيرة لتحرير المنافذ
  await new Promise((r) => setTimeout(r, 500));
}

async function main() {
  log(`\n══════ إعادة إنتاج «فشل الرفع» ══════`);
  log(`  تطبيق: ${APP_DIR}`);
  log(`  مفتاح الخادم السري: ${WITH_SECRET_KEY ? (WRONG_SECRET_KEY ? "مضبوط لكن خاطئ" : "مضبوط") : "غير مضبوط"} | خزنة store-assets: ${BUCKET_EXISTS ? "موجودة" : "غير موجودة"}`);

  if (!existsSync(path.join(APP_DIR, "node_modules"))) {
    log("✗ لا يوجد node_modules في مجلد التطبيق");
    process.exit(1);
  }

  const stub = start(process.execPath, [path.join(process.cwd(), "scripts", "stub-supabase.mjs")], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      STUB_PORT: String(STUB_PORT),
      STUB_BUCKET_EXISTS: BUCKET_EXISTS ? "1" : "0",
      STUB_SECRET_KEY: SECRET_KEY,
      STUB_OWNER_ID: OWNER_ID,
      STUB_MEMBER_ID: MEMBER_ID,
      STUB_MEMBER_STORES: OTHER_STORE_ID,
      STUB_OWNER_EMAIL: "owner@test.com",
    },
  });
  await waitForPort(STUB_PORT, 15000);

  const env = {
    ...process.env,
    NEXT_PUBLIC_SUPABASE_URL: `http://127.0.0.1:${STUB_PORT}`,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "pk_stub_public",
    NEXT_PUBLIC_MAIN_DOMAIN: "waathba.com",
    NEXT_TELEMETRY_DISABLED: "1",
  };
  if (WITH_SECRET_KEY) env.SUPABASE_SECRET_KEY = WRONG_SECRET_KEY ? "pk_wrong_key_not_a_service_key" : SECRET_KEY;
  else delete env.SUPABASE_SECRET_KEY;

  start("npx", ["next", "dev", "-p", String(APP_PORT), "-H", "127.0.0.1"], {
    cwd: APP_DIR,
    env,
  });

  if (!(await waitForPort(APP_PORT, 180000))) {
    log("✗ لم يبدأ التطبيق على المنفذ المطلوب");
    await cleanup();
    process.exit(1);
  }
  log(`  · التطبيق جاهز على ${BASE}`);

  const results = [];

  // 1) المالك الرئيسي يرفع شعارًا لمتجر لا يملك عضويت فيه (يكفيه دوره)
  if (!(await login("owner@test.com"))) {
    await cleanup();
    process.exit(1);
  }
  const ownerUpload = await upload(STORE_ID, "logo", "شعار-جديد.png");
  log(`\n  ① المالك الرئيسي — رفع شعار (metadata عربي): HTTP ${ownerUpload.status}`);
  log(`     الجسم: ${ownerUpload.text.slice(0, 220) || "(فارغ)"}`);
  results.push(["المالك يرفع شعارًا", ownerUpload.status]);

  // 2) المالك يرفع غلافًا
  const cover = await upload(STORE_ID, "cover", "cover.jpg");
  log(`  ② المالك الرئيسي — رفع غلاف: HTTP ${cover.status} ${cover.parsed?.url ?? cover.text.slice(0, 80)}`);
  results.push(["المالك يرفع غلافًا", cover.status]);

  // 3) المالك يرفع صورة منتج
  const product = await upload(STORE_ID, "products", "product.png");
  log(`  ③ المالك الرئيسي — رفع صورة منتج: HTTP ${product.status}`);
  results.push(["المالك يرفع صورة منتج", product.status]);

  // 4) حذف الصورة (استبدال/تنظيف)
  if (ownerUpload.parsed?.url) {
    const del = await deleteImage(STORE_ID, ownerUpload.parsed.url);
    log(`  ④ المالك الرئيسي — حذف صورة مرفوعة: HTTP ${del.status} ${del.text.slice(0, 120)}`);
    results.push(["المالك يحذف صورة", del.status]);
  }

  // 5) فحص التخزين
  const h = await health(STORE_ID);
  log(`  ⑤ فحص التخزين: HTTP ${h.status}`);
  if (h.body?.health) {
    const x = h.body.health;
    log(
      `     خزنة موجودة: ${x.bucketExists} | عامة: ${x.bucketPublic} | رفع بالجلسة: ${x.sessionUploadOk}` +
        ` | مفتاح الخادم: ${x.serverKeyPresent}`
    );
    for (const n of x.notes ?? []) log(`     ملاحظة: ${n}`);
  } else {
    log(`     ${String(h.body).slice(0, 160)}`);
  }

  // 6) عزل الأعضاء: صاحب متجر آخر لا يستطيع الرفع لمسار متجرٍ ليس له
  if (await login("member@test.com")) {
    const memberOwn = await upload(OTHER_STORE_ID, "logo", "m.png");
    const memberOther = await upload(STORE_ID, "logo", "m2.png");
    log(`  ⑥ صاحب متجر — متجره: HTTP ${memberOwn.status} | متجر آخر: HTTP ${memberOther.status}`);
    results.push(["العضو في متجره", memberOwn.status]);
    results.push(["العضو في متجر آخر (يجب 403)", memberOther.status]);
  }

  log(`\n  ─────── الخلاصة ───────`);
  for (const [label, status] of results) {
    const ok = label.includes("يجب 403") ? status === 403 : status === 201 || status === 200;
    log(`  ${ok ? "✓" : "✗"} ${label}: HTTP ${status}`);
  }
  log(`  (استجابات 500 بلا جسم = سبب «فشل الرفع» في الواجهة)\n`);

  const allGood = results.every(([label, status]) => (label.includes("يجب 403") ? status === 403 : status === 201 || status === 200));
  await cleanup();
  process.exit(allGood ? 0 : 2);
}

main().catch(async (e) => {
  console.error(e);
  await cleanup();
  process.exit(1);
});
