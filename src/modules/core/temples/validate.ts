import { SECTS, TEMPLE_TYPES, type TempleInput } from "./types";

const str = (v: unknown, max = 200) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const httpUrl = (v: unknown) => {
  const s = str(v, 500);
  return /^https?:\/\/\S+$/.test(s) ? s : "";
};

/** Validates untrusted form input from the register form. */
export function parseTempleInput(b: Record<string, unknown>): { data: TempleInput } | { error: string } {
  const name = str(b.name, 120);
  const province = str(b.province, 60);
  const district = str(b.district, 60);
  const subdistrict = str(b.subdistrict, 60);
  const lat = Number(b.lat);
  const lng = Number(b.lng);
  const year = b.founded_year === "" || b.founded_year == null ? null : Number(b.founded_year);

  if (!name) return { error: "กรุณากรอกชื่อวัด" };
  if (!province || !district || !subdistrict) return { error: "กรุณากรอกตำบล อำเภอ และจังหวัด" };
  if (!(Math.abs(lat) <= 90 && Math.abs(lng) <= 180) || (lat === 0 && lng === 0))
    return { error: "กรุณาปักหมุดตำแหน่งวัดบนแผนที่" };
  if (year !== null && !(Number.isInteger(year) && year >= 1000 && year <= 2700))
    return { error: "ปีที่ก่อตั้งต้องเป็นปี พ.ศ." };

  const links = b.links && typeof b.links === "object" ? (b.links as Record<string, unknown>) : {};
  const templeType = str(b.temple_type);
  const sect = str(b.sect);
  const photo = httpUrl(b.photo_url);
  return {
    data: {
      name,
      founded_year: year,
      location: { lat, lng },
      address: str(b.address),
      subdistrict,
      district,
      province,
      postal_code: str(b.postal_code, 5).replace(/\D/g, ""),
      temple_type: templeType in TEMPLE_TYPES ? (templeType as TempleInput["temple_type"]) : "community",
      sect: sect in SECTS ? (sect as TempleInput["sect"]) : "mahanikaya",
      abbot_name: str(b.abbot_name, 120),
      phone: str(b.phone, 30),
      description: str(b.description, 3000),
      photo_url: photo.startsWith("https://") ? photo : "",
      links: Object.fromEntries(
        [
          ["facebook", httpUrl(links.facebook)],
          ["website", httpUrl(links.website)],
          ["line", str(links.line, 100)],
        ].filter(([, v]) => v),
      ),
    },
  };
}
