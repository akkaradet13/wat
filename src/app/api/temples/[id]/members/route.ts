import { addMember, isTempleAdmin, listMembers, removeMember, setMemberRole } from "@/modules/core/auth/members";
import { forbidden, getUser, jsonError, readJson, unauthorized } from "@/modules/core/auth/server";

async function guard(req: Request, ctx: RouteContext<"/api/temples/[id]/members">) {
  const user = await getUser(req);
  if (!user) return { res: unauthorized() };
  const { id } = await ctx.params;
  return isTempleAdmin(user, id) ? { id } : { res: forbidden() };
}
const reply = (r: { ok: true } | { ok: false; status: number; error: string }, body?: object) =>
  r.ok ? Response.json({ ok: true, ...body }) : jsonError(r.status, r.error);

export async function GET(req: Request, ctx: RouteContext<"/api/temples/[id]/members">) {
  const g = await guard(req, ctx);
  return g.res ?? Response.json({ members: await listMembers(g.id) });
}

/** { email, display_name, role } -> { password? } (only when a new account was created) */
export async function POST(req: Request, ctx: RouteContext<"/api/temples/[id]/members">) {
  const g = await guard(req, ctx);
  if (g.res) return g.res;
  const r = await addMember(g.id, await readJson(req));
  return reply(r, r.ok ? { password: r.password } : undefined);
}

/** { uid, role } */
export async function PATCH(req: Request, ctx: RouteContext<"/api/temples/[id]/members">) {
  const g = await guard(req, ctx);
  if (g.res) return g.res;
  const b = await readJson(req);
  return reply(await setMemberRole(g.id, String(b.uid ?? ""), b.role));
}

/** { uid } */
export async function DELETE(req: Request, ctx: RouteContext<"/api/temples/[id]/members">) {
  const g = await guard(req, ctx);
  if (g.res) return g.res;
  const b = await readJson(req);
  return reply(await removeMember(g.id, String(b.uid ?? "")));
}
