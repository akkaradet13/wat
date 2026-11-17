import type { Metadata } from "next";
import { AdminPanel } from "./AdminPanel";

export const metadata: Metadata = { title: "ผู้ดูแลระบบ ยืนยันวัด", robots: { index: false } };

export default function AdminPage() {
  return (
    <div className="stack">
      <h1>ยืนยันวัด</h1>
      <AdminPanel />
    </div>
  );
}
