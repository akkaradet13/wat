import type { Metadata } from "next";
import { RegisterForm } from "./RegisterForm";

export const metadata: Metadata = { title: "ลงทะเบียนวัด", robots: { index: false } };

export default function RegisterPage() {
  return (
    <div className="stack">
      <h1>ลงทะเบียนวัด</h1>
      <p className="muted">ใช้งานได้ทันทีหลังลงทะเบียน ป้าย &quot;ยังไม่ยืนยัน&quot; จะแสดงจนกว่าผู้ดูแลระบบตรวจสอบ</p>
      <RegisterForm />
    </div>
  );
}
