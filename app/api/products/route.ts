// ============================================================
// GET  /api/products?storeId=&categoryId=&includeHidden= — منتجات المتجر
// POST /api/products — إضافة منتج (مع الصور)
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { services } from "@/lib/services";
import { ok, badRequest, requireStoreActor } from "@/lib/api-utils";
import { z } from "zod";

const SCHEMA = z.object({
  storeId: z.string().min(1),
  name: z.string().min(2, "اسم المنتج قصير جدًا").max(120),
  description: z.string().max(3000).optional().default(""),
  price: z.number().min(0),
  oldPrice: z.number().min(0).nullable().optional(),
  stock: z.number().int().min(0).nullable().optional(),
  isVisible: z.boolean().optional().default(true),
  categoryId: z.string().nullable().optional(),
  images: z.array(z.string().max(600)).max(8).default([]),
});

export async function GET(req: NextRequest) {
  const storeId = req.nextUrl.searchParams.get("storeId");
  if (!storeId) return badRequest("storeId مطلوب");
  const actor = await requireStoreActor(storeId);
  if (actor instanceof NextResponse) return actor;
  const categoryId = req.nextUrl.searchParams.get("categoryId") ?? undefined;
  const includeHidden = req.nextUrl.searchParams.get("includeHidden") === "1";
  const products = await services().listProducts(storeId, { categoryId, includeHidden });
  return ok({ products });
}

export async function POST(req: NextRequest) {
  const parsed = SCHEMA.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return badRequest(parsed.error.issues[0]?.message ?? "بيانات غير صالحة");
  }
  const input = parsed.data;
  const actor = await requireStoreActor(input.storeId);
  if (actor instanceof NextResponse) return actor;

  if (input.categoryId) {
    const cats = await services().listCategories(input.storeId, true);
    if (!cats.some((c) => c.id === input.categoryId)) {
      return badRequest("القسم غير موجود");
    }
  }
  if (input.oldPrice != null && input.oldPrice <= input.price) {
    return badRequest("السعر السابق يجب أن يكون أعلى من السعر الحالي");
  }

  const product = await services().createProduct(input.storeId, {
    name: input.name,
    description: input.description,
    price: input.price,
    oldPrice: input.oldPrice ?? null,
    stock: input.stock ?? null,
    isVisible: input.isVisible,
    categoryId: input.categoryId ?? null,
    images: input.images,
  });
  await services().logActivity(
    { id: actor.id, email: actor.email },
    input.storeId,
    "product.created",
    { name: input.name, price: input.price }
  );
  return ok({ product }, 201);
}
