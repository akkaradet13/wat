// Custom claims, set server-side only (POST /api/temples, scripts/set-super-admin.mts).
export interface Claims {
  temple_id?: string;
  role?: "admin" | "sender";
  super_admin?: boolean;
}
