"use client";

import { collection, onSnapshot, query, where, type GeoPoint, type Timestamp } from "firebase/firestore";
import { useEffect, useState } from "react";
import { clientDb } from "@/modules/core/firebase/client";
import type { LatLng } from "@/modules/core/temples/types";
import { ROUNDS, STALE_MS } from "./constants";

export interface LiveRound {
  id: string;
  temple_id: string;
  position: LatLng | null;
  updatedAt: number;
  routeName: string;
  senderName: string;
}

/** Live active rounds, optionally for one temple. Rounds without a recent position are dropped. */
export function useActiveRounds(templeId?: string): LiveRound[] {
  const [rounds, setRounds] = useState<LiveRound[]>([]);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const filters = [where("status", "==", "active"), ...(templeId ? [where("temple_id", "==", templeId)] : [])];
    return onSnapshot(query(collection(clientDb(), ROUNDS), ...filters), (snap) =>
      setRounds(
        snap.docs.map((d) => {
          const x = d.data() as { temple_id: string; last_position?: GeoPoint; last_updated_at?: Timestamp; started_at?: Timestamp; route_name?: string; sender_name?: string };
          return {
            id: d.id,
            temple_id: x.temple_id,
            position: x.last_position ? { lat: x.last_position.latitude, lng: x.last_position.longitude } : null,
            updatedAt: (x.last_updated_at ?? x.started_at)?.toMillis() ?? Date.now(),
            routeName: x.route_name ?? "",
            senderName: x.sender_name ?? "",
          };
        }),
      ),
    );
  }, [templeId]);

  // Re-evaluate staleness every minute even when no snapshot arrives.
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(t);
  }, []);

  return rounds.filter((r) => now - r.updatedAt < STALE_MS);
}
