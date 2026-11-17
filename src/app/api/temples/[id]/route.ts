import { revalidatePath } from "next/cache";
import { isTempleAdmin } from "@/modules/core/auth/members";
import { forbidden, getUser, jsonError, readJson, unauthorized } from "@/modules/core/auth/server";
import { updateTemple } from "@/modules/core/temples/server";
import { parseTempleInput } from "@/modules/core/temples/validate";

/** Temple admin edits the temple's info. Status/verification fields are not editable here. */
export async function PATCH(req: Request, ctx: RouteContext<"/api/temples/[id]">) {
  const user = await getUser(req);
  if (!user) return unauthorized();
  const { id } = await ctx.params;
  if (!isTempleAdmin(user, id)) return forbidden();

  const parsed = parseTempleInput(await readJson(req));
  if ("error" in parsed) return jsonError(400, parsed.error);
  const slug = await updateTemple(id, parsed.data);
  if (!slug) return jsonError(404, "ไม่พบวัด");
  revalidatePath(`/wat/${slug}`);
  revalidatePath("/");
  return Response.json({ slug });
}
