import { createAnnouncement } from "@/modules/alms/admin";
import { templeAdminDenied } from "@/modules/core/auth/members";
import { getUser, jsonError, readJson, unauthorized } from "@/modules/core/auth/server";
import { adminDb } from "@/modules/core/firebase/admin";

/** { temple_id, date: "YYYY-MM-DD", message?, notify?: boolean } -> { id, notified } */
export async function POST(req: Request) {
  const user = await getUser(req);
  if (!user) return unauthorized();
  const b = await readJson(req);
  const templeId = String(b.temple_id ?? "");
  const deny = await templeAdminDenied(user, templeId);
  if (deny) return jsonError(deny.status, deny.error);
  const t = await adminDb().doc(`temples/${templeId}`).get();
  if (!t.exists) return jsonError(404, "ไม่พบวัด");
  const r = await createAnnouncement(templeId, b, { name: t.get("name"), slug: t.get("slug") });
  return r.ok ? Response.json({ id: r.id, notified: r.notified }, { status: 201 }) : jsonError(r.status, r.error);
}
