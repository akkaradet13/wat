"use client";

import { MapView, type MapPin } from "@/modules/core/map";
import type { LatLng } from "@/modules/core/temples/types";
import { useActiveRounds } from "./useActiveRounds";

const timeTh = (ms: number) => new Date(ms).toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" });

/** Status banner + map for a temple profile. Shows the monk only while a round is active. */
export function LiveTempleMap({ templeId, templeName, location }: { templeId: string; templeName: string; location: LatLng }) {
  const live = useActiveRounds(templeId).find((r) => r.position);
  const pins: MapPin[] = [{ kind: "temple", pos: location, label: templeName }];
  if (live?.position) pins.push({ kind: "monk", pos: live.position, label: "พระอยู่ที่นี่" });

  return (
    <section className="stack" aria-live="polite">
      {live ? (
        <p className="live-banner">
          <span className="live-dot" /> กำลังออกบิณฑบาต · อัปเดต {timeTh(live.updatedAt)} น.
        </p>
      ) : (
        <p className="idle-banner">ขณะนี้ไม่ได้ออกบิณฑบาต</p>
      )}
      <MapView center={live?.position ?? location} pins={pins} follow={live?.position ?? undefined} />
    </section>
  );
}
