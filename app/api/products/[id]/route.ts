// ============================================================
// GET    /api/products/:id — منتج (عبر slug أو id)
// PATCH  /api/products/:id — تعديل
// DELETE /api/products/:id — حذف
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { services } from "@/lib/services";
import { ok, badRequest, requireStoreActor } from "@/lib/api-utils";
import { z } from "zod";

const PATCH_SCHEMA = z
  .object({
    storeId: z.string().min(1),
    name: z.string().min(2).max(120).optional(),
    description: z.string().max(3000).optional(),
    price: z.number().min(0).optional(),
    oldPrice: z.number().min(0).nullable().optional(),
    stock: z.number().int().min(0).nullable().optional(),
    isVisible: z.boolean().optional(),
    categoryId: z.string().nullable().optional(),
    images: z.array(z.string().max(600)).max(8).optional(),
  })
  .partial();

async function findProduct(idOrSlug: string) {
  const svc = services();
  const stores = await svc.listStores();
  for (const s of stores) {
    const p = await svc.getProduct(s.id, idOrSlug);
    if (p) return p;
  }
  return null;
}

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;
  const product = await findProduct(decodeURIComponent(id));
  if (!product) return badRequest("المنتج غير موجود");
  // القراءة العامة للمنتج مسموحة (المتجر العام) لكن نضمن التملك عبر المسار أدناه
  return ok({ product });
}

export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;
  const product = await findProduct(decodeURIComponent(id));
  if (!product) return badRequest("المنتج غير موجود");

  const actor = await requireStoreActor(product.storeId);
  if (actor instanceof NextResponse) return actor;

  const parsed = PATCH_SCHEMA.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return badRequest("بيانات غير صالحة");
  const patch = parsed.data;
  const finalPrice = patch.price ?? product.price;
  const finalOld = patch.oldPrice !== undefined ? patch.oldPrice : product.oldPrice;
  if (finalOld != null && finalOld <= finalPrice) {
    return badRequest("السعر السابق يجب أن يكون أعلى من السعر الحالي");
  }

  const updated = await services().updateProduct(product.id, {
    name: patch.name,
    description: patch.description,
    price: patch.price,
    oldPrice: patch.oldPrice,
    stock: patch.stock,
    isVisible: patch.isVisible,
    categoryId: patch.categoryId,
    images: patch.images,
  });
  await services().logActivity(
    { id: actor.id, email: actor.email },
    product.storeId,
    "product.updated",
    { name: updated.name }
  );
  return ok({ product: updated });
}

export async function DELETE(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;
  const product = await findProduct(decodeURIComponent(id));
  if (!product) return badRequest("المنتج غير موجود");

  const actor = await requireStoreActor(product.storeId);
  if (actor instanceof NextResponse) return actor;

  await services().deleteProduct(product.id);
  await services().logActivity(
    { id: actor.id, email: actor.email },
    product.storeId,
    "product.deleted",
    { name: product.name }
  );
  return ok({ ok: true });
}
