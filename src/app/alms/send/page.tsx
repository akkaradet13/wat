import type { Metadata } from "next";
import { SenderPanel } from "@/modules/alms/SenderPanel";

export const metadata: Metadata = { title: "ส่งพิกัดบิณฑบาต", robots: { index: false } };

export default function SendPage() {
  return (
    <div className="stack">
      <h1>ส่งพิกัดบิณฑบาต</h1>
      <SenderPanel />
    </div>
  );
}
