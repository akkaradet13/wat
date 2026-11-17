import { startRound } from "@/modules/alms/server";
import { getUser, jsonError, readJson, unauthorized } from "@/modules/core/auth/server";

/** Start a round. Body { route_id?, display_name? } (route defaults to the temple's first). Returns { id }. */
export async function POST(req: Request) {
  const user = await getUser(req);
  if (!user) return unauthorized();
  const b = await readJson(req);
  const r = await startRound(user, b.route_id, b.display_name);
  return r.ok ? Response.json({ id: r.id }, { status: 201 }) : jsonError(r.status, r.error);
}
