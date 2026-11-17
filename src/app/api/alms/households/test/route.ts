import { pushToHousehold } from "@/modules/alms/households";
import { getUser, jsonError, readJson, unauthorized } from "@/modules/core/auth/server";

/** Send a test notification to this device so people can see alerts work before tomorrow morning. */
export async function POST(req: Request) {
  const user = await getUser(req);
  if (!user) return unauthorized();
  const { url } = await readJson(req);
  const result = await pushToHousehold(user.uid, {
    title: "ทดสอบแจ้งเตือน 🔔",
    body: "ได้รับข้อความนี้แสดงว่าพร้อมแล้ว เมื่อพระใกล้ถึงบ้านจะแจ้งเตือนแบบนี้",
    url: typeof url === "string" && url.startsWith("/") ? url : "/",
    tag: "test",
  });
  if (result === "sent") return Response.json({ ok: true });
  return jsonError(410, "การแจ้งเตือนของเครื่องนี้หมดอายุ กรุณาเปิดแจ้งเตือนใหม่");
}
