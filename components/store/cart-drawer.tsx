// ============================================================
// وثبة — درج السلة (Cart Drawer)
// ============================================================
"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { X, Plus, Minus, Trash2, ShoppingBag } from "lucide-react";
import { useCart } from "./cart-context";
import { formatPrice } from "@/lib/constants";

export default function CartDrawer() {
  const { items, removeItem, updateQuantity, totalItems, totalPrice, isOpen, setIsOpen } = useCart();
  const overlayRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  function handleOverlayClick(e: React.MouseEvent) {
    if (e.target === overlayRef.current) setIsOpen(false);
  }

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className={`fixed inset-0 z-50 bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${
        isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
      }`}
    >
      <div
        ref={panelRef}
        className={`absolute top-0 h-full w-full max-w-md bg-white shadow-2xl transition-transform duration-300 ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
        style={{ left: 0, right: "auto" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-ink-100 px-5 py-4">
          <div className="flex items-center gap-2.5">
            <ShoppingBag className="h-5 w-5" style={{ color: "var(--store-primary)" }} />
            <h2 className="text-lg font-extrabold text-ink-900">سلة المشتريات</h2>
            {totalItems > 0 && (
              <span
                className="flex h-6 min-w-6 items-center justify-center rounded-full px-1.5 text-xs font-extrabold text-white"
                style={{ backgroundColor: "var(--store-primary)" }}
              >
                {totalItems}
              </span>
            )}
          </div>
          <button onClick={() => setIsOpen(false)} className="rounded-lg p-1.5 text-ink-400 hover:bg-ink-50 hover:text-ink-700">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-5 py-4" style={{ maxHeight: "calc(100vh - 180px)" }}>
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <ShoppingBag className="h-16 w-16 text-ink-200" />
              <p className="mt-4 font-bold text-ink-500">السلة فارغة</p>
              <p className="mt-1 text-sm text-ink-400">أضف منتجات لتبدأ التسوق</p>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item) => (
                <div key={item.productId} className="flex gap-3 rounded-xl border border-ink-100 p-3">
                  <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-ink-100">
                    {item.imageUrl ? (
                      <Image src={item.imageUrl} alt={item.name} fill sizes="80px" className="object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-2xl">🛍️</div>
                    )}
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <h3 className="truncate text-sm font-bold text-ink-900">{item.name}</h3>
                    <span className="mt-0.5 text-sm font-extrabold" style={{ color: "var(--store-primary)" }}>
                      {formatPrice(item.price)}
                    </span>
                    <div className="mt-auto flex items-center justify-between pt-2">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                          className="flex h-7 w-7 items-center justify-center rounded-lg bg-ink-50 text-ink-600 transition-colors hover:bg-ink-100"
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="w-7 text-center text-sm font-extrabold text-ink-900">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                          className="flex h-7 w-7 items-center justify-center rounded-lg bg-ink-50 text-ink-600 transition-colors hover:bg-ink-100"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <button
                        onClick={() => removeItem(item.productId)}
                        className="rounded-lg p-1.5 text-ink-400 transition-colors hover:bg-rose-50 hover:text-rose-500"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t border-ink-100 px-5 py-4">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm font-bold text-ink-500">المجموع</span>
              <span className="text-lg font-extrabold" style={{ color: "var(--store-primary)" }}>
                {formatPrice(totalPrice)}
              </span>
            </div>
            <a
              href="/checkout"
              className="flex w-full items-center justify-center rounded-xl py-3.5 text-sm font-extrabold text-white shadow-lg transition-transform hover:scale-[1.01]"
              style={{ backgroundColor: "var(--store-primary)" }}
              onClick={() => setIsOpen(false)}
            >
              إتمام الطلب
            </a>
          </div>
        )}
      </div>
    </div>
  );
}