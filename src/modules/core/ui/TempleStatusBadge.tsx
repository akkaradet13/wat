import type { TempleStatus } from "../temples/types";

const LABELS: Record<TempleStatus, string> = {
  verified: "✓ ยืนยันแล้ว",
  unverified: "ยังไม่ยืนยัน",
  suspended: "ถูกระงับ",
};

export function TempleStatusBadge({ status }: { status: TempleStatus }) {
  return <span className={`badge badge-${status}`}>{LABELS[status]}</span>;
}
