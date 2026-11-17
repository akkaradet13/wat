"use client";

import { useState } from "react";
import { MapView } from "../map";
import { SECTS, TEMPLE_TYPES, type LatLng, type Temple } from "../temples/types";

const THAILAND: LatLng = { lat: 13.7563, lng: 100.5018 };

// [name, label, required, input attrs]
const FIELDS: [keyof Temple, string, boolean, React.InputHTMLAttributes<HTMLInputElement>?][] = [
  ["name", "ชื่อวัด", true, { placeholder: "เช่น วัดนิคมกิตติยาราม" }],
  ["address", "ที่อยู่ (เลขที่ หมู่ ถนน)", false],
  ["subdistrict", "ตำบล/แขวง", true],
  ["district", "อำเภอ/เขต", true],
  ["province", "จังหวัด", true],
  ["postal_code", "รหัสไปรษณีย์", false, { inputMode: "numeric", maxLength: 5 }],
  ["founded_year", "ปีที่ก่อตั้ง (พ.ศ.)", false, { type: "number", min: 1000, max: 2700 }],
  ["abbot_name", "ชื่อเจ้าอาวาส", false],
  ["phone", "โทรศัพท์", false, { type: "tel" }],
  ["photo_url", "ลิงก์รูปหลักของวัด (https://...)", false, { type: "url" }],
];
const LINKS = [
  ["facebook", "เพจ Facebook", "url"],
  ["website", "เว็บไซต์", "url"],
  ["line", "LINE ID", "text"],
] as const;

/** Temple info form for registration and editing. `onSubmit` returns an error message, or null on success. */
export function TempleForm({
  initial,
  submitLabel,
  onSubmit,
}: {
  initial?: Temple;
  submitLabel: string;
  onSubmit: (body: Record<string, unknown>) => Promise<string | null>;
}) {
  const [pin, setPin] = useState<LatLng | null>(initial?.location ?? null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  function locateMe() {
    navigator.geolocation.getCurrentPosition(
      (p) => setPin({ lat: p.coords.latitude, lng: p.coords.longitude }),
      () => setError("หาตำแหน่งปัจจุบันไม่ได้ กรุณาแตะบนแผนที่แทน"),
      { enableHighAccuracy: true, timeout: 20_000 },
    );
  }

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!pin) return setError("กรุณาปักหมุดตำแหน่งวัดบนแผนที่");
    const f = Object.fromEntries(new FormData(e.currentTarget));
    setBusy(true);
    setError("");
    const err = await onSubmit({
      ...f,
      lat: pin.lat,
      lng: pin.lng,
      links: Object.fromEntries(LINKS.map(([k]) => [k, f[`link_${k}`]])),
    });
    setBusy(false);
    if (err) setError(err);
  }

  return (
    <form onSubmit={submit} className="stack">
      {FIELDS.map(([name, label, required, attrs]) => (
        <label key={name}>
          {label}
          {required && " *"}
          <input name={name} required={required} defaultValue={String(initial?.[name] ?? "")} {...attrs} />
        </label>
      ))}
      <label>
        ประเภทวัด
        <select name="temple_type" defaultValue={initial?.temple_type}>
          {Object.entries(TEMPLE_TYPES).map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </select>
      </label>
      <label>
        นิกาย
        <select name="sect" defaultValue={initial?.sect}>
          {Object.entries(SECTS).map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </select>
      </label>
      <label>
        ประวัติหรือคำแนะนำวัดโดยย่อ
        <textarea name="description" rows={5} maxLength={3000} defaultValue={initial?.description} />
      </label>
      <fieldset>
        <legend>ช่องทางติดต่อ</legend>
        {LINKS.map(([k, label, type]) => (
          <label key={k}>
            {label}
            <input name={`link_${k}`} type={type} defaultValue={initial?.links[k] ?? ""} />
          </label>
        ))}
      </fieldset>

      <fieldset>
        <legend>ตำแหน่งวัด *</legend>
        <p className="muted">แตะบนแผนที่หรือลากหมุด 🛕 ไปที่ตั้งวัด</p>
        <button type="button" className="btn btn-secondary" onClick={locateMe}>
          📍 ใช้ตำแหน่งปัจจุบัน
        </button>
        <MapView
          center={pin ?? THAILAND}
          zoom={pin ? 17 : 6}
          pins={pin ? [{ kind: "temple", pos: pin, label: "ตำแหน่งวัด" }] : []}
          onPick={setPin}
        />
      </fieldset>

      {error && <p className="error">{error}</p>}
      <button className="btn btn-xl" disabled={busy}>
        {busy ? "กำลังบันทึก…" : submitLabel}
      </button>
    </form>
  );
}
