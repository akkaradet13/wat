import { closeStaleRounds } from "@/modules/alms/server";
import { unauthorized } from "@/modules/core/auth/server";

/** Daily Vercel Cron (vercel.json). Vercel sends `Authorization: Bearer $CRON_SECRET`. */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) return unauthorized();
  return Response.json({ closed: await closeStaleRounds() });
}
