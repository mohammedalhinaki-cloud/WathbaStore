// ============================================================
// POST /api/upload — رفع صورة (multipart)
// body: storeId, folder (logo|cover|products|pages), file
// العزل: الملفات تُحفظ داخل مسار المتجر stores/{store_id}/...
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { services } from "@/lib/services";
import { ok, badRequest, requireStoreActor } from "@/lib/api-utils";

const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/svg+xml"];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

export async function POST(req: NextRequest) {
  const form = await req.formData().catch(() => null);
  if (!form) return badRequest("نموذج غير صالح");

  const storeId = String(form.get("storeId") ?? "");
  const folder = String(form.get("folder") ?? "products");
  if (!["logo", "cover", "products", "pages"].includes(folder)) {
    return badRequest("مجلد غير صالح");
  }
  if (!storeId) return badRequest("storeId مطلوب");

  const actor = await requireStoreActor(storeId);
  if (actor instanceof NextResponse) return actor;

  const file = form.get("file");
  if (!(file instanceof File)) return badRequest("لم يتم إرفاق صورة");
  if (!ALLOWED.includes(file.type)) return badRequest("نوع الصورة غير مدعوم (جيد: JPG, PNG, WebP, GIF)");
  if (file.size > MAX_SIZE) return badRequest("حجم الصورة يتجاوز 5MB");

  const buffer = Buffer.from(await file.arrayBuffer());
  const url = await services().uploadImage(storeId, folder as "logo", buffer, file.name);
  await services().logActivity(
    { id: actor.id, email: actor.email },
    storeId,
    "image.uploaded",
    { folder, name: file.name }
  );
  return ok({ url }, 201);
}
