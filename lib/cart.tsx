"use client";
// ตะกร้าเสื้อด้วย React Context (แนวเดียวกับแล็บ Products-Carts)
// เก็บลง localStorage ด้วย รีเฟรชหน้าแล้วตะกร้าไม่หาย

// createContext/useContext = ระบบส่งข้อมูลกลางให้ทุกหน้า, useEffect = ทำงานตอนโหลด/ค่าเปลี่ยน
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
// CartItem = ชนิดข้อมูลเสื้อ 1 แถวในตะกร้า (shirtId, name, color, size, qty, price)
import type { CartItem } from "./types";

// หน้าตาของสิ่งที่ตะกร้าแชร์ให้หน้าอื่นใช้
type CartValue = {
  items: CartItem[];
  add: (item: CartItem) => void;
  changeQty: (index: number, qty: number) => void;
  remove: (index: number) => void;
  clear: () => void;
  total: number;
  count: number;
};

// สร้าง "กล่องกลาง" ของตะกร้า
const CartContext = createContext<CartValue | null>(null);
// ชื่อ key ที่ใช้เก็บใน localStorage
const KEY = "reunion_cart";

// ตัวครอบหน้า (ใช้ใน app/user/layout.tsx) ทุกหน้าข้างในจะเห็นตะกร้าเดียวกัน
export function CartProvider({ children }: { children: ReactNode }) {
  // รายการเสื้อในตะกร้า
  const [items, setItems] = useState<CartItem[]>([]);
  // โหลดจาก localStorage เสร็จหรือยัง
  const [loaded, setLoaded] = useState(false);

  // โหลดตะกร้าจาก localStorage ครั้งแรก
  useEffect(() => {
    try {
      // อ่านข้อความจาก localStorage แล้วแปลงกลับเป็นลิสต์ (JSON.parse) ถ้าไม่มีใช้ []
      const saved = JSON.parse(localStorage.getItem(KEY) || "[]");
      // ถ้าเป็นลิสต์จริง เอามาใส่ตะกร้า
      if (Array.isArray(saved)) setItems(saved);
    // ข้อมูลเสีย -> ข้ามไป ไม่ให้เว็บพัง
    } catch {}
    // บอกว่าโหลดเสร็จแล้ว
    setLoaded(true);
  // [] = ทำครั้งเดียวตอนเปิดเว็บ
  }, []);

  // บันทึกทุกครั้งที่ตะกร้าเปลี่ยน (หลังโหลดเสร็จแล้วเท่านั้น กันเขียนทับด้วยค่าว่าง)
  useEffect(() => {
    // แปลงลิสต์เป็นข้อความ (JSON.stringify) แล้วเก็บลง localStorage
    if (loaded) localStorage.setItem(KEY, JSON.stringify(items));
  // [items, loaded] = ทำใหม่ทุกครั้งที่ตะกร้าเปลี่ยน
  }, [items, loaded]);

  // ถ้ามีเสื้อแบบ/สี/ไซซ์เดียวกันอยู่แล้ว ให้บวกจำนวนเพิ่มแทนการเพิ่มแถวใหม่
  function add(item: CartItem) {
    setItems((prev) => {
      // หาว่ามีเสื้อแบบ + สี + ไซซ์เดียวกันอยู่แล้วไหม (ไม่เจอ = -1)
      const index = prev.findIndex((p) => p.shirtId === item.shirtId && p.color === item.color && p.size === item.size);
      // ไม่มี -> เพิ่มแถวใหม่ต่อท้าย
      if (index === -1) return [...prev, item];
      // มีแล้ว -> บวกจำนวนเพิ่มในแถวเดิม
      return prev.map((p, i) => (i === index ? { ...p, qty: p.qty + item.qty } : p));
    });
  }

  // แก้จำนวนของแถวที่ index (ปุ่ม - / + ในหน้าตะกร้า)
  function changeQty(index: number, qty: number) {
    setItems((prev) => prev.map((p, i) => (i === index ? { ...p, qty } : p)));
  }

  // ลบแถวที่ index (filter = เก็บทุกแถวยกเว้นแถวนี้)
  function remove(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  // ราคารวม = ผลรวมของ (จำนวน × ราคา) ทุกแถว
  const total = items.reduce((sum, i) => sum + i.qty * i.price, 0);
  // จำนวนชิ้นรวม (ตัวเลขแดงบนไอคอนตะกร้า)
  const count = items.reduce((sum, i) => sum + i.qty, 0);

  // แชร์ของทั้งหมดนี้ให้หน้าอื่นใช้ (clear = ล้างตะกร้าเป็นลิสต์ว่าง)
  return <CartContext.Provider value={{ items, add, changeQty, remove, clear: () => setItems([]), total, count }}>{children}</CartContext.Provider>;
}

// หน้าอื่นเรียก useCart() เพื่อหยิบตะกร้ามาใช้
export function useCart(): CartValue {
  const value = useContext(CartContext);
  // ถ้าเรียกนอก CartProvider จะแจ้ง error
  if (!value) throw new Error("useCart ต้องใช้ภายใน CartProvider");
  return value;
}
