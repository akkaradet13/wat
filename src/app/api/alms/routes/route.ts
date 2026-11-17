import { createRoute } from "@/modules/alms/admin";
import { templeAdminDenied } from "@/modules/core/auth/members";
import { getUser, jsonError, readJson, unauthorized } from "@/modules/core/auth/server";

/** { temple_id, name, start_time } -> { id } */
export async function POST(req: Request) {
  const user = await getUser(req);
  if (!user) return unauthorized();
  const b = await readJson(req);
  const templeId = String(b.temple_id ?? "");
  const deny = await templeAdminDenied(user, templeId);
  if (deny) return jsonError(deny.status, deny.error);
  const r = await createRoute(templeId, b);
  return r.ok ? Response.json({ id: r.id }, { status: 201 }) : jsonError(r.status, r.error);
}
