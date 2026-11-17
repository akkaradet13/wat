import type { MetadataRoute } from "next";

// No start_url on purpose: it then defaults to the page where the app was installed,
// so someone who installs from their temple's page opens straight to that temple.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Wat ติดตามพระบิณฑบาต",
    short_name: "Wat",
    description: "ดูว่าพระออกบิณฑบาตถึงไหนแล้ว และแจ้งเตือนเมื่อพระใกล้ถึงบ้าน",
    display: "standalone",
    lang: "th",
    background_color: "#fffaf3",
    theme_color: "#b45309",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
