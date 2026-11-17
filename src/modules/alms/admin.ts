import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { adminDb } from "@/modules/core/firebase/admin";
import { ANNOUNCEMENTS, HOUSEHOLDS, ROUNDS, ROUTES } from "./constants";
import { pushToHousehold, templeRoute } from "./households";

// Server only. Temple-admin actions for the alms module. Callers must check isTempleAdmin first.
type Result<T = object> = (T & { ok: true }) | { ok: false; status: number; error: string };

const routes = () => adminDb().collection(ROUTES);
const str = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");

function parseRoute(b: Record<string, unknown>) {
  const name = str(b.name, 60);
  const start_time = str(b.start_time, 5);
  if (!name) return { error: "กรุณาตั้งชื่อสาย" };
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(start_time)) return { error: "เวลาออกไม่ถูกต้อง" };
  return { data: { name, start_time } };
}

export async function createRoute(templeId: string, b: Record<string, unknown>): Promise<Result<{ id: string }>> {
  const p = parseRoute(b);
  if (!p.data) return { ok: false, status: 400, error: p.error };
  const ref = await routes().add({ temple_id: templeId, ...p.data });
  return { ok: true, id: ref.id };
}

export async function updateRoute(templeId: string, routeId: string, b: Record<string, unknown>): Promise<Result> {
  const p = parseRoute(b);
  if (!p.data) return { ok: false, status: 400, error: p.error };
  const route = await templeRoute(templeId, routeId);
  if (!route) return { ok: false, status: 404, error: "ไม่พบสาย" };
  // Rounds copy the route name at start; refresh any active round so a rename shows right away.
  const active = await adminDb().collection(ROUNDS).where("route_id", "==", routeId).where("status", "==", "active").get();
  const batch = adminDb().batch();
  batch.update(route.ref, p.data);
  active.docs.forEach((d) => batch.update(d.ref, { route_name: p.data.name }));
  await batch.commit();
  return { ok: true };
}

/** Deletes a route. Its households move to another route so nobody silently loses alerts. */
export async function deleteRoute(templeId: string, routeId: string): Promise<Result> {
  const route = await templeRoute(templeId, routeId);
  if (!route) return { ok: false, status: 404, error: "ไม่พบสาย" };
  const others = (await routes().where("temple_id", "==", templeId).get()).docs.filter((d) => d.id !== routeId);
  if (!others.length) return { ok: false, status: 409, error: "ต้องมีอย่างน้อย 1 สาย" };
  const db = adminDb();
  const homes = await db.collection(HOUSEHOLDS).where("route_id", "==", routeId).get();
  // ponytail: one batch (500 writes); chunk if a single route ever has more homes.
  const batch = db.batch();
  homes.docs.slice(0, 499).forEach((h) => batch.update(h.ref, { route_id: others[0].id }));
  batch.delete(route.ref);
  await batch.commit();
  return { ok: true };
}

/** No-alms announcement for a date. Optionally pushes it to every household of the temple. */
export async function createAnnouncement(
  templeId: string,
  b: Record<string, unknown>,
  temple: { name: string; slug: string },
): Promise<Result<{ id: string; notified: number }>> {
  const date = str(b.date, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(Date.parse(date))) return { ok: false, status: 400, error: "วันที่ไม่ถูกต้อง" };
  const message = str(b.message, 300) || "งดบิณฑบาต";
  const ref = await adminDb().collection(ANNOUNCEMENTS).add({
    temple_id: templeId,
    date,
    type: "no_alms",
    message,
    created_at: FieldValue.serverTimestamp(),
    // Self-cleaning: gone a week after the date (Firestore TTL).
    expire_at: Timestamp.fromMillis(Date.parse(date) + 7 * 86_400_000),
  });

  let notified = 0;
  if (b.notify === true) {
    const homes = await adminDb().collection(HOUSEHOLDS).where("temple_id", "==", templeId).select().get();
    const dateTh = new Date(date).toLocaleDateString("th-TH", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" });
    const sent = await Promise.allSettled(
      homes.docs.map((h) =>
        pushToHousehold(h.id, { title: `งดบิณฑบาต${dateTh}`, body: `${temple.name}: ${message}`, url: `/wat/${temple.slug}`, tag: `announce-${ref.id}` }),
      ),
    );
    notified = sent.filter((s) => s.status === "fulfilled" && s.value === "sent").length;
  }
  return { ok: true, id: ref.id, notified };
}

export async function deleteAnnouncement(templeId: string, id: string): Promise<Result> {
  const ref = adminDb().collection(ANNOUNCEMENTS).doc(id);
  const snap = await ref.get();
  if (!snap.exists || snap.get("temple_id") !== templeId) return { ok: false, status: 404, error: "ไม่พบประกาศ" };
  await ref.delete();
  return { ok: true };
}
