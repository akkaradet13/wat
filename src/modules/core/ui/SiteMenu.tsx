"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useUser } from "../auth/client";
import { clientAuth } from "../firebase/client";

/** Hamburger menu (top right): all navigation for temples, plus who is signed in. */
export function SiteMenu() {
  const { user, claims, loading } = useUser();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  async function signOut() {
    setOpen(false);
    await clientAuth().signOut();
    router.push("/");
  }

  const role = claims.super_admin
    ? "ผู้ดูแลระบบ"
    : claims.role === "admin"
      ? "แอดมินวัด"
      : claims.role === "sender"
        ? "ผู้ส่งพิกัด"
        : "";

  return (
    <div className="menu">
      <button
        className="menu-button"
        aria-label={open ? "ปิดเมนู" : "เปิดเมนู"}
        aria-expanded={open}
        aria-controls="site-menu"
        onClick={() => setOpen(!open)}
      >
        <span aria-hidden>{open ? "✕" : "☰"}</span>
      </button>

      {open && (
        <>
          <div className="menu-backdrop" onClick={() => setOpen(false)} aria-hidden />
          <nav
            id="site-menu"
            className="menu-panel"
            aria-label="เมนู"
            onClick={(e) => (e.target as HTMLElement).closest("a") && setOpen(false)}
          >
            {user && (
              <p className="menu-who">
                👤 {user.email}
                {role && <span className="muted"> · {role}</span>}
              </p>
            )}
            <Link href="/alms/send">📍 ส่งพิกัดบิณฑบาต</Link>
            {claims.role === "admin" && <Link href="/manage">⚙️ จัดการวัด</Link>}
            {claims.super_admin && <Link href="/admin">✓ ยืนยันวัด</Link>}
            {!claims.temple_id && <Link href="/register">🛕 ลงทะเบียนวัด</Link>}
            {!loading &&
              (user ? (
                <button className="menu-item" onClick={signOut}>
                  ↩ ออกจากระบบ
                </button>
              ) : (
                <Link href="/login">🔑 เข้าสู่ระบบ</Link>
              ))}
          </nav>
        </>
      )}
    </div>
  );
}
