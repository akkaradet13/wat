"use client";

import Link from "next/link";
import { useState } from "react";
import { AnnouncementsPanel } from "@/modules/alms/announcements";
import { RoutesPanel } from "@/modules/alms/RoutesPanel";
import { authFetch, useUser } from "@/modules/core/auth/client";
import { useTemple } from "@/modules/core/temples/client";
import { AuthForm } from "@/modules/core/ui/AuthForm";
import { MembersPanel } from "@/modules/core/ui/MembersPanel";
import { TempleForm } from "@/modules/core/ui/TempleForm";
import { TempleStatusBadge } from "@/modules/core/ui/TempleStatusBadge";

const TABS = [
  ["announce", "ประกาศ"],
  ["routes", "สายบิณฑบาต"],
  ["members", "คนของวัด"],
  ["info", "ข้อมูลวัด"],
] as const;

export function ManagePanel() {
  const { user, claims, loading } = useUser();
  const { temple, reload } = useTemple(claims.temple_id);
  const [tab, setTab] = useState<(typeof TABS)[number][0]>("announce");
  const [saved, setSaved] = useState(false);

  if (loading) return <p>กำลังโหลด…</p>;
  if (!user) return <AuthForm />;
  if (!claims.temple_id) return <p>บัญชีนี้ยังไม่ได้ผูกกับวัด <Link href="/register">ลงทะเบียนวัด</Link></p>;
  if (claims.role !== "admin") return <p>เฉพาะแอดมินวัดเท่านั้น <Link href="/alms/send">ไปหน้าส่งพิกัด</Link></p>;
  if (!temple) return <p>กำลังโหลด…</p>;

  return (
    <div className="stack">
      <p>
        <Link href={`/wat/${temple.slug}`}>{temple.name}</Link> <TempleStatusBadge status={temple.status} />
      </p>
      <div className="choices" role="tablist">
        {TABS.map(([key, label]) => (
          <button
            key={key}
            role="tab"
            aria-selected={tab === key}
            className={tab === key ? "btn" : "btn btn-secondary"}
            onClick={() => {
              setSaved(false);
              setTab(key);
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "announce" && <AnnouncementsPanel templeId={temple.id} />}
      {tab === "routes" && <RoutesPanel templeId={temple.id} />}
      {tab === "members" && <MembersPanel templeId={temple.id} myUid={user.uid} />}
      {tab === "info" && (
        <>
          <p className="muted">แก้ชื่อวัดได้ ลิงก์ของวัดจะยังเป็นลิงก์เดิม เพื่อให้ลิงก์ที่แชร์ไปแล้วใช้ได้ต่อ</p>
          {saved && <p className="live-banner">บันทึกแล้ว</p>}
          <TempleForm
            key={temple.updated_at ?? temple.name}
            initial={temple}
            submitLabel="บันทึกข้อมูลวัด"
            onSubmit={async (body) => {
              const { ok, data } = await authFetch(`/api/temples/${temple.id}`, body, "PATCH");
              if (!ok) return data.error || "บันทึกไม่สำเร็จ";
              await reload();
              setSaved(true);
              window.scrollTo({ top: 0, behavior: "smooth" });
              return null;
            }}
          />
        </>
      )}
    </div>
  );
}
