// ย่อรูปสลิปก่อนส่ง เพราะ MockAPI เก็บไฟล์ไม่ได้ ต้องเก็บเป็นข้อความ base64
// ย่อให้ด้านยาวสุดไม่เกิน maxSize แล้วแปลงเป็น JPEG ลดคุณภาพทีละขั้นจนข้อความ base64 ไม่เกิน maxChars
// กันรูปสลิปที่เป็นภาพหน้าจอมือถือยาวๆ ใหญ่เกินจน MockAPI ปฏิเสธ (400)

// รับไฟล์รูป คืนค่าเป็นข้อความ base64 (Promise = ต้อง await รอ)
export function resizeImage(file: File, maxSize = 700, maxChars = 60000): Promise<string> {
  return new Promise((resolve, reject) => {
    // FileReader = ตัวอ่านไฟล์ของเบราว์เซอร์
    const reader = new FileReader();
    // อ่านไม่ได้ -> error
    reader.onerror = () => reject(new Error("อ่านไฟล์ไม่สำเร็จ"));
    // อ่านเสร็จ -> ทำต่อข้างใน
    reader.onload = () => {
      // สร้างรูปเปล่า
      const img = new Image();
      // ไม่ใช่รูป -> error
      img.onerror = () => reject(new Error("ไฟล์นี้ไม่ใช่รูปภาพ"));
      // รูปโหลดเสร็จ -> ย่อ
      img.onload = () => {
        // อัตราย่อ: ด้านที่ยาวที่สุดไม่เกิน maxSize (รูปเล็กอยู่แล้วไม่ขยาย)
        const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
        // สร้าง canvas (กระดานวาดรูป)
        const canvas = document.createElement("canvas");
        // ตั้งขนาด canvas ตามอัตราย่อ
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        // ตัววาดภาพ 2 มิติ
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("เบราว์เซอร์ไม่รองรับ"));
        // วาดรูปลง canvas ในขนาดที่ย่อแล้ว
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        // แปลงเป็น JPEG base64 เริ่มคุณภาพ 70% ถ้ายังยาวเกินก็ลดลงทีละ 10% (ต่ำสุด 30%)
        let quality = 0.7;
        let out = canvas.toDataURL("image/jpeg", quality);
        while (out.length > maxChars && quality > 0.3) {
          quality -= 0.1;
          out = canvas.toDataURL("image/jpeg", quality);
        }
        resolve(out);
      };
      // ใส่ข้อมูลที่อ่านได้ให้รูป -> รูปจะเริ่มโหลด
      img.src = reader.result as string;
    };
    // เริ่มอ่านไฟล์
    reader.readAsDataURL(file);
  });
}
