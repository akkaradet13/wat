import { FieldValue, Timestamp, type GeoPoint } from "firebase-admin/firestore";
import { adminDb } from "@/modules/core/firebase/admin";
import type { LatLng } from "@/modules/core/temples/types";
import { HOUSEHOLDS, NOTIFICATIONS } from "./constants";
import { distanceM } from "./geo";
import { pushToHousehold } from "./households";

// Server only. Called on every location post, so it must stay cheap in Firestore reads.

const CACHE_MS = 60_000;
const NOTIFICATION_TTL_DAYS = 30;

// ponytail: per-instance memory cache (App Hosting keeps instances warm). A household that joins
// mid-round is picked up within CACHE_MS. Move to a shared cache only if instances multiply.
const memo = new Map<string, { at: number; value: Promise<unknown> }>();
function cached<T>(key: string, load: () => Promise<T>): Promise<T> {
  const hit = memo.get(key);
  if (hit && Date.now() - hit.at < CACHE_MS) return hit.value as Promise<T>;
  const value = load();
  memo.set(key, { at: Date.now(), value });
  value.catch(() => memo.delete(key));
  return value;
}
const notified = new Set<string>(); // `${round}_${household}` already handled by this instance

type Household = { id: string; pos: LatLng; radius: number };

const householdsOnRoute = (routeId: string) =>
  cached(`hh:${routeId}`, async (): Promise<Household[]> => {
    const snap = await adminDb().collection(HOUSEHOLDS).where("route_id", "==", routeId).select("position", "radius_m").get();
    return snap.docs.map((d) => {
      const p = d.get("position") as GeoPoint;
      return { id: d.id, pos: { lat: p.latitude, lng: p.longitude }, radius: d.get("radius_m") as number };
    });
  });

const templeInfo = (templeId: string) =>
  cached(`t:${templeId}`, async () => {
    const t = await adminDb().doc(`temples/${templeId}`).get();
    return { name: (t.get("name") as string) ?? "วัด", slug: (t.get("slug") as string) ?? "" };
  });

/** Push "monk is near" to every household within its radius, once per round. Returns how many were sent. */
export async function notifyNearby(round: { id: string; route_id: string; temple_id: string; monks?: string }, monk: LatLng): Promise<number> {
  const near = (await householdsOnRoute(round.route_id))
    .map((h) => ({ ...h, d: distanceM(monk, h.pos) }))
    .filter((h) => h.d <= h.radius && !notified.has(`${round.id}_${h.id}`));
  if (!near.length) return 0;

  const temple = await templeInfo(round.temple_id);
  const db = adminDb();
  const results = await Promise.allSettled(
    near.map(async (h) => {
      const key = `${round.id}_${h.id}`;
      if (notified.size > 10_000) notified.clear(); // bounded; Firestore create() still dedupes
      notified.add(key);
      // create() fails if the doc exists: the once-per-round guarantee across instances.
      try {
        await db.collection(NOTIFICATIONS).doc(key).create({
          round_id: round.id,
          household_id: h.id,
          sent_at: FieldValue.serverTimestamp(),
          expire_at: Timestamp.fromMillis(Date.now() + NOTIFICATION_TTL_DAYS * 86_400_000),
        });
      } catch {
        return false; // already notified (by another instance)
      }
      const distance = Math.max(50, Math.round(h.d / 50) * 50);
      const result = await pushToHousehold(h.id, {
        title: `${round.monks || "พระ"}ใกล้ถึงบ้านแล้ว 🙏`,
        body: `${temple.name} · ห่างประมาณ ${distance} เมตร เตรียมใส่บาตรได้เลย`,
        url: temple.slug ? `/wat/${temple.slug}` : "/",
        tag: `round-${round.id}`,
      });
      if (result === "dead") memo.delete(`hh:${round.route_id}`);
      return result === "sent";
    }),
  );
  results.filter((r) => r.status === "rejected").forEach((r) => console.error("notify failed", (r as PromiseRejectedResult).reason));
  return results.filter((r) => r.status === "fulfilled" && r.value).length;
}
