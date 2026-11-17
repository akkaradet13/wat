import type { Metadata } from "next";
import { ManagePanel } from "./ManagePanel";

export const metadata: Metadata = { title: "จัดการวัด", robots: { index: false } };

export default function ManagePage() {
  return (
    <div className="stack">
      <h1>จัดการวัด</h1>
      <ManagePanel />
    </div>
  );
}
