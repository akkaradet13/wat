"use client";

import { MapView, type MapPin } from "@/modules/core/map";
import type { LatLng } from "@/modules/core/temples/types";
import { useActiveRounds } from "./useActiveRounds";

/** Who is sending (their own name from the sender page) and which route. */
const whoLabel = (r: { senderName: string; routeName: string }) => [r.senderName, r.routeName].filter(Boolean).join(" · ") || "พระ";

const timeTh = (ms: number) => new Date(ms).toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit", hourCycle: "h23", timeZone: "Asia/Bangkok" });

/** Status banner + map for a temple profile. Shows monks only while their round is active. */
export function LiveTempleMap({ templeId, templeName, location }: { templeId: string; templeName: string; location: LatLng }) {
  const live = useActiveRounds(templeId).filter((r) => r.position);
  const latest = live.reduce<(typeof live)[number] | undefined>((a, r) => (!a || r.updatedAt > a.updatedAt ? r : a), undefined);
  const pins: MapPin[] = [
    { kind: "temple", pos: location, label: templeName },
    ...live.map((r): MapPin => ({ kind: "monk", pos: r.position!, label: whoLabel(r) })),
  ];

  return (
    <section className="stack" aria-live="polite">
      {latest ? (
        <p className="live-banner">
          <span className="live-dot" /> กำลังออกบิณฑบาต{live.length > 1 && ` ${live.length} สาย`} · อัปเดต {timeTh(latest.updatedAt)} น.
          {live.map((r) => (
            <span key={r.id} className="live-who">
              {whoLabel(r)}
            </span>
          ))}
        </p>
      ) : (
        <p className="idle-banner">ขณะนี้ไม่ได้ออกบิณฑบาต</p>
      )}
      {/* Follow only when one monk is out; with several, keep the view stable. */}
      <MapView center={latest?.position ?? location} pins={pins} follow={live.length === 1 ? latest?.position ?? undefined : undefined} />
    </section>
  );
}
