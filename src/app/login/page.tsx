import type { Metadata } from "next";
import { LoginRedirect } from "./LoginRedirect";

export const metadata: Metadata = { title: "เข้าสู่ระบบสำหรับวัด", robots: { index: false } };

export default function LoginPage() {
  return (
    <div className="stack">
      <h1>เข้าสู่ระบบสำหรับวัด</h1>
      <LoginRedirect />
    </div>
  );
}
