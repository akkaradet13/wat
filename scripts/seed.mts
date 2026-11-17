// Dev-only seed: Wat Nikhom Kittiyaram (temple A, Rai Noi subdistrict). Data NOT yet confirmed by the temple.
// Usage: node --env-file=.env.local scripts/seed.mts --dev
import { cert, initializeApp } from "firebase-admin/app";
import { FieldValue, GeoPoint, getFirestore } from "firebase-admin/firestore";

if (!process.argv.includes("--dev")) {
  console.error("Refusing to run without --dev. Never seed unconfirmed data into the production project.");
  process.exit(1);
}

const { FIREBASE_PROJECT_ID: projectId, FIREBASE_CLIENT_EMAIL: clientEmail, FIREBASE_PRIVATE_KEY: key } = process.env;
initializeApp({ credential: cert({ projectId, clientEmail, privateKey: key?.replace(/\\n/g, "\n") }) });
const db = getFirestore();

const templeId = "seed-nikhom-kittiyaram";
await db.doc(`temples/${templeId}`).set({
  name: "วัดนิคมกิตติยาราม",
  slug: "นิคมกิตติยาราม-อุบลราชธานี",
  founded_year: 2500,
  location: new GeoPoint(15.26022, 104.8934),
  address: "หมู่ 11 บ้านนิคมจัดสรรค์ ถนน 3014",
  subdistrict: "ไร่น้อย",
  district: "เมืองอุบลราชธานี",
  province: "อุบลราชธานี",
  postal_code: "",
  temple_type: "community",
  sect: "mahanikaya",
  abbot_name: "พระอธิการธีร์ทัต ฉนฺทโก",
  phone: "",
  description: "[ข้อมูลทดสอบ] วัดร่มรื่นด้วยต้นไม้ใหญ่ เงียบสงบ เหมาะแก่การปฏิบัติธรรม",
  photo_url: "",
  links: { facebook: "https://web.facebook.com/p/วัดนิคมกิตติยาราม-61555055427251/" },
  status: "unverified",
  created_by: "seed",
  created_at: FieldValue.serverTimestamp(),
  updated_at: FieldValue.serverTimestamp(),
});
await db.doc(`alms_routes/${templeId}-main`).set({ temple_id: templeId, name: "สายหลัก", start_time: "06:00" });
console.log(`Seeded temples/${templeId} -> /wat/นิคมกิตติยาราม-อุบลราชธานี`);
