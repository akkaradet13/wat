"use client";

import { collection, onSnapshot, query, where } from "firebase/firestore";
import Link from "next/link";
import { useEffect, useState } from "react";
import { authFetch, useUser } from "@/modules/core/auth/client";
import { clientDb } from "@/modules/core/firebase/client";
import type { TempleStatus, TempleSummary } from "@/modules/core/temples/types";
import { AuthForm } from "@/modules/core/ui/AuthForm";

const TABS: [TempleStatus, string][] = [
  ["unverified", "รอยืนยัน"],
  ["verified", "ยืนยันแล้ว"],
  ["suspended", "ถูกระงับ"],
];

export function AdminPanel() {
  const { user, claims, loading } = useUser();
  const [tab, setTab] = useState<TempleStatus>("unverified");
  const [rows, setRows] = useState<TempleSummary[] | null>(null);

  useEffect(() => {
    if (!claims.super_admin) return;
    return onSnapshot(query(collection(clientDb(), "temples"), where("status", "==", tab)), (snap) =>
      setRows(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<TempleSummary, "id">) }))),
    );
  }, [claims.super_admin, tab]);

  async function act(id: string, status: TempleStatus) {
    const { ok, data } = await authFetch(`/api/admin/temples/${id}`, { status }, "PATCH");
    if (!ok) alert(data.error || "ไม่สำเร็จ");
  }

  if (loading) return <p>กำลังโหลด…</p>;
  if (!user) return <AuthForm />;
  if (!claims.super_admin) return <p>บัญชีนี้ไม่ใช่ผู้ดูแลระบบ</p>;

  return (
    <div className="stack">
      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
        {TABS.map(([s, label]) => (
          <button key={s} className={s === tab ? "btn" : "btn btn-secondary"} onClick={() => { setRows(null); setTab(s); }}>
            {label}
          </button>
        ))}
      </div>
      {rows === null ? (
        <p>กำลังโหลด…</p>
      ) : rows.length === 0 ? (
        <p className="muted">ไม่มีรายการ</p>
      ) : (
        <ul className="cards">
          {rows.map((t) => (
            <li key={t.id} className="card stack">
              <Link href={`/wat/${t.slug}`} target="_blank">
                <strong>{t.name}</strong>
              </Link>
              <span className="muted">
                อ.{t.district} จ.{t.province}
              </span>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                {t.status !== "verified" && (
                  <button className="btn" onClick={() => act(t.id, "verified")}>
                    ยืนยัน
                  </button>
                )}
                {t.status !== "suspended" && (
                  <button className="btn btn-danger" onClick={() => confirm(`ระงับ ${t.name}?`) && act(t.id, "suspended")}>
                    ระงับ
                  </button>
                )}
                {t.status === "suspended" && (
                  <button className="btn btn-secondary" onClick={() => act(t.id, "unverified")}>
                    ยกเลิกการระงับ
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
