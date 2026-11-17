import { deleteHousehold, saveHousehold } from "@/modules/alms/households";
import { getUser, jsonError, readJson, unauthorized } from "@/modules/core/auth/server";

/** Save this device's home pin + FCM token. Caller is usually an anonymous user. */
export async function POST(req: Request) {
  const user = await getUser(req);
  if (!user) return unauthorized();
  const r = await saveHousehold(user.uid, await readJson(req));
  return r.ok ? Response.json({ ok: true }) : jsonError(r.status, r.error);
}

/** Stop alerts for this device. */
export async function DELETE(req: Request) {
  const user = await getUser(req);
  if (!user) return unauthorized();
  await deleteHousehold(user.uid);
  return Response.json({ ok: true });
}
