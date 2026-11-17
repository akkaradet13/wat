import type { DecodedIdToken } from "firebase-admin/auth";
import { FieldValue, GeoPoint, Timestamp } from "firebase-admin/firestore";
import { adminDb } from "@/modules/core/firebase/admin";
import { ROUNDS, ROUTES, STALE_MS } from "./constants";

// Server only. Every function takes the verified token and checks it belongs to the temple.
type Result<T = object> = (T & { ok: true }) | { ok: false; status: number; error: string };

const canSend = (u: DecodedIdToken) => typeof u.temple_id === "string" && (u.role === "admin" || u.role === "sender");
const bangkokDate = () => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Bangkok" }).format(new Date());
const endFields = () => ({ status: "ended", ended_at: FieldValue.serverTimestamp(), last_position: FieldValue.delete() });

/** The temple's first route. Created on demand so a new temple can send without setup. */
async function defaultRouteId(templeId: string): Promise<string> {
  const col = adminDb().collection(ROUTES);
  const snap = await col.where("temple_id", "==", templeId).limit(1).get();
  if (!snap.empty) return snap.docs[0].id;
  const ref = await col.add({ temple_id: templeId, name: "สายหลัก", start_time: "06:00" });
  return ref.id;
}

export async function startRound(u: DecodedIdToken): Promise<Result<{ id: string }>> {
  if (!canSend(u)) return { ok: false, status: 403, error: "บัญชีนี้ไม่มีสิทธิ์ส่งพิกัด" };
  const db = adminDb();
  const routeId = await defaultRouteId(u.temple_id);

  // Close any round left open on this route before starting a new one.
  const open = await db.collection(ROUNDS).where("route_id", "==", routeId).where("status", "==", "active").get();
  const batch = db.batch();
  open.docs.forEach((d) => batch.update(d.ref, endFields()));
  const ref = db.collection(ROUNDS).doc();
  batch.create(ref, {
    route_id: routeId,
    temple_id: u.temple_id,
    sender_id: u.uid,
    date: bangkokDate(),
    started_at: FieldValue.serverTimestamp(),
    status: "active",
  });
  await batch.commit();
  return { ok: true, id: ref.id };
}

async function ownActiveRound(u: DecodedIdToken, roundId: string) {
  if (!canSend(u) || !roundId) return null;
  const ref = adminDb().collection(ROUNDS).doc(roundId);
  const snap = await ref.get();
  const ok = snap.exists && snap.get("temple_id") === u.temple_id && snap.get("status") === "active";
  return ok ? ref : null;
}

export async function updateLocation(u: DecodedIdToken, roundId: string, lat: number, lng: number): Promise<Result> {
  if (!(Math.abs(lat) <= 90 && Math.abs(lng) <= 180)) return { ok: false, status: 400, error: "พิกัดไม่ถูกต้อง" };
  // ponytail: one read per post to check ownership (~240 reads per 1-hour round).
  const ref = await ownActiveRound(u, roundId);
  if (!ref) return { ok: false, status: 409, error: "รอบนี้จบไปแล้ว" };
  await ref.update({ last_position: new GeoPoint(lat, lng), last_updated_at: FieldValue.serverTimestamp() });
  return { ok: true };
}

export async function endRound(u: DecodedIdToken, roundId: string): Promise<Result> {
  const ref = await ownActiveRound(u, roundId);
  if (ref) await ref.update(endFields());
  return { ok: true }; // already ended is fine
}

/** Daily cron: close rounds nobody ended. */
export async function closeStaleRounds(): Promise<number> {
  const db = adminDb();
  const cutoff = Date.now() - STALE_MS;
  const active = await db.collection(ROUNDS).where("status", "==", "active").get();
  const stale = active.docs.filter((d) => {
    const t = (d.get("last_updated_at") ?? d.get("started_at")) as Timestamp | undefined;
    return !t || t.toMillis() < cutoff;
  });
  // ponytail: single batch caps at 500 rounds per run; chunk if that ever happens.
  const batch = db.batch();
  stale.slice(0, 500).forEach((d) => batch.update(d.ref, endFields()));
  await batch.commit();
  return stale.length;
}
