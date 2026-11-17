// Grant or revoke the super_admin custom claim. The user must have signed up once.
// Usage: node --env-file=.env.local scripts/set-super-admin.mts someone@example.com [--remove]
// The user must sign out and in again (or wait up to 1 hour) for the claim to apply.
import { cert, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

const email = process.argv[2];
if (!email) {
  console.error("Usage: node --env-file=.env.local scripts/set-super-admin.mts <email> [--remove]");
  process.exit(1);
}
const { FIREBASE_PROJECT_ID: projectId, FIREBASE_CLIENT_EMAIL: clientEmail, FIREBASE_PRIVATE_KEY: key } = process.env;
initializeApp({ credential: cert({ projectId, clientEmail, privateKey: key?.replace(/\\n/g, "\n") }) });

const auth = getAuth();
const user = await auth.getUserByEmail(email);
const claims = { ...user.customClaims };
const remove = process.argv.includes("--remove");
if (remove) delete claims.super_admin;
else claims.super_admin = true;
await auth.setCustomUserClaims(user.uid, claims);
console.log(`${remove ? "Removed" : "Granted"} super_admin for ${email}`);
