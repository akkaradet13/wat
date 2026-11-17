import { updateLocation } from "@/modules/alms/server";
import { getUser, jsonError, readJson, unauthorized } from "@/modules/core/auth/server";

/** Sender posts { round_id, lat, lng } every few seconds. Phase 3 adds the proximity notifications here. */
export async function POST(req: Request) {
  const user = await getUser(req);
  if (!user) return unauthorized();
  const b = await readJson(req);
  const r = await updateLocation(user, String(b.round_id ?? ""), Number(b.lat), Number(b.lng));
  return r.ok ? Response.json({ ok: true }) : jsonError(r.status, r.error);
}
