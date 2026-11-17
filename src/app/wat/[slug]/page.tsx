import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { cache } from "react";
import { AnnouncementBanner } from "@/modules/alms/announcements";
import { HomeAlert } from "@/modules/alms/HomeAlert";
import { LiveTempleMap } from "@/modules/alms/LiveTempleMap";
import { getTempleBySlug } from "@/modules/core/temples/server";
import { SECTS, TEMPLE_TYPES } from "@/modules/core/temples/types";
import { TempleStatusBadge } from "@/modules/core/ui/TempleStatusBadge";

// ISR: rendered on first visit, then cached. Status changes call revalidatePath.
export const revalidate = 3600;
export const generateStaticParams = async () => [];

const decode = (s: string) => {
  try {
    return decodeURIComponent(s);
  } catch {
    return s;
  }
};

// Dedupe the Firestore read between generateMetadata and the page.
const load = cache(async (slug: string) => {
  const t = await getTempleBySlug(decode(slug));
  return t && t.status !== "suspended" ? t : null;
});

export async function generateMetadata({ params }: PageProps<"/wat/[slug]">): Promise<Metadata> {
  const t = await load((await params).slug);
  if (!t) return { title: "ไม่พบวัด", robots: { index: false } };
  const description =
    t.description.slice(0, 150) ||
    `ติดตามพระบิณฑบาต${t.name} ต.${t.subdistrict} อ.${t.district} จ.${t.province} แบบสด พร้อมข้อมูลและแผนที่วัด`;
  return {
    title: `${t.name} ${t.province}`,
    description,
    alternates: { canonical: `/wat/${t.slug}` },
    // Unverified temples stay out of the index so impostor or junk pages don't drag the site down.
    robots: t.status === "verified" ? undefined : { index: false, follow: true },
    openGraph: { title: `${t.name} ${t.province}`, description, url: `/wat/${t.slug}`, images: t.photo_url || undefined },
  };
}

export default async function TemplePage({ params }: PageProps<"/wat/[slug]">) {
  const t = await load((await params).slug);
  if (!t) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BuddhistTemple",
    name: t.name,
    url: `${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/wat/${t.slug}`,
    ...(t.description && { description: t.description }),
    ...(t.phone && { telephone: t.phone }),
    ...(t.photo_url && { image: t.photo_url }),
    address: {
      "@type": "PostalAddress",
      streetAddress: t.address,
      addressLocality: `${t.subdistrict} ${t.district}`,
      addressRegion: t.province,
      ...(t.postal_code && { postalCode: t.postal_code }),
      addressCountry: "TH",
    },
    geo: { "@type": "GeoCoordinates", latitude: t.location.lat, longitude: t.location.lng },
  };

  const info: [string, string][] = [
    ["ที่อยู่", [t.address, `ต.${t.subdistrict}`, `อ.${t.district}`, `จ.${t.province}`, t.postal_code].filter(Boolean).join(" ")],
    ["ประเภท", TEMPLE_TYPES[t.temple_type]],
    ["นิกาย", SECTS[t.sect]],
    ["เจ้าอาวาส", t.abbot_name],
    ["ก่อตั้ง", t.founded_year ? `พ.ศ. ${t.founded_year}` : ""],
    ["โทรศัพท์", t.phone],
    ["LINE", t.links.line ?? ""],
  ];
  const links = Object.entries({ Facebook: t.links.facebook, เว็บไซต์: t.links.website }).filter(([, v]) => v);

  return (
    <article className="stack">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
      <h1>
        {t.name} <TempleStatusBadge status={t.status} />
      </h1>
      <p className="muted">
        ต.{t.subdistrict} อ.{t.district} จ.{t.province}
      </p>

      {/* Live tracking first: it is what people come here for every morning. */}
      <AnnouncementBanner templeId={t.id} />
      <LiveTempleMap templeId={t.id} templeName={t.name} location={t.location} />
      <HomeAlert templeId={t.id} templeName={t.name} location={t.location} />

      {t.photo_url && (
        // ponytail: unoptimized because temples paste photo URLs from any host; add Firebase Storage uploads later.
        <Image src={t.photo_url} alt={t.name} width={720} height={480} className="photo" unoptimized />
      )}
      {t.description && <p style={{ whiteSpace: "pre-line" }}>{t.description}</p>}

      <h2>ข้อมูลวัด</h2>
      <dl className="info">
        {info
          .filter(([, v]) => v)
          .map(([k, v]) => (
            <div key={k} style={{ display: "contents" }}>
              <dt>{k}</dt>
              <dd>{v}</dd>
            </div>
          ))}
      </dl>
      {links.map(([k, v]) => (
        <a key={k} href={v} target="_blank" rel="noopener noreferrer">
          {k}
        </a>
      ))}
      <a href={`https://www.google.com/maps/dir/?api=1&destination=${t.location.lat},${t.location.lng}`} target="_blank" rel="noopener noreferrer">
        นำทางไปวัด
      </a>
    </article>
  );
}
