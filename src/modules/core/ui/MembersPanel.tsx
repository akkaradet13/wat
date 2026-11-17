"use client";

import { useCallback, useEffect, useState } from "react";
import { authFetch } from "../auth/client";
import type { Member } from "../auth/members";

const ROLE_TH = { admin: "แอดมินวัด", sender: "ผู้ส่งพิกัด" } as const;

/** Temple admin: add/remove senders and co-admins. */
export function MembersPanel({ templeId, myUid }: { templeId: string; myUid: string }) {
  const url = `/api/temples/${templeId}/members`;
  const [members, setMembers] = useState<Member[] | null>(null);
  const [message, setMessage] = useState("");
  const [newPassword, setNewPassword] = useState<{ email: string; password: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const { data } = await authFetch<{ members: Member[] }>(url, undefined, "GET");
    setMembers(data.members ?? []);
  }, [url]);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-shot fetch on mount
    load();
  }, [load]);

  async function call(body: object, method: string) {
    setBusy(true);
    setMessage("");
    const r = await authFetch<{ password?: string }>(url, body, method);
    setBusy(false);
    if (!r.ok) setMessage(r.data.error || "ไม่สำเร็จ");
    await load();
    return r;
  }

  async function add(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const f = Object.fromEntries(new FormData(form));
    const r = await call(f, "POST");
    if (!r.ok) return;
    form.reset();
    setNewPassword(r.data.password ? { email: String(f.email), password: r.data.password } : null);
    if (!r.data.password) setMessage("เพิ่มบัญชีที่มีอยู่แล้วเข้าวัดเรียบร้อย ให้ผู้นั้นออกจากระบบแล้วเข้าใหม่");
  }

  return (
    <div className="stack">
      {members === null ? (
        <p className="muted">กำลังโหลด…</p>
      ) : (
        <ul className="cards">
          {members.map((m) => (
            <li key={m.uid} className="card stack">
              <span>
                <strong>{m.display_name || m.email}</strong>
                {m.display_name && <span className="muted"> · {m.email}</span>}
                {m.uid === myUid && <span className="muted"> (ท่าน)</span>}
              </span>
              <div className="choices">
                <select
                  value={m.role}
                  disabled={busy}
                  aria-label="บทบาท"
                  onChange={(e) => call({ uid: m.uid, role: e.target.value }, "PATCH")}
                >
                  {Object.entries(ROLE_TH).map(([v, l]) => (
                    <option key={v} value={v}>
                      {l}
                    </option>
                  ))}
                </select>
                {m.uid !== myUid && (
                  <button
                    className="btn btn-secondary"
                    disabled={busy}
                    onClick={() => confirm(`นำ ${m.email} ออกจากวัด?`) && call({ uid: m.uid }, "DELETE")}
                  >
                    นำออก
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {newPassword && (
        <div className="guide stack" role="status">
          <p>
            สร้างบัญชีแล้ว แจ้งข้อมูลนี้ให้ผู้ใช้ (แสดงครั้งเดียว):
            <br />
            อีเมล <strong>{newPassword.email}</strong>
            <br />
            รหัสผ่าน <strong style={{ fontSize: "1.3rem", letterSpacing: "0.1em" }}>{newPassword.password}</strong>
          </p>
          <p className="muted">เปลี่ยนรหัสผ่านได้เองที่หน้าเข้าสู่ระบบ → &quot;ลืมรหัสผ่าน?&quot;</p>
        </div>
      )}

      <form onSubmit={add} className="stack">
        <h3>เพิ่มคน</h3>
        <label>
          อีเมล
          <input name="email" type="email" required />
        </label>
        <label>
          ชื่อเรียก (เช่น ลูกศิษย์สมชาย)
          <input name="display_name" maxLength={60} />
        </label>
        <label>
          บทบาท
          <select name="role" defaultValue="sender">
            <option value="sender">ผู้ส่งพิกัด (เริ่ม/จบรอบเท่านั้น)</option>
            <option value="admin">แอดมินวัด (จัดการได้ทุกอย่าง)</option>
          </select>
        </label>
        <button className="btn" disabled={busy}>
          เพิ่ม
        </button>
      </form>
      {message && <p className={message.includes("ไม่") || message.includes("ต้อง") ? "error" : "muted"}>{message}</p>}
    </div>
  );
}
