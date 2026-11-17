import { createAnnouncement } from "@/modules/alms/admin";
import { isTempleAdmin } from "@/modules/core/auth/members";
import { forbidden, getUser, jsonError, readJson, unauthorized } from "@/modules/core/auth/server";
import { adminDb } from "@/modules/core/firebase/admin";

/** { temple_id, date: "YYYY-MM-DD", message?, notify?: boolean } -> { id, notified } */
export async function POST(req: Request) {
  const user = await getUser(req);
  if (!user) return unauthorized();
  const b = await readJson(req);
  const templeId = String(b.temple_id ?? "");
  if (!isTempleAdmin(user, templeId)) return forbidden();
  const t = await adminDb().doc(`temples/${templeId}`).get();
  if (!t.exists) return jsonError(404, "ไม่พบวัด");
  const r = await createAnnouncement(templeId, b, { name: t.get("name"), slug: t.get("slug") });
  return r.ok ? Response.json({ id: r.id, notified: r.notified }, { status: 201 }) : jsonError(r.status, r.error);
}
