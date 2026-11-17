"use client";

import { getMessaging, getToken, isSupported } from "firebase/messaging";
import { clientApp } from "@/modules/core/firebase/client";

export const isIos = () =>
  /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

export const isStandalone = () =>
  matchMedia("(display-mode: standalone)").matches || (navigator as { standalone?: boolean }).standalone === true;

/** iPhone only gets Web Push after "Add to Home Screen" (iOS 16.4+). */
export async function pushSupport(): Promise<"ok" | "ios-install" | "unsupported"> {
  if (isIos() && !isStandalone()) return "ios-install";
  if (!("Notification" in window) || !("serviceWorker" in navigator) || !(await isSupported())) return "unsupported";
  return "ok";
}

/** FCM token for this device. Call only after Notification permission is granted. */
export async function getPushToken(): Promise<string> {
  const registration = await navigator.serviceWorker.register("/firebase-messaging-sw.js");
  await navigator.serviceWorker.ready;
  // No vapidKey: the SDK falls back to Firebase's default key.
  return getToken(getMessaging(clientApp()), { serviceWorkerRegistration: registration });
}
