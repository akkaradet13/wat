"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { authFetch, useUser } from "@/modules/core/auth/client";
import { AuthForm } from "@/modules/core/ui/AuthForm";
import { TempleForm } from "@/modules/core/ui/TempleForm";

export function RegisterForm() {
  const { user, claims, loading } = useUser();
  const router = useRouter();

  if (loading) return <p>กำลังโหลด…</p>;
  if (!user) return <AuthForm allowSignup />;
  if (claims.temple_id)
    return (
      <p>
        บัญชีนี้ลงทะเบียนวัดไว้แล้ว <Link href="/manage">ไปหน้าจัดการวัด</Link>
      </p>
    );

  return (
    <TempleForm
      submitLabel="ลงทะเบียนวัด"
      onSubmit={async (body) => {
        const { ok, data } = await authFetch<{ slug: string }>("/api/temples", body);
        if (!ok || !data.slug) return data.error || "ลงทะเบียนไม่สำเร็จ";
        await user.getIdToken(true); // pick up the new temple_id / admin claims
        router.push(`/wat/${data.slug}`);
        return null;
      }}
    />
  );
}
