"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { authFetch, useUser } from "@/modules/core/auth/client";
import { doc, getDoc } from "firebase/firestore";
import { clientAuth, clientDb } from "@/modules/core/firebase/client";
import { useTemple } from "@/modules/core/temples/client";
import { AuthForm } from "@/modules/core/ui/AuthForm";
import { SEND_INTERVAL_MS } from "./constants";
import { useRoutes } from "./useRoutes";

const KEY = "alms_round_id";
const store = {
  get: () => {
    try {
      return localStorage.getItem(KEY);
    } catch {
      return null;
    }
  },
  set: (v: string | null) => {
    try {
      if (v) localStorage.setItem(KEY, v);
      else localStorage.removeItem(KEY);
    } catch {}
  },
};

const GEO_ERRORS: Record<number, string> = {
  1: "ไม่ได้รับอนุญาตให้ใช้ตำแหน่ง กรุณาเปิดสิทธิ์ตำแหน่งในการตั้งค่าเบราว์เซอร์",
  2: "หาตำแหน่งไม่ได้ กรุณาออกไปที่โล่ง",
  3: "หาตำแหน่งนานเกินไป กำลังลองใหม่",
};

export function SenderPanel() {
  const { user, claims, loading } = useUser();
  // Resume a round after reload; the server answers 409 if it already ended.
  // Safe from hydration mismatch: the first render shows the loading state on both sides.
  const [roundId, setRoundId] = useState<string | null>(() => (typeof window === "undefined" ? null : store.get()));
  const [lastSent, setLastSent] = useState<Date | null>(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const latest = useRef<GeolocationPosition | null>(null);

  const canSend = !!user && !!claims.temple_id;
  const routes = useRoutes(claims.temple_id);
  const { temple } = useTemple(claims.temple_id);
  const [routeId, setRouteId] = useState("");
  const [name, setName] = useState("");

  // Prefill the sender's own name (users/{uid} is readable by its owner).
  useEffect(() => {
    if (!user) return;
    getDoc(doc(clientDb(), "users", user.uid))
      .then((d) => setName((n) => n || (d.get("display_name") as string) || ""))
      .catch(() => {});
  }, [user]);
  useEffect(() => {
    if (!roundId || !canSend) return;
    let wakeLock: WakeLockSentinel | null = null;
    const lock = async () => {
      try {
        wakeLock = await navigator.wakeLock?.request("screen");
      } catch {}
    };
    const onVisible = () => document.visibilityState === "visible" && lock();
    lock();
    document.addEventListener("visibilitychange", onVisible);

    const send = async () => {
      const p = latest.current;
      if (!p) return;
      const { ok, status, data } = await authFetch("/api/alms/location", {
        round_id: roundId,
        lat: p.coords.latitude,
        lng: p.coords.longitude,
      }).catch(() => ({ ok: false, status: 0, data: { error: "" } }));
      if (ok) {
        setLastSent(new Date());
        setMessage("");
      } else if (status === 409) {
        store.set(null);
        setRoundId(null);
        setMessage(data.error || "รอบนี้จบไปแล้ว");
      } else {
        setMessage("ส่งพิกัดไม่สำเร็จ ตรวจสอบอินเทอร์เน็ต ระบบจะลองใหม่เอง");
      }
    };

    let first = true;
    const watch = navigator.geolocation.watchPosition(
      (p) => {
        latest.current = p;
        if (first) {
          first = false;
          send();
        }
      },
      (e) => setMessage(GEO_ERRORS[e.code] ?? "หาตำแหน่งไม่ได้"),
      { enableHighAccuracy: true, maximumAge: 10_000, timeout: 30_000 },
    );
    const timer = setInterval(send, SEND_INTERVAL_MS);

    return () => {
      navigator.geolocation.clearWatch(watch);
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
      wakeLock?.release().catch(() => {});
      latest.current = null;
    };
  }, [roundId, canSend]);

  async function start() {
    setBusy(true);
    const { ok, data } = await authFetch<{ id: string }>("/api/alms/rounds", {
      route_id: routeId || routes?.[0]?.id,
      display_name: name.trim(),
    });
    setBusy(false);
    if (!ok || !data.id) return setMessage(data.error || "เริ่มรอบไม่สำเร็จ");
    store.set(data.id);
    setLastSent(null);
    setMessage("");
    setRoundId(data.id);
  }

  async function end() {
    if (!roundId || !confirm("จบรอบบิณฑบาตใช่ไหม")) return;
    setBusy(true);
    await authFetch(`/api/alms/rounds/${roundId}`, undefined, "DELETE");
    setBusy(false);
    store.set(null);
    setRoundId(null);
  }

  if (loading) return <p>กำลังโหลด…</p>;
  if (!user) return <AuthForm />;
  if (!claims.temple_id)
    return (
      <div className="stack">
        <p>บัญชีนี้ยังไม่ได้ผูกกับวัด</p>
        <Link href="/register" className="btn">
          ลงทะเบียนวัด
        </Link>
      </div>
    );

  if (temple?.status === "suspended" && !roundId)
    return <p className="announce">วัดนี้ถูกระงับโดยผู้ดูแลระบบ จึงส่งพิกัดไม่ได้</p>;

  return (
    <div className="stack">
      {roundId ? (
        <>
          <p className="live-banner" role="status">
            <span className="live-dot" /> กำลังส่งพิกัด
            {lastSent && ` · ล่าสุด ${lastSent.toLocaleTimeString("th-TH", { hourCycle: "h23", timeZone: "Asia/Bangkok" })}`}
          </p>
          <p>เปิดหน้านี้ค้างไว้ตลอดทาง ห้ามปิดหน้าจอ</p>
          <button className="btn btn-danger btn-xl" onClick={end} disabled={busy}>
            จบรอบ
          </button>
        </>
      ) : (
        <>
          <p className="idle-banner" role="status">
            หยุดส่งแล้ว
          </p>
          <label>
            ชื่อที่แสดงบนแผนที่
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={60}
              placeholder="เช่น พระเอิง"
              autoComplete="name"
            />
          </label>
          {routes && routes.length > 1 && (
            <label>
              สายที่จะเดิน
              <select value={routeId || routes[0].id} onChange={(e) => setRouteId(e.target.value)}>
                {routes.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name} ({r.start_time} น.)
                  </option>
                ))}
              </select>
            </label>
          )}
          <button className="btn btn-xl" onClick={start} disabled={busy || !name.trim()}>
            เริ่มรอบบิณฑบาต
          </button>
        </>
      )}
      {message && <p className="error">{message}</p>}
      <button className="link" onClick={() => clientAuth().signOut()} disabled={!!roundId}>
        ออกจากระบบ
      </button>
    </div>
  );
}
