"use client";
// ตะกร้าเสื้อด้วย React Context (แนวเดียวกับแล็บ Products-Carts)
// เก็บลง localStorage ด้วย รีเฟรชหน้าแล้วตะกร้าไม่หาย

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { CartItem } from "./types";

type CartValue = {
  items: CartItem[];
  add: (item: CartItem) => void;
  changeQty: (index: number, qty: number) => void;
  remove: (index: number) => void;
  clear: () => void;
  total: number;
  count: number;
};

const CartContext = createContext<CartValue | null>(null);
const KEY = "reunion_cart";

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loaded, setLoaded] = useState(false);

  // โหลดตะกร้าจาก localStorage ครั้งแรก
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(KEY) || "[]");
      if (Array.isArray(saved)) setItems(saved);
    } catch {}
    setLoaded(true);
  }, []);

  // บันทึกทุกครั้งที่ตะกร้าเปลี่ยน (หลังโหลดเสร็จแล้วเท่านั้น กันเขียนทับด้วยค่าว่าง)
  useEffect(() => {
    if (loaded) localStorage.setItem(KEY, JSON.stringify(items));
  }, [items, loaded]);

  // ถ้ามีเสื้อแบบ/สี/ไซซ์เดียวกันอยู่แล้ว ให้บวกจำนวนเพิ่มแทนการเพิ่มแถวใหม่
  function add(item: CartItem) {
    setItems((prev) => {
      const index = prev.findIndex((p) => p.shirtId === item.shirtId && p.color === item.color && p.size === item.size);
      if (index === -1) return [...prev, item];
      return prev.map((p, i) => (i === index ? { ...p, qty: p.qty + item.qty } : p));
    });
  }

  function changeQty(index: number, qty: number) {
    setItems((prev) => prev.map((p, i) => (i === index ? { ...p, qty } : p)));
  }

  function remove(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  const total = items.reduce((sum, i) => sum + i.qty * i.price, 0);
  const count = items.reduce((sum, i) => sum + i.qty, 0);

  return <CartContext.Provider value={{ items, add, changeQty, remove, clear: () => setItems([]), total, count }}>{children}</CartContext.Provider>;
}

export function useCart(): CartValue {
  const value = useContext(CartContext);
  if (!value) throw new Error("useCart ต้องใช้ภายใน CartProvider");
  return value;
}
