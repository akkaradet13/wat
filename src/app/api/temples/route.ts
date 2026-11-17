import { revalidatePath } from "next/cache";
import { getUser, jsonError, readJson, unauthorized } from "@/modules/core/auth/server";
import { createTemple } from "@/modules/core/temples/server";
import { parseTempleInput } from "@/modules/core/temples/validate";

/** Open registration: any signed-in account can register one temple, usable immediately as "unverified". */
export async function POST(req: Request) {
  const user = await getUser(req);
  if (!user) return unauthorized();
  if (user.temple_id) return jsonError(409, "บัญชีนี้ลงทะเบียนวัดไว้แล้ว");

  const parsed = parseTempleInput(await readJson(req));
  if ("error" in parsed) return jsonError(400, parsed.error);

  const result = await createTemple(user.uid, parsed.data);
  if ("error" in result) return jsonError(409, result.error);
  revalidatePath("/");
  return Response.json(result, { status: 201 });
}
