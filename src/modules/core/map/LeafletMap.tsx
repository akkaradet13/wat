"use client";

import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useEffect } from "react";
import { MapContainer, Marker, TileLayer, Tooltip, useMap, useMapEvents } from "react-leaflet";
import type { LatLng } from "../temples/types";

export interface MapPin {
  pos: LatLng;
  label: string;
  kind: "temple" | "monk";
}

export interface MapProps {
  center: LatLng;
  pins: MapPin[];
  zoom?: number;
  /** Picker mode: the single "temple" pin is draggable and map clicks move it. */
  onPick?: (p: LatLng) => void;
  /** Keep this point in view when it changes (live monk position). */
  follow?: LatLng;
}

// Emoji divIcons avoid Leaflet's default image icons, which break under bundlers.
const icons = {
  temple: L.divIcon({ html: "🛕", className: "map-pin", iconSize: [40, 40], iconAnchor: [20, 36] }),
  monk: L.divIcon({ html: "🧡", className: "map-pin map-pin-live", iconSize: [44, 44], iconAnchor: [22, 22] }),
};

function Follow({ to }: { to?: LatLng }) {
  const map = useMap();
  useEffect(() => {
    if (to) map.panTo([to.lat, to.lng]);
  }, [map, to]);
  return null;
}

function ClickToPick({ onPick }: { onPick: (p: LatLng) => void }) {
  useMapEvents({ click: (e) => onPick({ lat: e.latlng.lat, lng: e.latlng.lng }) });
  return null;
}

export default function LeafletMap({ center, pins, zoom = 16, onPick, follow }: MapProps) {
  return (
    <MapContainer center={[center.lat, center.lng]} zoom={zoom} className="map" scrollWheelZoom={false}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {pins.map((p) => (
        <Marker
          key={p.kind}
          position={[p.pos.lat, p.pos.lng]}
          icon={icons[p.kind]}
          draggable={!!onPick && p.kind === "temple"}
          eventHandlers={
            onPick && {
              dragend: (e) => {
                const ll = (e.target as L.Marker).getLatLng();
                onPick({ lat: ll.lat, lng: ll.lng });
              },
            }
          }
        >
          <Tooltip direction="top" offset={[0, -30]} permanent={p.kind === "monk"}>
            {p.label}
          </Tooltip>
        </Marker>
      ))}
      {onPick && <ClickToPick onPick={onPick} />}
      {onPick && <Follow to={pins[0]?.pos} />}
      <Follow to={follow} />
    </MapContainer>
  );
}
