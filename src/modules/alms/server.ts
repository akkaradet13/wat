import type { DecodedIdToken } from "firebase-admin/auth";
import { FieldValue, GeoPoint, type DocumentSnapshot, type Timestamp } from "firebase-admin/firestore";
import { adminDb } from "@/modules/core/firebase/admin";
import { ROUNDS, STALE_MS } from "./constants";
import { pickRoute } from "./households";
import { notifyNearby } from "./notify";

// Server only. Every function takes the verified token and checks it belongs to the temple.
type Result<T = object> = (T & { ok: true }) | { ok: false; status: number; error: string };

const canSend = (u: DecodedIdToken) => typeof u.temple_id === "string" && (u.role === "admin" || u.role === "sender");
const bangkokDate = () => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Bangkok" }).format(new Date());
const lastSeen = (d: DocumentSnapshot) =>
  ((d.get("last_updated_at") ?? d.get("started_at")) as Timestamp | undefined)?.toMillis() ?? 0;
const endFields = () => ({ status: "ended", ended_at: FieldValue.serverTimestamp(), last_position: FieldValue.delete() });

export async function startRound(u: DecodedIdToken, requestedRoute?: unknown): Promise<Result<{ id: string }>> {
  if (!canSend(u)) return { ok: false, status: 403, error: "บัญชีนี้ไม่มีสิทธิ์ส่งพิกัด" };
  const db = adminDb();
  const routeId = await pickRoute(u.temple_id, requestedRoute);

  // Self-cleaning without a scheduler: any round start closes this route's open round
  // and every stale round in the system (rounds someone forgot to end).
  const cutoff = Date.now() - STALE_MS;
  const open = await db.collection(ROUNDS).where("status", "==", "active").get();
  const batch = db.batch();
  open.docs
    .filter((d) => d.get("route_id") === routeId || lastSeen(d) < cutoff)
    .slice(0, 499) // ponytail: one batch; fine while active rounds are few
    .forEach((d) => batch.update(d.ref, endFields()));
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
  return ok ? snap : null;
}

export async function updateLocation(u: DecodedIdToken, roundId: string, lat: number, lng: number): Promise<Result> {
  if (!(Math.abs(lat) <= 90 && Math.abs(lng) <= 180)) return { ok: false, status: 400, error: "พิกัดไม่ถูกต้อง" };
  // ponytail: one read per post to check ownership (~240 reads per 1-hour round).
  const round = await ownActiveRound(u, roundId);
  if (!round) return { ok: false, status: 409, error: "รอบนี้จบไปแล้ว" };
  await round.ref.update({ last_position: new GeoPoint(lat, lng), last_updated_at: FieldValue.serverTimestamp() });
  // Alerts must never break location sending.
  await notifyNearby(
    { id: round.id, route_id: round.get("route_id"), temple_id: round.get("temple_id") },
    { lat, lng },
  ).catch((e) => console.error("notifyNearby", e));
  return { ok: true };
}

export async function endRound(u: DecodedIdToken, roundId: string): Promise<Result> {
  const round = await ownActiveRound(u, roundId);
  if (round) await round.ref.update(endFields());
  return { ok: true }; // already ended is fine
}
