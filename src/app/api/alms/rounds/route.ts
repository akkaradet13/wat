import { startRound } from "@/modules/alms/server";
import { getUser, jsonError, unauthorized } from "@/modules/core/auth/server";

/** Start a round on the temple's route. Returns { id }. */
export async function POST(req: Request) {
  const user = await getUser(req);
  if (!user) return unauthorized();
  const r = await startRound(user);
  return r.ok ? Response.json({ id: r.id }, { status: 201 }) : jsonError(r.status, r.error);
}
