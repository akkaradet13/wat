import { FieldValue, GeoPoint, type DocumentSnapshot, type Timestamp } from "firebase-admin/firestore";
import { adminAuth, adminDb } from "../firebase/admin";
import { makeSlug, uniqueSlug } from "./slug";
import type { Temple, TempleInput, TempleStatus, TempleSummary } from "./types";

// Server only.
const temples = () => adminDb().collection("temples");
const iso = (t: unknown) => (t ? (t as Timestamp).toDate().toISOString() : null);

function toTemple(d: DocumentSnapshot): Temple {
  const x = d.data()!;
  return {
    id: d.id,
    slug: x.slug,
    status: x.status,
    name: x.name,
    founded_year: x.founded_year ?? null,
    location: { lat: x.location.latitude, lng: x.location.longitude },
    address: x.address ?? "",
    subdistrict: x.subdistrict ?? "",
    district: x.district ?? "",
    province: x.province ?? "",
    postal_code: x.postal_code ?? "",
    temple_type: x.temple_type ?? "community",
    sect: x.sect ?? "mahanikaya",
    abbot_name: x.abbot_name ?? "",
    phone: x.phone ?? "",
    description: x.description ?? "",
    photo_url: x.photo_url ?? "",
    links: x.links ?? {},
    created_at: iso(x.created_at),
    updated_at: iso(x.updated_at),
  };
}

export async function getTempleBySlug(slug: string): Promise<Temple | null> {
  const snap = await temples().where("slug", "==", slug).limit(1).get();
  return snap.empty ? null : toTemple(snap.docs[0]);
}

/** Temples shown publicly (not suspended). */
export async function listTemples(statuses: TempleStatus[] = ["verified", "unverified"]): Promise<TempleSummary[]> {
  // ponytail: reads every listed temple; paginate or split by province once there are hundreds.
  const snap = await temples()
    .where("status", "in", statuses)
    .select("slug", "name", "district", "province", "status")
    .get();
  return snap.docs
    .map((d) => ({ id: d.id, ...(d.data() as Omit<TempleSummary, "id">) }))
    .sort((a, b) => a.name.localeCompare(b.name, "th"));
}

/** Creates a temple and makes `uid` its admin. One temple per account. */
export async function createTemple(uid: string, input: TempleInput): Promise<{ slug: string } | { error: string }> {
  const db = adminDb();
  const base = makeSlug(input.name, input.province);
  const userRef = db.collection("users").doc(uid);
  const templeRef = temples().doc();

  const result = await db.runTransaction(async (tx) => {
    const user = await tx.get(userRef);
    if (user.exists && user.data()?.temple_id) return { error: "บัญชีนี้ลงทะเบียนวัดไว้แล้ว" };
    const sameBase = await tx.get(temples().where("slug", ">=", base).where("slug", "<=", `${base}-`).select("slug"));
    const taken = new Set(sameBase.docs.map((d) => d.get("slug") as string));
    const slug = uniqueSlug(base, taken);
    const { location, ...rest } = input;
    tx.create(templeRef, {
      ...rest,
      slug,
      location: new GeoPoint(location.lat, location.lng),
      status: "unverified" satisfies TempleStatus,
      created_by: uid,
      created_at: FieldValue.serverTimestamp(),
      updated_at: FieldValue.serverTimestamp(),
    });
    tx.set(userRef, { temple_id: templeRef.id, role: "admin", display_name: "" }, { merge: true });
    return { slug };
  });

  if ("slug" in result) {
    const { customClaims } = await adminAuth().getUser(uid);
    await adminAuth().setCustomUserClaims(uid, { ...customClaims, temple_id: templeRef.id, role: "admin" });
  }
  return result;
}

/** Super admin action. Returns the slug so the caller can revalidate the page. */
export async function setTempleStatus(id: string, status: TempleStatus, by: string): Promise<string | null> {
  const ref = temples().doc(id);
  const snap = await ref.get();
  if (!snap.exists) return null;
  await ref.update({
    status,
    updated_at: FieldValue.serverTimestamp(),
    ...(status === "verified" && { verified_by: by, verified_at: FieldValue.serverTimestamp() }),
  });
  return snap.get("slug") as string;
}
