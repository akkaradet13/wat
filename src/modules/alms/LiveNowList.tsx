"use client";

import Link from "next/link";
import type { TempleSummary } from "@/modules/core/temples/types";
import { useActiveRounds } from "./useActiveRounds";

/** Home page: temples whose monks are out right now. */
export function LiveNowList({ temples }: { temples: TempleSummary[] }) {
  const liveIds = new Set(useActiveRounds().map((r) => r.temple_id));
  const live = temples.filter((t) => liveIds.has(t.id));
  if (!live.length) return <p className="idle-banner">ขณะนี้ยังไม่มีวัดที่กำลังออกบิณฑบาต</p>;
  return (
    <ul className="cards">
      {live.map((t) => (
        <li key={t.id}>
          <Link href={`/wat/${t.slug}`} className="card card-live">
            <span className="live-dot" /> <strong>{t.name}</strong> กำลังออกบิณฑบาต · ดูแผนที่สด
          </Link>
        </li>
      ))}
    </ul>
  );
}
