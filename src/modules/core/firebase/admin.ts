import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { getMessaging } from "firebase-admin/messaging";

// Server only. Never import from a Client Component.
// On Firebase App Hosting: no key, uses the backend's service account (Application Default Credentials).
// Locally: service account from .env.local.
function app(): App {
  const existing = getApps()[0];
  if (existing) return existing;
  const { FIREBASE_PROJECT_ID: projectId, FIREBASE_CLIENT_EMAIL: clientEmail, FIREBASE_PRIVATE_KEY: key } = process.env;
  if (projectId && clientEmail && key) {
    return initializeApp({ credential: cert({ projectId, clientEmail, privateKey: key.replace(/\\n/g, "\n") }) });
  }
  return initializeApp();
}

export const adminDb = () => getFirestore(app());
export const adminAuth = () => getAuth(app());
export const adminMessaging = () => getMessaging(app());
