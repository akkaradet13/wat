"use client";

import dynamic from "next/dynamic";

export type { MapPin, MapProps } from "./LeafletMap";

// Leaflet touches `window`, and loading it lazily keeps it off the first paint.
export const MapView = dynamic(() => import("./LeafletMap"), {
  ssr: false,
  loading: () => <div className="map map-loading">กำลังโหลดแผนที่…</div>,
});
