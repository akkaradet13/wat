import { getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Browser only. Lazy so server rendering of Client Components never initializes Firebase.
// On Firebase App Hosting the config is injected at build time (FIREBASE_WEBAPP_CONFIG), so no args needed.
// Locally: NEXT_PUBLIC_FIREBASE_* from .env.local.
export function clientApp() {
  if (getApps()[0]) return getApps()[0];
  if (!process.env.NEXT_PUBLIC_FIREBASE_API_KEY) return initializeApp();
  return initializeApp({
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  });
}

export const clientAuth = () => getAuth(clientApp());
export const clientDb = () => getFirestore(clientApp());
