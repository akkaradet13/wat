import type { MetadataRoute } from "next";
import { listTemples } from "@/modules/core/temples/server";

export const revalidate = 60; // see src/app/page.tsx

const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

/** Only verified temples are indexable, so only they go in the sitemap. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const temples = await listTemples(["verified"]);
  return [
    { url: base, changeFrequency: "daily", priority: 1 },
    ...temples.map((t) => ({ url: `${base}/wat/${encodeURIComponent(t.slug)}`, changeFrequency: "weekly" as const })),
  ];
}
