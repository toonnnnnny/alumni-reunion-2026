import type { NextConfig } from "next";

// output: "standalone" ใช้ตอนทำ Docker image ให้ไฟล์เล็กลง
const nextConfig: NextConfig = {
  output: "standalone",
};

export default nextConfig;
