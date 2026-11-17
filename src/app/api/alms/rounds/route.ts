import { startRound } from "@/modules/alms/server";
import { getUser, jsonError, readJson, unauthorized } from "@/modules/core/auth/server";

/** Start a round. Body { route_id? } (defaults to the temple's first route). Returns { id }. */
export async function POST(req: Request) {
  const user = await getUser(req);
  if (!user) return unauthorized();
  const r = await startRound(user, (await readJson(req)).route_id);
  return r.ok ? Response.json({ id: r.id }, { status: 201 }) : jsonError(r.status, r.error);
}
