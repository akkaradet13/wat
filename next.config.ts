import type { NextConfig } from "next";

// ponytail: classic ISR (`revalidate` + revalidatePath) instead of cacheComponents.
// Full HTML on first visit (SEO) with less code; migrate if we need partial prerendering.
const nextConfig: NextConfig = {
  // Cap the CDN stale-while-revalidate window (default 1 year). With revalidate = 60 this gives
  // "s-maxage=60, stale-while-revalidate=60": a suspended temple disappears within ~2 minutes.
  expireTime: 120,
};

export default nextConfig;
