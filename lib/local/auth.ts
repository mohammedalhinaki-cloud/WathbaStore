// ============================================================
// المصادقة المحلية (الوضع التجريبي) — scrypt + جلسة HMAC
// ============================================================

import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import type { ResponseCookie } from "next/dist/compiled/@edge-runtime/cookies";
import { sharedCookieDomain } from "../constants";

const DATA_DIR = path.join(process.cwd(), ".data");

export function dataDir(): string {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  return DATA_DIR;
}

function secret(): string {
  const file = path.join(dataDir(), "session-secret");
  try {
    return fs.readFileSync(file, "utf8");
  } catch {
    const s = randomBytes(32).toString("hex");
    fs.writeFileSync(file, s);
    return s;
  }
}

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  try {
    const [salt, hash] = stored.split(":");
    if (!salt || !hash) return false;
    const test = scryptSync(password, salt, 64);
    const expected = Buffer.from(hash, "hex");
    return test.length === expected.length && timingSafeEqual(test, expected);
  } catch {
    return false;
  }
}

export const SESSION_COOKIE = "wst_session";
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export function signSession(userId: string): string {
  const payload = Buffer.from(
    JSON.stringify({ uid: userId, exp: Date.now() + SESSION_TTL_MS })
  ).toString("base64url");
  const sig = createHmac("sha256", secret()).update(payload).digest("base64url");
  return `${payload}.${sig}`;
}

export function verifySession(token: string): { uid: string } | null {
  try {
    const [payload, sig] = token.split(".");
    if (!payload || !sig) return null;
    const expected = createHmac("sha256", secret()).update(payload).digest("base64url");
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (!data.uid || !data.exp || Date.now() > data.exp) return null;
    return { uid: data.uid };
  } catch {
    return null;
  }
}

/**
 * خيارات كوكي الجلسة في الوضع التجريبي.
 * `host` هو مضيف الطلب: على النطاق الحقيقي تُكتب الكوكي على النطاق الأب
 * (`.maaoun.com`) ليعمل الدخول على كل النطاقات الفرعية، وعلى المعاينة
 * المحلية تبقى كما هي.
 */
export function sessionCookieOptions(host?: string | null) {
  const domain = sharedCookieDomain(host);
  const secure = domain ? true : process.env.NODE_ENV === "production" && !isLocalhost();
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure,
    maxAge: 7 * 24 * 60 * 60,
    path: "/",
    ...(domain ? { domain } : {}),
  };
}

function isLocalhost(): boolean {
  const h = process.env.HOST || "";
  return h.includes("localhost") || h.includes("127.0.0.1") || h.endsWith(".e2b.app");
}
