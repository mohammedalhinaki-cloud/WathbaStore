// ============================================================
// GET /api/upload/health?storeId= — فحص طبقة رفع الصور (المالك الرئيسي فقط)
//
// يفحص السلسلة كاملة: الواجهة → API → Supabase Storage → قاعدة البيانات:
//   • هل Supabase مضبوط؟ وهل مفتاح الخادم السري موجود؟ (لم يعد مطلوبًا للرفع)
//   • هل خزنة store-assets موجودة/عامة وما حدودها؟
//   • هل يستطيع هذا الحساب فعلًا الكتابة في مسار المتجر (RLS)؟ اختبار رفع
//     وحذف حقيقي لكائن مؤقت صغير جدًا (١×١ بكسل) يُحذف مباشرة بعد الفحص.
//
// كل النتائج JSON — نفس الشكل الذي تعرضه بطاقة «فحص رفع الصور» في اللوحة.
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { services } from "@/lib/services";
import { ok, requireOwnerUser, serverError, badRequest } from "@/lib/api-utils";

export async function GET(req: NextRequest) {
  try {
    const user = await requireOwnerUser();
    if (user instanceof NextResponse) return user;

    const storeId = (req.nextUrl.searchParams.get("storeId") ?? "").trim() || undefined;
    if (storeId) {
      const store = await services().getStore(storeId);
      if (!store) return badRequest("المتجر غير موجود");
    }

    const health = await services().storageHealth(storeId);
    return ok({ health, checkedAt: new Date().toISOString() });
  } catch (e) {
    return serverError(e, "تعذر فحص طبقة التخزين");
  }
}
