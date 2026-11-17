"use client";

import { onAuthStateChanged, signInAnonymously } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { useEffect, useRef, useState } from "react";
import { authFetch } from "@/modules/core/auth/client";
import { clientAuth, clientDb } from "@/modules/core/firebase/client";
import { MapView, type MapPin } from "@/modules/core/map";
import type { LatLng } from "@/modules/core/temples/types";
import { HOUSEHOLDS } from "./constants";
import { IosInstallGuide } from "./IosInstallGuide";
import { getPushToken, pushSupport } from "./push";
import { useRoutes } from "./useRoutes";

type Phase = "loading" | "off" | "setup" | "on" | "ios-install" | "unsupported" | "denied";
const RADII = [200, 300, 500];

/** Temple page section: pin your home and turn on "monk is near" alerts. No sign-up (anonymous auth). */
export function HomeAlert({ templeId, templeName, location }: { templeId: string; templeName: string; location: LatLng }) {
  const [phase, setPhase] = useState<Phase>("loading");
  const [otherTemple, setOtherTemple] = useState(false);
  const [pin, setPin] = useState<LatLng | null>(null);
  const [radius, setRadius] = useState(300);
  const routes = useRoutes(templeId);
  const [routeId, setRouteId] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const enabling = useRef(false);

  useEffect(
    () =>
      onAuthStateChanged(clientAuth(), async (user) => {
        if (enabling.current) return;
        const support = await pushSupport();
        if (support !== "ok") return setPhase(support);
        if (Notification.permission === "denied") return setPhase("denied");
        const snap = user ? await getDoc(doc(clientDb(), HOUSEHOLDS, user.uid)).catch(() => null) : null;
        if (snap?.exists() && snap.get("temple_id") === templeId) {
          const p = snap.get("position");
          setPin({ lat: p.latitude, lng: p.longitude });
          setRadius(snap.get("radius_m"));
          setRouteId(snap.get("route_id"));
          setPhase("on");
        } else {
          setOtherTemple(!!snap?.exists());
          setPhase("off");
        }
      }),
    [templeId],
  );

  function locateHome() {
    navigator.geolocation.getCurrentPosition(
      (p) => setPin({ lat: p.coords.latitude, lng: p.coords.longitude }),
      () => setMessage("หาตำแหน่งไม่ได้ กรุณาแตะบนแผนที่ตรงบ้านของท่านแทน"),
      { enableHighAccuracy: true, timeout: 20_000 },
    );
  }

  async function sendTest() {
    const { ok, status, data } = await authFetch("/api/alms/households/test", { url: window.location.pathname });
    if (status === 410) setPhase("off");
    setMessage(ok ? "ส่งแจ้งเตือนทดสอบแล้ว ดูที่หน้าจอมือถือ" : data.error || "ส่งไม่สำเร็จ");
  }

  async function enable() {
    if (!pin) return setMessage("กรุณาปักหมุดบ้านก่อน");
    setBusy(true);
    setMessage("");
    enabling.current = true;
    try {
      // Ask first, before any other await, so iPhone still treats it as a direct tap.
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        if (permission === "denied") setPhase("denied");
        return setMessage("ต้องกด \"อนุญาต\" จึงจะรับแจ้งเตือนได้");
      }
      if (!clientAuth().currentUser) await signInAnonymously(clientAuth());
      const { ok, data } = await authFetch("/api/alms/households", {
        temple_id: templeId,
        lat: pin.lat,
        lng: pin.lng,
        radius_m: radius,
        route_id: routeId || routes?.[0]?.id,
        fcm_token: await getPushToken(),
      });
      if (!ok) return setMessage(data.error || "เปิดแจ้งเตือนไม่สำเร็จ");
      setPhase("on");
      await sendTest();
    } catch {
      setMessage("เปิดแจ้งเตือนไม่สำเร็จ กรุณาลองใหม่");
    } finally {
      enabling.current = false;
      setBusy(false);
    }
  }

  async function disable() {
    setBusy(true);
    await authFetch("/api/alms/households", undefined, "DELETE");
    setBusy(false);
    setMessage("ปิดแจ้งเตือนแล้ว");
    setPhase("off");
  }

  const pins: MapPin[] = [{ kind: "temple", pos: location, label: templeName }];
  if (pin) pins.unshift({ kind: "home", pos: pin, label: "บ้านของท่าน" });

  return (
    <section className="stack alert-box" aria-live="polite">
      <h2>แจ้งเตือนเมื่อพระใกล้ถึงบ้าน</h2>

      {phase === "loading" && <p className="muted">กำลังตรวจสอบ…</p>}
      {phase === "ios-install" && <IosInstallGuide />}
      {phase === "unsupported" && <p>เบราว์เซอร์นี้ยังรับแจ้งเตือนไม่ได้ ลองเปิดเว็บนี้ด้วย Chrome หรือ Safari</p>}
      {phase === "denied" && (
        <p>
          ท่านปิดการแจ้งเตือนของเว็บนี้ไว้ เปิดใหม่ได้ที่ การตั้งค่าเว็บไซต์ (แตะรูปแม่กุญแจข้างช่องที่อยู่) → การแจ้งเตือน →
          อนุญาต แล้วโหลดหน้านี้ใหม่
        </p>
      )}

      {phase === "off" && (
        <>
          <p className="muted">
            ไม่ต้องสมัครสมาชิก ปักหมุดบ้านครั้งเดียว
            {otherTemple && " (เครื่องนี้ตั้งแจ้งเตือนไว้กับวัดอื่น ถ้าเปิดที่นี่จะย้ายมาวัดนี้)"}
          </p>
          <button className="btn btn-xl" onClick={() => setPhase("setup")}>
            🔔 ตั้งแจ้งเตือน
          </button>
        </>
      )}

      {phase === "setup" && (
        <>
          <p>
            <strong>1. ปักหมุดบ้านของท่าน</strong> แตะบนแผนที่ หรือกดปุ่มด้านล่างตอนอยู่ที่บ้าน
          </p>
          <button className="btn btn-secondary" onClick={locateHome}>
            📍 ใช้ตำแหน่งปัจจุบัน
          </button>
          <MapView center={pin ?? location} pins={pins} onPick={setPin} />
          {routes && routes.length > 1 && (
            <label>
              สายบิณฑบาตที่ผ่านหน้าบ้าน
              <select value={routeId || routes[0].id} onChange={(e) => setRouteId(e.target.value)}>
                {routes.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name} ({r.start_time} น.)
                  </option>
                ))}
              </select>
            </label>
          )}
          <p>
            <strong>2. แจ้งเตือนเมื่อพระอยู่ห่างบ้าน</strong>
          </p>
          <div className="choices" role="radiogroup">
            {RADII.map((r) => (
              <button
                key={r}
                role="radio"
                aria-checked={radius === r}
                className={radius === r ? "btn" : "btn btn-secondary"}
                onClick={() => setRadius(r)}
              >
                {r} เมตร
              </button>
            ))}
          </div>
          <button className="btn btn-xl" onClick={enable} disabled={busy || !pin}>
            {busy ? "กำลังเปิด…" : "🔔 เปิดแจ้งเตือน"}
          </button>
          <button className="link" onClick={() => setPhase("off")}>
            ยกเลิก
          </button>
        </>
      )}

      {phase === "on" && (
        <>
          <p className="live-banner">🔔 เปิดแจ้งเตือนแล้ว จะแจ้งเมื่อพระอยู่ห่างบ้านไม่เกิน {radius} เมตร
            {routes && routes.length > 1 && ` (${routes.find((r) => r.id === routeId)?.name ?? ""})`}
          </p>
          <div className="choices">
            <button className="btn btn-secondary" onClick={sendTest}>
              ส่งแจ้งเตือนทดสอบ
            </button>
            <button className="btn btn-secondary" onClick={() => setPhase("setup")}>
              ย้ายหมุดบ้าน
            </button>
            <button className="btn btn-secondary" onClick={disable} disabled={busy}>
              ปิดแจ้งเตือน
            </button>
          </div>
        </>
      )}

      {message && <p className={message.includes("ไม่") ? "error" : "muted"}>{message}</p>}
    </section>
  );
}
