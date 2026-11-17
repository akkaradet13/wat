"use client";

import { collection, onSnapshot, query, where } from "firebase/firestore";
import { useEffect, useState } from "react";
import { authFetch } from "@/modules/core/auth/client";
import { clientDb } from "@/modules/core/firebase/client";
import { ANNOUNCEMENTS } from "./constants";

interface Announcement {
  id: string;
  date: string;
  message: string;
}

const todayTh = () => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Bangkok" }).format(new Date());
const dateTh = (d: string) =>
  new Date(d).toLocaleDateString("th-TH", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

/** Upcoming announcements (today onward), live. */
function useAnnouncements(templeId: string) {
  const [items, setItems] = useState<Announcement[] | null>(null);
  useEffect(
    () =>
      onSnapshot(query(collection(clientDb(), ANNOUNCEMENTS), where("temple_id", "==", templeId)), (snap) => {
        const today = todayTh();
        setItems(
          snap.docs
            .map((d) => ({ id: d.id, date: d.get("date") as string, message: d.get("message") as string }))
            .filter((a) => a.date >= today)
            .sort((a, b) => a.date.localeCompare(b.date)),
        );
      }),
    [templeId],
  );
  return items;
}

/** Temple page banner: shown above the live map. */
export function AnnouncementBanner({ templeId }: { templeId: string }) {
  const items = useAnnouncements(templeId);
  if (!items?.length) return null;
  return (
    <div className="announce" role="alert">
      {items.map((a) => (
        <p key={a.id}>
          📢 <strong>งดบิณฑบาต {a.date === todayTh() ? "วันนี้" : dateTh(a.date)}</strong>
          {a.message !== "งดบิณฑบาต" && ` · ${a.message}`}
        </p>
      ))}
    </div>
  );
}

/** Temple admin: announce and cancel no-alms days. */
export function AnnouncementsPanel({ templeId }: { templeId: string }) {
  const items = useAnnouncements(templeId);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const f = new FormData(form);
    setBusy(true);
    setMessage("");
    const { ok, data } = await authFetch<{ notified: number }>("/api/alms/announcements", {
      temple_id: templeId,
      date: f.get("date"),
      message: f.get("message"),
      notify: f.get("notify") === "on",
    });
    setBusy(false);
    if (!ok) return setMessage(data.error || "ประกาศไม่สำเร็จ");
    form.reset();
    setMessage(`ประกาศแล้ว${f.get("notify") === "on" ? ` แจ้งเตือนไป ${data.notified ?? 0} บ้าน` : ""}`);
  }

  return (
    <div className="stack">
      {items?.map((a) => (
        <div key={a.id} className="card stack">
          <span>
            <strong>{dateTh(a.date)}</strong> · {a.message}
          </span>
          <button
            className="btn btn-secondary"
            disabled={busy}
            onClick={async () => {
              if (!confirm("ยกเลิกประกาศนี้?")) return;
              await authFetch(`/api/alms/announcements/${a.id}`, { temple_id: templeId }, "DELETE");
            }}
          >
            ยกเลิกประกาศ
          </button>
        </div>
      ))}
      <form onSubmit={submit} className="stack">
        <h3>ประกาศงดบิณฑบาต</h3>
        <label>
          วันที่
          <input name="date" type="date" required min={todayTh()} />
        </label>
        <label>
          ข้อความ (ไม่บังคับ)
          <input name="message" maxLength={300} placeholder="เช่น ติดกิจนิมนต์นอกวัด" />
        </label>
        <label style={{ flexDirection: "row", alignItems: "center", gap: "0.5rem" }}>
          <input name="notify" type="checkbox" defaultChecked style={{ width: 24, height: 24 }} />
          ส่งแจ้งเตือนไปยังบ้านที่เปิดรับแจ้งเตือนของวัดนี้
        </label>
        <button className="btn" disabled={busy}>
          {busy ? "กำลังประกาศ…" : "ประกาศ"}
        </button>
      </form>
      {message && <p className={message.startsWith("ประกาศแล้ว") ? "muted" : "error"}>{message}</p>}
    </div>
  );
}
