// ============================================================
// معين — بطاقة المنتج (مع زر أضف إلى السلة)
// ============================================================

"use client";

import Image from "next/image";
import { formatPrice } from "@/lib/constants";
import { useCart } from "./cart-context";
import type { Product } from "@/lib/types";
import type { TemplateKey } from "@/lib/types";

interface Props {
  product: Product;
  storeName: string;
  whatsapp: string;
  /** ?store=xxx في وضع المعاينة */
  query: string;
  template: TemplateKey;
}

export default function ProductCard({ product, storeName, whatsapp, query, template }: Props) {
  const { addItem } = useCart();
  const priceText = formatPrice(product.price);
  const productUrl = `/products/${encodeURIComponent(product.slug)}${query || ""}`;
  const outOfStock = product.stock != null && product.stock <= 0;

  if (template === "classic") {
    return (
      <a
        href={productUrl}
        className="group flex items-center gap-4 border-b border-ink-100 py-4 transition-colors hover:bg-ink-50"
      >
        <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-ink-100">
          {product.images[0] ? (
            <Image
              src={product.images[0].url}
              alt={product.name}
              fill
              sizes="80px"
              className="object-cover"
            />
          ) : (
            <Placeholder />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-bold text-ink-900 group-hover:text-[var(--store-primary)]">
            {product.name}
          </h3>
          <p className="mt-0.5 line-clamp-1 text-xs text-ink-500">{product.description}</p>
          <div className="mt-1 flex items-center gap-2">
            <span className="font-extrabold text-[var(--store-primary)]">{priceText}</span>
            {product.oldPrice != null && (
              <span className="text-xs text-ink-400 line-through">{formatPrice(product.oldPrice)}</span>
            )}
          </div>
        </div>
        <button
          onClick={(e) => {
            e.preventDefault();
            if (!outOfStock) addItem(product);
          }}
          disabled={outOfStock}
          className="shrink-0 rounded-lg px-3 py-2 text-xs font-extrabold text-white transition-opacity hover:opacity-90 disabled:opacity-40"
          style={{ backgroundColor: "var(--store-primary)" }}
        >
          {outOfStock ? "نفدت" : "أضف للسلة"}
        </button>
      </a>
    );
  }

  // modern / minimal
  const minimal = template === "minimal";
  return (
    <a
      href={productUrl}
      className={`group flex flex-col overflow-hidden border bg-white transition-all hover:-translate-y-0.5 hover:shadow-md ${
        minimal ? "rounded-lg border-ink-150" : "rounded-2xl border-ink-100 shadow-sm"
      }`}
    >
      <div className={`relative w-full overflow-hidden bg-ink-100 ${minimal ? "aspect-[4/3]" : "aspect-square"}`}>
        {product.images[0] ? (
          <Image
            src={product.images[0].url}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <Placeholder />
        )}
        {product.oldPrice != null && (
          <span
            className="absolute right-2.5 top-2.5 rounded-full px-2.5 py-1 text-[11px] font-extrabold text-white shadow"
            style={{ backgroundColor: "var(--store-secondary)" }}
          >
            خصم
          </span>
        )}
        {outOfStock && (
          <span className="absolute inset-0 flex items-center justify-center bg-white/70 text-sm font-extrabold text-ink-600">
            نفدت الكمية
          </span>
        )}
      </div>
      <div className={`flex flex-1 flex-col ${minimal ? "p-3" : "p-4"}`}>
        <h3 className={`font-bold text-ink-900 group-hover:text-[var(--store-primary)] ${minimal ? "text-sm" : ""}`}>
          {product.name}
        </h3>
        {!minimal && product.description && (
          <p className="mt-1 line-clamp-2 text-xs leading-5 text-ink-500">{product.description}</p>
        )}
        <div className="mt-auto flex items-center gap-2 pt-2.5">
          <span className={`font-extrabold text-[var(--store-primary)] ${minimal ? "text-sm" : "text-lg"}`}>
            {priceText}
          </span>
          {product.oldPrice != null && (
            <span className="text-xs text-ink-400 line-through">{formatPrice(product.oldPrice)}</span>
          )}
        </div>
        <button
          onClick={(e) => {
            e.preventDefault();
            if (!outOfStock) addItem(product);
          }}
          disabled={outOfStock}
          className="mt-3 flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-extrabold text-white transition-opacity hover:opacity-90 disabled:opacity-40"
          style={{ backgroundColor: "var(--store-primary)" }}
        >
          {outOfStock ? "نفدت الكمية" : "أضف إلى السلة"}
        </button>
      </div>
    </a>
  );
}

function Placeholder() {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-ink-100">
      <span className="text-3xl">🛍️</span>
    </div>
  );
}