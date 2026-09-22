// ============================================================
// معين — زر "أضف إلى السلة" لصفحة تفاصيل المنتج
// ============================================================
"use client";

import { useState } from "react";
import { ShoppingBag, Check } from "lucide-react";
import { useCart } from "./cart-context";
import type { Product } from "@/lib/types";

interface Props {
  product: Product;
}

export default function AddToCartButton({ product }: Props) {
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);
  const outOfStock = product.stock != null && product.stock <= 0;

  function handleAdd() {
    if (outOfStock) return;
    addItem(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }

  return (
    <button
      onClick={handleAdd}
      disabled={outOfStock}
      className="mt-7 flex w-full items-center justify-center gap-2.5 rounded-2xl px-6 py-4 text-lg font-extrabold text-white shadow-lg transition-transform hover:scale-[1.02] disabled:opacity-50"
      style={{ backgroundColor: added ? "#25D366" : "var(--store-primary)" }}
    >
      {added ? (
        <>
          <Check className="h-6 w-6" />
          تمت الإضافة!
        </>
      ) : (
        <>
          <ShoppingBag className="h-6 w-6" />
          {outOfStock ? "نفدت الكمية" : "أضف إلى السلة"}
        </>
      )}
    </button>
  );
}