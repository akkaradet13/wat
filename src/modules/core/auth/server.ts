import type { DecodedIdToken } from "firebase-admin/auth";
import { adminAuth } from "../firebase/admin";

/** Verifies `Authorization: Bearer <Firebase ID token>`. Returns null when missing or invalid. */
export async function getUser(req: Request): Promise<DecodedIdToken | null> {
  const token = req.headers.get("authorization")?.match(/^Bearer (.+)$/)?.[1];
  if (!token) return null;
  try {
    return await adminAuth().verifyIdToken(token);
  } catch {
    return null;
  }
}

export const jsonError = (status: number, error: string) => Response.json({ error }, { status });
export const unauthorized = () => jsonError(401, "กรุณาเข้าสู่ระบบ");
export const forbidden = () => jsonError(403, "ไม่มีสิทธิ์ทำรายการนี้");

export async function readJson(req: Request): Promise<Record<string, unknown>> {
  const body: unknown = await req.json().catch(() => null);
  return body && typeof body === "object" ? (body as Record<string, unknown>) : {};
}
