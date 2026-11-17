"use client";

import { onIdTokenChanged, type User } from "firebase/auth";
import { useEffect, useState } from "react";
import { clientAuth } from "../firebase/client";
import type { Claims } from "./types";

export function useUser() {
  const [state, setState] = useState<{ user: User | null; claims: Claims; loading: boolean }>({
    user: null,
    claims: {},
    loading: true,
  });
  useEffect(
    () =>
      onIdTokenChanged(clientAuth(), async (user) => {
        const c = user ? (await user.getIdTokenResult()).claims : {};
        setState({
          user,
          loading: false,
          claims: {
            temple_id: typeof c.temple_id === "string" ? c.temple_id : undefined,
            role: c.role === "admin" || c.role === "sender" ? c.role : undefined,
            super_admin: c.super_admin === true,
          },
        });
      }),
    [],
  );
  return state;
}

/** JSON request carrying the current user's ID token. */
export async function authFetch<T = Record<string, unknown>>(url: string, body?: unknown, method = "POST") {
  const token = await clientAuth().currentUser?.getIdToken();
  const res = await fetch(url, {
    method,
    headers: { "content-type": "application/json", ...(token && { authorization: `Bearer ${token}` }) },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = (await res.json().catch(() => ({}))) as Partial<T> & { error?: string };
  return { ok: res.ok, status: res.status, data };
}
