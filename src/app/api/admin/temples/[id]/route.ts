import { revalidatePath } from "next/cache";
import { endTempleRounds } from "@/modules/alms/server";
import { forbidden, getUser, jsonError, readJson, unauthorized } from "@/modules/core/auth/server";
import { setTempleStatus } from "@/modules/core/temples/server";
import type { TempleStatus } from "@/modules/core/temples/types";

const STATUSES: TempleStatus[] = ["unverified", "verified", "suspended"];

/** Super admin: verify, suspend or reinstate a temple. */
export async function PATCH(req: Request, ctx: RouteContext<"/api/admin/temples/[id]">) {
  const user = await getUser(req);
  if (!user) return unauthorized();
  if (user.super_admin !== true) return forbidden();

  const { status } = await readJson(req);
  if (!STATUSES.includes(status as TempleStatus)) return jsonError(400, "สถานะไม่ถูกต้อง");

  const { id } = await ctx.params;
  const slug = await setTempleStatus(id, status as TempleStatus, user.uid);
  if (!slug) return jsonError(404, "ไม่พบวัด");
  if (status === "suspended") await endTempleRounds(id);
  revalidatePath(`/wat/${slug}`);
  revalidatePath("/");
  revalidatePath("/sitemap.xml");
  return Response.json({ ok: true });
}
