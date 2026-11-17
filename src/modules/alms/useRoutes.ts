"use client";

import { collection, onSnapshot, query, where } from "firebase/firestore";
import { useEffect, useState } from "react";
import { clientDb } from "@/modules/core/firebase/client";
import { ROUTES } from "./constants";

export interface Route {
  id: string;
  name: string;
  start_time: string;
  monks: string;
}

/** The temple's alms routes, live, sorted by start time. null while loading. */
export function useRoutes(templeId: string | undefined): Route[] | null {
  const [routes, setRoutes] = useState<Route[] | null>(null);
  useEffect(() => {
    if (!templeId) return;
    return onSnapshot(query(collection(clientDb(), ROUTES), where("temple_id", "==", templeId)), (snap) =>
      setRoutes(
        snap.docs
          .map((d) => ({ id: d.id, name: d.get("name") as string, start_time: d.get("start_time") as string, monks: (d.get("monks") as string) ?? "" }))
          .sort((a, b) => a.start_time.localeCompare(b.start_time) || a.name.localeCompare(b.name, "th")),
      ),
    );
  }, [templeId]);
  return routes;
}
