"use client";

import { useEffect } from "react";

/** Registers the single service worker used for both the PWA and FCM web push. */
export function ServiceWorker() {
  useEffect(() => {
    navigator.serviceWorker?.register("/firebase-messaging-sw.js").catch(() => {});
  }, []);
  return null;
}
