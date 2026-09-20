// ============================================================
// وثبة — نموذج المنتج (إضافة/تعديل) — مشترك بين لوحة المالك ولوحة العميل
// ============================================================

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2 } from "lucide-react";
import type { Category, Product } from "@/lib/types";
import { Card, Field, inputCls, PrimaryBtn, GhostBtn, Toggle } from "./ui";
import { FormAlerts } from "./use-api";
import UploadField from "./upload-field";

interface Props {
  storeId: string;
  categories: Category[];
  product?: Product;
  backHref: string;
}

export default function ProductForm({ storeId, categories, product, backHref = "/admin/products" }: Props) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [name, setName] = useState(product?.name ?? "");
  const [description, setDescription] = useState(product?.description ?? "");
  const [price, setPrice] = useState(product ? String(product.price) : "");
  const [oldPrice, setOldPrice] = useState(product?.oldPrice != null ? String(product.oldPrice) : "");
  const [stock, setStock] = useState(product?.stock != null ? String(product.stock) : "");
  const [visible, setVisible] = useState(product?.isVisible ?? true);
  const [categoryId, setCategoryId] = useState(product?.categoryId ?? "");
  const [images, setImages] = useState<string[]>(product?.images.map((i) => i.url) ?? []);

  async function submit() {
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const body = {
        storeId,
        name: name.trim(),
        description: description.trim(),
        price: Number(price) || 0,
        oldPrice: oldPrice ? Number(oldPrice) : null,
        stock: stock !== "" ? Number(stock) : null,
        isVisible: visible,
        categoryId: categoryId || null,
        images,
      };
      const res = await fetch(product ? `/api/products/${product.id}` : "/api/products", {
        method: product ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "فشل الحفظ");
      setSuccess("تم حفظ المنتج — يظهر الآن في المتجر");
      router.refresh();
      setTimeout(() => router.push(product ? backHref : `${backHref}`), 800);
    } catch (e) {
      setError(e instanceof Error ? e.message : "حدث خطأ");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <FormAlerts error={error} success={success} />
      <Card>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Field label="اسم المنتج" required>
              <input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} placeholder="لاتيه" />
            </Field>
          </div>
          <div className="sm:col-span-2">
            <Field label="الوصف">
              <textarea className={inputCls} rows={4} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="وصف المنتج الذي يقرؤه الزائر…" />
            </Field>
          </div>
          <Field label="السعر" required>
            <input className={inputCls} dir="ltr" type="number" min="0" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="25" />
          </Field>
          <Field label="السعر السابق (اختياري)">
            <input className={inputCls} dir="ltr" type="number" min="0" step="0.01" value={oldPrice} onChange={(e) => setOldPrice(e.target.value)} placeholder="35" />
          </Field>
          <Field label="المخزون (اختياري)" hint="اتركه فارغًا إذا لم ترغب بإظهار الكمية">
            <input className={inputCls} dir="ltr" type="number" min="0" value={stock} onChange={(e) => setStock(e.target.value)} placeholder="50" />
          </Field>
          <Field label="القسم">
            <select className={inputCls} value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
              <option value="">بدون قسم</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </Field>
        </div>
      </Card>

      <Card>
        <UploadField
          storeId={storeId}
          folder="products"
          label="صور المنتج"
          value={images}
          onChange={setImages}
          hint="أول صورة هي الرئيسية — يمكنك رفع عدة صور"
        />
        <div className="mt-5 flex items-center justify-between border-t border-ink-100 pt-5">
          <Toggle checked={visible} onChange={setVisible} label={visible ? "المنتج ظاهر" : "المنتج مخفي"} />
          <div className="flex gap-2">
            <GhostBtn onClick={() => router.push(backHref)}>
              <ArrowRight className="h-4 w-4" />
              رجوع
            </GhostBtn>
            <PrimaryBtn onClick={() => void submit()} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {product ? "حفظ التعديلات" : "إضافة المنتج"}
            </PrimaryBtn>
          </div>
        </div>
      </Card>
    </div>
  );
}
