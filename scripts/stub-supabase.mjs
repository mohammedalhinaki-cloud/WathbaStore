#!/usr/bin/env node
/**
 * ============================================================
 * وثبة — خادم Supabase وهمي للاختبار المحلي
 * ============================================================
 *
 * يحاكي ما تستخدمه المنصة فعلًا من Supabase:
 *   • Auth      : /auth/v1/token , /auth/v1/user
 *   • PostgREST : /rest/v1/<table>  (select / insert / update)
 *   • Storage   : /storage/v1/bucket/<id> , /storage/v1/object/<bucket>/<path>
 *
 * ويحاكي كذلك **دلالات RLS للخزنة** بدقة:
 *   - طلب بالمفتاح السري (service key) → يمرّ دائمًا (يتجاوز RLS)
 *   - طلب بجلسة مستخدم عادي       → يمرّ فقط داخل stores/<معرّف متجره>/…
 *   - غير ذلك                     → 403 row-level security policy
 *
 * متغيرات التحكم:
 *   STUB_PORT=8788
 *   STUB_BUCKET_EXISTS=1            # 0 لمحاكاة خزنة غير موجودة
 *   STUB_SECRET_KEY=sk_test         # ما يُعتبر «مفتاح الخادم»
 *   STUB_OWNER_ID=<uuid>            # حساب المالك الرئيسي
 *   STUB_MEMBER_STORES=store-a      # متاجر العضو (مفصولة بفواصل) أو ALL
 *   STUB_PUBLIC_BUCKET=1
 */

import { createServer } from "node:http";

const PORT = Number(process.env.STUB_PORT ?? 8788);
const BUCKET = process.env.STUB_BUCKET ?? "store-assets";
const SECRET_KEY = process.env.STUB_SECRET_KEY ?? "sk_test";
const OWNER_ID = process.env.STUB_OWNER_ID ?? "11111111-1111-4111-8111-111111111111";
const MEMBER_STORES = (process.env.STUB_MEMBER_STORES ?? "ALL").split(",").map((s) => s.trim());
const BUCKET_EXISTS = process.env.STUB_BUCKET_EXISTS !== "0";
const PUBLIC_BUCKET = process.env.STUB_PUBLIC_BUCKET !== "0";

const objects = new Map(); // path -> { size, contentType }
const log = [];
let uploadAttempts = 0;

function json(res, status, body, headers = {}) {
  const payload = body === undefined ? "" : JSON.stringify(body);
  res.writeHead(status, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    ...headers,
  });
  res.end(payload);
}

function readBody(req) {
  return new Promise((resolve) => {
    const chunks = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => resolve(Buffer.concat(chunks)));
  });
}

function bearer(req) {
  const h = req.headers.authorization || "";
  return h.replace(/^Bearer\s+/i, "").trim();
}

/** هل الطلب يحمل مفتاح الخدمة؟ */
function isServiceRequest(req) {
  const token = bearer(req);
  return token === SECRET_KEY || req.headers.apikey === SECRET_KEY;
}

/** معرّف المستخدم من الرمز (نحاكي رمزًا يحمل المعرّف) */
function userIdFromToken(req) {
  const token = bearer(req);
  if (!token || token === SECRET_KEY) return null;
  if (token.startsWith("token-")) return token.slice("token-".length);
  return null;
}

/** دلالات RLS للخزنة كما في ترحيل 0003 */
function storageAllowed(req, objectPath) {
  if (isServiceRequest(req)) return { ok: true, why: "service key (يتجاوز RLS)" };
  const uid = userIdFromToken(req);
  if (!uid) return { ok: false, why: "لا جلسة" };
  const parts = objectPath.split("/");
  if (parts[0] !== "stores" || !parts[1]) return { ok: false, why: "المسار ليس داخل stores/<store>/" };
  const storeId = parts[1];
  if (uid === OWNER_ID) return { ok: true, why: "المالك الرئيسي (أي مسار)" };
  if (MEMBER_STORES.includes("ALL") || MEMBER_STORES.includes(storeId)) {
    return { ok: true, why: "عضو المتجر (مسار متجره)" };
  }
  return { ok: false, why: "ليس عضوًا في هذا المتجر" };
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url, `http://127.0.0.1:${PORT}`);
  const path = url.pathname;
  const method = req.method || "GET";
  log.push(`${method} ${path}`);

  if (method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,POST,PATCH,DELETE,OPTIONS",
      "Access-Control-Allow-Headers": "*",
    });
    return res.end();
  }

  // ---------- Auth ----------
  if (path === "/auth/v1/token") {
    const body = JSON.parse((await readBody(req)).toString() || "{}");
    if (!body.email || !body.password) return json(res, 400, { error: "invalid_grant" });
    const isOwner = body.email === (process.env.STUB_OWNER_EMAIL ?? "owner@test.com");
    const id = isOwner ? OWNER_ID : (process.env.STUB_MEMBER_ID ?? "22222222-2222-4222-8222-222222222222");
    const user = {
      id,
      aud: "authenticated",
      role: "authenticated",
      email: body.email,
      email_confirmed_at: new Date().toISOString(),
      user_metadata: { full_name: isOwner ? "مالك المنصة" : "صاحب متجر" },
      app_metadata: { provider: "email", providers: ["email"] },
      created_at: new Date().toISOString(),
    };
    return json(res, 200, {
      access_token: `token-${id}`,
      token_type: "bearer",
      expires_in: 3600,
      expires_at: Math.floor(Date.now() / 1000) + 3600,
      refresh_token: `refresh-${id}`,
      user,
    });
  }

  if (path === "/auth/v1/user") {
    const uid = userIdFromToken(req);
    if (!uid) return json(res, 401, { message: "invalid claim: missing sub claim" });
    const isOwner = uid === OWNER_ID;
    return json(res, 200, {
      id: uid,
      aud: "authenticated",
      role: "authenticated",
      email: isOwner ? (process.env.STUB_OWNER_EMAIL ?? "owner@test.com") : "member@test.com",
      user_metadata: { full_name: isOwner ? "مالك المنصة" : "صاحب متجر" },
      app_metadata: { provider: "email" },
      created_at: new Date().toISOString(),
    });
  }

  if (path === "/auth/v1/logout") return json(res, 204, undefined);

  // ---------- PostgREST ----------
  if (path.startsWith("/rest/v1/")) {
    const table = path.split("/")[3];
    const params = url.searchParams;
    const acceptsObject = (req.headers.accept || "").includes("vnd.pgrst.object+json");

    if (method === "GET") {
      if (table === "profiles") {
        const uid = params.get("id")?.replace(/^eq\./, "") ?? userIdFromToken(req);
        const isOwner = uid === OWNER_ID;
        const rows = [
          {
            id: uid,
            email: isOwner ? (process.env.STUB_OWNER_EMAIL ?? "owner@test.com") : "member@test.com",
            role: isOwner ? "owner" : "store_member",
            full_name: isOwner ? "مالك المنصة" : "صاحب متجر",
          },
        ];
        return json(res, 200, acceptsObject ? rows[0] : rows);
      }
      if (table === "store_members") {
        // العضو له عضوية في متاجره فقط (المالك الرئيسي بلا عضويات — دوره يكفيه)
        const memberships = MEMBER_STORES.includes("ALL")
          ? []
          : MEMBER_STORES.map((sid) => ({ store_id: sid, user_id: userIdFromToken(req), role: "owner" }));
        return json(res, 200, memberships);
      }
      if (table === "stores") {
        const rows = [
          {
            id: params.get("id")?.replace(/^eq\./, "") ?? "unknown",
            name: "متجر اختبار",
            subdomain: "test-store",
            status: "delivered",
            owner_name: "صاحب المتجر",
            owner_phone: "",
            owner_email: "member@test.com",
            whatsapp: "",
            description: "",
            logo_url: null,
            cover_url: null,
            client_credentials: null,
            delivered_at: new Date().toISOString(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ];
        return json(res, 200, acceptsObject ? rows[0] : rows);
      }
      // جداول عامة: نُرجع مصفوفة فارغة
      return json(res, 200, []);
    }

    if (method === "POST" || method === "PATCH") {
      await readBody(req);
      const id = params.get("id")?.replace(/^eq\./, "");
      const row = { id: id ?? "row-1", created_at: new Date().toISOString() };
      return json(res, 201, acceptsObject ? row : [row]);
    }

    if (method === "DELETE") {
      await readBody(req);
      return json(res, 204, undefined);
    }
    return json(res, 405, { message: "method not allowed" });
  }

  // ---------- Storage ----------
  if (path.startsWith("/storage/v1/bucket/")) {
    const id = decodeURIComponent(path.replace("/storage/v1/bucket/", ""));
    if (!BUCKET_EXISTS || id !== BUCKET) {
      return json(res, 404, { statusCode: "404", error: "Bucket not found", message: "Bucket not found" });
    }
    return json(res, 200, {
      id,
      name: id,
      owner: "",
      public: PUBLIC_BUCKET,
      file_size_limit: 5242880,
      allowed_mime_types: ["image/jpeg", "image/png", "image/webp", "image/gif", "image/svg+xml"],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  }

  if (path.startsWith("/storage/v1/object/public/")) {
    const key = decodeURIComponent(path.replace("/storage/v1/object/public/", ""));
    if (!objects.has(key)) return json(res, 400, { error: "not found" });
    return json(res, 200, { ok: true });
  }

  if (path.startsWith("/storage/v1/object/")) {
    const key = decodeURIComponent(path.replace("/storage/v1/object/", ""));
    const [bucket, ...rest] = key.split("/");
    const objectPath = rest.join("/");

    if (bucket !== BUCKET) {
      return json(res, 404, { statusCode: "404", error: "Bucket not found", message: "Bucket not found" });
    }
    if (!BUCKET_EXISTS) {
      return json(res, 404, { statusCode: "404", error: "Bucket not found", message: "Bucket not found" });
    }

    if (method === "POST" || method === "PUT") {
      uploadAttempts++;
      const body = await readBody(req);
      const verdict = storageAllowed(req, objectPath);
      if (!verdict.ok) {
        return json(res, 403, {
          statusCode: "403",
          error: "Unauthorized",
          message: "new row violates row-level security policy",
          why: verdict.why,
        });
      }
      if (body.length > 5242880) {
        return json(res, 413, { statusCode: "413", error: "Payload too large", message: "The object exceeded the maximum allowed size" });
      }
      objects.set(`${bucket}/${objectPath}`, { size: body.length });
      return json(res, 200, { Key: `${bucket}/${objectPath}` });
    }

    if (method === "DELETE") {
      const raw = (await readBody(req)).toString();
      let prefixes = [];
      try {
        prefixes = JSON.parse(raw || "{}").prefixes ?? [];
      } catch {
        prefixes = objectPath ? [objectPath] : [];
      }
      if (!prefixes.length && objectPath) prefixes = [objectPath];
      const results = [];
      for (const p of prefixes) {
        const verdict = storageAllowed(req, p);
        if (!verdict.ok) {
          return json(res, 403, {
            statusCode: "403",
            error: "Unauthorized",
            message: "new row violates row-level security policy",
            why: verdict.why,
          });
        }
        objects.delete(`${bucket}/${p}`);
        results.push({ name: p });
      }
      return json(res, 200, results);
    }
    return json(res, 405, { message: "method not allowed" });
  }

  // ---------- تشخيص ----------
  if (path === "/__stub/state") {
    return json(res, 200, { uploads: uploadAttempts, objects: [...objects.keys()], log: log.slice(-40) });
  }
  if (path === "/__stub/reset") {
    uploadAttempts = 0;
    objects.clear();
    log.length = 0;
    return json(res, 200, { ok: true });
  }

  return json(res, 404, { message: `no route: ${method} ${path}` });
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`[stub-supabase] يعمل على http://127.0.0.1:${PORT}  (bucket=${BUCKET}, exists=${BUCKET_EXISTS}, public=${PUBLIC_BUCKET})`);
});
