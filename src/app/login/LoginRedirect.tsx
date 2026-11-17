"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useUser } from "@/modules/core/auth/client";
import { AuthForm } from "@/modules/core/ui/AuthForm";

export function LoginRedirect() {
  const { user, claims, loading } = useUser();
  const router = useRouter();
  useEffect(() => {
    if (user) router.replace(claims.super_admin ? "/admin" : claims.temple_id ? "/alms/send" : "/register");
  }, [user, claims, router]);
  if (loading || user) return <p>กำลังโหลด…</p>;
  return <AuthForm />;
}
