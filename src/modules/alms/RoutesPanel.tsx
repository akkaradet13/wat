"use client";

import { useState } from "react";
import { authFetch } from "@/modules/core/auth/client";
import { useRoutes } from "./useRoutes";

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));
const MINUTES = Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, "0"));

/** 24-hour time picker. `<input type="time">` follows the device locale and may show AM/PM. */
function TimeSelect({ name, defaultValue }: { name: string; defaultValue: string }) {
  const [h, m] = defaultValue.split(":");
  const [time, setTime] = useState({ h, m: MINUTES.includes(m) ? m : "00" });
  return (
    <span className="choices" style={{ alignItems: "center" }}>
      <select aria-label="ชั่วโมง" value={time.h} onChange={(e) => setTime({ ...time, h: e.target.value })}>
        {HOURS.map((v) => (
          <option key={v}>{v}</option>
        ))}
      </select>
      :
      <select aria-label="นาที" value={time.m} onChange={(e) => setTime({ ...time, m: e.target.value })}>
        {MINUTES.map((v) => (
          <option key={v}>{v}</option>
        ))}
      </select>
      น.
      <input type="hidden" name={name} value={`${time.h}:${time.m}`} />
    </span>
  );
}

/** Temple admin: add, rename, retime and delete alms routes. */
export function RoutesPanel({ templeId }: { templeId: string }) {
  const routes = useRoutes(templeId);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function call(url: string, body: object, method: string) {
    setBusy(true);
    setMessage("");
    const { ok, data } = await authFetch(url, { temple_id: templeId, ...body }, method);
    setBusy(false);
    if (!ok) setMessage(data.error || "ไม่สำเร็จ");
    return ok;
  }

  const fields = (f: FormData) => ({ name: f.get("name"), start_time: f.get("start_time"), monks: f.get("monks") });

  return (
    <div className="stack">
      {routes?.length === 0 && <p className="muted">ยังไม่มีสาย ระบบจะสร้าง &quot;สายหลัก&quot; ให้เมื่อเริ่มรอบครั้งแรก</p>}
      {routes?.map((r) => (
        <form
          key={r.id}
          className="card stack"
          onSubmit={async (e) => {
            e.preventDefault();
            if (await call(`/api/alms/routes/${r.id}`, fields(new FormData(e.currentTarget)), "PATCH")) setMessage("บันทึกแล้ว");
          }}
        >
          <label>
            ชื่อสาย
            <input name="name" defaultValue={r.name} required maxLength={60} />
          </label>
          <label>
            เวลาออก
            <TimeSelect name="start_time" defaultValue={r.start_time} />
          </label>
          <label>
            พระที่ออกบิณฑบาตสายนี้ (แสดงบนแผนที่)
            <input name="monks" defaultValue={r.monks} maxLength={120} placeholder="เช่น หลวงพ่อทองอินทร์" />
          </label>
          <div className="choices">
            <button className="btn" disabled={busy}>
              บันทึก
            </button>
            {routes.length > 1 && (
              <button
                type="button"
                className="btn btn-secondary"
                disabled={busy}
                onClick={() =>
                  confirm(`ลบ "${r.name}"? บ้านที่ตั้งแจ้งเตือนสายนี้จะย้ายไปสายอื่น`) &&
                  call(`/api/alms/routes/${r.id}`, {}, "DELETE")
                }
              >
                ลบสาย
              </button>
            )}
          </div>
        </form>
      ))}

      <form
        className="stack"
        onSubmit={async (e) => {
          e.preventDefault();
          const form = e.currentTarget;
          if (await call("/api/alms/routes", fields(new FormData(form)), "POST")) form.reset();
        }}
      >
        <h3>เพิ่มสาย</h3>
        <label>
          ชื่อสาย
          <input name="name" required maxLength={60} placeholder="เช่น สายตลาด" />
        </label>
        <label>
          เวลาออก
          <TimeSelect name="start_time" defaultValue="06:00" />
        </label>
        <label>
          พระที่ออกบิณฑบาตสายนี้ (แสดงบนแผนที่)
          <input name="monks" maxLength={120} placeholder="เช่น หลวงพ่อทองอินทร์" />
        </label>
        <button className="btn" disabled={busy}>
          เพิ่มสาย
        </button>
      </form>
      {message && <p className={message === "บันทึกแล้ว" ? "muted" : "error"}>{message}</p>}
    </div>
  );
}
