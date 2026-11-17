export type TempleStatus = "unverified" | "verified" | "suspended";
export type LatLng = { lat: number; lng: number };

export const TEMPLE_TYPES = { community: "วัดราษฎร์", royal: "พระอารามหลวง" } as const;
export const SECTS = { mahanikaya: "มหานิกาย", dhammayut: "ธรรมยุติกนิกาย", other: "อื่น ๆ" } as const;

export interface TempleInput {
  name: string;
  founded_year: number | null; // Buddhist Era
  location: LatLng;
  address: string;
  subdistrict: string;
  district: string;
  province: string;
  postal_code: string;
  temple_type: keyof typeof TEMPLE_TYPES;
  sect: keyof typeof SECTS;
  abbot_name: string;
  phone: string;
  description: string;
  photo_url: string;
  links: { facebook?: string; website?: string; line?: string };
}

/** Serializable shape for pages and Client Components (timestamps as ISO strings). */
export interface Temple extends TempleInput {
  id: string;
  slug: string;
  status: TempleStatus;
  created_at: string | null;
  updated_at: string | null;
}

export type TempleSummary = Pick<Temple, "id" | "slug" | "name" | "district" | "province" | "status">;
