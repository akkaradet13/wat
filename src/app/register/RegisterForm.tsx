"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { authFetch, useUser } from "@/modules/core/auth/client";
import { MapView } from "@/modules/core/map";
import { SECTS, TEMPLE_TYPES, type LatLng } from "@/modules/core/temples/types";
import { AuthForm } from "@/modules/core/ui/AuthForm";

const THAILAND: LatLng = { lat: 13.7563, lng: 100.5018 };

// [name, label, required, input attrs]
const FIELDS: [string, string, boolean, React.InputHTMLAttributes<HTMLInputElement>?][] = [
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

export function RegisterForm() {
  const { user, claims, loading } = useUser();
  const router = useRouter();
  const [pin, setPin] = useState<LatLng | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  if (loading) return <p>กำลังโหลด…</p>;
  if (!user) return <AuthForm allowSignup />;
  if (claims.temple_id)
    return (
      <p>
        บัญชีนี้ลงทะเบียนวัดไว้แล้ว <Link href="/alms/send">ไปหน้าส่งพิกัด</Link>
      </p>
    );

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
    const body = {
      ...f,
      lat: pin.lat,
      lng: pin.lng,
      links: Object.fromEntries(LINKS.map(([k]) => [k, f[`link_${k}`]])),
    };
    setBusy(true);
    setError("");
    const { ok, data } = await authFetch<{ slug: string }>("/api/temples", body);
    if (!ok || !data.slug) {
      setBusy(false);
      return setError(data.error || "ลงทะเบียนไม่สำเร็จ");
    }
    await user!.getIdToken(true); // pick up the new temple_id / admin claims
    router.push(`/wat/${data.slug}`);
  }

  return (
    <form onSubmit={submit} className="stack">
      {FIELDS.map(([name, label, required, attrs]) => (
        <label key={name}>
          {label}
          {required && " *"}
          <input name={name} required={required} {...attrs} />
        </label>
      ))}
      <label>
        ประเภทวัด
        <select name="temple_type">
          {Object.entries(TEMPLE_TYPES).map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </select>
      </label>
      <label>
        นิกาย
        <select name="sect">
          {Object.entries(SECTS).map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </select>
      </label>
      <label>
        ประวัติหรือคำแนะนำวัดโดยย่อ
        <textarea name="description" rows={5} maxLength={3000} />
      </label>
      <fieldset>
        <legend>ช่องทางติดต่อ</legend>
        {LINKS.map(([k, label, type]) => (
          <label key={k}>
            {label}
            <input name={`link_${k}`} type={type} />
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
        {busy ? "กำลังบันทึก…" : "ลงทะเบียนวัด"}
      </button>
    </form>
  );
}
