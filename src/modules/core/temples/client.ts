"use client";

import { doc, getDoc, type GeoPoint } from "firebase/firestore";
import { useCallback, useEffect, useState } from "react";
import { clientDb } from "../firebase/client";
import type { Temple } from "./types";

/** One temple (public read). `reload` re-fetches after an edit. */
export function useTemple(id: string | undefined) {
  const [temple, setTemple] = useState<Temple | null>(null);
  const load = useCallback(async () => {
    if (!id) return;
    const snap = await getDoc(doc(clientDb(), "temples", id));
    if (!snap.exists()) return setTemple(null);
    const x = snap.data();
    const loc = x.location as GeoPoint;
    setTemple({ ...(x as Temple), id: snap.id, location: { lat: loc.latitude, lng: loc.longitude }, links: x.links ?? {}, created_at: null, updated_at: null });
  }, [id]);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-shot fetch on mount
    load();
  }, [load]);
  return { temple, reload: load };
}
