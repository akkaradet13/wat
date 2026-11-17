import { randomInt } from "node:crypto";
import type { DecodedIdToken } from "firebase-admin/auth";
import { adminAuth, adminDb } from "../firebase/admin";
import { getTempleStatus } from "../temples/server";

// Server only. Temple membership = users/{uid} doc + custom claims { temple_id, role }.

export type Role = "admin" | "sender";
export interface Member {
  uid: string;
  email: string;
  display_name: string;
  role: Role;
}
type Fail = { ok: false; status: number; error: string };

export const isTempleAdmin = (u: DecodedIdToken, templeId: string) =>
  u.super_admin === true || (u.temple_id === templeId && u.role === "admin");

export const SUSPENDED_ERROR = "วัดนี้ถูกระงับโดยผู้ดูแลระบบ จึงเพิ่มหรือแก้ไขข้อมูลไม่ได้";

/** Why this user may not change the temple, or null if allowed. Suspended temples are read-only except for super admins. */
export async function templeAdminDenied(u: DecodedIdToken, templeId: string): Promise<Fail | null> {
  if (!isTempleAdmin(u, templeId)) return { ok: false, status: 403, error: "ไม่มีสิทธิ์ทำรายการนี้" };
  if (u.super_admin === true) return null;
  const status = await getTempleStatus(templeId);
  if (!status) return { ok: false, status: 404, error: "ไม่พบวัด" };
  return status === "suspended" ? { ok: false, status: 403, error: SUSPENDED_ERROR } : null;
}

const users = () => adminDb().collection("users");
const ROLES: Role[] = ["admin", "sender"];

/** Easy to read aloud and type: no 0/O, 1/l/I. */
function newPassword() {
  const chars = "abcdefghjkmnpqrstuvwxyz23456789";
  return Array.from({ length: 10 }, () => chars[randomInt(chars.length)]).join("");
}

async function setClaims(uid: string, patch: { temple_id?: string; role?: Role } | null) {
  const claims = { ...(await adminAuth().getUser(uid)).customClaims };
  delete claims.temple_id;
  delete claims.role;
  await adminAuth().setCustomUserClaims(uid, { ...claims, ...patch });
}

export async function listMembers(templeId: string): Promise<Member[]> {
  const snap = await users().where("temple_id", "==", templeId).get();
  if (snap.empty) return [];
  const { users: accounts } = await adminAuth().getUsers(snap.docs.map((d) => ({ uid: d.id })));
  const email = new Map(accounts.map((a) => [a.uid, a.email ?? ""]));
  return snap.docs
    .map((d) => ({ uid: d.id, email: email.get(d.id) ?? "", display_name: d.get("display_name") ?? "", role: d.get("role") as Role }))
    .sort((a, b) => a.role.localeCompare(b.role) || a.email.localeCompare(b.email));
}

/** Adds an account to the temple. Creates it if new and returns a one-time password for the admin to hand over. */
export async function addMember(templeId: string, b: Record<string, unknown>): Promise<{ ok: true; password?: string } | Fail> {
  const email = typeof b.email === "string" ? b.email.trim().toLowerCase() : "";
  const display_name = typeof b.display_name === "string" ? b.display_name.trim().slice(0, 60) : "";
  const role = b.role as Role;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { ok: false, status: 400, error: "อีเมลไม่ถูกต้อง" };
  if (!ROLES.includes(role)) return { ok: false, status: 400, error: "บทบาทไม่ถูกต้อง" };

  let user = await adminAuth().getUserByEmail(email).catch(() => null);
  let password: string | undefined;
  if (user) {
    const current = user.customClaims?.temple_id;
    if (current && current !== templeId) return { ok: false, status: 409, error: "บัญชีนี้เป็นของวัดอื่นอยู่แล้ว" };
  } else {
    password = newPassword();
    user = await adminAuth().createUser({ email, password, displayName: display_name || undefined });
  }
  await users().doc(user.uid).set({ temple_id: templeId, role, display_name }, { merge: true });
  await setClaims(user.uid, { temple_id: templeId, role });
  return { ok: true, password };
}

async function adminCount(templeId: string) {
  return (await users().where("temple_id", "==", templeId).where("role", "==", "admin").count().get()).data().count;
}

async function memberRef(templeId: string, uid: string) {
  const ref = users().doc(uid);
  const snap = await ref.get();
  return snap.exists && snap.get("temple_id") === templeId ? snap : null;
}

export async function setMemberRole(templeId: string, uid: string, role: unknown): Promise<{ ok: true } | Fail> {
  if (!ROLES.includes(role as Role)) return { ok: false, status: 400, error: "บทบาทไม่ถูกต้อง" };
  const m = await memberRef(templeId, uid);
  if (!m) return { ok: false, status: 404, error: "ไม่พบสมาชิก" };
  if (m.get("role") === "admin" && role !== "admin" && (await adminCount(templeId)) <= 1)
    return { ok: false, status: 409, error: "ต้องมีแอดมินอย่างน้อย 1 คน" };
  await m.ref.update({ role });
  await setClaims(uid, { temple_id: templeId, role: role as Role });
  return { ok: true };
}

/** Removes the account from the temple (the account itself stays). Takes effect within an hour (token refresh). */
export async function removeMember(templeId: string, uid: string): Promise<{ ok: true } | Fail> {
  const m = await memberRef(templeId, uid);
  if (!m) return { ok: false, status: 404, error: "ไม่พบสมาชิก" };
  if (m.get("role") === "admin" && (await adminCount(templeId)) <= 1)
    return { ok: false, status: 409, error: "ต้องมีแอดมินอย่างน้อย 1 คน" };
  await m.ref.delete();
  await setClaims(uid, null);
  await adminAuth().revokeRefreshTokens(uid);
  return { ok: true };
}
