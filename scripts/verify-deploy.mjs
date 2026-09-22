#!/usr/bin/env node
/**
 * ============================================================
 * معين maaoun.com — فحص ما بعد النشر (post-deploy verification)
 * ============================================================
 *
 * الغرض:
 *   آخر حادثة كسرت تبويبات لوحة المالك كانت «رفع غير كامل للملفات
 *   الثابتة (assets)» — الـ Worker نُشر بنجاح لكن ملفات الـ chunks
 *   الخاصة بالمسارات (app/**) لم تصل إلى طبقة Cloudflare Assets،
 *   فكل تنقّل بين تبويبات اللوحة كان يفشل بخطأ 404 في المتصفح.
 *
 *   هذا السكربت يقرأ كل ملفات .open-next/assets الناتجة عن البناء
 *   ثم يتحقق من أن كل ملف منها متاح فعليًا على الموقع المنشور
 *   بنفس المسار والـ hash. أي ملف ناقص => فشل الفحص (exit 1).
 *
 * الاستخدام:
 *   npm run cf-deploy          # يُشغَّل تلقائيًا بعد النشر
 *   node scripts/verify-deploy.mjs                 # فحص يدوي
 *   VERIFY_BASE_URL=https://... node scripts/verify-deploy.mjs
 *                                                  # فحص نطاق آخر
 */

import { readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = new URL("..", import.meta.url).pathname.replace(/\/$/, "");
const ASSETS_DIR = join(ROOT, ".open-next", "assets");
const BASE_URL = (process.env.VERIFY_BASE_URL || "https://maaoun.com").replace(/\/$/, "");
const CONCURRENCY = 5;
const RETRIES = 3;
const RETRY_DELAY_MS = 4000;
// ملفات وصفية (metadata) لا تُخدَم كروابط مباشرة
const META_FILES = new Set(["_headers"]);

function listFiles(dir, acc = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) listFiles(full, acc);
    else if (statSync(full).size > 0 && !META_FILES.has(entry.name)) acc.push(full);
  }
  return acc;
}

async function checkPath(relPath) {
  // المسار يُرسل كما هو (الأقواس (owner) جزء طبيعي من رابط الـ chunk)
  const url = new URL(relPath, BASE_URL);
  for (let attempt = 1; ; attempt++) {
    try {
      const res = await fetch(url, { method: "GET", cache: "no-store" });
      if (res.status === 200) return { relPath, ok: true };
      if (res.status === 404) {
        // إعادة محاولة قصيرة لاستبعاد تأخير انتشار النسخ الاحتياطي
        if (attempt < RETRIES) {
          await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
          continue;
        }
        return { relPath, ok: false, status: 404 };
      }
      return { relPath, ok: false, status: res.status };
    } catch (err) {
      if (attempt < RETRIES) {
        await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
        continue;
      }
      return { relPath, ok: false, error: String(err?.message || err) };
    }
  }
}

async function main() {
  const files = listFiles(ASSETS_DIR).map((f) => relative(ASSETS_DIR, f).split("\\").join("/"));
  if (files.length === 0) {
    console.error("✗ لم يتم العثور على ملفات داخل .open-next/assets — شغّل npm run cf-build أولًا.");
    process.exit(1);
  }

  console.log(`\n🔎 فحص اكتمال الملفات الثابتة على: ${BASE_URL}`);
  console.log(`   عدد الملفات: ${files.length}\n`);

  const results = [];
  let done = 0;
  const queue = [...files];
  async function worker() {
    while (queue.length > 0) {
      const relPath = queue.shift();
      if (relPath === undefined) return;
      const result = await checkPath(relPath);
      results.push(result);
      done++;
      const mark = result.ok ? "✓" : "✗";
      console.log(
        `  ${mark} ${String(done).padStart(3)}/${files.length}  ${relPath}` +
          (result.ok ? "" : `  → ${result.status ?? result.error}`)
      );
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));

  const missing = results.filter((r) => !r.ok);
  console.log("");
  if (missing.length === 0) {
    console.log(`✅ اكتمل الفحص: جميع ${files.length} ملفًا متوفرة على الموقع المنشور.`);
    process.exit(0);
  }
  console.error(`❌ فشل الفحص: ${missing.length} ملف ناقص/غير متاح على الموقع المنشور:`);
  for (const m of missing) console.error(`   - ${m.relPath}  (${m.status ?? m.error})`);
  console.error("");
  console.error("   الحل: أعد النشر من جديد (npm run cf-deploy) ثم أعد تشغيل هذا الفحص.");
  console.error("   إن استمرت النقصان: من لوحة Cloudflare → Worker → Versions → Rollback إلى آخر إصدار سليم، ثم أعد النشر.");
  process.exit(1);
}

main().catch((err) => {
  console.error("خطأ غير متوقع أثناء الفحص:", err);
  process.exit(1);
});
