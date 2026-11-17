import Link from "next/link";
import { LiveNowList } from "@/modules/alms/LiveNowList";
import { listTemples } from "@/modules/core/temples/server";
import { TempleStatusBadge } from "@/modules/core/ui/TempleStatusBadge";

// 60 s: the App Hosting CDN honours s-maxage and revalidatePath does not purge it, so this bounds
// how long a suspended/edited temple can still show (plus expireTime in next.config.ts).
export const revalidate = 60;

export default async function Home() {
  const temples = await listTemples();
  return (
    <div className="stack">
      <h1>ติดตามพระบิณฑบาตแบบสด</h1>
      <p className="muted">ดูว่าพระเดินถึงไหนแล้ว เตรียมใส่บาตรทันโดยไม่ต้องยืนรอ</p>

      <h2>กำลังออกบิณฑบาต</h2>
      <LiveNowList temples={temples} />

      <h2>วัดในระบบ</h2>
      <ul className="cards">
        {temples.map((t) => (
          <li key={t.id}>
            <Link href={`/wat/${t.slug}`} className="card">
              <strong>{t.name}</strong> <TempleStatusBadge status={t.status} />
              <br />
              <span className="muted">
                อ.{t.district} จ.{t.province}
              </span>
            </Link>
          </li>
        ))}
      </ul>

      <h2>สำหรับวัด</h2>
      <div className="actions">
        <Link href="/alms/send" className="action">
          <span className="action-icon" aria-hidden>
            📍
          </span>
          <span>
            <strong>ส่งพิกัดบิณฑบาต</strong>
            <span className="muted">สำหรับผู้ที่เดินไปกับพระ</span>
          </span>
        </Link>
        <Link href="/register" className="action">
          <span className="action-icon" aria-hidden>
            🛕
          </span>
          <span>
            <strong>ลงทะเบียนวัด</strong>
            <span className="muted">ฟรี ใช้งานได้ทันที</span>
          </span>
        </Link>
      </div>
    </div>
  );
}
