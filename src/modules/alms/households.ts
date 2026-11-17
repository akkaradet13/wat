import { FieldValue, GeoPoint } from "firebase-admin/firestore";
import { adminDb, adminMessaging } from "@/modules/core/firebase/admin";
import { HOUSEHOLDS, ROUTES } from "./constants";

// Server only. A household is one device (anonymous uid) that wants alerts for one temple.
const col = () => adminDb().collection(HOUSEHOLDS);
export const RADIUS_OPTIONS = [200, 300, 500] as const;
const DEAD_TOKEN = new Set([
  "messaging/registration-token-not-registered",
  "messaging/invalid-registration-token",
  "messaging/invalid-argument",
]);

/** The temple's first route; created on demand (same rule as starting a round). */
export async function defaultRouteId(templeId: string): Promise<string> {
  const routes = adminDb().collection(ROUTES);
  const snap = await routes.where("temple_id", "==", templeId).limit(1).get();
  if (!snap.empty) return snap.docs[0].id;
  return (await routes.add({ temple_id: templeId, name: "สายหลัก", start_time: "06:00" })).id;
}

export async function saveHousehold(
  uid: string,
  b: Record<string, unknown>,
): Promise<{ ok: true } | { ok: false; status: number; error: string }> {
  const lat = Number(b.lat);
  const lng = Number(b.lng);
  const radius = Number(b.radius_m);
  const templeId = typeof b.temple_id === "string" ? b.temple_id : "";
  const token = typeof b.fcm_token === "string" ? b.fcm_token : "";
  if (!(Math.abs(lat) <= 90 && Math.abs(lng) <= 180) || (lat === 0 && lng === 0))
    return { ok: false, status: 400, error: "กรุณาปักหมุดบ้าน" };
  if (!RADIUS_OPTIONS.includes(radius as (typeof RADIUS_OPTIONS)[number]))
    return { ok: false, status: 400, error: "ระยะแจ้งเตือนไม่ถูกต้อง" };
  if (!token || token.length > 4096) return { ok: false, status: 400, error: "ไม่ได้รับสิทธิ์แจ้งเตือน" };

  const temple = templeId ? await adminDb().doc(`temples/${templeId}`).get() : null;
  if (!temple?.exists || temple.get("status") === "suspended") return { ok: false, status: 404, error: "ไม่พบวัด" };

  await col().doc(uid).set({
    temple_id: templeId,
    route_id: await defaultRouteId(templeId),
    position: new GeoPoint(lat, lng),
    radius_m: radius,
    fcm_token: token,
    updated_at: FieldValue.serverTimestamp(),
  });
  return { ok: true };
}

export async function deleteHousehold(uid: string) {
  await col().doc(uid).delete();
}

/** Sends a push to one household. Deletes the household if FCM says the token is dead. */
export async function pushToHousehold(uid: string, msg: { title: string; body: string; url: string; tag?: string }) {
  const snap = await col().doc(uid).get();
  const token = snap.get("fcm_token") as string | undefined;
  if (!token) return "missing" as const;
  try {
    await adminMessaging().send({
      token,
      data: { ...msg, tag: msg.tag ?? "alms" },
      webpush: { headers: { Urgency: "high", TTL: "900" } },
    });
    return "sent" as const;
  } catch (e) {
    const code = (e as { code?: string }).code ?? "";
    if (DEAD_TOKEN.has(code)) {
      await snap.ref.delete();
      return "dead" as const;
    }
    throw e;
  }
}
