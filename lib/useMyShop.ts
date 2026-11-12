"use client";
// โหลดข้อมูลร้านของ Vendor ที่ล็อกอินอยู่ (ทุก 5 วินาที)
import { getRecord } from "./api";
import { useAuth } from "./auth";
import { usePolling } from "./usePolling";

export function useMyShop() {
  const { account } = useAuth();
  return usePolling(async () => {
    if (!account?.shopId) throw new Error("บัญชีนี้ยังไม่ได้ผูกกับร้าน ติดต่อ Admin");
    return getRecord("shop", account.shopId);
  });
}
