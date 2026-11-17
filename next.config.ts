import type { NextConfig } from "next";

// ponytail: classic ISR (`revalidate` + revalidatePath) instead of cacheComponents.
// Full HTML on first visit (SEO) with less code; migrate if we need partial prerendering.
const nextConfig: NextConfig = {};

export default nextConfig;
