"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useUser } from "../auth/client";
import { clientAuth } from "../firebase/client";

/** Header status: who is signed in, their shortcuts, and sign out. Public visitors see a small login link. */
export function UserMenu() {
  const { user, claims, loading } = useUser();
  const router = useRouter();
  if (loading) return null;
  if (!user)
    return (
      <Link href="/login" className="user-menu-link">
        เข้าสู่ระบบ (สำหรับวัด)
      </Link>
    );

  async function signOut() {
    await clientAuth().signOut();
    router.push("/");
  }

  const role = claims.super_admin ? "ผู้ดูแลระบบ" : claims.role === "admin" ? "แอดมินวัด" : claims.role === "sender" ? "ผู้ส่งพิกัด" : "";
  return (
    <div className="user-menu">
      <span className="user-menu-who">
        <span aria-hidden>👤</span> {user.email}
        {role && <span className="muted"> · {role}</span>}
      </span>
      <span className="user-menu-actions">
        {claims.super_admin && <Link href="/admin">ยืนยันวัด</Link>}
        {claims.temple_id && <Link href="/alms/send">ส่งพิกัด</Link>}
        <button className="link" onClick={signOut}>
          ออกจากระบบ
        </button>
      </span>
    </div>
  );
}
