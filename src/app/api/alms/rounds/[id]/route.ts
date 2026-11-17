import { endRound } from "@/modules/alms/server";
import { getUser, unauthorized } from "@/modules/core/auth/server";

/** End a round. Idempotent. */
export async function DELETE(req: Request, ctx: RouteContext<"/api/alms/rounds/[id]">) {
  const user = await getUser(req);
  if (!user) return unauthorized();
  await endRound(user, (await ctx.params).id);
  return Response.json({ ok: true });
}
