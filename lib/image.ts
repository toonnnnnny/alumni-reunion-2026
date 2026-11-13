// ย่อรูปสลิปก่อนส่ง เพราะ MockAPI เก็บไฟล์ไม่ได้ ต้องเก็บเป็นข้อความ base64
// ย่อให้กว้างไม่เกิน maxWidth แล้วแปลงเป็น JPEG คุณภาพ 0.7 ข้อมูลจะเล็กพอส่งผ่าน API

// รับไฟล์รูป คืนค่าเป็นข้อความ base64 (Promise = ต้อง await รอ)
export function resizeImage(file: File, maxWidth = 600): Promise<string> {
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
        // อัตราย่อ: กว้างไม่เกิน 600px (รูปเล็กอยู่แล้วไม่ขยาย)
        const scale = Math.min(1, maxWidth / img.width);
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
        // แปลง canvas เป็น JPEG คุณภาพ 70% ในรูปข้อความ base64 แล้วส่งกลับ
        resolve(canvas.toDataURL("image/jpeg", 0.7));
      };
      // ใส่ข้อมูลที่อ่านได้ให้รูป -> รูปจะเริ่มโหลด
      img.src = reader.result as string;
    };
    // เริ่มอ่านไฟล์
    reader.readAsDataURL(file);
  });
}
