// ============================================================
// معين — خدمة الصور المرفوعة (الوضع المحلي فقط)
// المسار: /uploads/{store_id}/{folder}/{file}
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";

const MIME: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".avif": "image/avif",
};

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ path: string[] }> }
) {
  const { path: segments } = await ctx.params;
  if (!segments || segments.length < 3) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  // storeId/folder/file — نتأكد من سلامة الأجزاء
  if (segments.some((s) => !/^[a-zA-Z0-9._-]+$/.test(s))) {
    return NextResponse.json({ error: "bad path" }, { status: 400 });
  }
  const file = path.join(process.cwd(), ".data", "uploads", ...segments);
  const real = path.resolve(file);
  const root = path.resolve(process.cwd(), ".data", "uploads");
  if (!real.startsWith(root) || !fs.existsSync(real)) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  const ext = path.extname(real).toLowerCase();
  const mime = MIME[ext] ?? "application/octet-stream";
  const buf = fs.readFileSync(real);
  return new NextResponse(buf, {
    headers: {
      "Content-Type": mime,
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
