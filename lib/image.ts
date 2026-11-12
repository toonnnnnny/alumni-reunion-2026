// ย่อรูปสลิปก่อนส่ง เพราะ MockAPI เก็บไฟล์ไม่ได้ ต้องเก็บเป็นข้อความ base64
// ย่อให้กว้างไม่เกิน maxWidth แล้วแปลงเป็น JPEG คุณภาพ 0.7 ข้อมูลจะเล็กพอส่งผ่าน API

export function resizeImage(file: File, maxWidth = 600): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("อ่านไฟล์ไม่สำเร็จ"));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("ไฟล์นี้ไม่ใช่รูปภาพ"));
      img.onload = () => {
        const scale = Math.min(1, maxWidth / img.width);
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("เบราว์เซอร์ไม่รองรับ"));
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.7));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}
