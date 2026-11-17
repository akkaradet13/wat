import { deleteRoute, updateRoute } from "@/modules/alms/admin";
import { isTempleAdmin } from "@/modules/core/auth/members";
import { forbidden, getUser, jsonError, readJson, unauthorized } from "@/modules/core/auth/server";

async function guard(req: Request) {
  const user = await getUser(req);
  if (!user) return { res: unauthorized() };
  const b = await readJson(req);
  const templeId = String(b.temple_id ?? "");
  return isTempleAdmin(user, templeId) ? { templeId, b } : { res: forbidden() };
}
const reply = (r: { ok: true } | { ok: false; status: number; error: string }) =>
  r.ok ? Response.json({ ok: true }) : jsonError(r.status, r.error);

/** { temple_id, name, start_time } */
export async function PATCH(req: Request, ctx: RouteContext<"/api/alms/routes/[id]">) {
  const g = await guard(req);
  return g.res ?? reply(await updateRoute(g.templeId, (await ctx.params).id, g.b));
}

/** { temple_id } — households on the route move to another route. */
export async function DELETE(req: Request, ctx: RouteContext<"/api/alms/routes/[id]">) {
  const g = await guard(req);
  return g.res ?? reply(await deleteRoute(g.templeId, (await ctx.params).id));
}
