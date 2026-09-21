// POST /api/stores/:id/subdomain — تغيير النطاق الفرعي (المالك فقط)
//
// ملاحظات تصميمية مهمة:
// - هذا المسار يُرجع JSON دائمًا وفي كل الحالات (نجاح/تعارض/خطأ خادم).
//   الخطأ القديم: أي استثناء غير ملتقط كان يخرج من المسار ويرد الخادم
//   باستجابة فارغة (500 بلا body)، فكانت الواجهة تظهر خطأ
//   "Unexpected end of JSON input" بدل رسالة مفهومة.
// - تسجيل النشاط لا يُسقط نجاح العملية: فلو فشل لا يؤثر على النتيجة.
import { NextRequest, NextResponse } from "next/server";
import { services } from "@/lib/services";
import { ok, err, badRequest, requireOwnerUser } from "@/lib/api-utils";
import { validateSubdomain } from "@/lib/subdomain";

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireOwnerUser();
    if (user instanceof NextResponse) return user;
    const { id } = await ctx.params;

    const store = await services().getStore(id);
    if (!store) return badRequest("المتجر غير موجود");

    const body = await req.json().catch(() => null);
    const subdomain = String(body?.subdomain ?? "").trim().toLowerCase();
    const check = validateSubdomain(subdomain);
    if (!check.ok) return badRequest(check.reason!);
    if (subdomain === store.subdomain) return ok({ ok: true, subdomain, store });

    const res = await services().changeSubdomain(id, subdomain);
    if (!res.ok) return badRequest(res.error ?? "فشل تغيير النطاق الفرعي");

    // سجل النشاط: إجراء احتفالي — فشله لا يلغي التغيير الناجح
    try {
      await services().logActivity(
        { id: user.id, email: user.email },
        id,
        "store.subdomain_changed",
        { from: store.subdomain, to: subdomain }
      );
    } catch (logError) {
      console.error("فشل تسجيل نشاط تغيير النطاق الفرعي", logError);
    }

    const updated = (await services().getStore(id)) ?? store;
    return ok({ ok: true, subdomain, store: updated });
  } catch (e) {
    // شبكة أمان أخيرة: أي خطأ غير متوقع يعود برسالة JSON واضحة (500)
    // بدل استجابة فارغة تفسدها واجهة المتصفح.
    console.error("خطأ غير متوقع في تغيير النطاق الفرعي", e);
    return err(
      "حدث خطأ غير متوقع في الخادم أثناء تغيير النطاق. حاول مرة أخرى.",
      500
    );
  }
}
