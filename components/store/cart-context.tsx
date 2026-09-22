// ============================================================
// معين — سلة المشتريات (Context + localStorage)
//
// السلة معزولة لكل متجر: المفتاح wathba-cart:<النطاق الفرعي>.
// المفتاح داخلي وليس الاسم التجاري — إبقاؤه يحفظ سلات الزوار الحالية.
// على النطاقات الحقيقية كل متجر أصل (origin) مستقل أصلًا، أما في وضع
// المعاينة (نطاق واحد + ?store=) فبدون العزل تختلط منتجات متجر بمتجر.
// ============================================================
"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import type { Product } from "@/lib/types";

export interface CartItem {
  productId: string;
  name: string;
  price: number;
  oldPrice: number | null;
  quantity: number;
  imageUrl: string | null;
  slug: string;
}

interface CartContextType {
  items: CartItem[];
  addItem: (product: Product) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, qty: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

interface CartProviderProps {
  children: React.ReactNode;
  /** النطاق الفرعي للمتجر — لعزل السلة بين المتاجر */
  storeKey?: string;
  /** تبنّي السلة المحفوظة بالمفتاح القديم (على النطاق الحقيقي فقط) */
  adoptLegacy?: boolean;
}

const CartContext = createContext<CartContextType | null>(null);

const CART_KEY = "wathba-cart";

export function cartStorageKey(storeKey?: string): string {
  const key = (storeKey || "").trim().toLowerCase();
  return key ? `${CART_KEY}:${key}` : CART_KEY;
}

function sanitize(raw: unknown): CartItem[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((i): i is CartItem => !!i && typeof i === "object" && typeof (i as CartItem).productId === "string")
    .map((i) => ({
      productId: String(i.productId),
      name: String(i.name ?? ""),
      price: Number(i.price) || 0,
      oldPrice: i.oldPrice == null ? null : Number(i.oldPrice) || null,
      quantity: Math.max(1, Math.floor(Number(i.quantity) || 1)),
      imageUrl: typeof i.imageUrl === "string" ? i.imageUrl : null,
      slug: String(i.slug ?? ""),
    }));
}

function loadCart(key: string, adoptLegacy: boolean): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(key);
    if (raw) return sanitize(JSON.parse(raw));

    // ترقية من المفتاح القديم (آمنة فقط على نطاق المتجر الحقيقي)
    if (adoptLegacy && key !== CART_KEY) {
      const legacy = window.localStorage.getItem(CART_KEY);
      if (legacy) {
        const items = sanitize(JSON.parse(legacy));
        window.localStorage.removeItem(CART_KEY);
        if (items.length) {
          window.localStorage.setItem(key, JSON.stringify(items));
          return items;
        }
      }
    }
  } catch {
    /* ignore */
  }
  return [];
}

function saveCart(key: string, items: CartItem[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(items));
  } catch {
    /* ignore */
  }
}

export function CartProvider({ children, storeKey, adoptLegacy = false }: CartProviderProps) {
  const storageKey = cartStorageKey(storeKey);
  // نحفظ المفتاح مع العناصر حتى لا تُكتَب سلة متجر داخل مفتاح متجر آخر
  const [cart, setCart] = useState<{ key: string; items: CartItem[] }>({ key: storageKey, items: [] });
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setCart({ key: storageKey, items: loadCart(storageKey, adoptLegacy) });
    setMounted(true);
  }, [storageKey, adoptLegacy]);

  useEffect(() => {
    if (mounted && cart.key === storageKey) saveCart(storageKey, cart.items);
  }, [cart, mounted, storageKey]);

  const items = cart.items;

  const setItems = useCallback((updater: (prev: CartItem[]) => CartItem[]) => {
    setCart((c) => ({ ...c, items: updater(c.items) }));
  }, []);

  const addItem = useCallback((product: Product) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.productId === product.id);
      if (existing) {
        return prev.map((i) =>
          i.productId === product.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [
        ...prev,
        {
          productId: product.id,
          name: product.name,
          price: product.price,
          oldPrice: product.oldPrice,
          quantity: 1,
          imageUrl: product.images[0]?.url ?? null,
          slug: product.slug,
        },
      ];
    });
    setIsOpen(true);
  }, [setItems]);

  const removeItem = useCallback((productId: string) => {
    setItems((prev) => prev.filter((i) => i.productId !== productId));
  }, [setItems]);

  const updateQuantity = useCallback((productId: string, qty: number) => {
    if (qty <= 0) {
      setItems((prev) => prev.filter((i) => i.productId !== productId));
      return;
    }
    setItems((prev) =>
      prev.map((i) => (i.productId === productId ? { ...i, quantity: qty } : i))
    );
  }, [setItems]);

  const clearCart = useCallback(() => setItems(() => []), [setItems]);

  const totalItems = items.reduce((s, i) => s + i.quantity, 0);
  const totalPrice = items.reduce((s, i) => s + i.price * i.quantity, 0);

  return (
    <CartContext.Provider
      value={{ items, addItem, removeItem, updateQuantity, clearCart, totalItems, totalPrice, isOpen, setIsOpen }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
