// ============================================================
// POST /api/upload — رفع صورة (multipart)
// body: storeId, folder (logo|cover|products|pages), file
// DELETE /api/upload — حذف صورة مرفوعة (استبدال/تنظيف)
// body: { storeId, url }
//
// العزل: الملفات تُحفظ داخل مسار المتجر stores/{store_id}/...
//
// الصلاحية: المالك الرئيسي (أي متجر) أو صاحب المتجر (متجره فقط).
// الفحص في طبقة API (هنا) + طبقة الخدمة + RLS في Supabase Storage.
//
// ملاحظة مهمة: كل خطأ (بما فيه أخطاء التخزين غير المتوقعة) يُعاد الآن
// كـ **JSON** برسالة عربية واضحة ورمز تقني. سابقًا كان أي استثناء غير
// ملتقط يخرج باستجابة 500 فارغة، فتظهر في الواجهة «فشل الرفع» بلا سبب.
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { services } from "@/lib/services";
import { StorageError } from "@/lib/services/types";
import { ok, badRequest, requireStoreActor, serverError } from "@/lib/api-utils";

const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/svg+xml"];
const ALLOWED_EXT: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
  svg: "image/svg+xml",
};
const FOLDERS = ["logo", "cover", "products", "pages"] as const;
type Folder = (typeof FOLDERS)[number];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB — نفس حد الخزنة

function extOf(name: string): string {
  const parts = name.toLowerCase().split(".");
  return parts.length > 1 ? parts.pop()! : "";
}

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData().catch(() => null);
    if (!form) return badRequest("نموذج غير صالح");

    const storeId = String(form.get("storeId") ?? "").trim();
    const folder = String(form.get("folder") ?? "products").trim() as Folder;
    if (!FOLDERS.includes(folder)) return badRequest("مجلد غير صالح");
    if (!storeId) return badRequest("storeId مطلوب");

    const actor = await requireStoreActor(storeId);
    if (actor instanceof NextResponse) return actor;

    const file = form.get("file");
    if (!(file instanceof File)) return badRequest("لم يتم إرفاق صورة");
    if (file.size <= 0) return badRequest("الملف فارغ");
    if (file.size > MAX_SIZE) return badRequest("حجم الصورة يتجاوز 5MB");

    // نوع الملف: نعتمد النوع المُعلن، وإن كان فارغًا/عامًا نستنتجه من الامتداد
    const ext = extOf(file.name);
    const guess = ALLOWED_EXT[ext];
    const type = ALLOWED.includes(file.type) ? file.type : (guess ?? "");
    if (!type) {
      return badRequest(
        "نوع الصورة غير مدعوم (المدعوم: JPG, PNG, WebP, GIF, SVG)",
        "mime_not_allowed",
        `النوع المُرسل: ${file.type || "غير معروف"}`
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const url = await services().uploadImage(storeId, folder, buffer, file.name);
    await services().logActivity(
      { id: actor.id, email: actor.email },
      storeId,
      "image.uploaded",
      { folder, name: file.name, size: file.size }
    );
    return ok({ url }, 201);
  } catch (e) {
    if (e instanceof StorageError) {
      console.error(`[upload] فشل الرفع (${e.code}):`, e.detail ?? e.message);
      return NextResponse.json(
        { error: e.message, code: e.code, detail: e.detail },
        { status: e.status || 500 }
      );
    }
    return serverError(e, "فشل رفع الصورة — راجع تفاصيل الخطأ");
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => null)) as { storeId?: string; url?: string } | null;
    const storeId = String(body?.storeId ?? "").trim();
    const url = String(body?.url ?? "").trim();
    if (!storeId || !url) return badRequest("storeId و url مطلوبان");

    const actor = await requireStoreActor(storeId);
    if (actor instanceof NextResponse) return actor;

    const deleted = await services().deleteImage(url);
    if (deleted) {
      await services().logActivity(
        { id: actor.id, email: actor.email },
        storeId,
        "image.deleted",
        { url }
      );
    }
    return ok({ ok: true, deleted });
  } catch (e) {
    return serverError(e, "تعذر حذف الصورة");
  }
}
