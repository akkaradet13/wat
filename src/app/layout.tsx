import type { Metadata, Viewport } from "next";
import { Noto_Sans_Thai } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const font = Noto_Sans_Thai({ subsets: ["thai", "latin"], display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: { default: "ติดตามพระบิณฑบาตแบบสด | Wat", template: "%s | Wat" },
  description: "ดูว่าพระออกบิณฑบาตถึงไหนแล้วแบบสด เตรียมใส่บาตรทันโดยไม่ต้องยืนรอ",
  openGraph: { siteName: "Wat", locale: "th_TH", type: "website" },
};

export const viewport: Viewport = { themeColor: "#b45309" };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="th" className={font.className}>
      <body>
        <header className="site-header">
          <Link href="/" className="logo">
            🛕 Wat
          </Link>
        </header>
        <main className="container">{children}</main>
      </body>
    </html>
  );
}
