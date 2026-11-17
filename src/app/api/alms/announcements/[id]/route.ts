import { deleteAnnouncement } from "@/modules/alms/admin";
import { templeAdminDenied } from "@/modules/core/auth/members";
import { getUser, jsonError, readJson, unauthorized } from "@/modules/core/auth/server";

/** { temple_id } */
export async function DELETE(req: Request, ctx: RouteContext<"/api/alms/announcements/[id]">) {
  const user = await getUser(req);
  if (!user) return unauthorized();
  const templeId = String((await readJson(req)).temple_id ?? "");
  const deny = await templeAdminDenied(user, templeId);
  if (deny) return jsonError(deny.status, deny.error);
  const r = await deleteAnnouncement(templeId, (await ctx.params).id);
  return r.ok ? Response.json({ ok: true }) : jsonError(r.status, r.error);
}
