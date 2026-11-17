"use client";

import { FirebaseError } from "firebase/app";
import { createUserWithEmailAndPassword, sendPasswordResetEmail, signInWithEmailAndPassword } from "firebase/auth";
import { useRef, useState } from "react";
import { clientAuth } from "../firebase/client";

const ERRORS: Record<string, string> = {
  "auth/invalid-credential": "อีเมลหรือรหัสผ่านไม่ถูกต้อง",
  "auth/email-already-in-use": "อีเมลนี้มีบัญชีอยู่แล้ว กรุณาเข้าสู่ระบบ",
  "auth/weak-password": "รหัสผ่านต้องยาวอย่างน้อย 6 ตัวอักษร",
  "auth/invalid-email": "รูปแบบอีเมลไม่ถูกต้อง",
  "auth/too-many-requests": "ลองหลายครั้งเกินไป กรุณารอสักครู่",
};

export function AuthForm({ allowSignup = false }: { allowSignup?: boolean }) {
  const [signup, setSignup] = useState(allowSignup);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [info, setInfo] = useState("");
  const emailRef = useRef<HTMLInputElement>(null);

  async function resetPassword() {
    const email = emailRef.current?.value.trim();
    setError("");
    if (!email) return setError("กรอกอีเมลก่อน แล้วกด \"ลืมรหัสผ่าน?\" อีกครั้ง");
    const auth = clientAuth();
    auth.languageCode = "th";
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (err) {
      if (err instanceof FirebaseError && err.code === "auth/invalid-email") return setError(ERRORS[err.code]);
      // Other errors (e.g. unknown email) get the same reply so accounts can't be probed.
    }
    setInfo(`ถ้ามีบัญชีของ ${email} จะได้รับอีเมลสำหรับตั้งรหัสผ่านใหม่ (ดูในกล่องจดหมายขยะด้วย)`);
  }

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const email = String(f.get("email"));
    const password = String(f.get("password"));
    setBusy(true);
    setError("");
    try {
      await (signup ? createUserWithEmailAndPassword : signInWithEmailAndPassword)(clientAuth(), email, password);
    } catch (err) {
      setError((err instanceof FirebaseError && ERRORS[err.code]) || "เกิดข้อผิดพลาด กรุณาลองใหม่");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="stack">
      <h2>{signup ? "สร้างบัญชี" : "เข้าสู่ระบบ"}</h2>
      <label>
        อีเมล
        <input ref={emailRef} name="email" type="email" autoComplete="email" required />
      </label>
      <label>
        รหัสผ่าน
        <input
          name="password"
          type="password"
          minLength={6}
          autoComplete={signup ? "new-password" : "current-password"}
          required
        />
      </label>
      {error && <p className="error">{error}</p>}
      {info && <p className="muted">{info}</p>}
      <button className="btn" disabled={busy}>
        {busy ? "กำลังดำเนินการ…" : signup ? "สร้างบัญชี" : "เข้าสู่ระบบ"}
      </button>
      {!signup && (
        <button type="button" className="link" onClick={resetPassword}>
          ลืมรหัสผ่าน?
        </button>
      )}
      {allowSignup && (
        <button type="button" className="link" onClick={() => setSignup(!signup)}>
          {signup ? "มีบัญชีแล้ว? เข้าสู่ระบบ" : "ยังไม่มีบัญชี? สร้างบัญชี"}
        </button>
      )}
    </form>
  );
}
