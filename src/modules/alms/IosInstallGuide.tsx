/* eslint-disable @next/next/no-img-element -- tiny static icon */

const ShareIcon = () => (
  <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="#2563eb" strokeWidth="2" aria-label="ปุ่มแชร์">
    <path d="M12 15V3M8 7l4-4 4 4" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M7 10H5v11h14V10h-2" strokeLinejoin="round" />
  </svg>
);
const AddIcon = () => (
  <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="#1c1917" strokeWidth="2" aria-label="ไอคอนเพิ่ม">
    <rect x="3" y="3" width="18" height="18" rx="4" />
    <path d="M12 8v8M8 12h8" strokeLinecap="round" />
  </svg>
);

/** Shown on iPhone/iPad when the site isn't installed yet: Web Push only works from the Home Screen app. */
export function IosInstallGuide() {
  return (
    <div className="guide stack">
      <p>
        <strong>iPhone ต้องเพิ่มเว็บนี้ไว้ที่หน้าจอโฮมก่อน</strong> จึงจะรับแจ้งเตือนได้ ทำครั้งเดียว ใช้ได้ตลอด
      </p>
      <ol className="steps">
        <li>เปิดหน้านี้ด้วยแอป Safari</li>
        <li>
          แตะปุ่มแชร์ <ShareIcon /> ที่แถบด้านล่างของจอ
        </li>
        <li>
          เลื่อนลง แล้วแตะ <strong>&quot;เพิ่มไปยังหน้าจอโฮม&quot;</strong> <AddIcon />
        </li>
        <li>
          แตะ <strong>&quot;เพิ่ม&quot;</strong> ที่มุมขวาบน
        </li>
        <li>
          ปิด Safari แล้วแตะไอคอน <img src="/icon-192.png" alt="ไอคอน Wat" width={28} height={28} className="inline-icon" />{" "}
          <strong>Wat</strong> บนหน้าจอโฮม เปิดหน้าวัดนี้ แล้วกด &quot;ตั้งแจ้งเตือน&quot; อีกครั้ง
        </li>
      </ol>
      <p className="muted">ต้องใช้ iOS 16.4 ขึ้นไป</p>
    </div>
  );
}
