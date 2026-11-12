// รวมสต็อกทุกสีทุกไซซ์ของเสื้อ 1 แบบ
export function totalStock(stock: Record<string, Record<string, number>>): number {
  return Object.values(stock).reduce((sum, sizes) => sum + Object.values(sizes).reduce((a, b) => a + b, 0), 0);
}
